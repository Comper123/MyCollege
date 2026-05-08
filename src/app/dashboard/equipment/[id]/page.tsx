"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Block } from "@/components/blocks/Block";
import ProtectedBlock from "@/components/blocks/ProtectedBlock";
import Button from "@/components/ui/Button";
import { Table, Column } from "@/components/ui/Table";
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  QrCode, 
  MapPin, 
  User, 
  Box, 
  Calendar,
  Barcode,
  Printer,
  Download,
  AlertCircle,
  CheckCircle,
  Wrench,
  Clock,
  Tag,
  Package,
  Building2,
  UserCircle,
  Cpu
} from "lucide-react";
import { FullEquipment } from "@/types/equipment";
import { fio } from "@/lib/db/schema";
import { AttributeSchema, EquipmentMovement } from "@/lib/db/schema/equipment";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import EquipmentModal from "@/components/pages/dashboard/equipment/EquipmentModal";
import QRCodeModal from "@/components/pages/dashboard/equipment/QRCodeModal";
import { formatDateTime } from "@/utils/datetime/dateFormatter";

interface MovementWithDetails extends EquipmentMovement {
  fromRoom: { number: string } | null;
  toRoom: { number: string } | null;
  movedBy: { firstname: string; lastname: string; fathername?: string } | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active: {
    label: "В эксплуатации",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    icon: <CheckCircle size={14} />
  },
  maintenance: {
    label: "На обслуживании",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    icon: <Wrench size={14} />
  },
  broken: {
    label: "Неисправно",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    icon: <AlertCircle size={14} />
  },
  reserved: {
    label: "Зарезервировано",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: <Clock size={14} />
  },
  written_off: {
    label: "Списано",
    color: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800/50",
    icon: <AlertCircle size={14} />
  },
};

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [equipment, setEquipment] = useState<FullEquipment | null>(null);
  const [movements, setMovements] = useState<MovementWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadEquipment = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(`/api/equipment/${id}`);
      if (resp.ok) {
        const data = await resp.json();
        setEquipment(data);
      } else if (resp.status === 404) {
        router.push("/dashboard/equipment");
      }
    } catch (error) {
      console.error("Error loading equipment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      const resp = await fetch(`/api/equipment/movements?equipmentId=${id}`);
      if (resp.ok) {
        const data = await resp.json();
        setMovements(data);
      }
    } catch (error) {
      console.error("Error loading movements:", error);
    }
  };

  useEffect(() => {
    loadEquipment();
    loadMovements();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const resp = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
      if (resp.ok) {
        router.push("/dashboard/equipment");
      }
    } catch (error) {
      console.error("Error deleting equipment:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!equipment) return;
    
    const data = {
      "Инвентарный номер": equipment.inventoryNumber,
      "Название": equipment.name,
      "Тип": equipment.equipmentType?.name,
      "Серийный номер": equipment.serialNumber,
      "Модель": equipment.model,
      "Производитель": equipment.manufacturer,
      "Статус": statusConfig[equipment.status]?.label || equipment.status,
      "Кабинет": equipment.room?.number || "—",
      "Ответственный": equipment.responsible ? fio(equipment.responsible) : "—",
      "Примечания": equipment.notes || "—",
      "Дата создания": formatDateTime(equipment.createdAt.toString(), "full"),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${equipment.inventoryNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const movementsColumns: Column<MovementWithDetails>[] = [
    {
      title: "Дата",
      key: "movedAt",
      render: (value) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDateTime(value as string, "full")}
        </span>
      ),
    },
    {
      title: "Из кабинета",
      key: "fromRoom",
      render: (value) => (
        <span className="text-sm">
          {(value as { number: string })?.number ? `Каб. ${(value as { number: string }).number}` : "—"}
        </span>
      ),
    },
    {
      title: "В кабинет",
      key: "toRoom",
      render: (value) => (
        <span className="text-sm font-medium">
          {(value as { number: string })?.number ? `Каб. ${(value as { number: string }).number}` : "—"}
        </span>
      ),
    },
    {
      title: "Кто переместил",
      key: "movedBy",
      render: (value) => <span className="text-sm">{fio(value as any) || "—"}</span>,
    },
    {
      title: "Причина",
      key: "reason",
      render: (value) => <span className="text-sm text-gray-500">{value as string || "—"}</span>,
    },
  ];

  if (isLoading) {
    return (
      <main className="w-full h-full">
        <Block>
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </Block>
      </main>
    );
  }

  if (!equipment) {
    return (
      <main className="w-full h-full">
        <Block>
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">Оборудование не найдено</p>
            <Button onClick={() => router.push("/dashboard/equipment")} className="mt-4">
              Вернуться к списку
            </Button>
          </div>
        </Block>
      </main>
    );
  }

  const status = statusConfig[equipment.status] || statusConfig.active;

  return (
    <main className="w-full h-full">
      <Block>
        {/* Навигация */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Назад</span>
          </button>
          
          <div className="flex gap-2 print:hidden">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={14} />
              Экспорт
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer size={14} />
              Печать
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsQRModalOpen(true)}>
              <QrCode size={14} />
              QR-код
            </Button>
            <ProtectedBlock allowedRoles={["admin", "laborant"]}>
              <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
                <Edit size={14} />
                Редактировать
              </Button>
            </ProtectedBlock>
            <ProtectedBlock allowedRoles={["admin"]}>
              <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
                <Trash size={14} />
                Удалить
              </Button>
            </ProtectedBlock>
          </div>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {equipment.name}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color}`}>
                  {status.icon}
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {equipment.inventoryNumber}
                </span>
                {equipment.serialNumber && (
                  <span className="text-gray-500 dark:text-gray-400">
                    СН: {equipment.serialNumber}
                  </span>
                )}
              </div>
            </div>
            {equipment.qrCode && (
              <div 
                className="print:hidden p-2 bg-white dark:bg-gray-800 rounded-xl border cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsQRModalOpen(true)}
              >
                <img 
                  src={equipment.qrCode} 
                  alt="QR Code" 
                  className="w-20 h-20"
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Левая колонка - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border rounded-xl p-5 bg-white dark:bg-gray-900/30">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Box size={18} className="text-indigo-500" />
                Основные характеристики
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Тип оборудования</p>
                  <p className="font-medium text-gray-900 dark:text-white">{equipment.equipmentType?.name || "—"}</p>
                </div>
                {equipment.model && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Модель</p>
                    <p className="text-gray-900 dark:text-white">{equipment.model}</p>
                  </div>
                )}
                {equipment.manufacturer && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Производитель</p>
                    <p className="text-gray-900 dark:text-white">{equipment.manufacturer}</p>
                  </div>
                )}
                {equipment.serialNumber && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Серийный номер</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">{equipment.serialNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Атрибуты */}
            {equipment.attributes && Object.keys(equipment.attributes).length > 0 && (
              <div className="border rounded-xl p-5 bg-white dark:bg-gray-900/30">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Cpu size={18} className="text-indigo-500" />
                  Характеристики
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(equipment.attributes).map(([key, value]) => {
                    // Находим схему атрибута по техническому имени (key)
                    const schema = equipment.equipmentType?.attributesSchema as AttributeSchema[];
                    const field = schema?.find(f => f.name === key);
                    
                    // Получаем отображаемое название (label) или используем key
                    const displayLabel = field?.label || key;
                    
                    // Форматируем значение в зависимости от типа
                    let displayValue = value;
                    if (field?.type === "boolean") {
                      displayValue = value ? "Да" : "Нет";
                    }
                    
                    // Добавляем единицу измерения если есть
                    const unit = field?.unit ? ` ${field.unit}` : "";
                    
                    return (
                      <div key={key} className="flex flex-col p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {displayLabel}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                          {String(displayValue)}{unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Примечания */}
            {equipment.notes && (
              <div className="border rounded-xl p-5 bg-white dark:bg-gray-900/30">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Примечания</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {equipment.notes}
                </p>
              </div>
            )}

            {/* История перемещений */}
            {movements.length > 0 && (
              <div className="border rounded-xl p-5 bg-white dark:bg-gray-900/30">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">История перемещений</h2>
                <Table
                  columns={movementsColumns}
                  data={movements}
                  keyExtractor={(row) => row.id}
                />
              </div>
            )}
          </div>

          {/* Правая колонка - 1/3 */}
          <div className="space-y-6">
            {/* Местоположение */}
            <div className="border rounded-xl p-5 bg-white dark:bg-gray-900/30">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-indigo-500" />
                Местоположение
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Кабинет</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {equipment.room?.number ? `Кабинет ${equipment.room.number}` : "Не указан"}
                  </p>
                </div>
                {equipment.room?.description && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Описание</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{equipment.room.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ответственные */}
            <div className="border rounded-xl p-5 bg-white dark:bg-gray-900/30">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UserCircle size={18} className="text-indigo-500" />
                Ответственные
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ответственный лаборант</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {equipment.responsible ? fio(equipment.responsible) : "Не назначен"}
                  </p>
                </div>
                {equipment.lot?.acceptedBy && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Принял партию</p>
                    <p className="text-sm text-gray-900 dark:text-white">{fio(equipment.lot.acceptedBy)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Даты */}
            <div className="border rounded-xl p-5 bg-white dark:bg-gray-900/30">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-500" />
                Даты
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Дата создания</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDateTime(equipment.createdAt.toString(), "full")}</p>
                </div>
                {equipment.purchasedAt && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Дата закупки</p>
                    <p className="text-sm text-gray-900 dark:text-white">{formatDateTime(equipment.purchasedAt.toString(), "date")}</p>
                  </div>
                )}
                {equipment.warrantyUntil && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Гарантия до</p>
                    <p className="text-sm text-gray-900 dark:text-white">{formatDateTime(equipment.warrantyUntil.toString(), "date")}</p>
                  </div>
                )}
                {equipment.writtenOffAt && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Дата списания</p>
                    <p className="text-sm text-red-600 dark:text-red-400">{formatDateTime(equipment.writtenOffAt.toString(), "full")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Информация о партии */}
            {equipment.lot && (
              <div className="border rounded-xl p-5 bg-white dark:bg-gray-900/30">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package size={18} className="text-indigo-500" />
                  Партия
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Номер партии</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">{equipment.lot.lotNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Название</p>
                    <p className="text-sm text-gray-900 dark:text-white">{equipment.lot.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Количество</p>
                    <p className="text-sm text-gray-900 dark:text-white">{equipment.lot.quantity} шт.</p>
                  </div>
                  {equipment.lot.supplier && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Поставщик</p>
                      <p className="text-sm text-gray-900 dark:text-white">{equipment.lot.supplier}</p>
                    </div>
                  )}
                  {equipment.lot.invoiceNumber && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Накладная</p>
                      <p className="text-sm text-gray-900 dark:text-white">{equipment.lot.invoiceNumber}</p>
                    </div>
                  )}
                  {equipment.lot.unitPriceCents && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Цена за единицу</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {(equipment.lot.unitPriceCents / 100).toLocaleString("ru-RU")} ₽
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Фотографии */}
        {equipment.photos && equipment.photos.length > 0 && (
          <div className="border rounded-xl p-5 bg-white dark:bg-gray-900/30">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Фотографии</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {equipment.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`${equipment.name} ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.open(photo, "_blank")}
                />
              ))}
            </div>
          </div>
        )}
      </Block>

      {/* Модалки */}
      <EquipmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          loadEquipment();
        }}
        equipment={equipment}
        onSuccess={() => {
          loadEquipment();
          setIsEditModalOpen(false);
        }}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Удалить оборудование?"
        description={
          <>
            Вы действительно хотите удалить оборудование <strong>{equipment.name}</strong>?
            <br />
            Это действие нельзя отменить.
          </>
        }
        confirmText="Да, удалить"
        cancelText="Отмена"
        isLoading={isDeleting}
      />

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        inventoryNumber={equipment.inventoryNumber}
        qrCode={equipment.qrCode}
        name={equipment.name}
      />
    </main>
  );
}