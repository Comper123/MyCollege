"use client";

import { Block } from "@/components/blocks/Block";
import EmptyBlock from "@/components/blocks/EmptyBlock";
import ProtectedBlock from "@/components/blocks/ProtectedBlock";
import RoomCard from "@/components/pages/dashboard/rooms/RoomCard";
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
import { 
  LayoutGrid, 
  Table as TableIcon, 
  Plus, 
  Building2,
  Users,
  UserCog,
  FileText,
  X,
  Check,
  Search,
  Filter
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function RoomsPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const isMy = searchParams.get("isMy");
  const [mode, setMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Модалки
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [createForm, setCreateForm] = useState<RoomForm>(emptyRoomForm);
  const [isCreating, setIsCreating] = useState(false);

  // Фильтры
  const [filterTeacher, setFilterTeacher] = useState<string>("");
  const [filterLaborant, setFilterLaborant] = useState<string>("");

  // data
  const [rooms, setRooms] = useState<FullRoom[]>([]);
  const [labs, setLabs] = useState<SelectUser[]>([]);
  const [labOptions, setLabOptions] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<SelectUser[]>([]);
  const [teachersOptions, setTeachersOptions] = useState<Option[]>([]);

  // Статистика
  const stats = useMemo(() => {
    return {
      total: rooms.length,
      withTeacher: rooms.filter(r => r.attachedTeacher).length,
      withLaborant: rooms.filter(r => r.attachedLaborant).length,
      withDescription: rooms.filter(r => r.description).length,
    };
  }, [rooms]);

  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      const resp = await fetch(`/api/rooms?isMy=${isMy}`);
      if (resp.ok) {
        const data: FullRoom[] = await resp.json();
        setRooms(data);
      } else {
        console.log("Ошибка загрузки кабинетов");
      }
      setIsLoading(false);
    };
    fetchRooms();
  }, [isMy]);

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
  }, []);

  const roomsSearch = useMemo(() => {
    let filtered = rooms;
    
    if (search.trim()) {
      filtered = filtered.filter(r => 
        r.number.toLowerCase().includes(search.toLowerCase().trim())
      );
    }
    
    if (filterTeacher) {
      filtered = filtered.filter(r => r.attachedTeacher?.id === filterTeacher);
    }
    
    if (filterLaborant) {
      filtered = filtered.filter(r => r.attachedLaborant?.id === filterLaborant);
    }
    
    return filtered;
  }, [search, rooms, filterTeacher, filterLaborant]);

  const handleCreate = async () => {
    if (!createForm.number.trim()) {
      alert("Введите номер кабинета");
      return;
    }
    
    setIsCreating(true);
    try {
      const resp = await fetch('/api/rooms', {
        method: "POST",
        body: JSON.stringify(createForm)
      });
      if (resp.ok) {
        const newRoom: FullRoom = await resp.json();
        setRooms(prev => ([...prev, newRoom]));
        setCreateForm(emptyRoomForm);
        setIsCreateRoomOpen(false);
      } else {
        const error = await resp.json();
        alert(error.error || "Ошибка создания кабинета");
      }
    } catch (error) {
      console.log(error);
      alert("Ошибка при создании кабинета");
    } finally {
      setIsCreating(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setFilterTeacher("");
    setFilterLaborant("");
  };

  const columns: Column<FullRoom>[] = [
    {
      title: "Номер",
      key: "number",
      render: (value) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          Каб. {value as string}
        </span>
      )
    },
    {
      title: "Описание",
      key: "description",
      render: (value) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-gray-400" />
          <p className="max-w-96 truncate text-gray-500 dark:text-gray-400">
            {value as string || "—"}
          </p>
        </div>
      )
    },
    {
      title: "Ответственный лаборант",
      key: "attachedLaborant",
      render: (value) => {
        const laborant = value as SelectUser;
        return laborant ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {laborant.lastname?.[0]}{laborant.firstname?.[0]}
              </span>
            </div>
            <span className="text-sm">{fio(laborant)}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Не назначен</span>
        );
      }
    },
    {
      title: "Ответственный преподаватель",
      key: "attachedTeacher",
      render: (value) => {
        const teacher = value as SelectUser;
        return teacher ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">
                {teacher.lastname?.[0]}{teacher.firstname?.[0]}
              </span>
            </div>
            <span className="text-sm">{fio(teacher)}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Не назначен</span>
        );
      }
    }
  ];

  return (
    <main className="w-full h-full">
      <ProtectedBlock allowedRoles={isMy ? [] : ["laborant", "admin"]}>
        <Block>
          {/* Заголовок и статистика */}
          <div className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isMy ? "Мои кабинеты" : "Все кабинеты"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isMy 
                    ? "Кабинеты, в которых вы помечены ответственным за оборудование" 
                    : "Управление кабинетами вашего учреждения"}
                </p>
              </div>
              
              {/* Статистика */}
              <div className="flex gap-3">
                <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Всего</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-center">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">С препод.</p>
                  <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">{stats.withTeacher}</p>
                </div>
                <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-center">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">С лаборантом</p>
                  <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{stats.withLaborant}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Панель управления */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <SearchInput 
                  value={search} 
                  onChange={setSearch} 
                  onClear={() => setSearch("")} 
                  className="h-9"
                  placeholder="Поиск по номеру кабинета..."
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                  showFilters 
                    ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Filter size={16} />
                <span className="text-sm">Фильтры</span>
                {(filterTeacher || filterLaborant) && (
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
                    {(filterTeacher ? 1 : 0) + (filterLaborant ? 1 : 0)}
                  </span>
                )}
              </button>

              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  className={`p-1.5 px-2 transition-colors ${
                    mode === "grid" 
                      ? "bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400" 
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setMode("grid")}
                  title="Сетка"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  className={`p-1.5 px-2 transition-colors ${
                    mode === "table" 
                      ? "bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400" 
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setMode("table")}
                  title="Таблица"
                >
                  <TableIcon size={18} />
                </button>
              </div>

              <ProtectedBlock allowedRoles={["admin"]} isHide>
                <Button onClick={() => setIsCreateRoomOpen(true)}>
                  <Plus size={16} />
                  Добавить кабинет
                </Button>
              </ProtectedBlock>
            </div>

            {/* Расширенные фильтры */}
            {showFilters && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Фильтры</h3>
                  <button
                    onClick={resetFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 flex items-center gap-1"
                  >
                    <X size={12} />
                    Сбросить
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <Users size={12} className="inline mr-1" />
                      Ответственный преподаватель
                    </label>
                    <select
                      value={filterTeacher}
                      onChange={(e) => setFilterTeacher(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Все преподаватели</option>
                      {teachersOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <UserCog size={12} className="inline mr-1" />
                      Ответственный лаборант
                    </label>
                    <select
                      value={filterLaborant}
                      onChange={(e) => setFilterLaborant(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Все лаборанты</option>
                      {labOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Контент */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : roomsSearch.length > 0 ? (
            <div className="mt-6">
              {mode === "grid" ? (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-gray-500">
                      Найдено: {roomsSearch.length} кабинетов
                    </p>
                  </div>
                  <Grid cols={3}>
                    {roomsSearch.map((room) => (
                      <RoomCard room={room} key={room.id} />
                    ))}
                  </Grid>
                </>
              ) : (
                <Table
                  columns={columns}
                  data={roomsSearch}
                  keyExtractor={row => row.id}
                />
              )}
            </div>
          ) : (
            <EmptyBlock 
              icon={<Building2 size={48} className="mx-auto mb-3 text-gray-400" />}
              title={
                search || filterTeacher || filterLaborant
                  ? "Кабинеты не найдены"
                  : isMy 
                    ? "За вами не закреплено ни одного кабинета" 
                    : "Ни один кабинет пока еще не создан"
              }
              description={
                search || filterTeacher || filterLaborant
                  ? "Попробуйте изменить параметры поиска или сбросить фильтры"
                  : isMy
                    ? "Обратитесь к администратору для закрепления кабинетов"
                    : "Нажмите кнопку «Добавить кабинет» чтобы создать первый кабинет"
              }
              action={
                (search || filterTeacher || filterLaborant) ? (
                  <Button variant="secondary" onClick={resetFilters}>
                    Сбросить фильтры
                  </Button>
                ) : !isMy && (
                  <ProtectedBlock allowedRoles={["admin"]}>
                    <Button onClick={() => setIsCreateRoomOpen(true)}>
                      <Plus size={16} />
                      Добавить кабинет
                    </Button>
                  </ProtectedBlock>
                )
              }
            />
          )}
        </Block>
      </ProtectedBlock>

      {/* Модалка создания кабинета */}
      {!isMy && (
        <Modal 
          isOpen={isCreateRoomOpen} 
          title={
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-indigo-500" />
              <span>Создать кабинет</span>
            </div>
          }
          onClose={() => setIsCreateRoomOpen(false)}
          size="md"
        >
          <div className="space-y-4">
            <ModalField title="Номер кабинета *">
              <input 
                type="text" 
                className={inputCls} 
                value={createForm.number} 
                onChange={(e) => setCreateForm(prev => ({...prev, number: e.target.value}))}
                placeholder="Например: 301"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">Уникальный номер кабинета</p>
            </ModalField>

            <div className="grid grid-cols-2 gap-3">
              <ModalField title="Ответственный преподаватель">
                <SelectSearch 
                  options={teachersOptions} 
                  value={createForm.teacher_id} 
                  onChange={value => setCreateForm(prev => ({...prev, teacher_id: value}))}
                  placeholder="Не выбран"
                />
              </ModalField>

              <ModalField title="Ответственный лаборант">
                <SelectSearch 
                  options={labOptions} 
                  value={createForm.laborant_id} 
                  onChange={value => setCreateForm(prev => ({...prev, laborant_id: value}))}
                  placeholder="Не выбран"
                />
              </ModalField>
            </div>

            <ModalField title="Назначение кабинета">
              <textarea 
                className={inputCls} 
                rows={4} 
                value={createForm.description} 
                onChange={(e) => setCreateForm(prev => ({...prev, description: e.target.value}))}
                placeholder="Укажите назначение кабинета, например: Компьютерный класс, Лаборатория физики и т.д."
              />
            </ModalField>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => setIsCreateRoomOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} loading={isCreating}>
              <Check size={16} />
              Создать кабинет
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}