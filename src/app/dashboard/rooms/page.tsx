'use client';


import { Block } from "@/components/blocks/Block";
import EmptyBlock from "@/components/blocks/EmptyBlock";
import ProtectedBlock from "@/components/blocks/ProtectedBlock";
import Button from "@/components/ui/Button";
import { inputCls } from "@/components/ui/forms/Input";
import SelectSearch, { Option } from "@/components/ui/forms/SelectSearch";
import Grid from "@/components/ui/Grid";
import Modal, { ModalField } from "@/components/ui/Modal";
import SearchInput from "@/components/ui/SearchInput";
import { Column, Table } from "@/components/ui/Table";
import { fio, Room, User } from "@/lib/db/schema";
import { emptyRoomForm, FullRoom, RoomForm } from "@/types/rooms";
import { SelectUser } from "@/types/users";
import { LayoutGrid, Plus, TableIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function RoomsPage(){
  // Свойства
  const searchParams = useSearchParams();
  const isMy = searchParams.get("isMy");
  const [mode, setMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");

  // Модалки
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [createForm, setCreateForm] = useState<RoomForm>(emptyRoomForm);

  // data
  const [rooms, setRooms] = useState<FullRoom[]>([]);
  const [labs, setLabs] = useState<SelectUser[]>([]);
  const [labOptions, setLabOptions] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<SelectUser[]>([]);
  const [teachersOptions, setTeachersOptions] = useState<Option[]>([]);
  
  useEffect(() => {
    const fetchRooms = async () => {
      const resp = await fetch(`/api/rooms?isMy=${isMy}`);
      if (resp.ok){
        const data: FullRoom[] = await resp.json();
        setRooms(data);
      } else {
        console.log("Ошибка загрузки кабинетов");
      }
    };
    fetchRooms();
  }, [isMy]);

  // Загружаем преподавателей и лаборантов
  useEffect(() => {
    const load = async () => {
      try {
        const [labRes, teacherRes] = await Promise.all([
          fetch('/api/admin/users?role=laborant'),
          fetch('/api/admin/users?role=teacher')
        ]);
        const l = labRes.ok ? await labRes.json() : { users: [] };
        const t = teacherRes.ok ? await teacherRes.json() : { users: [] };

        setLabOptions(
          l.users.map((i: SelectUser) => ({
            label: fio(i),
            value: i.id,
          }))
        );

        setTeachersOptions(
          t.users.map((i: SelectUser) => ({
            label: fio(i),
            value: i.id,
          }))
        );
      } catch (e) {
        console.error(e);
      }
    };

    load();
  }, [])

  // Кабинеты с учетом поиска
  const roomsSearch = useMemo(() => {
    if (!search.trim()) return rooms;
    return rooms?.filter(r => r.number.toLowerCase().includes(search.toLowerCase().trim()));
  }, [search, rooms]);

  const handleCreate = async () => {
    try {
      const resp = await fetch('/api/rooms', {
        method: "POST",
        body: JSON.stringify(createForm)
      });
      if (resp.ok){
        const newRoom: FullRoom = await resp.json();
        setRooms(prev => ([...prev, newRoom]));
      } else {

      }
    } catch (error) {
      console.log(error);
    }    
  }

  const columns: Column<FullRoom>[] = [
    {
      title: "Номер",
      key: "number"
    },
    {
      title: "Описание",
      key: "description",
      render: (value) => <p className="max-w-96 truncate text-gray-400">{value as string}</p>
    },
    {
      title: "Ответственный лаборант",
      key: "attachedLaborant",
      render: (value, row) => <p>{fio(value as SelectUser)}</p>
    },
    {
      title: "Ответственный преподаватель",
      key: "attachedTeacher",
      render: (value, row) => <p>{fio(value as SelectUser)}</p>
    }
  ]

  return (
    <main className="w-full h-full">
      <ProtectedBlock allowedRoles={isMy ? [] : ["laborant", "admin"]}>
        <Block>
          <h1 className="text-xl font-semibold">{isMy ? "Закрепленные за вами кабинеты" : "Все кабинеты"}</h1>
          <p className="text-sm text-gray-400 mb-3">{isMy ? "Кабинеты, в которых вы помечены ответственным за оборудование" : "Все кабинеты вашего учреждения"}</p>
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
            <ProtectedBlock allowedRoles={["admin"]} isHide>
              <Button className="ml-4" onClick={() => setIsCreateRoomOpen(true)}>
                <Plus size={16}/>
                Добавить
              </Button>
            </ProtectedBlock>
          </div>
          
          {roomsSearch.length > 0 ? (
            <div className="mt-6">
              {/* Сами типы оборудования */}
              {mode === "grid" ? (
                <Grid cols={3}>
                  {/* {roomsSearch.map((eqT, i) => (
                    
                  ))} */}
                  <p></p>
                </Grid>
              ) : (
                <Table
                  columns={columns}
                  data={roomsSearch}
                  keyExtractor={row => row.id}
                />
              )}
            </div>
          ) : (
            <EmptyBlock title={search ? 
              (isMy ? 
                "За вами не закреплено такого кабинета" : 'Кабинета с таким номером не существует') 
              : (isMy ? 'За вами не закреплено ни одного кабинета' : 'Ни один кабинет пока еще не создан, исправьте это!')}/>
          )} 
        </Block>
      </ProtectedBlock>
      {!isMy && 
        <>
          {/* Модалка создания кабинета */}
          <Modal isOpen={isCreateRoomOpen} title="Создать кабинет" onClose={() => setIsCreateRoomOpen(false)}>
            <ModalField title="Номер">
              <input type="text" className={inputCls} value={createForm.number} onChange={(e) => setCreateForm(prev => ({...prev, number: e.target.value}))}/>
            </ModalField>
            <ModalField title="Закрепленный преподаватель">
              <SelectSearch options={teachersOptions} value={createForm.teacher_id} onChange={value => setCreateForm(prev => ({...prev, teacher_id: value}))}/>
            </ModalField>
            <ModalField title="Закрепленный лаборант">
              <SelectSearch options={labOptions} value={createForm.laborant_id} onChange={value => setCreateForm(prev => ({...prev, laborant_id: value}))}/>
            </ModalField>
            <ModalField title="Назначение">
              <textarea className={inputCls} rows={5} value={createForm.description} onChange={(e) => setCreateForm(prev => ({...prev, description: e.target.value}))}/>
            </ModalField>
            <Button onClick={() => handleCreate()} className="ml-auto mt-3">Создать</Button>
          </Modal>
        </>
      }
    </main>
  )
}