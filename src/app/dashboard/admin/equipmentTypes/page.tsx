"use client";


import { Block } from "@/components/ui/Block";
import Button from "@/components/ui/Button";
import { inputCls } from "@/components/ui/forms/Input";
import Grid from "@/components/ui/Grid";
import Modal, { ModalField, ModalGroupField } from "@/components/ui/Modal";
import SearchInput from "@/components/ui/SearchInput";
import { EquipmentType } from "@/lib/db/schema"
import { CustomField } from "@/types/equipmentTypes";
import { LayoutGrid, Plus, Table } from "lucide-react";
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
    fields: [{type: "string"}]
  });

  const [selectProp, setSelectProp] = useState(null);

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

  const addProp = () => {
    setCreateForm(prev => ({...prev, fields: [...prev.fields, {type: 'string'}]}))
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
              <Table strokeWidth={1.5} size={20}/>
            </button>
          </div>
          <Button className="ml-4" onClick={() => setIsCreateEqTypeOpen(true)}>
            <Plus size={16}/>
            Добавить
          </Button>
        </div>

        {/* Сами типы оборудования */}
        {mode === "grid" ? (
          <Grid cols={3}>

          </Grid>
        ) : (
          <div>c</div>
        )}
      </Block>

      <Modal size="xl" isOpen={isCreateEqTypeOpen} onClose={() => setIsCreateEqTypeOpen(false)} title="Создать тип оборудования">
        <div className="grid grid-cols-2 gap-4">
          <ModalGroupField title="Основные поля">
            <div className="space-y-1 mb-5">
              <ModalField title="Название">
                <input type="text" className={inputCls}/>
              </ModalField>
              <ModalField title="Описание">
                <textarea className={inputCls} rows={5}/>
              </ModalField>
              <ModalField title="Свойства" action={addProp} actionText="+ Добавить">
                {createForm.fields.map((f, i) => (
                  <div key={i} className="grid gap-2 grid-cols-2">
                    <input type="text" className={inputCls}/>
                    <input type="text" className={inputCls}/>
                  </div>
                ))}
              </ModalField>
            </div>
          </ModalGroupField>
          <ModalGroupField title={selectProp ? "" : "Свойство не выбрано"}>
            {selectProp ? (
              <ModalField title="Свойства оборудования">
                <input type="text" className={inputCls}/>
              </ModalField>
            ) : (
              <div className="h-full flex items-center">
                <p className="text-gray-400 text-sm">Выберите свойство для просмотра и редактирования</p>
              </div>
            )}
          </ModalGroupField>
        </div>
        
        <Button className="ml-auto">Создать</Button>
      </Modal>
    </main>
  )
}