"use client";

import { useRouter } from "next/navigation";
import { FullEquipment } from "@/types/equipment";
import { fio } from "@/lib/db/schema";
import ContextMenu from "@/components/ui/Actions";
import { Pencil, Trash, QrCode, Eye, Wrench, Package } from "lucide-react";
import { useState } from "react";
import QRCodeModal from "./QRCodeModal";

interface EquipmentCardProps {
  equipment: FullEquipment;
  onEdit: () => void;
  onDelete: () => void;
  onRequestRepair?: () => void;
  showRequestButton?: boolean;
  variant?: "default" | "compact";
}

const statusConfig = {
  active: { label: "В эксплуатации", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  maintenance: { label: "На обслуживании", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  broken: { label: "Неисправно", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  reserved: { label: "Зарезервировано", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  written_off: { label: "Списано", color: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400" },
};

export default function EquipmentCard({ 
  equipment, 
  onEdit, 
  onDelete, 
  onRequestRepair,
  showRequestButton = true,
  variant = "default" 
}: EquipmentCardProps) {
  const router = useRouter();
  const [qrOpen, setQrOpen] = useState(false);
  const status = statusConfig[equipment.status as keyof typeof statusConfig] || statusConfig.active;

  const handleClick = () => {
    router.push(`/dashboard/equipment/${equipment.id}`);
  };

  if (variant === "compact") {
    return (
      <div className="border rounded-lg p-3 bg-white dark:bg-gray-800/50 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Package size={14} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0" onClick={handleClick}>
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                {equipment.name}
              </p>
              <p className="font-mono text-xs text-gray-400 truncate">
                {equipment.inventoryNumber}
              </p>
            </div>
          </div>
          {showRequestButton && onRequestRepair && equipment.status !== "written_off" && (
            <button
              onClick={(e) => { e.stopPropagation(); onRequestRepair(); }}
              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors flex-shrink-0"
              title="Заявка на ремонт"
            >
              <Wrench size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="border rounded-xl p-4 bg-white dark:bg-gray-800/50 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-white">{equipment.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="font-mono text-xs text-gray-500">{equipment.inventoryNumber}</p>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <ContextMenu
              items={[
                {
                  label: "Открыть",
                  icon: <Eye size={14} />,
                  onClick: handleClick,
                },
                {
                  label: "QR-код",
                  icon: <QrCode size={14} />,
                  onClick: () => setQrOpen(true),
                },
                ...(onRequestRepair ? [{
                  label: "Заявка на ремонт",
                  icon: <Wrench size={14} />,
                  onClick: onRequestRepair,
                }] : []),
                {
                  label: "Редактировать",
                  icon: <Pencil size={14} />,
                  onClick: onEdit,
                },
                {
                  label: "Удалить",
                  icon: <Trash size={14} />,
                  variant: "danger" as const,
                  onClick: onDelete,
                },
              ]}
            />
          </div>
        </div>

        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Тип:</span>
            <span className="truncate max-w-[150px]">{equipment.equipmentType?.name || "—"}</span>
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
              <span className="truncate max-w-[150px]">{equipment.model}</span>
            </div>
          )}
        </div>
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