"use client";

import { FullEquipment } from "@/types/equipment";
import { Monitor, Wrench, AlertCircle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

interface EquipmentCardSmallProps {
  equipment: FullEquipment;
}

const statusIcons = {
  active: <CheckCircle size={12} className="text-emerald-500" />,
  maintenance: <Wrench size={12} className="text-amber-500" />,
  broken: <AlertCircle size={12} className="text-red-500" />,
  reserved: <Clock size={12} className="text-blue-500" />,
  written_off: <AlertCircle size={12} className="text-gray-400" />,
};

export default function EquipmentCardSmall({ equipment }: EquipmentCardSmallProps) {
  return (
    <Link 
      href={`/dashboard/equipment/${equipment.id}`}
      className="block p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-gray-400" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              {equipment.name}
            </p>
            <p className="font-mono text-xs text-gray-400">
              {equipment.inventoryNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {statusIcons[equipment.status as keyof typeof statusIcons]}
        </div>
      </div>
      {equipment.model && (
        <p className="text-xs text-gray-500 mt-1">{equipment.model}</p>
      )}
    </Link>
  );
}