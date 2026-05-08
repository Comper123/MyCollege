"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Printer, Grid, List, ChevronDown } from "lucide-react";

interface Equipment {
  id: string;
  inventoryNumber: string;
  name: string;
  qrCode?: string | null;
}

interface BulkQRPrintProps {
  equipment: Equipment[];
  title: string;
}

export default function SimpleBulkQRPrint({ equipment, title }: BulkQRPrintProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrint = () => {
    setIsOpen(false);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-коды: ${title}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, sans-serif;
              padding: 20px;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .grid-layout {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
            }
            .list-layout {
              display: flex;
              flex-direction: column;
              gap: 15px;
            }
            .qr-item {
              text-align: center;
              padding: 15px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              break-inside: avoid;
            }
            .list-layout .qr-item {
              display: flex;
              align-items: center;
              gap: 20px;
              text-align: left;
            }
            .qr-image {
              width: 100px;
              height: 100px;
              object-fit: contain;
              margin: 0 auto;
            }
            .list-layout .qr-image {
              margin: 0;
            }
            .qr-placeholder {
              width: 100px;
              height: 100px;
              background: #f3f4f6;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              margin: 0 auto;
            }
            .list-layout .qr-placeholder {
              margin: 0;
            }
            .inventory-number {
              font-family: monospace;
              font-size: 12px;
              font-weight: 600;
              margin-top: 8px;
            }
            .equipment-name {
              font-size: 11px;
              color: #6b7280;
            }
            @media print {
              .page-break {
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>QR-коды: ${title}</h2>
            <p>Всего: ${equipment.length} шт.</p>
          </div>
          <div class="${layout === "grid" ? "grid-layout" : "list-layout"}">
            ${equipment.map(item => `
              <div class="qr-item">
                ${item.qrCode ? `
                  <img src="${item.qrCode}" class="qr-image" />
                ` : `
                  <div class="qr-placeholder">Нет QR</div>
                `}
                <div class="inventory-number">${item.inventoryNumber}</div>
                <div class="equipment-name">${item.name}</div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = () => { setTimeout(() => window.print(), 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (equipment.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
      >
        <Printer size={14} />
        QR-коды ({equipment.length})
        <ChevronDown size={12} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 space-y-3">
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Формат печати</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLayout("grid")}
                  className={`flex-1 py-1.5 px-2 rounded text-sm flex items-center justify-center gap-1 ${
                    layout === "grid"
                      ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Grid size={14} />
                  Сетка
                </button>
                <button
                  onClick={() => setLayout("list")}
                  className={`flex-1 py-1.5 px-2 rounded text-sm flex items-center justify-center gap-1 ${
                    layout === "list"
                      ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <List size={14} />
                  Список
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handlePrint}
                className="w-full py-2 px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Печать {equipment.length} QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}