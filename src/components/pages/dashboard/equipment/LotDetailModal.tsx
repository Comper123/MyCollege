"use client";

import Modal from "@/components/ui/Modal";
import { FullEquipment, FullLot } from "@/types/equipment";
import { formatDateTime } from "@/utils/datetime/dateFormatter";
import { fio } from "@/lib/db/schema";
import { Table, Column } from "@/components/ui/Table";
import { Package, Calendar, User, Building2, CreditCard, Hash } from "lucide-react";
import SimpleBulkQRPrint from "./BulkQRPrint";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lot: FullLot | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Черновик", color: "text-gray-500 bg-gray-100" },
  accepted: { label: "Принят", color: "text-green-600 bg-green-50" },
  partial: { label: "Частично списан", color: "text-amber-600 bg-amber-50" },
  closed: { label: "Закрыт", color: "text-red-600 bg-red-50" },
};

export default function LotDetailModal({ isOpen, onClose, lot }: Props) {
  if (!lot) return null;

  const equipmentColumns: Column<FullEquipment>[] = [
    {
      title: "Инв. номер",
      key: "inventoryNumber",
      render: (value: unknown, row: FullEquipment) => <span className="font-mono text-xs">{row.inventoryNumber || "—"}</span>,
    },
    {
      title: "Название",
      key: "name",
      render: (value: unknown, row: FullEquipment) => <span className="font-medium">{row.name || "—"}</span>,
    },
    {
      title: "Кабинет",
      key: "roomId",
      render: (_value: unknown, row: FullEquipment) => (
        <span>{row.room?.number || "—"}</span>
      ),
    },
    {
      title: "Ответственный",
      key: "responsibleId",
      render: (_value: unknown, row: FullEquipment) => (
        <span>{row.responsible ? fio(row.responsible) : "—"}</span>
      ),
    },
    {
      title: "Статус",
      key: "status",
      render: (_value: unknown, row: FullEquipment) => {
        const statusMap: Record<string, string> = {
          active: "В эксплуатации",
          maintenance: "На обслуживании",
          broken: "Неисправно",
          reserved: "Зарезервировано",
          written_off: "Списано",
        };
        return statusMap[row.status] || row.status || "—";
      },
    },
  ];

  const createdCount = lot.items?.length || 0;
  const isFullyCreated = createdCount === lot.quantity;

  return (
    <Modal isOpen={isOpen} title={`Партия: ${lot.lotNumber}`} onClose={onClose} size="xl">
      <div className="space-y-5">
        {/* Статус бар */}
        <div className={`p-3 rounded-lg ${isFullyCreated ? "bg-green-50 dark:bg-green-950/20" : "bg-amber-50 dark:bg-amber-950/20"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={18} className={isFullyCreated ? "text-green-600" : "text-amber-600"} />
              <span className="font-medium">
                Создано {createdCount} из {lot.quantity} единиц оборудования
              </span>
            </div>
            {!isFullyCreated && (
              <span className="text-xs text-amber-600">Не все единицы созданы</span>
            )}
          </div>
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all ${isFullyCreated ? "bg-green-500" : "bg-amber-500"}`}
              style={{ width: `${(createdCount / lot.quantity) * 100}%` }}
            />
          </div>
        </div>

        {/* Основная информация */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Hash size={12} /> Номер партии
            </p>
            <p className="font-mono text-sm font-medium mt-0.5">{lot.lotNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Package size={12} /> Название
            </p>
            <p className="font-medium text-sm mt-0.5">{lot.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Building2 size={12} /> Тип
            </p>
            <p className="text-sm mt-0.5">{lot.equipmentType?.name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Количество</p>
            <p className="text-sm font-medium mt-0.5">{lot.quantity} шт.</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Статус</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusLabels[lot.status]?.color}`}>
              {statusLabels[lot.status]?.label || lot.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <User size={12} /> Принял
            </p>
            <p className="text-sm mt-0.5">{lot.acceptedBy && fio(lot.acceptedBy) || "—"}</p>
          </div>
          {lot.supplier && (
            <div>
              <p className="text-xs text-gray-500">Поставщик</p>
              <p className="text-sm mt-0.5">{lot.supplier}</p>
            </div>
          )}
          {lot.invoiceNumber && (
            <div>
              <p className="text-xs text-gray-500">Накладная</p>
              <p className="text-sm font-mono mt-0.5">{lot.invoiceNumber}</p>
            </div>
          )}
          {lot.unitPriceCents && (
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <CreditCard size={12} /> Цена за ед.
              </p>
              <p className="text-sm font-medium mt-0.5">
                {(lot.unitPriceCents / 100).toLocaleString("ru-RU")} ₽
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar size={12} /> Дата принятия
            </p>
            <p className="text-sm mt-0.5">
              {lot.acceptedAt ? formatDateTime(lot.acceptedAt.toString(), "full") : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Дата создания</p>
            <p className="text-sm mt-0.5">{formatDateTime(lot.createdAt.toString(), "full")}</p>
          </div>
        </div>

        {/* Оборудование в партии */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Оборудование в партии ({lot.items?.length || 0} шт.)
            </h3>
            {lot.items && lot.items.length > 0 && (
              <SimpleBulkQRPrint 
                equipment={lot.items.map(item => ({
                  id: item.id,
                  inventoryNumber: item.inventoryNumber,
                  name: item.name,
                  qrCode: item.qrCode,
                }))}
                title={`Партия ${lot.lotNumber}`}
              />
            )}
          </div>
          {lot.items && lot.items.length > 0 ? (
            <Table 
              columns={equipmentColumns} 
              data={lot.items} 
              keyExtractor={(row) => row.id}
            />
          ) : (
            <div className="text-center py-8 text-gray-400 border rounded-lg">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              <p>Оборудование ещё не создано</p>
              <p className="text-xs mt-1">Партия создана, но единицы оборудования ещё не сгенерированы</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}