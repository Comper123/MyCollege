"use client";

import { useEffect, useState } from "react";
import Modal, { ModalField } from "@/components/ui/Modal";
import { inputCls } from "@/components/ui/forms/Input";
import SelectSearch, { Option } from "@/components/ui/forms/SelectSearch";
import Button from "@/components/ui/Button";
import { MapPin, ArrowRight, Building2, AlertCircle } from "lucide-react";

interface Room {
  id: string;
  number: string;
  description: string | null;
}

interface EquipmentMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  equipmentName: string;
  currentRoomId: string | null;
  currentRoomNumber: string | null;
  onSuccess: () => void;
}

export default function EquipmentMoveModal({
  isOpen,
  onClose,
  equipmentId,
  equipmentName,
  currentRoomId,
  currentRoomNumber,
  onSuccess,
}: EquipmentMoveModalProps) {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [targetRoomId, setTargetRoomId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRooms = async () => {
      const resp = await fetch("/api/rooms");
      if (resp.ok) {
        const data = await resp.json();
        setRooms(data);
      }
    };
    if (isOpen) {
      loadRooms();
      setTargetRoomId("");
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const roomOptions: Option[] = rooms
    .filter(room => room.id !== currentRoomId)
    .map(room => ({
      label: `Кабинет ${room.number}${room.description ? ` (${room.description})` : ""}`,
      value: room.id,
    }));

  const currentRoomOption = currentRoomId ? {
    label: `Кабинет ${currentRoomNumber}`,
    value: currentRoomId,
  } : null;

  const handleSubmit = async () => {
    if (!targetRoomId) {
      setError("Выберите целевой кабинет");
      return;
    }

    if (!reason.trim()) {
      setError("Укажите причину перемещения");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const resp = await fetch(`/api/equipment/${equipmentId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toRoomId: targetRoomId,
          reason: reason.trim(),
        }),
      });

      if (resp.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await resp.json();
        setError(data.error || "Ошибка при перемещении");
      }
    } catch (err) {
      setError("Ошибка сети. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  const selectedTargetRoom = rooms.find(r => r.id === targetRoomId);

  return (
    <Modal
      isOpen={isOpen}
      title={
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-indigo-500" />
          <span>Перемещение оборудования</span>
        </div>
      }
      onClose={onClose}
      size="xl"
    >
      <div className="space-y-5">
        {/* Информация об оборудовании */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Оборудование</p>
          <p className="font-medium text-gray-900 dark:text-white">{equipmentName}</p>
        </div>

        {/* Текущее местоположение */}
        <div className="flex items-center gap-3">
          <div className="flex-1 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-indigo-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Текущий кабинет</span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white mt-1">
              {currentRoomNumber ? `Кабинет ${currentRoomNumber}` : "Не указан"}
            </p>
          </div>
          
          <ArrowRight size={20} className="text-gray-400 flex-shrink-0" />
          
          <div className="flex-1">
            <ModalField title="Новый кабинет *">
              <SelectSearch
                options={roomOptions}
                value={targetRoomId}
                onChange={setTargetRoomId}
                placeholder="Выберите кабинет"
              />
            </ModalField>
          </div>
        </div>

        {/* Информация о выбранном кабинете */}
        {selectedTargetRoom && selectedTargetRoom.description && (
          <div className="p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg text-xs text-gray-500">
            📍 {selectedTargetRoom.description}
          </div>
        )}

        {/* Причина перемещения */}
        <ModalField title="Причина перемещения *">
          <textarea
            className={inputCls}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Укажите причину перемещения (например: ремонт, переезд, временное размещение)"
          />
        </ModalField>

        {/* Предупреждение */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-700 dark:text-amber-400">
              <p className="font-medium mb-1">Обратите внимание:</p>
              <p>Перемещение будет зафиксировано в истории перемещений оборудования.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          <MapPin size={16} />
          Переместить
        </Button>
      </div>
    </Modal>
  );
}