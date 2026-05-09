"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Block } from "@/components/blocks/Block";
import Button from "@/components/ui/Button";
import { Camera, Scan, Loader2, AlertCircle, CheckCircle, X } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  
  const scannerRef = useRef<any>(null);
  const containerId = "qr-reader-container";

  // Проверка камер при загрузке
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        setAvailableCameras(videoDevices);
        setHasCamera(videoDevices.length > 0);
        
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error checking cameras:", err);
        setHasCamera(false);
      }
    };
    
    checkCameras();
    
    // Запрашиваем разрешение на камеру при загрузке
    const requestCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setCameraPermission(true);
      } catch (err) {
        console.error("Camera permission denied:", err);
        setCameraPermission(false);
      }
    };
    
    requestCameraPermission();
  }, []);

  // Останавливаем сканер при размонтировании
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(console.error);
          }
          scannerRef.current.clear();
        } catch (err) {
          console.error("Error cleaning scanner:", err);
        }
      }
    };
  }, []);

  const startScanner = async () => {
    setError(null);
    setScanResult(null);
    
    // Проверяем наличие камеры
    if (!hasCamera) {
      setError("Камера не найдена на устройстве");
      return;
    }
    
    // Проверяем разрешение
    if (cameraPermission === false) {
      setError("Нет разрешения на использование камеры. Пожалуйста, разрешите доступ в браузере.");
      return;
    }
    
    // Ждём, пока DOM обновится
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const container = document.getElementById(containerId);
    if (!container) {
      setError("Элемент для сканера не найден");
      return;
    }

    // Очищаем предыдущий сканер
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error cleaning scanner:", err);
      }
      scannerRef.current = null;
    }

    setIsScanning(true);

    try {
      // Динамический импорт html5-qrcode
      const { Html5Qrcode } = await import("html5-qrcode");
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
      };

      scannerRef.current = new Html5Qrcode(containerId);
      
      // Используем выбранную камеру или по умолчанию
      const cameraId = selectedCamera || { facingMode: "environment" };
      
      await scannerRef.current.start(
        cameraId,
        config,
        (decodedText: string) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage: string) => {
          // Игнорируем ошибки сканирования
          console.debug("Scanning:", errorMessage);
        }
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Нет доступа к камере. Пожалуйста, разрешите доступ к камере в настройках браузера.");
        } else if (err.name === "NotFoundError") {
          setError("Камера не найдена. Убедитесь, что камера подключена и работает.");
        } else if (err.name === "NotReadableError") {
          setError("Камера уже используется другим приложением. Закройте другие программы, использующие камеру.");
        } else if (err.name === "OverconstrainedError") {
          setError("Не удалось найти камеру с требуемыми характеристиками.");
        } else {
          setError(`Ошибка: ${err.message}`);
        }
      } else {
        setError("Не удалось запустить сканер. Проверьте подключение камеры.");
      }
      
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
    scannerRef.current = null;
  };

  const handleScanSuccess = async (decodedText: string) => {
    await stopScanner();
    setScanResult(decodedText);
    
    // Извлекаем инвентарный номер
    let inventoryNumber = decodedText;
    const invMatch = decodedText.match(/INV-\d{4}-\d{5}/);
    if (invMatch) {
      inventoryNumber = invMatch[0];
    }
    
    setIsLoading(true);
    
    try {
      const resp = await fetch(`/api/equipment/search?inventoryNumber=${encodeURIComponent(inventoryNumber)}`);
      if (resp.ok) {
        const equipment = await resp.json();
        router.push(`/dashboard/equipment/${equipment.id}`);
      } else {
        setError(`Оборудование с номером ${inventoryNumber} не найдено`);
        setScanResult(null);
      }
    } catch (err) {
      console.error("Error searching equipment:", err);
      setError("Ошибка при поиске оборудования");
      setScanResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualInput = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const inventoryNumber = formData.get("inventoryNumber") as string;
    
    if (!inventoryNumber) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const resp = await fetch(`/api/equipment/search?inventoryNumber=${encodeURIComponent(inventoryNumber)}`);
      if (resp.ok) {
        const equipment = await resp.json();
        router.push(`/dashboard/equipment/${equipment.id}`);
      } else {
        setError(`Оборудование с номером ${inventoryNumber} не найдено`);
      }
    } catch (err) {
      setError("Ошибка при поиске оборудования");
    } finally {
      setIsLoading(false);
    }
  };

  const requestCameraAgain = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission(true);
      setError(null);
      startScanner();
    } catch (err) {
      console.error("Camera permission denied:", err);
      setCameraPermission(false);
      setError("Разрешите доступ к камере в настройках браузера и попробуйте снова.");
    }
  };

  return (
    <main className="w-full h-full">
      <Block>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <Scan size={48} className="mx-auto mb-3 text-indigo-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Сканирование QR-кода
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Наведите камеру на QR-код оборудования для быстрого перехода
            </p>
          </div>

          {/* Выбор камеры */}
          {availableCameras.length > 1 && !isScanning && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Выберите камеру
              </label>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
              >
                {availableCameras.map((camera) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Камера ${camera.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Контейнер для сканера */}
          {(isScanning || error) && (
            <div className="space-y-4">
              <div 
                id={containerId}
                className="w-full max-w-md mx-auto rounded-xl overflow-hidden border-2 border-indigo-500 bg-black"
                style={{ aspectRatio: "1/1" }}
              />
              
              {isScanning && (
                <div className="flex justify-center gap-3">
                  <Button variant="secondary" onClick={stopScanner}>
                    <X size={16} />
                    Остановить
                  </Button>
                </div>
              )}
              
              {isScanning && (
                <p className="text-center text-sm text-gray-500">
                  Наведите камеру на QR-код
                </p>
              )}
            </div>
          )}

          {/* Кнопка старта */}
          {!isScanning && !scanResult && !error && (
            <div className="text-center">
              {cameraPermission === false ? (
                <div className="text-center">
                  <p className="text-red-500 mb-3">Нет доступа к камере</p>
                  <Button onClick={requestCameraAgain}>
                    <Camera size={18} />
                    Запросить доступ к камере
                  </Button>
                </div>
              ) : (
                <Button onClick={startScanner} size="lg" className="px-8">
                  <Camera size={18} />
                  Начать сканирование
                </Button>
              )}
              <p className="text-xs text-gray-400 mt-3">
                Потребуется доступ к камере
              </p>
            </div>
          )}

          {/* Результат сканирования */}
          {scanResult && !isScanning && (
            <div className="text-center p-6 bg-green-50 dark:bg-green-950/20 rounded-xl">
              <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
              <p className="text-lg font-medium text-green-700 dark:text-green-400">
                QR-код распознан!
              </p>
              <p className="text-sm text-gray-500 mt-1 break-all">{scanResult}</p>
              {isLoading && (
                <div className="mt-4 flex justify-center">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                </div>
              )}
              <Button variant="secondary" size="sm" onClick={() => {
                setScanResult(null);
                setError(null);
              }} className="mt-4">
                Сканировать другой
              </Button>
            </div>
          )}

          {/* Ошибка */}
          {error && !isScanning && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={startScanner}
                    >
                      Попробовать снова
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => {
                        setError(null);
                        setScanResult(null);
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ручной ввод */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
              Или введите инвентарный номер вручную
            </h3>
            <form onSubmit={handleManualInput} className="flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                name="inventoryNumber"
                placeholder="INV-2024-0000000001"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                pattern="INV-\d{4}-\d{10}"
                title="Формат: INV-2024-0000000001"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Найти"}
              </Button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-2">
              Формат: INV-ГГГГ-XXXXXXXXXX (например, INV-2024-0000000001)
            </p>
          </div>

          {/* Инструкция */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              💡 Если камера не работает:
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-300 mt-2 space-y-1">
              <li>• Разрешите доступ к камере в браузере</li>
              <li>• Проверьте, что камера работает в других приложениях</li>
              <li>• Используйте HTTPS или localhost (в некоторых браузерах)</li>
              <li>• Попробуйте другой браузер (Chrome, Edge, Firefox)</li>
            </ul>
          </div>
        </div>
      </Block>
    </main>
  );
}