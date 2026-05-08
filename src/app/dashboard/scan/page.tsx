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
  const [isScannerReady, setIsScannerReady] = useState(false);
  
  const scannerRef = useRef<any>(null);
  const containerId = "qr-reader-container";

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
    
    // Ждём, пока DOM обновится
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const container = document.getElementById(containerId);
    if (!container) {
      setError("Элемент для сканера не найден. Пожалуйста, обновите страницу.");
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
      // Динамически импортируем html5-qrcode
      const { Html5Qrcode } = await import("html5-qrcode");
      
      scannerRef.current = new Html5Qrcode(containerId);
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
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
          setError("Нет доступа к камере. Пожалуйста, разрешите доступ к камере.");
        } else if (err.name === "NotFoundError") {
          setError("Камера не найдена. Убедитесь, что камера подключена.");
        } else {
          setError("Не удалось запустить сканер. " + err.message);
        }
      } else {
        setError("Не удалось получить доступ к камере. Пожалуйста, проверьте разрешения.");
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
    // Останавливаем сканер после успешного сканирования
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
      const resp = await fetch(`/api/equipment/search?inventoryNumber=${inventoryNumber}`);
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
      const resp = await fetch(`/api/equipment/search?inventoryNumber=${inventoryNumber}`);
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

  const handleReset = () => {
    setError(null);
    setScanResult(null);
    setIsScanning(false);
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

          {/* Контейнер для сканера - всегда рендерится */}
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
              <Button onClick={startScanner} size="lg" className="px-8">
                <Camera size={18} />
                Начать сканирование
              </Button>
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
              <Button variant="secondary" size="sm" onClick={handleReset} className="mt-4">
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
                      onClick={handleReset}
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
                placeholder="INV-2024-00001"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                pattern="INV-\d{4}-\d{5}"
                title="Формат: INV-2024-00001"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Найти"}
              </Button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-2">
              Формат: INV-ГГГГ-XXXXX (например, INV-2024-00001)
            </p>
          </div>
        </div>
      </Block>
    </main>
  );
}