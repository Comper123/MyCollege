"use client";

import { useEffect, useMemo, useState } from "react";
import EmptyBlock from "@/components/blocks/EmptyBlock";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import { Column, Table } from "@/components/ui/Table";
import { LayoutGrid, Plus, Table as TableIcon, Pencil, Trash } from "lucide-react";
import Grid from "@/components/ui/Grid";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { FullEquipment } from "@/types/equipment";
import { fio } from "@/lib/db/schema";
import { EquipmentType, Room, User } from "@/lib/db/schema";
import EquipmentModal from "./EquipmentModal";
import EquipmentCard from "./EquipmentCard";


export default function EquipmentList() {
  const [equipment, setEquipment] = useState<FullEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");

  // Фильтры
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Модалки
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<FullEquipment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusOptions = [
    { value: "active", label: "В эксплуатации", color: "text-green-600" },
    { value: "maintenance", label: "На обслуживании", color: "text-yellow-600" },
    { value: "broken", label: "Неисправно", color: "text-red-600" },
    { value: "reserved", label: "Зарезервировано", color: "text-blue-600" },
    { value: "written_off", label: "Списано", color: "text-gray-500" },
  ];

  

  

  useEffect(() => {
    const loadFilters = async () => {
        const [typesRes, roomsRes] = await Promise.all([
        fetch("/api/admin/equipmentTypes"),
        fetch("/api/rooms"),
        ]);
        if (typesRes.ok) setTypes(await typesRes.json());
        if (roomsRes.ok) setRooms(await roomsRes.json());
    };
    loadFilters();
  }, []);

  const loadEquipment = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedType) params.append("typeId", selectedType);
    if (selectedRoom) params.append("roomId", selectedRoom);
    if (selectedStatus) params.append("status", selectedStatus);

    const resp = await fetch(`/api/equipment?${params.toString()}`);
    if (resp.ok) {
    const data = await resp.json();
    setEquipment(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const l = () => loadEquipment();
    l();
  }, [search, selectedType, selectedRoom, selectedStatus]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const resp = await fetch(`/api/equipment/${deleteId}`, { method: "DELETE" });
    if (resp.ok) {
      setEquipment((prev) => prev.filter((e) => e.id !== deleteId));
      setDeleteId(null);
    }
    setIsDeleting(false);
  };

  const columns: Column<FullEquipment>[] = [
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
      title: "Тип",
      key: "equipmentType",
      render: (value) => (value as EquipmentType)?.name,
    },
    {
      title: "Кабинет",
      key: "room",
      render: (value) => (value as Room)?.number || "—",
    },
    {
      title: "Ответственный",
      key: "responsible",
      render: (value) => fio(value as User) || "—",
    },
    {
      title: "Статус",
      key: "status",
      render: (value) => {
        const opt = statusOptions.find((s) => s.value === value);
        return <span className={`text-xs font-medium ${opt?.color}`}>{opt?.label}</span>;
      },
    },
    {
      title: "Действия",
      key: "id",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditingEquipment(row)}
            className="p-1.5 rounded-md hover:bg-indigo-100 text-indigo-500 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            className="p-1.5 rounded-md hover:bg-red-100 text-red-500 transition-colors"
          >
            <Trash size={14} />
          </button>
        </div>
      ),
    },
  ];

  const filteredEquipment = useMemo(() => {
    if (!search.trim()) return equipment;
    return equipment.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.inventoryNumber.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, equipment]);

  return (
    <div>
      {/* Фильтры и поиск */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="h-9 w-[300px]"
          placeholder="Поиск по названию или инв. номеру..."
        />

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm bg-white dark:bg-gray-800"
        >
          <option value="">Все типы</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm bg-white dark:bg-gray-800"
        >
          <option value="">Все кабинеты</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.number}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm bg-white dark:bg-gray-800"
        >
          <option value="">Все статусы</option>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="flex ml-auto">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              className={`p-1.5 px-2 transition-colors ${mode === "grid" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
              onClick={() => setMode("grid")}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`p-1.5 px-2 transition-colors ${mode === "table" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
              onClick={() => setMode("table")}
            >
              <TableIcon size={18} />
            </button>
          </div>

          <Button className="ml-3" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Добавить
          </Button>
        </div>
      </div>

      {/* Список оборудования */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredEquipment.length > 0 ? (
        mode === "grid" ? (
          <Grid cols={3}>
            {filteredEquipment.map((item) => (
              <EquipmentCard
                key={item.id}
                equipment={item}
                onEdit={() => setEditingEquipment(item)}
                onDelete={() => setDeleteId(item.id)}
              />
            ))}
          </Grid>
        ) : (
          <Table columns={columns} data={filteredEquipment} keyExtractor={(row) => row.id} />
        )
      ) : (
        <EmptyBlock title="Оборудование не найдено" />
      )}

      {/* Модалки */}
      <EquipmentModal
        isOpen={isModalOpen || !!editingEquipment}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEquipment(null);
        }}
        equipment={editingEquipment || undefined}
        onSuccess={() => {
          loadEquipment();
          setIsModalOpen(false);
          setEditingEquipment(null);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Удалить оборудование?"
        description="Это действие нельзя отменить."
        confirmText="Да, удалить"
        cancelText="Отмена"
        isLoading={isDeleting}
      />
    </div>
  );
}