"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { formatDateTime } from "@/utils/datetime/dateFormatter";
import { fio, Request, RequestStatus, RequestType } from "@/lib/db/schema";
import { CheckCircle, XCircle, Clock, User, Calendar, Package } from "lucide-react";
import { RequestWithRelations } from "@/types/request";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: { label: "Черновик", color: "text-gray-500", bg: "bg-gray-100", icon: <Clock size={16} /> },
  pending: { label: "На рассмотрении", color: "text-yellow-600", bg: "bg-yellow-100", icon: <Clock size={16} /> },
  approved: { label: "Одобрена", color: "text-blue-600", bg: "bg-blue-100", icon: <CheckCircle size={16} /> },
  rejected: { label: "Отклонена", color: "text-red-600", bg: "bg-red-100", icon: <XCircle size={16} /> },
  in_progress: { label: "В работе", color: "text-purple-600", bg: "bg-purple-100", icon: <Clock size={16} /> },
  completed: { label: "Выполнена", color: "text-green-600", bg: "bg-green-100", icon: <CheckCircle size={16} /> },
  cancelled: { label: "Отменена", color: "text-gray-500", bg: "bg-gray-100", icon: <XCircle size={16} /> },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Низкий", color: "text-gray-500" },
  medium: { label: "Средний", color: "text-blue-500" },
  high: { label: "Высокий", color: "text-orange-500" },
  urgent: { label: "Срочный", color: "text-red-500" },
};

const typeLabels: Record<string, string> = {
  repair: "Ремонт",
  maintenance: "Обслуживание",
  replacement: "Замена",
  transfer: "Перемещение",
  write_off: "Списание",
  other: "Другое",
};

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestWithRelations | null;
  onUpdate?: (updated: RequestWithRelations) => void;
}

export default function RequestDetailModal({ isOpen, onClose, request, onUpdate }: RequestDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(request?.status || "pending");
  const [adminComment, setAdminComment] = useState(request?.adminComment || "");

  const isAdmin = true; // Получите из контекста

  const handleStatusUpdate = async () => {
    setUpdating(true);
    const resp = await fetch(`/api/requests/${request?.id || ''}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminComment }),
    });
    
    if (resp.ok) {
      const updated = await resp.json(); // Получаем обновлённую заявку
      onUpdate?.(updated); // Передаём её в колбэк
      onClose();
    }
    setUpdating(false);
};

  if (!request) return null;

  const statusInfo = request.status && statusConfig[request.status] || statusConfig.pending;
  const priorityInfo = request.priority && priorityConfig[request.priority] || priorityConfig.medium;

  return (
    <Modal isOpen={isOpen} title={`Заявка #${request.id.slice(0, 8)}`} onClose={onClose} size="lg">
      <div className="space-y-5">
        {/* Статус и приоритет */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.icon}
              {statusInfo.label}
            </span>
            <span className={`text-sm font-medium ${priorityInfo.color}`}>
              Приоритет: {priorityInfo.label}
            </span>
          </div>
          {isAdmin && request.status !== "completed" && request.status !== "rejected" && (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RequestStatus)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="pending">На рассмотрении</option>
              <option value="approved">Одобрить</option>
              <option value="rejected">Отклонить</option>
              <option value="in_progress">В работу</option>
              <option value="completed">Выполнено</option>
            </select>
          )}
        </div>

        {/* Заголовок */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{request.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{typeLabels[request.type] || request.type}</p>
        </div>

        {/* Описание */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{request.description}</p>
        </div>

        {/* Оборудование */}
        {request.equipment && (
          <div className="flex items-center gap-2 text-sm">
            <Package size={16} className="text-gray-400" />
            <span className="text-gray-500">Оборудование:</span>
            <span className="font-medium">{request.equipment.name}</span>
            <span className="font-mono text-xs text-gray-400">{request.equipment.inventoryNumber}</span>
          </div>
        )}

        {/* Информация о создателе */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <span className="text-gray-500">Создал:</span>
            <span className="font-medium">{fio(request.createdBy)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-gray-500">Создана:</span>
            <span>{request.createdAt && formatDateTime(request.createdAt.toString(), "full")}</span>
          </div>
        </div>

        {/* Ответственный */}
        {request.assignedTo && (
          <div className="flex items-center gap-2 text-sm">
            <User size={16} className="text-gray-400" />
            <span className="text-gray-500">Ответственный:</span>
            <span className="font-medium">{fio(request.assignedTo)}</span>
          </div>
        )}

        {/* Комментарий администратора */}
        {(isAdmin || request.adminComment) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий</label>
            {isAdmin ? (
              <textarea
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Комментарий для пользователя..."
              />
            ) : (
              <p className="text-gray-600">{request.adminComment || "Нет комментариев"}</p>
            )}
          </div>
        )}

        {/* Результат */}
        {request.resolution && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-700">Результат выполнения:</p>
            <p className="text-sm text-green-600 mt-1">{request.resolution}</p>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
          {isAdmin && status !== request.status && (
            <Button onClick={handleStatusUpdate} loading={updating}>
              Обновить статус
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}