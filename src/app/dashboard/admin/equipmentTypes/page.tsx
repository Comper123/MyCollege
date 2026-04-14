"use client";


import { Block } from "@/components/ui/Block";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import { EquipmentType } from "@/lib/db/schema"
import { LayoutGrid, Plus, Table } from "lucide-react";
import { useEffect, useState } from "react"

export default function EquipmentTypesPage(){
  const [equipmentTypesList, setEqupmentTypesList] = useState<EquipmentType[]>([])
  const [mode, setMode] = useState<"grid" | "table">("table");
  const [search, setSearch] = useState<string>("");

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
          <Button className="ml-4">
            <Plus size={16}/>
            Добавить
          </Button>
        </div>
      </Block>
    </main>
  )
}