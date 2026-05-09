"use client";

import EmptyBlock from "@/components/blocks/EmptyBlock";
import ContextMenu from "@/components/ui/Actions";
import { Block } from "@/components/blocks/Block";
import Button from "@/components/ui/Button";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import Card from "@/components/ui/forms/Card";
import Grid from "@/components/ui/Grid";
import SearchInput from "@/components/ui/SearchInput";
import { Column, Table } from "@/components/ui/Table";
import { AttributeSchema, EquipmentType } from "@/lib/db/schema";
import { formatDateTime } from "@/utils/datetime/dateFormatter";
import { LayoutGrid, Pencil, Plus, Table as TableIcon, Trash, Hash, Text, ToggleLeft, List } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EquipmentTypeModal from "@/components/pages/dashboard/admin/equipmentTypes/equipmentTypeModal";

const fieldTypeIcons = {
  string: <Text size={12} />,
  number: <Hash size={12} />,
  boolean: <ToggleLeft size={12} />,
  select: <List size={12} />,
};


export default function EquipmentTypesPage() {
  const [equipmentTypesList, setEquipmentTypesList] = useState<EquipmentType[]>([]);
  const [mode, setMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState<string>("");

  const [isCreateEqTypeOpen, setIsCreateEqTypeOpen] = useState(false);
  const [isEditEqTypeOpen, setIsEditEqTypeOpen] = useState(false);
  const [isDeleteEqTypeOpen, setIsDeleteEqTypeOpen] = useState(false);

  const [deleteEqTypeId, setDeleteEqTypeId] = useState("");
  const [editedEqType, setEditedEqType] = useState<EquipmentType>();

  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteModal = (id: string) => {
    setDeleteEqTypeId(id);
    setIsDeleteEqTypeOpen(true);
  };

  const loadEquipmentType = async (id: string) => {
    const resp = await fetch(`/api/admin/equipmentTypes/${id}`);
    const data: EquipmentType = await resp.json();
    setEditedEqType(data);
  };

  const openEditModal = async (id: string) => {
    await loadEquipmentType(id);
    setIsEditEqTypeOpen(true);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const resp = await fetch(`/api/admin/equipmentTypes/${deleteEqTypeId}`, {
        method: "DELETE",
      });
      if (resp.ok) {
        setEquipmentTypesList((prev) => prev.filter((t) => t.id !== deleteEqTypeId));
        setDeleteEqTypeId("");
        setIsDeleteEqTypeOpen(false);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const loadEquipmentList = async () => {
      try {
        const resp = await fetch("/api/admin/equipmentTypes");
        if (resp.ok) {
          const formatData: EquipmentType[] = await resp.json();
          setEquipmentTypesList(formatData);
        }
      } catch (error) {
        console.log(error);
      }
    };
    loadEquipmentList();
  }, []);

  const columns: Column<EquipmentType>[] = [
    {
      title: "Название",
      key: "name",
      render: (value) => <span className="font-medium">{value as string}</span>,
    },
    {
      title: "Описание",
      key: "description",
      render: (value) => <p className="max-w-96 truncate text-gray-400">{value as string || "—"}</p>,
    },
    {
      title: "Характеристики",
      key: "attributesSchema",
      render: (value) => {
        const schema = value as AttributeSchema[] | null;
        if (!schema || schema.length === 0) {
          return <span className="text-gray-400 text-sm">Нет</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {schema.slice(0, 3).map((field, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-600 dark:text-gray-400"
              >
                {fieldTypeIcons[field.type]}
                {field.label || field.name}
              </span>
            ))}
            {schema.length > 3 && (
              <span className="text-xs text-gray-400">+{schema.length - 3}</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Дата создания",
      key: "createdAt",
      render: (value) => <p>{formatDateTime(value as string, "full")}</p>,
    },
    {
      title: "Действия",
      key: "id",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div
            className="hover:bg-red-100 duration-300 text-red-500 cursor-pointer p-1 rounded-md"
            onClick={() => openDeleteModal(row.id)}
          >
            <Trash size={16} />
          </div>
          <div
            className="hover:bg-indigo-100 duration-300 text-indigo-500 cursor-pointer p-1 rounded-md"
            onClick={() => openEditModal(row.id)}
          >
            <Pencil size={16} />
          </div>
        </div>
      ),
    },
  ];

  const filteredEquipmentList = useMemo(() => {
    if (!search.trim()) return equipmentTypesList;
    return equipmentTypesList.filter((eq) =>
      eq.name.toLowerCase().includes(search.toLowerCase().trim())
    );
  }, [search, equipmentTypesList]);

  return (
    <main>
      <Block>
        <h1 className="text-xl font-semibold">Типы оборудования</h1>
        <p className="text-sm text-gray-400 mb-3">
          Здесь расположены типы оборудования, можете отредактировать существующие или добавить новые
        </p>
        <div className="flex">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            className="h-8 w-[400px]"
          />
          <div className="flex ml-3 mr-auto rounded-lg border overflow-hidden">
            <button
              className={`text-slate-600 p-1 px-1.5 hover:bg-gray-300/70 transition-colors duration-300 ${
                mode === "grid" ? "bg-gray-300/70" : ""
              }`}
              onClick={() => setMode("grid")}
            >
              <LayoutGrid strokeWidth={1.5} size={20} />
            </button>
            <button
              className={`text-slate-600 p-1 px-1.5 hover:bg-gray-300/70 transition-colors duration-300 ${
                mode === "table" ? "bg-gray-300/70" : ""
              }`}
              onClick={() => setMode("table")}
            >
              <TableIcon strokeWidth={1.5} size={20} />
            </button>
          </div>
          <Button className="ml-4" onClick={() => setIsCreateEqTypeOpen(true)}>
            <Plus size={16} />
            Добавить
          </Button>
        </div>

        {filteredEquipmentList.length > 0 ? (
          <div className="mt-6">
            {mode === "grid" ? (
              <Grid cols={3}>
                {filteredEquipmentList.map((eqT) => (
                  <Card key={eqT.id}>
                    <div className="flex justify-between">
                      <div>
                        <h1 className="text-gray-800 dark:text-white font-semibold">
                          {eqT.name}
                        </h1>
                        <p className="text-gray-400 text-xs mb-2 line-clamp-1">
                          {eqT.description || "Нет описания"}
                        </p>
                      </div>
                      <ContextMenu
                        items={[
                          {
                            label: "Редактировать",
                            icon: <Pencil size={14} />,
                            onClick: () => openEditModal(eqT.id),
                          },
                          {
                            label: "Удалить",
                            icon: <Trash size={14} />,
                            variant: "danger",
                            onClick: () => openDeleteModal(eqT.id),
                          },
                        ]}
                      />
                    </div>
                    <hr className="border-b-0 mb-3" />
                    {eqT.attributesSchema && eqT.attributesSchema.length > 0 ? (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                          Характеристики:
                        </p>
                        <div className="space-y-1.5">
                          {(eqT.attributesSchema as AttributeSchema[]).map((field, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                {fieldTypeIcons[field.type]}
                                <span className="font-medium">{field.label || field.name}:</span>
                              </span>
                              <span className="text-gray-400">
                                {field.type === "select"
                                  ? field.options?.join(", ")
                                  : field.type === "boolean"
                                  ? "Да/Нет"
                                  : field.type === "number"
                                  ? "Число"
                                  : "Текст"}
                                {field.unit && ` (${field.unit})`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Характеристик не добавлено</p>
                    )}
                  </Card>
                ))}
              </Grid>
            ) : (
              <Table columns={columns} data={filteredEquipmentList} keyExtractor={(row) => row.id} />
            )}
          </div>
        ) : (
          <EmptyBlock
            title={
              search
                ? "Такого типа оборудования не существует"
                : "Ни один тип оборудования пока еще не создан, исправьте это!"
            }
          />
        )}
      </Block>

      <EquipmentTypeModal
        isOpen={isCreateEqTypeOpen}
        onClose={() => setIsCreateEqTypeOpen(false)}
        setEquipmentTypesList={setEquipmentTypesList}
      />

      <EquipmentTypeModal
        isOpen={isEditEqTypeOpen}
        onClose={() => setIsEditEqTypeOpen(false)}
        setEquipmentTypesList={setEquipmentTypesList}
        initialData={editedEqType}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteEqTypeOpen}
        onClose={() => setIsDeleteEqTypeOpen(false)}
        onConfirm={handleDelete}
        title="Удалить тип оборудования?"
        description={<>Все единицы этого типа потеряют привязку к типу.</>}
        confirmText="Да, удалить"
        cancelText="Нет, оставить"
        isLoading={isDeleting}
      />
    </main>
  );
}