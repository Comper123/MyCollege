"use client";

import Modal from "@/components/ui/Modal";
import { FullEquipment, FullLot } from "@/types/equipment";
import { formatDateTime } from "@/utils/datetime/dateFormatter";
import { fio } from "@/lib/db/schema";
import { Table, Column } from "@/components/ui/Table";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lot: FullLot | null;
}

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  accepted: "Принят",
  partial: "Частично списан",
  closed: "Закрыт",
};

export default function LotDetailModal({ isOpen, onClose, lot }: Props) {
  if (!lot) return null;

  const equipmentColumns: Column<FullEquipment>[] = [
    {
      title: "Инв. номер",
      key: "inventoryNumber",
      render: (value) => <span className="font-mono text-xs">{value as string}</span>,
    },
    {
      title: "Название",
      key: "name",
    },
    {
      title: "Кабинет",
      key: "room",
      render: (value, row) => row.room?.number || "—",
    },
    {
      title: "Статус",
      key: "status",
    },
  ];

  return (
    <Modal isOpen={isOpen} title={`Партия: ${lot.lotNumber}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* Основная информация */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Название</p>
            <p className="font-medium">{lot.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Тип оборудования</p>
            <p>{lot.equipmentType?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Количество</p>
            <p>{lot.quantity} шт.</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Статус</p>
            <p>{statusLabels[lot.status] || lot.status}</p>
          </div>
          {lot.supplier && (
            <div>
              <p className="text-xs text-gray-500">Поставщик</p>
              <p>{lot.supplier}</p>
            </div>
          )}
          {lot.invoiceNumber && (
            <div>
              <p className="text-xs text-gray-500">Номер накладной</p>
              <p>{lot.invoiceNumber}</p>
            </div>
          )}
          {lot.unitPriceCents && (
            <div>
              <p className="text-xs text-gray-500">Цена за единицу</p>
              <p>{(lot.unitPriceCents / 100).toLocaleString("ru-RU")} ₽</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">Принял</p>
            <p>{lot.acceptedBy && fio(lot.acceptedBy) || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Дата принятия</p>
            <p>{lot.acceptedAt ? formatDateTime(lot.acceptedAt.toISOString(), "full") : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Дата создания</p>
            <p>{formatDateTime(lot.createdAt.toISOString(), "full")}</p>
          </div>
        </div>

        {/* Оборудование в партии */}
        <div>
          <h3 className="font-medium mb-2">Оборудование в партии ({lot.items?.length || 0} шт.)</h3>
          {lot.items && lot.items.length > 0 ? (
            <Table columns={equipmentColumns} data={lot.items} keyExtractor={(row) => row.id} />
          ) : (
            <p className="text-gray-400 text-sm">Оборудование ещё не создано</p>
          )}
        </div>
      </div>
    </Modal>
  );
}