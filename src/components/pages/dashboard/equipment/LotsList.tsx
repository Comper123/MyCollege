"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import { Column, Table } from "@/components/ui/Table";
import { Plus, Pencil, Trash, Package, RefreshCw } from "lucide-react";
import { FullLot } from "@/types/equipment";
import { formatDateTime } from "@/utils/datetime/dateFormatter";
import LotModal from "./LotModal";
import LotDetailModal from "./LotDetailModal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

export default function LotsList() {
  const [lots, setLots] = useState<FullLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<FullLot | null>(null);
  const [detailLot, setDetailLot] = useState<FullLot | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const resp = await fetch(`/api/equipment/lots?${params.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        console.log("Loaded lots:", data); // Для отладки
        setLots(data);
      } else {
        const errorData = await resp.json();
        setError(errorData.error || "Ошибка загрузки партий");
      }
    } catch (err) {
      console.error("Error loading lots:", err);
      setError("Ошибка сети при загрузке партий");
    } finally {
      setIsLoading(false);
    }
  }, [setLots, search]);

  useEffect(() => {
    loadLots();
  }, [search, loadLots]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const resp = await fetch(`/api/equipment/lots/${deleteId}`, { method: "DELETE" });
      if (resp.ok) {
        setLots((prev) => prev.filter((l) => l.id !== deleteId));
        setDeleteId(null);
      } else {
        const error = await resp.json();
        alert(error.error);
      }
    } catch (err) {
      console.error("Error deleting lot:", err);
      alert("Ошибка при удалении партии");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<FullLot>[] = [
    {
      title: "Номер партии",
      key: "lotNumber",
      render: (value) => <span className="font-mono text-xs font-medium">{value as string}</span>,
    },
    {
      title: "Название",
      key: "name",
      render: (value) => <span className="font-medium">{value as string}</span>,
    },
    {
      title: "Тип",
      key: "equipmentType",
      render: (value) => (value as any)?.name || "—",
    },
    {
      title: "Кол-во",
      key: "quantity",
      render: (value) => (
        <div className="flex items-center gap-1">
          <span className="font-semibold">{value as number}</span>
          <span className="text-xs text-gray-400">шт.</span>
        </div>
      ),
    },
    {
      title: "Создано",
      key: "items",
      render: (_, row) => {
        const createdCount = row.items?.length || 0;
        const totalCount = row.quantity;
        return (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${createdCount === totalCount ? "text-green-600" : "text-amber-600"}`}>
              {createdCount}/{totalCount}
            </span>
            {createdCount === totalCount ? (
              <span className="text-xs text-green-600">✓</span>
            ) : (
              <span className="text-xs text-amber-600">⚠</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Статус",
      key: "status",
      render: (value) => {
        const statuses: Record<string, { label: string; color: string }> = {
          draft: { label: "Черновик", color: "text-gray-500 bg-gray-100" },
          accepted: { label: "Принят", color: "text-green-600 bg-green-50" },
          partial: { label: "Частично списан", color: "text-amber-600 bg-amber-50" },
          closed: { label: "Закрыт", color: "text-red-600 bg-red-50" },
        };
        const s = statuses[value as string] || statuses.draft;
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
            {s.label}
          </span>
        );
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
            title="Редактировать"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            className="p-1.5 rounded-md hover:bg-red-100 text-red-500 transition-colors"
            title="Удалить"
          >
            <Trash size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            className="h-9"
            placeholder="Поиск партий по названию..."
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadLots} size="sm">
            <RefreshCw size={14} />
            Обновить
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Создать партию
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lots.length > 0 ? (
        <Table columns={columns} data={lots} keyExtractor={(row) => row.id} />
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>Партии не найдены</p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-4" variant="secondary">
            <Plus size={16} />
            Создать первую партию
          </Button>
        </div>
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