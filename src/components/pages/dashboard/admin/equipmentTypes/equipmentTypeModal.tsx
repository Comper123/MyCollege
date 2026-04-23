import Button from "@/components/ui/Button";
import { inputCls } from "@/components/ui/forms/Input";
import { optionCls, selectCls } from "@/components/ui/forms/Select";
import Modal, { ModalField, ModalGroupField } from "@/components/ui/Modal";
import { EquipmentType } from "@/lib/db/schema";
import { CustomField, emptyEquiupmentTypeForm, EquipmentTypeForm, FieldTypeLabels, fieldTypes } from "@/types/equipmentTypes";
import { ArrowRight, Trash, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

interface EquipmentTypeModal {
  isOpen: boolean;
  onClose: () => void;
  initialData?: EquipmentType;
  setEquipmentTypesList: React.Dispatch<React.SetStateAction<EquipmentType[]>>;
}


export default function EquipmentTypeModal({ isOpen, onClose, initialData, setEquipmentTypesList} : EquipmentTypeModal){
  const [selectPropI, setSelectPropI] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<EquipmentTypeForm>(initialData ? initialData as EquipmentTypeForm : emptyEquiupmentTypeForm);
  const [editId, setEditId] = useState("");
  
  useEffect(() => {
    const updateForm = () => {
      if (initialData) {
        setEditId(initialData.id);
        setForm(initialData as EquipmentTypeForm);
      } else {
        setForm(emptyEquiupmentTypeForm);
      }
    }
    updateForm();
  }, [initialData]);

  const mode = initialData ? 'edit' : 'create';

  // Добавление нового поля
  const addField = () => {
    setForm(prev => ({...prev, attributesSchema: [...prev.attributesSchema || [], {name: "", type: 'string'}]}))
  }

  // Изменение конкретного поля
  const editField = (field: keyof CustomField, value: string, i: number) => {
    setForm(prev => ({
      ...prev,
      attributesSchema: prev.attributesSchema?.map((f, index) =>
        index === i ? { ...f, [field]: value } : f
      )
    }))
  }

  // Удаление поля
  const removeField = (i: number) => {
    setForm(prev => {
      const newFields = prev.attributesSchema?.filter((_, index) => index !== i)
      // Сбрасываем если массив стал пустым
      if (newFields?.length === 0) setSelectPropI(null)
      return { ...prev, attributesSchema: newFields }
    })

    // Сбрасываем или корректируем выбранный индекс
    setSelectPropI(prev => {
      if (prev === null) return null
      if (prev === i) return null        // удалили выбранный элемент
      if (prev > i) return prev - 1      // выбранный сдвинулся
      return prev                        // выбранный не затронут
    })
  }

  // Создание типа оборудования
  const handleCreate = async () => {
    if (form.name?.trim().length === 0){
      setError("У типа оборудования должно быть название");
      return;
    }

    if (form.attributesSchema?.some(f => f.name.trim().length === 0)){
      setError("У типа оборудования не должно быть полей с пустым названием");
      return;
    }

    try {
      const resp = await fetch('/api/admin/equipmentTypes', {
        method: "POST",
        body: JSON.stringify(form)
      });
      if (resp.ok) {
        const data = await resp.json();
        const newEqT: EquipmentType = data;
        setEquipmentTypesList(prev => ([...prev, newEqT]))
        onClose();
        setForm(emptyEquiupmentTypeForm);
        setError("");
      } else {
        setError("Ошибка создания типа оборудования. Проверьте все поля");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleEdit = async () => {
    try {
      const resp = await fetch(`/api/admin/equipmentTypes/${editId}`, {
        method: "PATCH",
        body: JSON.stringify(form)
      });
      if (resp.ok){
        const data: EquipmentType = await resp.json();
        setEquipmentTypesList(prev => (prev.map(eqT => eqT.id === editId ? data : eqT)))
        onClose();
      } else {
        console.log("Ошибка изменения типа оборудования")
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Modal size="xl" isOpen={isOpen} onClose={onClose} title={mode === "create" ? "Создать тип оборудования" : `Изменить ${form.name}`}>
      {error && (
        <p className="py-2 px-4 bg-red-100 text-sm text-red-600 rounded-lg mb-2 flex gap-2 items-center"><TriangleAlert/>{error}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <ModalGroupField title="Характеристики">
          <div className="space-y-1 mb-5">
            <ModalField title="Название">
              <input type="text" className={inputCls} value={form.name} onChange={e => setForm(prev => ({...prev, name: e.target.value}))}/>
            </ModalField>
            <ModalField title="Описание">
              <textarea className={inputCls} rows={5} value={form.description} onChange={e => setForm(prev => ({...prev, description: e.target.value}))}/>
            </ModalField>
            <ModalField title="Дополнительные свойства" action={addField} actionText="+ Добавить">
              <div className="mt-2 max-h-48 overflow-y-auto scrollbar-thin">
                {form.attributesSchema && form.attributesSchema.map((f, i) => (
                  <div key={i} className={`${i === selectPropI ? 'bg-indigo-100/60' : ''} rounded-lg px-4 py-2 grid gap-2 grid-cols-10 items-center`} onClick={() => setSelectPropI(i)}>
                    <p className="text-xs text-gray-600 font-semibold">#{i + 1}</p>
                    <input type="text" placeholder="Введите название свойства:"
                      className={`${inputCls} col-span-7`} value={f.name} onChange={e => editField("name", e.target.value, i)}/>
                    <div className="h-full flex justify-end items-center col-span-2">
                      <div className="p-2 hover:bg-red-50 duration-300 rounded-lg cursor-pointer text-red-600"
                        onClick={() => removeField(i)}>
                        <Trash size={16}/>
                      </div>
                      <div className="p-2 hover:bg-indigo-50 duration-300 rounded-lg cursor-pointer text-indigo-600">
                        <ArrowRight size={16}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ModalField>
          </div>
        </ModalGroupField>
        <ModalGroupField title={selectPropI !== null && form.attributesSchema &&  form.attributesSchema[selectPropI] ? form.attributesSchema[selectPropI].name === "" ? 'Нет названия' : form.attributesSchema[selectPropI].name : "Свойство не выбрано"}>
          {selectPropI !== null ? (
            <ModalField title="Тип поля">
              <select
                className={selectCls}
                value={form.attributesSchema?.[selectPropI]?.type || ""}
                onChange={e => editField("type", e.target.value, selectPropI)}
              >
                {fieldTypes.map((t, i) => ( 
                  <option key={i} value={t} className={optionCls}>{FieldTypeLabels[t]}</option>
                ))}
              </select>
            </ModalField>
          ) : (
            <div className="h-full flex items-center">
              <p className="text-gray-400 text-sm">Выберите свойство для просмотра и редактирования</p>
            </div>
          )}
        </ModalGroupField>
      </div>
      
      <Button className="ml-auto" onClick={mode === "create" ? () => handleCreate() : () => handleEdit()}>{mode === "create" ? "Создать" : "Изменить"} </Button>
    </Modal>
  )
}