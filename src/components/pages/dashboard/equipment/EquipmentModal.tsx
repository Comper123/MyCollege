"use client";

import { useEffect, useState } from "react";
import Modal, { ModalField } from "@/components/ui/Modal";
import { inputCls } from "@/components/ui/forms/Input";
import SelectSearch, { Option } from "@/components/ui/forms/SelectSearch";
import Button from "@/components/ui/Button";
import { FullEquipment } from "@/types/equipment";
import { Equipment, EquipmentType, Room, User, fio } from "@/lib/db/schema";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  equipment?: FullEquipment;
  onSuccess: () => void;
}

export default function EquipmentModal({ isOpen, onClose, equipment, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [laborants, setLaborants] = useState<User[]>([]);

  const [form, setForm] = useState({
    name: "",
    equipmentTypeId: "",
    roomId: "",
    responsibleId: "",
    serialNumber: "",
    model: "",
    manufacturer: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    const loadData = async () => {
      const [typesRes, roomsRes, labRes] = await Promise.all([
        fetch("/api/admin/equipmentTypes"),
        fetch("/api/rooms"),
        fetch("/api/admin/users?role=laborant"),
      ]);
      if (typesRes.ok) setTypes(await typesRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (labRes.ok) {
        const data = await labRes.json();
        setLaborants(data.users || []);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const setF = (equipment: Equipment | undefined) => {
      if (equipment) {
        setForm({
          name: equipment.name,
          equipmentTypeId: equipment.equipmentTypeId,
          roomId: equipment.roomId || "",
          responsibleId: equipment.responsibleId || "",
          serialNumber: equipment.serialNumber || "",
          model: equipment.model || "",
          manufacturer: equipment.manufacturer || "",
          status: equipment.status,
          notes: equipment.notes || "",
        });
      } else {
        setForm({
          name: "",
          equipmentTypeId: "",
          roomId: "",
          responsibleId: "",
          serialNumber: "",
          model: "",
          manufacturer: "",
          status: "active",
          notes: "",
        });
      }
    }
    setF(equipment);
  }, [equipment]);

  const handleSubmit = async () => {
    if (!form.name || !form.equipmentTypeId) {
      alert("Заполните название и тип оборудования");
      return;
    }

    setLoading(true);
    const url = equipment ? `/api/equipment/${equipment.id}` : "/api/equipment";
    const method = equipment ? "PATCH" : "POST";

    const resp = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (resp.ok) {
      onSuccess();
      onClose();
    } else {
      const error = await resp.json();
      alert(error.error || "Ошибка сохранения");
    }
    setLoading(false);
  };

  const typeOptions: Option[] = types.map((t) => ({ label: t.name, value: t.id }));
  const roomOptions: Option[] = rooms.map((r) => ({ label: r.number, value: r.id }));
  const laborantOptions: Option[] = laborants.map((l) => ({ label: fio(l), value: l.id }));

  return (
    <Modal
      isOpen={isOpen}
      title={equipment ? "Редактировать оборудование" : "Добавить оборудование"}
      onClose={onClose}
    >
      <ModalField title="Название *">
        <input
          type="text"
          className={inputCls}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </ModalField>

      <ModalField title="Тип оборудования *">
        <SelectSearch
          options={typeOptions}
          value={form.equipmentTypeId}
          onChange={(v) => setForm((f) => ({ ...f, equipmentTypeId: v }))}
        />
      </ModalField>

      <ModalField title="Кабинет">
        <SelectSearch
          options={roomOptions}
          value={form.roomId}
          onChange={(v) => setForm((f) => ({ ...f, roomId: v }))}
          placeholder="Не выбран"
        />
      </ModalField>

      <ModalField title="Ответственный лаборант">
        <SelectSearch
          options={laborantOptions}
          value={form.responsibleId}
          onChange={(v) => setForm((f) => ({ ...f, responsibleId: v }))}
          placeholder="Не выбран"
        />
      </ModalField>

      <div className="grid grid-cols-2 gap-3">
        <ModalField title="Серийный номер">
          <input
            type="text"
            className={inputCls}
            value={form.serialNumber}
            onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
          />
        </ModalField>
        <ModalField title="Модель">
          <input
            type="text"
            className={inputCls}
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          />
        </ModalField>
      </div>

      <ModalField title="Производитель">
        <input
          type="text"
          className={inputCls}
          value={form.manufacturer}
          onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
        />
      </ModalField>

      <ModalField title="Статус">
        <select
          className={inputCls}
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="active">В эксплуатации</option>
          <option value="maintenance">На обслуживании</option>
          <option value="broken">Неисправно</option>
          <option value="reserved">Зарезервировано</option>
          <option value="written_off">Списано</option>
        </select>
      </ModalField>

      <ModalField title="Примечания">
        <textarea
          className={inputCls}
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </ModalField>

      <Button onClick={handleSubmit} className="ml-auto mt-3">
        {equipment ? "Сохранить" : "Создать"}
      </Button>
    </Modal>
  );
}