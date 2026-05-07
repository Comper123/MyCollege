"use client";

import { FullEquipment } from "@/types/equipment";
import { fio } from "@/lib/db/schema";
import ContextMenu from "@/components/ui/Actions";
import { Pencil, Trash, QrCode } from "lucide-react";
import { useState } from "react";
import QRCodeModal from "./QRCodeModal";

interface Props {
  equipment: FullEquipment;
  onEdit: () => void;
  onDelete: () => void;
}

const statusConfig = {
  active: { label: "В эксплуатации", color: "bg-green-100 text-green-700" },
  maintenance: { label: "На обслуживании", color: "bg-yellow-100 text-yellow-700" },
  broken: { label: "Неисправно", color: "bg-red-100 text-red-700" },
  reserved: { label: "Зарезервировано", color: "bg-blue-100 text-blue-700" },
  written_off: { label: "Списано", color: "bg-gray-100 text-gray-600" },
};

export default function EquipmentCard({ equipment, onEdit, onDelete }: Props) {
  const [qrOpen, setQrOpen] = useState(false);
  const status = statusConfig[equipment.status as keyof typeof statusConfig] || statusConfig.active;

  return (
    <>
      <div className="border rounded-xl p-4 bg-white dark:bg-gray-800/50 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{equipment.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="font-mono text-xs text-gray-500">{equipment.inventoryNumber}</p>
          </div>
          <ContextMenu
            items={[
              {
                label: "QR-код",
                icon: <QrCode size={14} />,
                onClick: () => setQrOpen(true),
              },
              {
                label: "Редактировать",
                icon: <Pencil size={14} />,
                onClick: onEdit,
              },
              {
                label: "Удалить",
                icon: <Trash size={14} />,
                variant: "danger",
                onClick: onDelete,
              },
            ]}
          />
        </div>

        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Тип:</span>
            <span>{equipment.equipmentType?.name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Кабинет:</span>
            <span>{equipment.room?.number || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ответственный:</span>
            <span className="truncate max-w-[150px]">{equipment.responsible && fio(equipment.responsible) || "—"}</span>
          </div>
          {equipment.model && (
            <div className="flex justify-between">
              <span className="text-gray-500">Модель:</span>
              <span className="truncate">{equipment.model}</span>
            </div>
          )}
        </div>

        {equipment.notes && (
          <p className="mt-2 text-xs text-gray-400 truncate">{equipment.notes}</p>
        )}
      </div>

      <QRCodeModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        inventoryNumber={equipment.inventoryNumber}
        qrCode={equipment.qrCode}
        name={equipment.name}
      />
    </>
  );
}