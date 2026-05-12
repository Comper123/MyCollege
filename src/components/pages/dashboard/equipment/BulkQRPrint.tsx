"use client";

import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import { Printer, Loader2 } from "lucide-react";
import QRCode from "qrcode";

interface Equipment {
  id: string;
  inventoryNumber: string;
  name: string;
}

interface BulkQRPrintProps {
  equipment: Equipment[];
  title: string;
}

export default function BulkQRPrint({ equipment, title }: BulkQRPrintProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrImages, setQrImages] = useState<Map<string, string>>(new Map());
  const [generatedCount, setGeneratedCount] = useState(0);
  const [allGenerated, setAllGenerated] = useState(false);
  const generationStarted = useRef(false);

  const generateAllQRCodes = async () => {
    setIsGenerating(true);
    setGeneratedCount(0);
    setAllGenerated(false);
    
    const newQrImages = new Map<string, string>();
    
    for (let i = 0; i < equipment.length; i++) {
      const item = equipment[i];
      try {
        const qrData = JSON.stringify({
          type: "equipment",
          version: 1,
          id: item.id,
          inventoryNumber: item.inventoryNumber,
        });
        
        const url = await QRCode.toDataURL(qrData, {
          width: 150,
          margin: 1,
          errorCorrectionLevel: "H",
        });
        
        newQrImages.set(item.id, url);
        setGeneratedCount(i + 1);
      } catch (err) {
        console.error(`Failed to generate QR for ${item.id}:`, err);
      }
    }
    
    setQrImages(newQrImages);
    setAllGenerated(true);
    setIsGenerating(false);
  };

  // Генерация всех QR-кодов - запускаем только один раз
  useEffect(() => {
    const timer = setTimeout(() => {
      if (equipment.length > 0 && qrImages.size === 0 && !generationStarted.current) {
        generationStarted.current = true;
        generateAllQRCodes();
      }
    })
    return clearTimeout(timer);
  }, [equipment.length]);

  

  const handlePrint = () => {
    if (!allGenerated) {
      alert("Пожалуйста, подождите, QR-коды генерируются...");
      return;
    }
    
    setIsPrinting(true);
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setIsPrinting(false);
      return;
    }

    const itemsHtml = equipment.map(item => {
      const qrUrl = qrImages.get(item.id);
      return `
        <div class="qr-item">
          <div class="qr-image">
            ${qrUrl ? `<img src="${qrUrl}" alt="QR Code" />` : '<div class="qr-placeholder">Ошибка генерации</div>'}
          </div>
          <div class="inventory-number">${item.inventoryNumber}</div>
          <div class="equipment-name">${item.name}</div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-коды: ${title}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .header h1 { font-size: 24px; margin-bottom: 8px; }
            .header p { color: #6b7280; font-size: 14px; }
            .grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
            }
            .qr-item {
              text-align: center;
              padding: 15px;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .qr-image {
              width: 120px;
              height: 120px;
              margin: 0 auto 10px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-image img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .qr-placeholder {
              width: 120px;
              height: 120px;
              background: #f3f4f6;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              color: #9ca3af;
              font-size: 12px;
            }
            .inventory-number {
              font-family: monospace;
              font-size: 11px;
              font-weight: 600;
              margin-top: 8px;
            }
            .equipment-name {
              font-size: 10px;
              color: #6b7280;
              margin-top: 4px;
            }
            @media print {
              .qr-item {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>QR-коды оборудования</h1>
            <p>${title} • Всего: ${equipment.length} шт.</p>
          </div>
          <div class="grid">
            ${itemsHtml}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 1000);
            }, 500);
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setIsPrinting(false);
  };

  if (equipment.length === 0) return null;

  return (
    <Button 
      variant="secondary" 
      size="sm" 
      onClick={handlePrint}
      disabled={isPrinting || isGenerating}
    >
      {isPrinting ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isGenerating ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Printer size={14} />
      )}
      {isGenerating ? `Генерация QR (${generatedCount}/${equipment.length})` : `Печать QR (${equipment.length})`}
    </Button>
  );
}