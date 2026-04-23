"use client";


import EmptyBlock from "@/components/blocks/EmptyBlock";
import EquipmentTypeModal from "@/components/pages/dashboard/admin/equipmentTypes/equipmentTypeModal";
import ContextMenu from "@/components/ui/Actions";
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
import { CustomField, EquipmentTypeForm, FieldTypeLabels, fieldTypes } from "@/types/equipmentTypes";
import { formatDateTime } from "@/utils/datetime/dateFormatter";
import { ArrowRight, LayoutGrid, Pencil, Plus, Table as TableIcon, Trash, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react"





export default function EquipmentTypesPage(){
  const [equipmentTypesList, setEqupmentTypesList] = useState<EquipmentType[]>([])
  const [mode, setMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState<string>("");

  const [createForm, setCreateForm] = useState<EquipmentTypeForm>();

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
      render: (value) => <p className="max-w-96 truncate text-gray-400">{value as string}</p>
    },
     {
      title: "Дата создания",
      key: "createdAt",
      render: (value) => <p>{formatDateTime(value as string, "full")}</p>
    },
    {
      title: "Действия",
      key: "id",
      render: (_, row) => (
        <div className="flex gap-2">

        </div>
      )
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

  // Список типов оборудования с учетом поиска
  const filteredEquipmentList = useMemo(() => {
    if (!search.trim()) return equipmentTypesList

    return equipmentTypesList.filter(eq =>
      eq.name.toLowerCase().includes(search.toLowerCase().trim())
    )
  }, [search, equipmentTypesList])

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
        
        {filteredEquipmentList.length > 0 ? (
          <div className="mt-6">
            {/* Сами типы оборудования */}
            {mode === "grid" ? (
              <Grid cols={3}>
                {filteredEquipmentList.map((eqT, i) => (
                  <Card key={i}>
                    <div className="flex justify-between">
                      <div>
                        <h1 className="text-gray-800 font-semibold">{eqT.name}</h1>
                        <p className="text-gray-400 text-xs mb-2 line-clamp-1">{eqT.description || "Нет описания"}</p>
                      </div>
                      <ContextMenu items={[
                        {
                          label: "Редактировать",
                          icon: <Pencil size={14} />,
                          onClick: () => console.log("edit"),
                        },
                        {
                          label: "Удалить",
                          icon: <Trash size={14} />,
                          variant: "danger",
                          onClick: () => console.log("delete"),
                        },
                      ]} />
                    </div>
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
                data={filteredEquipmentList}
                keyExtractor={row => row.id}
              />
            )}
          </div>
        ) : (
          <EmptyBlock title={search ? 'Такого типа оборудования не существует' : 'Ни один тип оборудования пока еще не создан, исправьте это!'}/>
        )}   
      </Block>
      <EquipmentTypeModal
        isOpen={isCreateEqTypeOpen}
        onClose={() => setIsCreateEqTypeOpen(false)}/
        initialData={createForm}>
    </main>
  )
}