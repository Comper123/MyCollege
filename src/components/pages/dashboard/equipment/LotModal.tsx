"use client";

import { useEffect, useState } from "react";
import Modal, { ModalField } from "@/components/ui/Modal";
import { inputCls } from "@/components/ui/forms/Input";
import SelectSearch, { Option } from "@/components/ui/forms/SelectSearch";
import Button from "@/components/ui/Button";
import { FullLot } from "@/types/equipment";
import { EquipmentType, Room, User, fio } from "@/lib/db/schema";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lot?: FullLot;
  onSuccess: () => void;
}

export default function LotModal({ isOpen, onClose, lot, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [laborants, setLaborants] = useState<User[]>([]);

  const [form, setForm] = useState({
    name: "",
    equipmentTypeId: "",
    quantity: 1,
    supplier: "",
    invoiceNumber: "",
    unitPriceCents: "",
    roomId: "",
    responsibleId: "",
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
    const setL = (lot: FullLot | undefined) => {
      if (lot) {
        setForm({
          name: lot.name,
          equipmentTypeId: lot.equipmentTypeId,
          quantity: lot.quantity,
          supplier: lot.supplier || "",
          invoiceNumber: lot.invoiceNumber || "",
          unitPriceCents: lot.unitPriceCents?.toString() || "",
          roomId: "",
          responsibleId: "",
        });
      } else {
        setForm({
          name: "",
          equipmentTypeId: "",
          quantity: 1,
          supplier: "",
          invoiceNumber: "",
          unitPriceCents: "",
          roomId: "",
          responsibleId: "",
        });
      }
    }
    setL(lot);
  }, [lot]);

  const handleSubmit = async () => {
    if (!form.name || !form.equipmentTypeId || form.quantity < 1) {
      alert("Заполните название, тип и количество");
      return;
    }

    setLoading(true);
    const url = lot ? `/api/equipment/lots/${lot.id}` : "/api/equipment/lots";
    const method = lot ? "PATCH" : "POST";

    const submitData = {
      ...form,
      unitPriceCents: form.unitPriceCents ? parseInt(form.unitPriceCents) : undefined,
    };

    const resp = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
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
      title={lot ? "Редактировать партию" : "Создать партию"}
      onClose={onClose}
      className='overflow-visible'
    >
      <ModalField title="Название партии *">
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

      <ModalField title="Количество единиц *">
        <input
          type="number"
          min={1}
          className={inputCls}
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
        />
      </ModalField>

      <div className="grid grid-cols-2 gap-3">
        <ModalField title="Поставщик">
          <input
            type="text"
            className={inputCls}
            value={form.supplier}
            onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
          />
        </ModalField>
        <ModalField title="Номер накладной">
          <input
            type="text"
            className={inputCls}
            value={form.invoiceNumber}
            onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
          />
        </ModalField>
      </div>

      <ModalField title="Цена за единицу (коп.)">
        <input
          type="number"
          className={inputCls}
          value={form.unitPriceCents}
          onChange={(e) => setForm((f) => ({ ...f, unitPriceCents: e.target.value }))}
          placeholder="Например: 5000000 для 50 000 ₽"
        />
      </ModalField>

      <div className="border-t pt-3 mt-2">
        <p className="text-sm font-medium mb-2">Размещение (опционально)</p>
        <div className="grid grid-cols-2 gap-3">
          <ModalField title="Кабинет">
            <SelectSearch
              options={roomOptions}
              value={form.roomId}
              onChange={(v) => setForm((f) => ({ ...f, roomId: v }))}
              placeholder="Не выбран"
            />
          </ModalField>
          <ModalField title="Ответственный">
            <SelectSearch
              options={laborantOptions}
              value={form.responsibleId}
              onChange={(v) => setForm((f) => ({ ...f, responsibleId: v }))}
              placeholder="Не выбран"
            />
          </ModalField>
        </div>
      </div>

      <Button onClick={handleSubmit} className="ml-auto mt-3">
        {lot ? "Сохранить" : "Создать"}
      </Button>
    </Modal>
  );
}