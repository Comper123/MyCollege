"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import { Column, Table } from "@/components/ui/Table";
import { Plus, Pencil, Trash, Package } from "lucide-react";
import { FullLot } from "@/types/equipment";
import { formatDateTime } from "@/utils/datetime/dateFormatter";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import LotModal from "./LotModal";
import LotDetailModal from "./LotDetailModal";

export default function LotsList() {
  const [lots, setLots] = useState<FullLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<FullLot | null>(null);
  const [detailLot, setDetailLot] = useState<FullLot | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadLots = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);

    const resp = await fetch(`/api/equipment/lots?${params.toString()}`);
    if (resp.ok) {
      const data = await resp.json();
      setLots(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const l = () => loadLots();
    l();
  }, [search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const resp = await fetch(`/api/equipment/lots/${deleteId}`, { method: "DELETE" });
    if (resp.ok) {
      setLots((prev) => prev.filter((l) => l.id !== deleteId));
      setDeleteId(null);
    } else {
      const error = await resp.json();
      alert(error.error);
    }
    setIsDeleting(false);
  };

  const columns: Column<FullLot>[] = [
    {
      title: "Номер партии",
      key: "lotNumber",
      render: (value) => <span className="font-mono text-xs">{value as string}</span>,
    },
    {
      title: "Название",
      key: "name",
    },
    {
      title: "Тип",
      key: "equipmentType",
      render: (value) => (value as any)?.name,
    },
    {
      title: "Количество",
      key: "quantity",
    },
    {
      title: "Статус",
      key: "status",
      render: (value) => {
        const statuses: Record<string, string> = {
          draft: "Черновик",
          accepted: "Принят",
          partial: "Частично списан",
          closed: "Закрыт",
        };
        return statuses[value as string] || value;
      },
    },
    {
      title: "Дата создания",
      key: "createdAt",
      render: (value) => formatDateTime(value as string, "date"),
    },
    {
      title: "Действия",
      key: "id",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDetailLot(row)}
            className="p-1.5 rounded-md hover:bg-blue-100 text-blue-500 transition-colors"
            title="Просмотр"
          >
            <Package size={14} />
          </button>
          <button
            onClick={() => setSelectedLot(row)}
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          className="h-9 w-[300px]"
          placeholder="Поиск партий..."
        />
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Создать партию
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lots.length > 0 ? (
        <Table columns={columns} data={lots} keyExtractor={(row) => row.id} />
      ) : (
        <div className="text-center py-12 text-gray-500">Партии не найдены</div>
      )}

      <LotModal
        isOpen={isModalOpen || !!selectedLot}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLot(null);
        }}
        lot={selectedLot || undefined}
        onSuccess={() => {
          loadLots();
          setIsModalOpen(false);
          setSelectedLot(null);
        }}
      />

      <LotDetailModal
        isOpen={!!detailLot}
        onClose={() => setDetailLot(null)}
        lot={detailLot}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Удалить партию?"
        description="Партия будет удалена, если в ней нет оборудования."
        confirmText="Да, удалить"
        cancelText="Отмена"
        isLoading={isDeleting}
      />
    </div>
  );
}