"use client";

import { useState, useEffect } from "react";
import { Download, Printer, X, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import QRCode from "qrcode";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  name: string;
  inventoryNumber: string;
}

export default function QRModal({ isOpen, onClose, equipmentId, name, inventoryNumber }: QRModalProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Генерируем QR-код при открытии модалки
  useEffect(() => {
    if (!isOpen) return;

    const generateQR = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const qrData = JSON.stringify({
          type: "equipment",
          version: 1,
          id: equipmentId,
          inventoryNumber: inventoryNumber,
        });

        const url = await QRCode.toDataURL(qrData, {
          width: 400,
          margin: 2,
          errorCorrectionLevel: "H", // Высокий уровень для лучшего распознавания
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });

        setQrImageUrl(url);
      } catch (err) {
        console.error("QR generation failed:", err);
        setError("Не удалось сгенерировать QR-код");
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();
  }, [isOpen, equipmentId, inventoryNumber]);

  const handleDownload = async () => {
    try {
      const qrData = JSON.stringify({
        type: "equipment",
        version: 1,
        id: equipmentId,
        inventoryNumber: inventoryNumber,
      });

      const url = await QRCode.toDataURL(qrData, {
        width: 500,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      const link = document.createElement("a");
      link.download = `qr-${inventoryNumber}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handlePrint = () => {
    if (!qrImageUrl) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-код: ${inventoryNumber}</title>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
            }
            .container {
              text-align: center;
              padding: 20px;
            }
            .qr-wrapper {
              background: white;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              margin-bottom: 20px;
            }
            .qr-image {
              width: 250px;
              height: 250px;
              display: block;
              margin: 0 auto;
            }
            .inventory-number {
              font-family: monospace;
              font-size: 14px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 8px;
            }
            .equipment-name {
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="qr-wrapper">
              <img src="${qrImageUrl}" alt="QR Code" class="qr-image" />
            </div>
            <div class="inventory-number">${inventoryNumber}</div>
            <div class="equipment-name">${name}</div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 500);
            }, 300);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            QR-код оборудования
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          {/* Контейнер с QR-кодом */}
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            {isLoading ? (
              <div className="w-[250px] h-[250px] flex flex-col items-center justify-center">
                <Loader2 size={32} className="animate-spin text-indigo-500 mb-3" />
                <p className="text-sm text-gray-500">Генерация QR-кода...</p>
              </div>
            ) : error ? (
              <div className="w-[250px] h-[250px] flex flex-col items-center justify-center">
                <div className="text-red-500 text-center">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : (
              <img 
                src={qrImageUrl} 
                alt="QR Code" 
                width={250} 
                height={250} 
                className="w-[250px] h-[250px]"
              />
            )}
          </div>
          
          {/* Информация об оборудовании */}
          <div className="text-center mt-4">
            <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
              {inventoryNumber}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {name}
            </p>
          </div>
          
          {/* Кнопки действий */}
          <div className="flex gap-3 mt-6 w-full">
            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={isLoading || !!error}
              className="flex-1"
            >
              <Download size={16} />
              Скачать
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrint}
              disabled={isLoading || !!error}
              className="flex-1"
            >
              <Printer size={16} />
              Печать
            </Button>
            <Button onClick={onClose} className="flex-1">
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}