"use client";

import { useEffect, useState } from "react";
import { 
  Package, 
  DoorOpen, 
  Inbox, 
  Users, 
  TrendingUp,
  Calendar,
  RefreshCw
} from "lucide-react";
import { DashboardStats, ActivityItem, EquipmentStatusData, RequestTrendData } from "@/types/dashboard";
import { useRouter } from "next/navigation";
import StatCard from "@/components/analytic/StatCard";
import PieChart from "@/components/analytic/PieChart";
import TopList from "@/components/analytic/TopList";
import LineChart from "@/components/analytic/LineChart";
import ActivityList from "@/components/analytic/ActivityList";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  if (user?.role === "teacher") router.push("/dashboard/teacher");
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [equipmentStatusData, setEquipmentStatusData] = useState<EquipmentStatusData[]>([]);
  const [trendData, setTrendData] = useState<RequestTrendData[]>([]);
  const [topRooms, setTopRooms] = useState<{ id: string; name: string; value: number }[]>([]);
  const [topTypes, setTopTypes] = useState<{ id: string; name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Загрузка статистики
      const statsResp = await fetch("/api/dashboard/stats");
      if (statsResp.ok) {
        const data = await statsResp.json();
        setStats(data.stats);
        setEquipmentStatusData(data.equipmentStatus);
        setTrendData(data.requestTrend);
        setTopRooms(data.topRooms);
        setTopTypes(data.topEquipmentTypes);
        setActivities(data.activities);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <main className="w-full h-full">
      {/* Заголовок */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Панель управления</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Общая аналитика и статистика системы
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Оборудование"
          value={stats?.totalEquipment || 0}
          icon={<Package size={20} />}
          color="indigo"
          description={`${stats?.activeEquipment || 0} в эксплуатации`}
        />
        <StatCard
          title="Кабинеты"
          value={stats?.totalRooms || 0}
          icon={<DoorOpen size={20} />}
          color="emerald"
          description={`${stats?.occupiedRooms || 0} оборудовано`}
        />
        <StatCard
          title="Заявки"
          value={stats?.totalRequests || 0}
          icon={<Inbox size={20} />}
          color="amber"
          description={`${stats?.pendingRequests || 0} ожидают`}
        />
        <StatCard
          title="Пользователи"
          value={stats?.totalUsers || 0}
          icon={<Users size={20} />}
          color="blue"
          description={`${stats?.activeUsers || 0} активных`}
        />
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Состояние оборудования */}
        <div className="bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package size={18} className="text-indigo-500" />
            Состояние оборудования
          </h2>
          {equipmentStatusData.length > 0 ? (
            <PieChart
              data={{
                labels: equipmentStatusData.map(s => s.status),
                values: equipmentStatusData.map(s => s.count),
                colors: equipmentStatusData.map(s => s.color),
              }}
              height={200}
            />
          ) : (
            <div className="text-center py-8 text-gray-400">Нет данных</div>
          )}
        </div>

        {/* Динамика заявок */}
        <div className="bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            Динамика заявок
          </h2>
          {trendData.length > 0 ? (
            <LineChart
              data={{
                labels: trendData.map(t => t.date),
                datasets: [
                  { label: "Создано", data: trendData.map(t => t.created), borderColor: "#603EF9" },
                  { label: "Выполнено", data: trendData.map(t => t.completed), borderColor: "#10B981" },
                ],
              }}
              height={200}
            />
          ) : (
            <div className="text-center py-8 text-gray-400">Нет данных</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Топ кабинетов по оборудованию */}
        <div className="bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <DoorOpen size={16} className="text-emerald-500" />
            Топ кабинетов по оборудованию
          </h2>
          <TopList
            items={topRooms.map(room => ({ ...room, name: `Кабинет ${room.name}`, unit: "ед" }))}
            valueLabel="ед"
          />
        </div>

        {/* Топ типов оборудования */}
        <div className="bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Package size={16} className="text-purple-500" />
            Популярные типы оборудования
          </h2>
          <TopList
            items={topTypes.map(type => ({ ...type, unit: "шт" }))}
            valueLabel="шт"
          />
        </div>

        {/* Последняя активность */}
        <div className="bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-orange-500" />
            Последняя активность
          </h2>
          <ActivityList activities={activities} isLoading={isLoading} />
        </div>
      </div>

      {/* Секция быстрых действий */}
      <div className="mt-6">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-200 dark:border-indigo-800 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Быстрые действия</h2>
          <div className="flex flex-wrap gap-3">
            <QuickActionButton href="/dashboard/equipment" icon={<Package size={16} />} label="Добавить оборудование" />
            <QuickActionButton href="/dashboard/equipment/lots" icon={<Inbox size={16} />} label="Создать партию" />
            <QuickActionButton href="/dashboard/requests" icon={<Inbox size={16} />} label="Просмотреть заявки" />
            <QuickActionButton href="/dashboard/scan" icon={<Package size={16} />} label="Сканировать QR" />
          </div>
        </div>
      </div>
    </main>
  );
}

function QuickActionButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
    >
      {icon}
      {label}
    </button>
  );
}