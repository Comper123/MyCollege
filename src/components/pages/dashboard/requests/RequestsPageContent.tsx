"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Block } from "@/components/blocks/Block";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import { Column, Table } from "@/components/ui/Table";
import { 
  Plus, 
  Filter, 
  X, 
  Eye, 
  Edit, 
  Trash, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronDown,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  User as UserIcon,
  Package,
  TrendingUp,
  BarChart3,
  Sparkles
} from "lucide-react";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { formatDateTime } from "@/utils/datetime/dateFormatter";
import { fio, Equipment, User, RequestType, RequestStatus } from "@/lib/db/schema";
import RequestModal from "./RequestModal";
import { RequestWithRelations } from "@/types/request";
import RequestDetailModal from "./RequestDetailModal";
import { useAuth } from "@/context/AuthContext";

// Красивые иконки для статусов
const statusConfig: Record<RequestStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  draft: { 
    label: "Черновик", 
    color: "text-gray-500", 
    bg: "bg-gray-50", 
    border: "border-gray-200",
    icon: <Clock size={14} className="text-gray-400" /> 
  },
  pending: { 
    label: "На рассмотрении", 
    color: "text-amber-600", 
    bg: "bg-amber-50", 
    border: "border-amber-200",
    icon: <Clock size={14} className="text-amber-500" /> 
  },
  approved: { 
    label: "Одобрена", 
    color: "text-blue-600", 
    bg: "bg-blue-50", 
    border: "border-blue-200",
    icon: <CheckCircle size={14} className="text-blue-500" /> 
  },
  rejected: { 
    label: "Отклонена", 
    color: "text-red-600", 
    bg: "bg-red-50", 
    border: "border-red-200",
    icon: <AlertCircle size={14} className="text-red-500" /> 
  },
  in_progress: { 
    label: "В работе", 
    color: "text-purple-600", 
    bg: "bg-purple-50", 
    border: "border-purple-200",
    icon: <Clock size={14} className="text-purple-500" /> 
  },
  completed: { 
    label: "Выполнена", 
    color: "text-emerald-600", 
    bg: "bg-emerald-50", 
    border: "border-emerald-200",
    icon: <CheckCircle size={14} className="text-emerald-500" /> 
  },
  cancelled: { 
    label: "Отменена", 
    color: "text-gray-500", 
    bg: "bg-gray-50", 
    border: "border-gray-200",
    icon: <X size={14} className="text-gray-400" /> 
  },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "Низкий", color: "text-gray-500", bg: "bg-gray-100" },
  medium: { label: "Средний", color: "text-blue-500", bg: "bg-blue-100" },
  high: { label: "Высокий", color: "text-orange-500", bg: "bg-orange-100" },
  urgent: { label: "Срочный", color: "text-red-500", bg: "bg-red-100" },
};

const typeLabels: Record<RequestType, { label: string; icon: string; color: string }> = {
  repair: { label: "Ремонт", icon: "🔧", color: "text-amber-600" },
  maintenance: { label: "Обслуживание", icon: "⚙️", color: "text-blue-600" },
  replacement: { label: "Замена", icon: "🔄", color: "text-indigo-600" },
  transfer: { label: "Перемещение", icon: "📦", color: "text-emerald-600" },
  write_off: { label: "Списание", icon: "🗑️", color: "text-red-600" },
  other: { label: "Другое", icon: "📝", color: "text-gray-600" },
};

export default function RequestsPageContent() {
  const searchParams = useSearchParams();
  const my = searchParams.get("my");
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithRelations | null>(null);
  const [detailRequest, setDetailRequest] = useState<RequestWithRelations | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdminOrLaborant = true;
  // Определяем, нужно ли показывать только свои заявки
  const showOnlyMy = my === "true" || user?.role === "teacher";

  // Статистика
  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === "pending").length,
      inProgress: requests.filter(r => r.status === "in_progress").length,
      completed: requests.filter(r => r.status === "completed").length,
    };
  }, [requests]);

  const loadRequests = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (typeFilter !== "all") params.append("type", typeFilter);
    if (showOnlyMy) {
      params.append("my", "true");
    }

    const resp = await fetch(`/api/requests?${params.toString()}`);
    if (resp.ok) {
      const data = await resp.json();
      setRequests(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRequests();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, statusFilter, typeFilter, my]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const resp = await fetch(`/api/requests/${deleteId}`, { method: "DELETE" });
    if (resp.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== deleteId));
      setDeleteId(null);
    }
    setIsDeleting(false);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setShowFilters(false);
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [requests, search]);

  const RequestCard = ({ request }: { request: RequestWithRelations }) => {
    const status = request.status && statusConfig[request.status] || statusConfig.pending;
    const priority = request.priority && priorityConfig[request.priority] || priorityConfig.medium;
    const type = typeLabels[request.type as RequestType] || typeLabels.other;

    return (
      <div 
        onClick={() => setDetailRequest(request)}
        className="group bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{type.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{request.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">#{request.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedRequest(request); }}
              className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500"
            >
              <Edit size={14} />
            </button>
            {isAdminOrLaborant && (
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteId(request.id); }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
              >
                <Trash size={14} />
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {request.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color} border ${status.border}`}>
              {status.icon}
              {status.label}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.color}`}>
              {priority.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <UserIcon size={12} />
            {fio(request.createdBy).split(' ').slice(0, 2).join(' ')}
          </div>
        </div>

        {request.equipment && (
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Package size={12} />
              {request.equipment.name}
            </div>
          </div>
        )}
      </div>
    );
  };

  const columns: Column<RequestWithRelations>[] = [
    {
      title: "Заявка",
      key: "title",
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 dark:text-white">{row.title}</span>
          <p className="text-xs text-gray-400 mt-0.5 max-w-64 line-clamp-4">{row.description}</p>
        </div>
      ),
    },
    {
      title: "Тип",
      key: "type",
      render: (_, row) => {
        const type = typeLabels[row.type as RequestType];
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{type.label}</span>
          </div>
        );
      },
    },
    {
      title: "Приоритет",
      key: "priority",
      render: (value) => {
        const p = priorityConfig[value as string] || priorityConfig.medium;
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${p.bg} ${p.color}`}>
            {p.label}
          </span>
        );
      },
    },
    {
      title: "Статус",
      key: "status",
      render: (value, row) => {
        const s = row.status && statusConfig[row.status] || statusConfig.pending;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.color} border ${s.border}`}>
            {s.icon}
            {s.label}
          </span>
        );
      },
    },
    {
      title: "Создатель",
      key: "createdBy",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
            {row.createdBy.firstname?.[0]}{row.createdBy.lastname?.[0]}
          </div>
          <span className="text-sm">{fio(row.createdBy)}</span>
        </div>
      ),
    },
    {
      title: "Дата",
      key: "createdAt",
      render: (value) => (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <CalendarIcon size={12} />
          {formatDateTime(value as string, "date")}
        </div>
      ),
    },
    {
      title: "",
      key: "id",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDetailRequest(row)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-all duration-200"
            title="Просмотр"
          >
            <Eye size={16} />
          </button>
          {(isAdminOrLaborant || row.createdById === row.createdBy?.id) && (
            <button
              onClick={() => setSelectedRequest(row)}
              className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-all duration-200"
              title="Редактировать"
            >
              <Edit size={16} />
            </button>
          )}
          {isAdminOrLaborant && (
            <button
              onClick={() => setDeleteId(row.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-all duration-200"
              title="Удалить"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <main className="w-full h-full">
      <Block>
        {/* Заголовок с градиентом */}
        <div className="relative mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -z-10" />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={24} className="text-indigo-500" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  {my === "true" ? "Мои заявки" : "Заявки на оборудование"}
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {my === "true"
                  ? "Управление вашими заявками на ремонт и обслуживание"
                  : "Централизованное управление заявками на обслуживание оборудования"}
              </p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="shadow-lg hover:shadow-xl transition-all">
              <Plus size={16} />
              Создать заявку
            </Button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800/30 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Всего</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                <BarChart3 size={20} className="text-indigo-500" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800/30 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">На рассмотрении</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                <Clock size={20} className="text-amber-500" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800/30 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">В работе</p>
                <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-500" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800/30 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Выполнено</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Панель управления */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[250px]">
              <SearchInput
                value={search}
                onChange={setSearch}
                onClear={() => setSearch("")}
                placeholder="Поиск заявок по названию или описанию..."
                className="h-10"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
                showFilters
                  ? "bg-indigo-50 text-indigo-600 border-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-700"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Filter size={16} />
              <span className="text-sm font-medium">Фильтры</span>
              {(statusFilter !== "all" || typeFilter !== "all") && (
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
                  {(statusFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0)}
                </span>
              )}
            </button>

            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 px-3 transition-all duration-200 ${
                  viewMode === "table" 
                    ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                title="Таблица"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 px-3 transition-all duration-200 border-l border-gray-200 dark:border-gray-700 ${
                  viewMode === "grid" 
                    ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                title="Карточки"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>

          {/* Расширенные фильтры */}
          {showFilters && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Фильтры</h3>
                <button 
                  onClick={resetFilters} 
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 flex items-center gap-1 transition-colors"
                >
                  <X size={12} />
                  Сбросить все
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Статус</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Все статусы</option>
                    <option value="pending">На рассмотрении</option>
                    <option value="approved">Одобрена</option>
                    <option value="rejected">Отклонена</option>
                    <option value="in_progress">В работе</option>
                    <option value="completed">Выполнена</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Тип заявки</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Все типы</option>
                    <option value="repair">Ремонт</option>
                    <option value="maintenance">Обслуживание</option>
                    <option value="replacement">Замена</option>
                    <option value="transfer">Перемещение</option>
                    <option value="write_off">Списание</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Результаты */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-indigo-200 rounded-full animate-spin" />
              <div className="absolute top-0 left-0 w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="mt-6">
            {viewMode === "table" ? (
              <Table columns={columns} data={filteredRequests} keyExtractor={(row) => row.id} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
              <Package size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">Заявки не найдены</h3>
            <p className="text-sm text-gray-400 mb-4">
              {search || statusFilter !== "all" || typeFilter !== "all" 
                ? "Попробуйте изменить параметры поиска или сбросить фильтры" 
                : "Создайте первую заявку на оборудование"}
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)} variant="secondary">
              <Plus size={16} />
              Создать заявку
            </Button>
          </div>
        )}
      </Block>

      <RequestModal
        isOpen={isCreateModalOpen || !!selectedRequest}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest || undefined}
        onSuccess={() => {
          loadRequests();
          setIsCreateModalOpen(false);
          setSelectedRequest(null);
        }}
      />

      <RequestDetailModal
        isOpen={!!detailRequest}
        onClose={() => setDetailRequest(null)}
        request={detailRequest}
        onUpdate={() => loadRequests()}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Удалить заявку?"
        description="Это действие нельзя отменить. Заявка будет безвозвратно удалена."
        confirmText="Да, удалить"
        cancelText="Отмена"
        isLoading={isDeleting}
      />
    </main>
  );
}