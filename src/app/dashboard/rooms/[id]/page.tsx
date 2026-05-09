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
  Building2,
  User,
  UserCog,
  FileText,
  Calendar,
  Package,
  Monitor,
  Wrench,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  Printer,
  Download,
  Plus,
  LayoutGrid,
  TableIcon
} from "lucide-react";
import { FullRoom } from "@/types/rooms";
import { fio } from "@/lib/db/schema";
import { FullEquipment } from "@/types/equipment";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { formatDateTime } from "@/utils/datetime/dateFormatter";
import Image from "next/image";
import Link from "next/link";
import EquipmentCardSmall from "@/components/pages/dashboard/equipment/EquipmentCardSmall";
import SimpleBulkQRPrint from "@/components/pages/dashboard/equipment/BulkQRPrint";

interface RoomWithDetails extends FullRoom {
  equipment?: FullEquipment[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "В эксплуатации", color: "text-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  maintenance: { label: "На обслуживании", color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-950/30" },
  broken: { label: "Неисправно", color: "text-red-700", bg: "bg-red-50 dark:bg-red-950/30" },
  reserved: { label: "Зарезервировано", color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-950/30" },
  written_off: { label: "Списано", color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800/50" },
};

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [room, setRoom] = useState<RoomWithDetails | null>(null);
  const [equipment, setEquipment] = useState<FullEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [equipmentMode, setEquipmentMode] = useState<"grid" | "table">("grid");

  const loadRoom = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(`/api/rooms/${id}`);
      if (resp.ok) {
        const data = await resp.json();
        setRoom(data);
      } else if (resp.status === 404) {
        router.push("/dashboard/rooms");
      }
    } catch (error) {
      console.error("Error loading room:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEquipment = async () => {
    try {
      const resp = await fetch(`/api/equipment?roomId=${id}`);
      if (resp.ok) {
        const data = await resp.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error("Error loading equipment:", error);
    }
  };

  useEffect(() => {
    loadRoom();
    loadEquipment();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const resp = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
      if (resp.ok) {
        router.push("/dashboard/rooms");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!room) return;
    
    const data = {
      "Номер кабинета": room.number,
      "Описание": room.description || "—",
      "Ответственный преподаватель": room.attachedTeacher ? fio(room.attachedTeacher) : "—",
      "Ответственный лаборант": room.attachedLaborant ? fio(room.attachedLaborant) : "—",
      "Количество оборудования": equipment.length,
      "Оборудование": equipment.map(e => ({
        "Название": e.name,
        "Инвентарный номер": e.inventoryNumber,
        "Статус": e.status,
        "Модель": e.model || "—",
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `room-${room.number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const equipmentColumns: Column<FullEquipment>[] = [
    {
      title: "Инв. номер",
      key: "inventoryNumber",
      render: (value) => <span className="font-mono text-xs">{value as string}</span>,
    },
    {
      title: "Название",
      key: "name",
      render: (value, row) => (
        <Link 
          href={`/dashboard/equipment/${row.id}`}
          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
        >
          {value as string}
        </Link>
      ),
    },
    {
      title: "Тип",
      key: "equipmentType",
      render: (value) => (value as any)?.name || "—",
    },
    {
      title: "Модель",
      key: "model",
      render: (value) => value?.toString() || "—",
    },
    {
      title: "Статус",
      key: "status",
      render: (value) => {
        const status = statusConfig[value as string] || statusConfig.active;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      title: "Ответственный",
      key: "responsible",
      render: (value) => fio(value as any) || "—",
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

  if (!room) {
    return (
      <main className="w-full h-full">
        <Block>
          <div className="text-center py-16">
            <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">Кабинет не найден</p>
            <Button onClick={() => router.push("/dashboard/rooms")} className="mt-4">
              Вернуться к списку
            </Button>
          </div>
        </Block>
      </main>
    );
  }

  return (
    <main className="w-full h-full print:p-4">
      <Block>
        {/* Навигация */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3 print:hidden">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Назад</span>
          </button>
          
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={14} />
              Экспорт
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer size={14} />
              Печать
            </Button>
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
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30">
                <Building2 size={32} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Кабинет {room.number}
                </h1>
                {room.description && (
                  <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                    {room.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 text-center">
            <Package size={20} className="mx-auto mb-2 text-indigo-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{equipment.length}</p>
            <p className="text-xs text-gray-500">Единиц оборудования</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 text-center">
            <Monitor size={20} className="mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {equipment.filter(e => e.status === "active").length}
            </p>
            <p className="text-xs text-gray-500">В эксплуатации</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 text-center">
            <Wrench size={20} className="mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {equipment.filter(e => e.status === "maintenance" || e.status === "broken").length}
            </p>
            <p className="text-xs text-gray-500">На ремонте/неисправно</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 text-center">
            <Clock size={20} className="mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {equipment.filter(e => e.status === "reserved").length}
            </p>
            <p className="text-xs text-gray-500">Зарезервировано</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Левая колонка - Информация о кабинете */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ответственные */}
            <div className="border rounded-xl p-5 bg-white dark:bg-gray-900/30">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User size={18} className="text-indigo-500" />
                Ответственные лица
              </h2>
              <div className="space-y-4">
                {room.attachedTeacher && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Преподаватель</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {fio(room.attachedTeacher)}
                      </p>
                      {room.attachedTeacher.email && (
                        <p className="text-xs text-gray-400 mt-1">{room.attachedTeacher.email}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {room.attachedLaborant && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <UserCog size={18} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Лаборант</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {fio(room.attachedLaborant)}
                      </p>
                      {room.attachedLaborant.email && (
                        <p className="text-xs text-gray-400 mt-1">{room.attachedLaborant.email}</p>
                      )}
                    </div>
                  </div>
                )}

                {!room.attachedTeacher && !room.attachedLaborant && (
                  <p className="text-gray-400 text-sm">Нет назначенных ответственных</p>
                )}
              </div>
            </div>

            {/* Информация о кабинете */}
            <div className="border rounded-xl p-5 bg-white dark:bg-gray-900/30">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={18} className="text-indigo-500" />
                Информация
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Номер кабинета</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    Кабинет {room.number}
                  </p>
                </div>
                {room.description && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Назначение</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {room.description}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Дата создания</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDateTime(room.createdAt?.toString() || new Date().toISOString(), "full")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка - Оборудование */}
          <div className="lg:col-span-2">
            <div className="border rounded-xl bg-white dark:bg-gray-900/30 overflow-hidden">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Monitor size={18} className="text-indigo-500" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Оборудование в кабинете
                    </h2>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full">
                      {equipment.length} ед.
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {equipment.length > 0 && (
                      <SimpleBulkQRPrint 
                        equipment={equipment.map(item => ({
                          id: item.id,
                          inventoryNumber: item.inventoryNumber,
                          name: item.name,
                          qrCode: item.qrCode,
                        }))}
                        title={`Кабинет ${room.number}`}
                      />
                    )}
                    {/* Переключатель режимов */}
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <button
                        className={`p-1.5 px-2 transition-colors ${
                          equipmentMode === "grid" 
                            ? "bg-gray-100 dark:bg-gray-700 text-indigo-600" 
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setEquipmentMode("grid")}
                        title="Сетка"
                      >
                        <LayoutGrid size={14} />
                      </button>
                      <button
                        className={`p-1.5 px-2 transition-colors ${
                          equipmentMode === "table" 
                            ? "bg-gray-100 dark:bg-gray-700 text-indigo-600" 
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setEquipmentMode("table")}
                        title="Таблица"
                      >
                        <TableIcon size={14} />
                      </button>
                    </div>
                    
                    <Link href={`/dashboard/equipment?roomId=${room.id}`}>
                      <Button variant="secondary" size="sm">
                        <Plus size={14} />
                        Добавить
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {equipment.length > 0 ? (
                  equipmentMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {equipment.map((item) => (
                        <EquipmentCardSmall key={item.id} equipment={item} />
                      ))}
                    </div>
                  ) : (
                    <Table
                      columns={equipmentColumns}
                      data={equipment}
                      keyExtractor={(row) => row.id}
                    />
                  )
                ) : (
                  <div className="text-center py-12">
                    <Monitor size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">В кабинете нет оборудования</p>
                    <Link href={`/dashboard/equipment?roomId=${room.id}`}>
                      <Button variant="secondary" className="mt-4">
                        <Plus size={14} />
                        Добавить оборудование
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Дополнительная информация - Карта/План кабинета (опционально) */}
        {/* <div className="border rounded-xl p-5 bg-white dark:bg-gray-900/30">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-indigo-500" />
            Схема расположения
          </h2>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64 flex items-center justify-center">
            <p className="text-gray-400">Схема кабинета будет добавлена позже</p>
          </div>
        </div> */}
      </Block>

      {/* Модалка удаления */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Удалить кабинет?"
        description={
          <>
            Вы действительно хотите удалить кабинет <strong>№{room.number}</strong>?
            <br />
            Все оборудование в этом кабинете потеряет привязку к местоположению.
            <br />
            Это действие нельзя отменить.
          </>
        }
        confirmText="Да, удалить"
        cancelText="Отмена"
        isLoading={isDeleting}
      />
    </main>
  );
}