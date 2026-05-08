"use client";

import { useEffect, useState } from "react";
import Modal, { ModalField } from "@/components/ui/Modal";
import { inputCls } from "@/components/ui/forms/Input";
import Button from "@/components/ui/Button";
import { EquipmentType } from "@/lib/db/schema";
import { AttributeSchema, CustomField } from "@/types/equipmentTypes";
import { Plus, Trash, GripVertical, Hash, Type, ToggleLeft, List } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  setEquipmentTypesList: React.Dispatch<React.SetStateAction<EquipmentType[]>>;
  initialData?: EquipmentType;
}

const fieldTypes = [
  { value: "string", label: "Текст", icon: <Type size={14} /> },
  { value: "number", label: "Число", icon: <Hash size={14} /> },
  { value: "boolean", label: "Да/Нет", icon: <ToggleLeft size={14} /> },
  { value: "select", label: "Выбор из списка", icon: <List size={14} /> },
];

export default function EquipmentTypeModal({
  isOpen,
  onClose,
  setEquipmentTypesList,
  initialData,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [attributes, setAttributes] = useState<AttributeSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || "");
      setAttributes((initialData.attributesSchema as AttributeSchema[]) || []);
    } else {
      setName("");
      setDescription("");
      setAttributes([]);
    }
  }, [initialData, isOpen]);

  const addAttribute = () => {
    setAttributes([
      ...attributes,
      {
        name: `field_${Date.now()}`,
        label: "",
        type: "string",
        required: false,
      },
    ]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: keyof AttributeSchema, value: any) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], [field]: value };
    
    // Если изменили name, обновляем его автоматически из label (транслитом)
    if (field === "label" && value) {
      updated[index].name = value
        .toLowerCase()
        .replace(/[а-яё]/g, (c: string) => {
          const map: Record<string, string> = {
            а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e",
            ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
            н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
            ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "",
            ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
          };
          return map[c] || c;
        })
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
    }
    
    setAttributes(updated);
  };

  const updateSelectOptions = (index: number, optionsStr: string) => {
    const options = optionsStr.split(",").map((s) => s.trim()).filter(Boolean);
    updateAttribute(index, "options", options);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Название типа обязательно");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      attributesSchema: attributes.filter((a) => a.label?.trim()),
    };

    try {
      const url = initialData
        ? `/api/admin/equipmentTypes/${initialData.id}`
        : "/api/admin/equipmentTypes";
      const method = initialData ? "PUT" : "POST";

      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        const data = await resp.json();
        setEquipmentTypesList((prev) => {
          if (initialData) {
            return prev.map((t) => (t.id === initialData.id ? data : t));
          } else {
            return [data, ...prev];
          }
        });
        onClose();
      } else {
        const errorData = await resp.json();
        setError(errorData.error || "Ошибка сохранения");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={initialData ? "Редактировать тип оборудования" : "Создать тип оборудования"}
      onClose={onClose}
      size="lg"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <ModalField title="Название *">
        <input
          type="text"
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: Ноутбук, Проектор, МФУ"
        />
      </ModalField>

      <ModalField title="Описание">
        <textarea
          className={inputCls}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Общее описание типа оборудования..."
        />
      </ModalField>

      {/* Характеристики */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Характеристики
          </label>
          <Button variant="secondary" size="sm" onClick={addAttribute}>
            <Plus size={14} />
            Добавить поле
          </Button>
        </div>

        {attributes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed">
            <p className="text-gray-400 text-sm">Нет добавленных характеристик</p>
            <p className="text-gray-400 text-xs mt-1">
              Нажмите "Добавить поле" чтобы создать спецификацию для оборудования
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {attributes.map((attr, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800/20"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 text-gray-400 pt-1">
                    <GripVertical size={16} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Отображаемое название *
                        </label>
                        <input
                          type="text"
                          className={`${inputCls} text-sm`}
                          value={attr.label || ""}
                          onChange={(e) => updateAttribute(index, "label", e.target.value)}
                          placeholder="Например: Объём ОЗУ"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Тип поля *
                        </label>
                        <select
                          className={`${inputCls} text-sm`}
                          value={attr.type}
                          onChange={(e) => updateAttribute(index, "type", e.target.value as any)}
                        >
                          {fieldTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(attr.type === "string" || attr.type === "number") && (
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Единица измерения (необязательно)
                        </label>
                        <input
                          type="text"
                          className={`${inputCls} text-sm`}
                          value={attr.unit || ""}
                          onChange={(e) => updateAttribute(index, "unit", e.target.value)}
                          placeholder="Например: ГБ, мм, шт"
                        />
                      </div>
                    )}

                    {attr.type === "select" && (
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Варианты выбора (через запятую) *
                        </label>
                        <input
                          type="text"
                          className={`${inputCls} text-sm`}
                          value={attr.options?.join(", ") || ""}
                          onChange={(e) => updateSelectOptions(index, e.target.value)}
                          placeholder="Например: DDR4, DDR5, LPDDR4"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={attr.required || false}
                          onChange={(e) => updateAttribute(index, "required", e.target.checked)}
                          className="rounded"
                        />
                        Обязательное поле
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttribute(index)}
                    className="text-red-500 hover:text-red-600 p-1 flex-shrink-0"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-3 border-t">
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          {initialData ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </Modal>
  );
}