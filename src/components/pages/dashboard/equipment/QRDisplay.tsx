"use client";

import { useState, useEffect } from "react";
import { QrCode, Download, Printer, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import QRCode from "qrcode";

interface QRDisplayProps {
  equipmentId: string;
  inventoryNumber: string;
  name: string;
}

export default function QRDisplay({ equipmentId, inventoryNumber, name }: QRDisplayProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          width: 200,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        
        setQrUrl(url);
      } catch (err) {
        console.error("QR generation failed:", err);
        setError("Не удалось сгенерировать QR-код");
      } finally {
        setIsLoading(false);
      }
    };
    
    generateQR();
  }, [equipmentId, inventoryNumber]);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border">
        <Loader2 size={32} className="animate-spin text-indigo-500 mb-2" />
        <p className="text-sm text-gray-500">Генерация QR-кода...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-3 rounded-xl border shadow-sm">
        <img src={qrUrl} alt="QR Code" width={150} height={150} className="w-36 h-36" />
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleDownload}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Скачать QR-код"
        >
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}