"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { inputCls } from "@/components/ui/forms/Input";
import SelectSearch, { Option } from "@/components/ui/forms/SelectSearch";
import Button from "@/components/ui/Button";
import { FullEquipment } from "@/types/equipment";
import { EquipmentType, Room, User, fio } from "@/lib/db/schema";
import { AttributeSchema } from "@/types/equipmentTypes";
import { 
  Info, 
  Cpu, 
  MapPin, 
  User as UserIcon, 
  Hash,
  Type,
  ToggleLeft,
  List,
  AlertCircle,
  CheckCircle,
  Wrench,
  Clock,
  Package,
  XCircle
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  equipment?: FullEquipment;
  onSuccess: () => void;
}

interface AttributeValue {
  [key: string]: string | number | boolean;
}

const statusOptions = [
  { value: "active", label: "В эксплуатации", icon: <CheckCircle size={14} />, color: "text-emerald-600" },
  { value: "maintenance", label: "На обслуживании", icon: <Wrench size={14} />, color: "text-amber-600" },
  { value: "broken", label: "Неисправно", icon: <AlertCircle size={14} />, color: "text-red-600" },
  { value: "reserved", label: "Зарезервировано", icon: <Clock size={14} />, color: "text-blue-600" },
  { value: "written_off", label: "Списано", icon: <AlertCircle size={14} />, color: "text-gray-500" },
];

export default function EquipmentModal({ isOpen, onClose, equipment, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [laborants, setLaborants] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"main" | "attributes" | "location">("main");
  const [error, setError] = useState<string | null>(null);

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

  const [attributes, setAttributes] = useState<AttributeValue>({});

  const selectedType = useMemo(() => {
    if (!form.equipmentTypeId) return null;
    return types.find((t) => t.id === form.equipmentTypeId) || null;
  }, [form.equipmentTypeId, types]);

  const attributesSchema = useMemo(() => {
    return (selectedType?.attributesSchema as AttributeSchema[]) || [];
  }, [selectedType]);

  // Загрузка справочников
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
      try {
        const [typesRes, roomsRes, labRes] = await Promise.all([
          fetch("/api/admin/equipmentTypes"),
          fetch("/api/rooms"),
          fetch("/api/admin/users?role=laborant"),
        ]);
        
        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setTypes(typesData);
        }
        
        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          setRooms(roomsData);
        }
        
        if (labRes.ok) {
          const data = await labRes.json();
          setLaborants(data.users || []);
        }
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError("Не удалось загрузить справочные данные");
      }
    };
    
    loadData();
  }, [isOpen]);

  // Инициализация атрибутов при смене типа
  useEffect(() => {
    // Проверяем, нужно ли инициализировать атрибуты
    const shouldInitialize = !equipment || equipment.equipmentTypeId !== form.equipmentTypeId;
    
    if (shouldInitialize && attributesSchema.length > 0) {
      const initialAttrs: AttributeValue = {};
      attributesSchema.forEach((field) => {
        if (field.type === "boolean") {
          initialAttrs[field.name] = false;
        } else if (field.type === "number") {
          initialAttrs[field.name] = "";
        } else {
          initialAttrs[field.name] = "";
        }
      });
      setAttributes(initialAttrs);
    }
  }, [form.equipmentTypeId, attributesSchema, equipment]);

  // Заполнение формы при редактировании
  useEffect(() => {
    if (!isOpen) return;
    
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
      setAttributes(equipment.attributes || {});
      
      if (equipment.attributes && Object.keys(equipment.attributes).length > 0) {
        setActiveTab("attributes");
      } else {
        setActiveTab("main");
      }
    } else {
      // Сброс формы при добавлении нового оборудования
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
      setAttributes({});
      setActiveTab("main");
    }
    
    // Сбрасываем ошибку при открытии модалки
    setError(null);
  }, [equipment, isOpen]);

  const handleAttributeChange = useCallback((name: string, value: string | number | boolean) => {
    setAttributes((prev) => ({ ...prev, [name]: value }));
  }, []);

  const renderAttributeField = useCallback((field: AttributeSchema) => {
    const value = attributes[field.name] ?? (field.type === "boolean" ? false : "");
    const isRequired = field.required;

    switch (field.type) {
      case "boolean":
        return (
          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleAttributeChange(field.name, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
            {isRequired && <span className="text-xs text-red-500 ml-1">*</span>}
          </label>
        );

      case "number":
        return (
          <div className="relative">
            <input
              type="number"
              className={`${inputCls} pr-16`}
              value={value as number || ""}
              onChange={(e) => handleAttributeChange(field.name, e.target.value ? parseFloat(e.target.value) : "")}
              placeholder={`Введите ${field.label.toLowerCase()}`}
            />
            {field.unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {field.unit}
              </span>
            )}
          </div>
        );

      case "select":
        return (
          <select
            className={inputCls}
            value={value as string || ""}
            onChange={(e) => handleAttributeChange(field.name, e.target.value)}
          >
            <option value="">Выберите значение</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <div className="relative">
            <input
              type="text"
              className={`${inputCls} ${field.unit ? 'pr-16' : ''}`}
              value={value as string || ""}
              onChange={(e) => handleAttributeChange(field.name, e.target.value)}
              placeholder={`Введите ${field.label.toLowerCase()}`}
            />
            {field.unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {field.unit}
              </span>
            )}
          </div>
        );
    }
  }, [attributes, handleAttributeChange]);

  const validateForm = useCallback(() => {
    // Проверка основных полей
    if (!form.name || !form.equipmentTypeId) {
      setError("Заполните название и тип оборудования");
      return false;
    }

    // Проверка обязательных атрибутов
    const missingRequired = attributesSchema.filter(
      (field) => field.required && !attributes[field.name] && attributes[field.name] !== false
    );
    
    if (missingRequired.length > 0) {
      setError(`Заполните обязательные поля:\n${missingRequired.map((f) => `• ${f.label}`).join("\n")}`);
      return false;
    }

    return true;
  }, [form.name, form.equipmentTypeId, attributesSchema, attributes]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    
    const url = equipment ? `/api/equipment/${equipment.id}` : "/api/equipment";
    const method = equipment ? "PATCH" : "POST";

    const submitData = {
      ...form,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    };

    try {
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
        setError(error.error || "Ошибка сохранения оборудования");
      }
    } catch (err) {
      console.error("Ошибка при сохранении:", err);
      setError("Не удалось сохранить оборудование. Проверьте соединение с сервером.");
    } finally {
      setLoading(false);
    }
  }, [form, attributes, equipment, validateForm, onSuccess, onClose]);

  const typeOptions: Option[] = useMemo(() => types.map((t) => ({ label: t.name, value: t.id })), [types]);
  const roomOptions: Option[] = useMemo(() => rooms.map((r) => ({ label: r.number, value: r.id })), [rooms]);
  const laborantOptions: Option[] = useMemo(() => laborants.map((l) => ({ label: fio(l), value: l.id })), [laborants]);

  return (
    <Modal
      isOpen={isOpen}
      title={
        <div className="flex items-center gap-2">
          <Package size={20} className="text-indigo-500" />
          <span>{equipment ? "Редактировать оборудование" : "Добавить оборудование"}</span>
        </div>
      }
      onClose={onClose}
      size="xl"
    >
      <div className="min-h-[500px] flex flex-col">
        {/* Плашка с ошибкой */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre-line">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 flex-shrink-0"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* Вкладки */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5 flex-shrink-0">
          <button
            onClick={() => setActiveTab("main")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === "main"
                ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Info size={16} />
            Основное
          </button>
          
          <button
            onClick={() => setActiveTab("attributes")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === "attributes"
                ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Cpu size={16} />
            Характеристики
            {attributesSchema.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                {attributesSchema.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("location")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === "location"
                ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <MapPin size={16} />
            Размещение
          </button>
        </div>

        {/* Контент вкладок */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* Вкладка: Основное */}
          {activeTab === "main" && (
            <div className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Название <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Например: Ноутбук Lenovo ThinkPad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Тип оборудования <span className="text-red-500">*</span>
                  </label>
                  <SelectSearch
                    options={typeOptions}
                    value={form.equipmentTypeId}
                    onChange={(v) => setForm((f) => ({ ...f, equipmentTypeId: v }))}
                    placeholder="Выберите тип"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Серийный номер
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.serialNumber}
                    onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
                    placeholder="SN123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Модель
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.model}
                    onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                    placeholder="T14 Gen 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Производитель
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.manufacturer}
                    onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
                    placeholder="Lenovo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Статус
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status: status.value }))}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        form.status === status.value
                          ? `${status.color} bg-gray-100 dark:bg-gray-800 ring-2 ring-indigo-500`
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {status.icon}
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Примечания
                </label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Дополнительная информация об оборудовании..."
                />
              </div>
            </div>
          )}

          {/* Вкладка: Характеристики - УЛУЧШЕННАЯ ВЕРСИЯ */}
          {activeTab === "attributes" && (
            <div className="pb-4">
              {selectedType && (
                <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-indigo-500" />
                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
                      {`Характеристики для типа "${selectedType.name}"`}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">
                    Заполните характеристики оборудования в соответствии с его типом
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {attributesSchema.map((field, idx) => (
                  <div 
                    key={idx} 
                    className={`border rounded-lg p-4 transition-all ${
                      field.required && !attributes[field.name] && attributes[field.name] !== false
                        ? "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10" 
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {field.type === "string" && <Type size={14} className="text-blue-500" />}
                      {field.type === "number" && <Hash size={14} className="text-emerald-500" />}
                      {field.type === "boolean" && <ToggleLeft size={14} className="text-purple-500" />}
                      {field.type === "select" && <List size={14} className="text-orange-500" />}
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {field.label || field.name}
                      </label>
                      {field.required && (
                        <span className="text-xs text-red-500 ml-1">Обязательное</span>
                      )}
                      {field.unit && field.type !== "number" && (
                        <span className="text-xs text-gray-400 ml-auto">{field.unit}</span>
                      )}
                    </div>
                    {renderAttributeField(field)}
                    
                    {/* Подсказка для поля */}
                    {field.description && (
                      <p className="mt-1 text-xs text-gray-400">{field.description}</p>
                    )}
                  </div>
                ))}
                
                {attributesSchema.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Cpu size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Нет характеристик для выбранного типа оборудования</p>
                    <p className="text-xs mt-1">Выберите тип оборудования на вкладке Основное</p>
                  </div>
                )}

                {/* Сводка по заполненным атрибутам */}
                {attributesSchema.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Заполнено характеристик:
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {Object.keys(attributes).filter(key => attributes[key] !== "" && attributes[key] !== false).length} / {attributesSchema.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Вкладка: Размещение */}
          {activeTab === "location" && (
            <div className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      Кабинет
                    </div>
                  </label>
                  <SelectSearch
                    options={roomOptions}
                    value={form.roomId}
                    onChange={(v) => setForm((f) => ({ ...f, roomId: v }))}
                    placeholder="Не выбран"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <div className="flex items-center gap-1">
                      <UserIcon size={14} />
                      Ответственный лаборант
                    </div>
                  </label>
                  <SelectSearch
                    options={laborantOptions}
                    value={form.responsibleId}
                    onChange={(v) => setForm((f) => ({ ...f, responsibleId: v }))}
                    placeholder="Не назначен"
                  />
                </div>
              </div>

              {equipment?.lot && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Информация о партии</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {equipment.lot.name} ({equipment.lot.lotNumber})
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          {equipment ? "Сохранить изменения" : "Создать оборудование"}
        </Button>
      </div>
    </Modal>
  );
}