import Button from "@/components/ui/Button";
import { inputCls } from "@/components/ui/forms/Input";
import { optionCls, selectCls } from "@/components/ui/forms/Select";
import Modal, { ModalField, ModalGroupField } from "@/components/ui/Modal";
import { emptyEquiupmentTypeForm, EquipmentTypeForm, FieldTypeLabels, fieldTypes } from "@/types/equipmentTypes";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";

interface EquipmentTypeModal {
  isOpen: boolean;
  onClose: () => void;
  initialData?: EquipmentTypeForm | null;
}


export default function EquipmentTypeModal({ isOpen, onClose, initialData = null } : EquipmentTypeModal){
  const [selectPropI, setSelectPropI] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState<EquipmentTypeForm>(initialData || emptyEquiupmentTypeForm);
  const mode = initialData === null ? 'create' : 'edit';

  return (
    <Modal size="xl" isOpen={isOpen} onClose={onClose} title="Создать тип оборудования">
      {error && (
        <p className="py-2 px-4 bg-red-100 text-sm text-red-600 rounded-lg mb-2 flex gap-2 items-center"><TriangleAlert/>{error}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <ModalGroupField title="Характеристики">
          <div className="space-y-1 mb-5">
            <ModalField title="Название">
              <input type="text" className={inputCls} value={createForm.name} onChange={e => setCreateForm(prev => ({...prev, name: e.target.value}))}/>
            </ModalField>
            <ModalField title="Описание">
              <textarea className={inputCls} rows={5} value={createForm.description} onChange={e => setCreateForm(prev => ({...prev, description: e.target.value}))}/>
            </ModalField>
            <ModalField title="Дополнительные свойства" action={addField} actionText="+ Добавить">
              <div className="mt-2 max-h-48 overflow-y-auto scrollbar-thin">
                {createForm.fields.map((f, i) => (
                  <div key={i} className={`${i === selectPropI ? 'bg-indigo-100/60' : ''} rounded-lg px-4 py-2 grid gap-2 grid-cols-10 items-center`} onClick={() => setSelectPropI(i)}>
                    <p className="text-xs text-gray-600 font-semibold">#{i}</p>
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
        <ModalGroupField title={selectPropI !== null && createForm.fields[selectPropI] ? createForm.fields[selectPropI].name === "" ? 'Нет названия' : createForm.fields[selectPropI].name : "Свойство не выбрано"}>
          {selectPropI !== null ? (
            <ModalField title="Тип поля">
              <select className={selectCls}>
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
      
      <Button className="ml-auto" onClick={handleCreate}>Создать</Button>
    </Modal>
  )
}