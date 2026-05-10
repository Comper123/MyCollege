"use client";

import { useState, useEffect } from "react";
import { Eye, Clock, CheckCircle, AlertCircle, X, Plus, Wrench } from "lucide-react";
import { formatDateTime } from "@/utils/datetime/dateFormatter";
import { fio } from "@/lib/db/schema";
import { RequestWithRelations } from "@/types/request";
import Button from "@/components/ui/Button";
import RequestDetailModal from "@/components/pages/dashboard/requests/RequestDetailModal";

interface EquipmentRequestsProps {
  equipmentId: string;
  onRefresh?: () => void;
  onCreateRequest?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: { 
    label: "Черновик", 
    color: "text-gray-500", 
    bg: "bg-gray-50", 
    icon: <Clock size={12} className="text-gray-400" /> 
  },
  pending: { 
    label: "На рассмотрении", 
    color: "text-amber-600", 
    bg: "bg-amber-50", 
    icon: <Clock size={12} className="text-amber-500" /> 
  },
  approved: { 
    label: "Одобрена", 
    color: "text-blue-600", 
    bg: "bg-blue-50", 
    icon: <CheckCircle size={12} className="text-blue-500" /> 
  },
  rejected: { 
    label: "Отклонена", 
    color: "text-red-600", 
    bg: "bg-red-50", 
    icon: <AlertCircle size={12} className="text-red-500" /> 
  },
  in_progress: { 
    label: "В работе", 
    color: "text-purple-600", 
    bg: "bg-purple-50", 
    icon: <Clock size={12} className="text-purple-500" /> 
  },
  completed: { 
    label: "Выполнена", 
    color: "text-emerald-600", 
    bg: "bg-emerald-50", 
    icon: <CheckCircle size={12} className="text-emerald-500" /> 
  },
  cancelled: { 
    label: "Отменена", 
    color: "text-gray-500", 
    bg: "bg-gray-50", 
    icon: <X size={12} className="text-gray-400" /> 
  },
};

export default function EquipmentRequests({ equipmentId, onCreateRequest }: EquipmentRequestsProps) {
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailRequest, setDetailRequest] = useState<RequestWithRelations | null>(null);
  const [showAll, setShowAll] = useState(false);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(`/api/requests?equipmentId=${equipmentId}`);
      if (resp.ok) {
        const data = await resp.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (equipmentId) {
      loadRequests();
    }
  }, [equipmentId]);

  const displayedRequests = showAll ? requests : requests.slice(0, 3);

  const handleRequestUpdate = () => {
    loadRequests();
    setDetailRequest(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Wrench size={20} className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Нет заявок на ремонт</p>
        <p className="text-xs text-gray-400 mt-1">Создайте заявку, если оборудование неисправно</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">Заявки на ремонт</h3>
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
            {requests.length}
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={onCreateRequest} className="bg-amber-500 hover:bg-amber-600">
          <Plus size={12} />
          Новая заявка
        </Button>
      </div>

      <div className="space-y-2">
        {displayedRequests.map((request) => {
          const status = request.status && statusConfig[request.status] || statusConfig.pending;
          return (
            <div
              key={request.id}
              onClick={() => setDetailRequest(request)}
              className="group p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      #{request.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                    {request.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                    {request.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>Создал: {fio(request.createdBy)}</span>
                    <span>{request.createdAt && formatDateTime(request.createdAt.toString(), "date")}</span>
                  </div>
                </div>
                <Eye size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
              </div>
            </div>
          );
        })}

        {requests.length > 3 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-center text-sm text-indigo-500 hover:text-indigo-600 py-2 transition-colors"
          >
            Показать все ({requests.length})
          </button>
        )}

        {showAll && requests.length > 3 && (
          <button
            onClick={() => setShowAll(false)}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-600 py-2 transition-colors"
          >
            Показать меньше
          </button>
        )}
      </div>

      <RequestDetailModal
        isOpen={!!detailRequest}
        onClose={() => setDetailRequest(null)}
        request={detailRequest}
        onUpdate={handleRequestUpdate}
      />
    </div>
  );
}