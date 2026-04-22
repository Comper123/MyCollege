"use client";


import EmptyBlock from "@/components/blocks/EmptyBlock";
import { Block } from "@/components/ui/Block";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/forms/Card";
import { inputCls } from "@/components/ui/forms/Input";
import { optionCls, selectCls } from "@/components/ui/forms/Select";
import Grid from "@/components/ui/Grid";
import Modal, { ModalField, ModalGroupField } from "@/components/ui/Modal";
import SearchInput from "@/components/ui/SearchInput";
import { Column, Table} from "@/components/ui/Table";
import { EquipmentType } from "@/lib/db/schema"
import { CustomField, FieldTypeLabels, fieldTypes } from "@/types/equipmentTypes";
import { formatDateTime } from "@/utils/datetime/dateFormatter";
import { ArrowRight, LayoutGrid, Plus, Table as TableIcon, Trash, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react"



interface EquipmentTypeForm {
  name: string;
  description: string;
  fields: CustomField[]
}

export default function EquipmentTypesPage(){
  const [equipmentTypesList, setEqupmentTypesList] = useState<EquipmentType[]>([])
  const [mode, setMode] = useState<"grid" | "table">("table");
  const [search, setSearch] = useState<string>("");

  const [createForm, setCreateForm] = useState<EquipmentTypeForm>({
    name: '',
    description: '',
    fields: [{name: "", type: "string"}]
  });
  const [createError, setCreateError] = useState("");

  const [selectPropI, setSelectPropI] = useState<number | null>(null);

  // Модалки
  const [isCreateEqTypeOpen, setIsCreateEqTypeOpen] = useState(false);

  useEffect(() => {
    const loadEquipmentList = async () => {
      try {
        const resp = await fetch("/api/admin/equipmentTypes");
        if (resp.ok){
          const formatData: EquipmentType[] = await resp.json(); 
          setEqupmentTypesList(formatData);
        } else {
          console.log("Неуспешная загрузка типов оборудования");
        }
      } catch (error){
        console.log(error)
      }
    } 
    loadEquipmentList();
  }, [])


  const columns: Column<EquipmentType>[] = [
    {
      title: "Название",
      key: "name"
    },
    {
      title: "Описание",
      key: "description",
    },
     {
      title: "Дата создания",
      key: "createdAt",
      render: (value) => <p>{formatDateTime(value as string, "full")}</p>
    }
  ]

  // Добавление нового поля
  const addField = () => {
    setCreateForm(prev => ({...prev, fields: [...prev.fields, {name: "", type: 'string'}]}))
  }

  // Изменение конкретного поля
  const editField = (field: keyof CustomField, value: string, i: number) => {
    setCreateForm(prev => ({
      ...prev,
      fields: prev.fields.map((f, index) =>
        index === i ? { ...f, [field]: value } : f
      )
    }))
  }

  // Удаление поля
  const removeField = (i: number) => {
    setCreateForm(prev => {
      const newFields = prev.fields.filter((_, index) => index !== i)
      // Сбрасываем если массив стал пустым
      if (newFields.length === 0) setSelectPropI(null)
      return { ...prev, fields: newFields }
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
    if (createForm.name.trim().length === 0){
      setCreateError("У типа оборудования должно быть название");
      return;
    }

    if (createForm.fields.some(f => f.name.trim().length === 0)){
      setCreateError("У типа оборудования не должно быть полей с пустым названием");
      return;
    }

    try {
      const resp = await fetch('/api/admin/equipmentTypes', {
        method: "POST",
        body: JSON.stringify(createForm)
      });
      if (resp.ok) {
        setIsCreateEqTypeOpen(false);
        setCreateError("");
      } else {
        setCreateError("Ошибка создания типа оборудования. Проверьте все поля");
      }
    } catch (error) {
      console.log(error)
    }
    
  }

  return (
    <main>
      <Block>
        <h1 className="text-xl font-semibold">Типы оборудования</h1>
        <p className="text-sm text-gray-400 mb-3">Здесь расположены типы оборудования, можете отредактировать существующие или добавить новые</p>
        <div className="flex">
          <SearchInput value={search} onChange={setSearch} onClear={() => setSearch("")} className="h-8 w-[400px]"/>  
          <div className="flex ml-3 mr-auto rounded-lg border overflow-hidden">
            <button className={`text-slate-600 p-1 px-1.5 hover:bg-gray-300/70 transition-colors duration-300 ${mode === "grid" ? 'bg-gray-300/70' : ''}`}
              onClick={() => setMode("grid")}>
              <LayoutGrid strokeWidth={1.5} size={20}/>
            </button>
            <button className={`text-slate-600 p-1 px-1.5 hover:bg-gray-300/70 transition-colors duration-300 ${mode === "table" ? 'bg-gray-300/70' : ''}`}
              onClick={() => setMode("table")}>
              <TableIcon strokeWidth={1.5} size={20}/>
            </button>
          </div>
          <Button className="ml-4" onClick={() => setIsCreateEqTypeOpen(true)}>
            <Plus size={16}/>
            Добавить
          </Button>
        </div>
        
        {equipmentTypesList.length > 0 ? (
          <div className="mt-6">
            {/* Сами типы оборудования */}
            {mode === "grid" ? (
              <Grid cols={3}>
                {equipmentTypesList.map((eqT, i) => (
                  <Card key={i}>
                    <h1 className="text-gray-800 font-semibold">{eqT.name}</h1>
                    <p className="text-gray-400 text-xs mb-2">{eqT.description || "Нет описания"}</p>
                    <hr className="border-b-0 mb-2"/>
                    {eqT.attributesSchema && eqT.attributesSchema?.length > 0 ? (
                      <div className="">
                        {/* Список характеристик типа оборудования */}
                        <p className="text-gray-600 text-sm font-medium">Характеристики:</p>
                        {eqT.attributesSchema.map((field, i) => (
                          <div key={i} className="flex items-center">
                            <span className="rounded-full aspect-square h-5 bg-gray-200 p-1 text-xs text-gray-600 mr-1 flex items-center justify-center">{i + 1}</span>
                            <p className="text-gray-400 text-sm"> {(field as CustomField).name}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm font-medium">Характеристик не загружено</p>
                    )}
                  </Card>
                ))}
              </Grid>
            ) : (
              <Table
                columns={columns}
                data={equipmentTypesList}
                keyExtractor={row => row.id}
              />
            )}
          </div>
        ) : (
          <EmptyBlock title="Ни один тип оборудования пока еще не создан, исправьте это!"/>
        )}
        
      </Block>

      <Modal size="xl" isOpen={isCreateEqTypeOpen} onClose={() => setIsCreateEqTypeOpen(false)} title="Создать тип оборудования">
        {createError && (
          <p className="py-2 px-4 bg-red-100 text-sm text-red-600 rounded-lg mb-2 flex gap-2 items-center"><TriangleAlert/>{createError}</p>
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
    </main>
  )
}