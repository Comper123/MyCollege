"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Block } from "@/components/blocks/Block";
import { Camera, Scan, Loader2, AlertCircle, CheckCircle, X, RefreshCw } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();

  // Состояния
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [manualInput, setManualInput] = useState("");
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef(false); // синхронный флаг для колбэков

  // Добавьте эту функцию в компонент
  const parseQRData = (decodedText: string): string | null => {
    try {
      const data = JSON.parse(decodedText);
      if (data.type === "equipment" && data.version === 1 && data.id) {
        return data.id;
      }
      return null;
    } catch {
      // Старый формат - ищем инвентарный номер
      const invMatch = decodedText.match(/INV-\d{4}-\d+/);
      return invMatch ? invMatch[0] : null;
    }
  };

  // Очистка сканера
  const cleanupScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (isScanningRef.current) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (_) {
        // Игнорируем ошибки при очистке
      }
      scannerRef.current = null;
    }
    isScanningRef.current = false;
    setIsScanning(false);
  }, []);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      cleanupScanner();
    };
  }, [cleanupScanner]);

  // Запрос разрешения и получение списка камер
  const requestPermissionAndCameras = useCallback(async () => {
    setIsRequestingPermission(true);
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setPermissionGranted(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
      return true;
    } catch (err: any) {
      setPermissionGranted(false);
      
      if (err.name === "NotAllowedError") {
        setError("Доступ к камере запрещён. Разрешите доступ в настройках браузера.");
      } else if (err.name === "NotFoundError") {
        setError("Камера не обнаружена на вашем устройстве.");
      } else {
        setError("Не удалось получить доступ к камере.");
      }
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  useEffect(() => {
    requestPermissionAndCameras();
  }, [requestPermissionAndCameras]);

  // Поиск оборудования по инвентарному номеру
  const searchEquipment = useCallback(async (rawText: string) => {
    setIsSearching(true);
    setError(null);

    // Парсим QR-код
    const equipmentIdOrInv = parseQRData(rawText);
    
    if (!equipmentIdOrInv) {
      setError("Неверный формат QR-кода");
      setIsSearching(false);
      return;
    }

    try {
      let url: string;
      // Если это UUID (36 символов с дефисами) - ищем по ID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(equipmentIdOrInv)) {
        url = `/api/equipment/${equipmentIdOrInv}`;
      } else {
        url = `/api/equipment/search?inventoryNumber=${encodeURIComponent(equipmentIdOrInv)}`;
      }
      
      const resp = await fetch(url);
      if (resp.ok) {
        const equipment = await resp.json();
        router.push(`/dashboard/equipment/${equipment.id}`);
      } else {
        setError(`Оборудование не найдено`);
        setScanResult(null);
      }
    } catch (_) {
      setError("Ошибка соединения с сервером");
      setScanResult(null);
    } finally {
      setIsSearching(false);
    }
  }, [router]);

  // Запуск сканера
  const startScanner = useCallback(async () => {
    setError(null);
    setScanResult(null);

    if (permissionGranted === false) {
      const ok = await requestPermissionAndCameras();
      if (!ok) return;
    }

    // Даём React время отрендерить контейнер
    await new Promise(r => setTimeout(r, 100));

    const container = document.getElementById("qr-scanner");
    if (!container) {
      setError("Не удалось найти контейнер для сканера");
      return;
    }

    await cleanupScanner();
    setIsScanning(true);
    isScanningRef.current = true;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-scanner");
      scannerRef.current = scanner;

      const cameraConstraint = selectedCameraId
        ? selectedCameraId
        : { facingMode: "environment" };

      await scanner.start(
        cameraConstraint,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
        },
        async (decodedText: string) => {
          // Срабатывает только один раз
          if (!isScanningRef.current) return;
          isScanningRef.current = false;

          setScanResult(decodedText);
          await cleanupScanner();
          await searchEquipment(decodedText);
        },
        (_: string) => {
          // ошибки кадра — норма, игнорируем
        }
      );
    } catch (err: any) {
      isScanningRef.current = false;
      setIsScanning(false);
      scannerRef.current = null;

      const name = err?.name ?? "";
      if (name === "NotAllowedError") {
        setPermissionGranted(false);
        setError("Доступ к камере запрещён. Разрешите в настройках браузера и попробуйте снова.");
      } else if (name === "NotFoundError") {
        setError("Камера не обнаружена. Проверьте подключение устройства.");
      } else if (name === "NotReadableError") {
        setError("Камера занята другим приложением. Закройте его и попробуйте снова.");
      } else {
        setError(`Не удалось запустить сканер: ${err?.message ?? "неизвестная ошибка"}`);
      }
    }
  }, [permissionGranted, selectedCameraId, cleanupScanner, searchEquipment, requestPermissionAndCameras]);

  // Ручной поиск
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    await searchEquipment(manualInput.trim());
  };

  const reset = () => {
    setScanResult(null);
    setError(null);
    setManualInput("");
  };

  return (
    <main className="w-full h-full">
      <Block>
        <div className="max-w-xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 mb-4">
              <Scan size={28} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Сканирование QR-кода
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Наведите камеру на QR-код оборудования для быстрого перехода к его странице
            </p>
          </div>

          {/* Выбор камеры (если их несколько) */}
          {cameras.length > 1 && !isScanning && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Камера
              </label>
              <select
                value={selectedCameraId}
                onChange={e => setSelectedCameraId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {cameras.map(cam => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Камера ${cam.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Контейнер для видео сканера — рендерится всегда когда isScanning */}
          <div
            className={`rounded-2xl overflow-hidden border-2 transition-all mb-4 ${
              isScanning
                ? "border-indigo-500 shadow-lg shadow-indigo-500/10"
                : "border-transparent h-0 overflow-hidden"
            }`}
          >
            <div
              id="qr-scanner"
              className="w-full bg-black"
              style={{ aspectRatio: "1/1" }}
            />
          </div>

          {/* Результат / статус */}
          {scanResult && (
            <div className="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-3">
              <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  QR-код распознан
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-0.5 truncate">
                  {scanResult}
                </p>
              </div>
              {isSearching && <Loader2 size={16} className="animate-spin text-green-600 shrink-0 mt-0.5" />}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Кнопки управления */}
          <div className="flex flex-col gap-2">
            {!isScanning ? (
              <button
                onClick={startScanner}
                disabled={isSearching}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-3 px-5 rounded-xl transition-colors text-sm"
              >
                <Camera size={16} />
                {permissionGranted === false ? "Запросить доступ к камере" : "Начать сканирование"}
              </button>
            ) : (
              <button
                onClick={cleanupScanner}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-white/70 font-medium py-3 px-5 rounded-xl transition-colors text-sm"
              >
                <X size={16} />
                Остановить
              </button>
            )}

            {(error || scanResult) && !isScanning && (
              <button
                onClick={() => { reset(); }}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-white/60 py-2.5 px-5 rounded-xl transition-colors text-sm"
              >
                <RefreshCw size={14} />
                Сбросить
              </button>
            )}
          </div>

          {/* Ручной ввод */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 text-center">
              Или введите инвентарный номер вручную
            </p>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder="INV-2024-0000000001"
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isSearching || !manualInput.trim()}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              >
                {isSearching ? <Loader2 size={14} className="animate-spin" /> : null}
                Найти
              </button>
            </form>
          </div>

          {/* Подсказки */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p className="font-medium text-gray-600 dark:text-gray-300 mb-2">Если камера не работает:</p>
            <p>• Убедитесь, что сайт открыт по HTTPS или на localhost</p>
            <p>• Разрешите доступ к камере в настройках браузера</p>
            <p>• Попробуйте Chrome, Edge или Firefox последней версии</p>
            <p>• Проверьте, что камера не занята другим приложением</p>
          </div>
        </div>
      </Block>
    </main>
  );
}