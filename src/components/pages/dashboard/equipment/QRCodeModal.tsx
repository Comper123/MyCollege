"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, X } from "lucide-react";
import Button from "@/components/ui/Button";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  name: string;
  inventoryNumber: string;
}

export default function QRModal({ isOpen, onClose, equipmentId, name, inventoryNumber }: QRModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  // Данные для QR-кода
  const qrData = JSON.stringify({
    type: "equipment",
    version: 1,
    id: equipmentId,
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      
      const link = document.createElement("a");
      link.download = `qr-${inventoryNumber}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error("Error downloading QR:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-код: ${inventoryNumber}</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui; }
            .container { text-align: center; }
            .qr { margin: 20px; }
            .inv { font-family: monospace; margin-top: 10px; }
            .name { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="qr" id="qr"></div>
            <div class="inv">${inventoryNumber}</div>
            <div class="name">${name}</div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
          <script>
            new QRCode(document.getElementById("qr"), { 
              text: '${qrData.replace(/'/g, "\\'")}', 
              width: 250, 
              height: 250 
            });
            setTimeout(() => window.print(), 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            QR-код оборудования
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl border">
            <QRCodeSVG
              value={qrData}
              size={250}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
            />
          </div>
          
          <p className="font-mono text-sm mt-4">{inventoryNumber}</p>
          <p className="text-sm text-gray-500">{name}</p>
          
          <div className="flex gap-3 mt-6 w-full">
            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1"
            >
              <Download size={16} />
              {isDownloading ? "Загрузка..." : "Скачать"}
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrint}
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