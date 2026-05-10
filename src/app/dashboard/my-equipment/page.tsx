"use client";

import { useEffect, useState } from "react";
import { Block } from "@/components/blocks/Block";
import { FullEquipment } from "@/types/equipment";
import Grid from "@/components/ui/Grid";
import SearchInput from "@/components/ui/SearchInput";
import Button from "@/components/ui/Button";
import { Loader2, Package, Wrench, AlertCircle } from "lucide-react";
import RequestModal from "@/components/pages/dashboard/requests/RequestModal";
import { useAuth } from "@/context/AuthContext";
import EquipmentCard from "@/components/pages/dashboard/equipment/EquipmentCard";

export default function MyEquipmentPage() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<FullEquipment[]>([]);
  const [filtered, setFiltered] = useState<FullEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<FullEquipment | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const loadEquipment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/teacher/equipment");
      if (resp.ok) {
        const data = await resp.json();
        setEquipment(data);
        setFiltered(data);
      } else {
        const errorData = await resp.json();
        setError(errorData.error || "Ошибка загрузки оборудования");
      }
    } catch (error) {
      console.error("Error loading equipment:", error);
      setError("Ошибка сети при загрузке оборудования");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "teacher") {
      loadEquipment();
    }
  }, [user]);

  useEffect(() => {
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      setFiltered(
        equipment.filter(
          (eq) =>
            eq.name.toLowerCase().includes(lowerSearch) ||
            eq.inventoryNumber.toLowerCase().includes(lowerSearch) ||
            eq.equipmentType?.name.toLowerCase().includes(lowerSearch)
        )
      );
    } else {
      setFiltered(equipment);
    }
  }, [search, equipment]);

  const handleRequestRepair = (eq: FullEquipment) => {
    setSelectedEquipment(eq);
    setIsRequestModalOpen(true);
  };

  if (user?.role !== "teacher") {
    return (
      <main className="w-full h-full">
        <Block>
          <div className="text-center py-16">
            <Package size={48} className="mx-auto mb-3 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Доступ ограничен
            </h2>
            <p className="text-gray-500 mt-1">
              Эта страница доступна только преподавателям
            </p>
          </div>
        </Block>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="w-full h-full">
        <Block>
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
          </div>
        </Block>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full h-full">
        <Block>
          <div className="text-center py-16">
            <AlertCircle size={48} className="mx-auto mb-3 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Ошибка загрузки
            </h2>
            <p className="text-gray-500 mt-1">{error}</p>
            <Button onClick={loadEquipment} className="mt-4" variant="secondary">
              Повторить
            </Button>
          </div>
        </Block>
      </main>
    );
  }

  return (
    <main className="w-full h-full">
      <Block>
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Моё оборудование
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Оборудование в кабинетах, за которые вы отвечаете
              </p>
            </div>
            <div className="text-sm bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg">
              Всего: {filtered.length} ед.
            </div>
          </div>
        </div>

        <div className="mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            placeholder="Поиск по названию, инвентарному номеру или типу..."
            className="w-full md:w-96"
          />
        </div>

        {filtered.length > 0 ? (
          <Grid cols={3}>
            {filtered.map((item) => (
              <div key={item.id} className="relative group">
                <EquipmentCard
                  equipment={item}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onRequestRepair={() => handleRequestRepair(item)}
                />
              </div>
            ))}
          </Grid>
        ) : (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto mb-3 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Нет оборудования
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {search
                ? "Попробуйте изменить параметры поиска"
                : "За вами не закреплено ни одного кабинета с оборудованием"}
            </p>
          </div>
        )}

        <RequestModal
          isOpen={isRequestModalOpen}
          onClose={() => {
            setIsRequestModalOpen(false);
            setSelectedEquipment(null);
          }}
          equipment={selectedEquipment}
          onSuccess={() => {
            setIsRequestModalOpen(false);
            setSelectedEquipment(null);
          }}
        />
      </Block>
    </main>
  );
}