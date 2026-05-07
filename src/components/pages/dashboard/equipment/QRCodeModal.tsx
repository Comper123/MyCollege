"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Image from "next/image";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventoryNumber: string;
  qrCode?: string | null;
  name: string;
}

export default function QRCodeModal({ isOpen, onClose, inventoryNumber, qrCode, name }: Props) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head><title>QR-код: ${inventoryNumber}</title></head>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; flex-direction:column">
          <img src="${qrCode}" style="width:300px; height:300px" />
          <p style="font-family:monospace; margin-top:20px">${inventoryNumber}</p>
          <p>${name}</p>
        </body>
      </html>
    `);
    printWindow.print();
    printWindow.close();
  };

  return (
    <Modal isOpen={isOpen} title="QR-код оборудования" onClose={onClose}>
      <div className="flex flex-col items-center py-4">
        {qrCode ? (
          <img src={qrCode} alt="QR Code" className="w-48 h-48" />
        ) : (
          <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            Нет QR-кода
          </div>
        )}
        <p className="font-mono text-sm mt-3">{inventoryNumber}</p>
        <p className="text-gray-500 text-sm">{name}</p>

        <div className="flex gap-3 mt-6">
          <Button variant="primary" onClick={onClose}>
            Закрыть
          </Button>
          <Button onClick={handlePrint}>Печать</Button>
        </div>
      </div>
    </Modal>
  );
}