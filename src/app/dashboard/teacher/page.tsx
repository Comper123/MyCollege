"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Block } from "@/components/blocks/Block";
import { Package, DoorOpen, Wrench, AlertTriangle, Calendar } from "lucide-react";
import Link from "next/link";

interface EquipmentStats {
  total_equipment: number;
  active_count: number;
  maintenance_count: number;
  broken_count: number;
  rooms_count: number;
}

interface MaintenanceRecommendation {
  equipment_id: string;
  equipment_name: string;
  inventory_number: string;
  equipment_type: string | null;
  room_number: string | null;
  warranty_expires_in_days: number | null;
  recommendation: string;
  priority: number;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<EquipmentStats | null>(null);
  const [recommendations, setRecommendations] = useState<MaintenanceRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch("/api/dashboard/teacher/stats");
        if (!response.ok) {
          throw new Error("Ошибка загрузки данных");
        }
        
        const data = await response.json();
        setStats(data.stats);
        setRecommendations(data.recommendations || []);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Не удалось загрузить данные");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  const getPriorityStyle = (priority: number) => {
    switch (priority) {
      case 1: return { bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800" };
      case 2: return { bg: "bg-orange-50 dark:bg-orange-950/20", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" };
      case 3: return { bg: "bg-yellow-50 dark:bg-yellow-950/20", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-800" };
      case 4: return { bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" };
      default: return { bg: "bg-gray-50 dark:bg-gray-800/30", text: "text-gray-500 dark:text-gray-400", border: "border-gray-200 dark:border-gray-700" };
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "Критический";
      case 2: return "Срочный";
      case 3: return "Важный";
      case 4: return "Обычный";
      default: return "Низкий";
    }
  };

  if (isLoading) {
    return (
      <main className="w-full h-full">
        <Block>
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg"
            >
              Попробовать снова
            </button>
          </div>
        </Block>
      </main>
    );
  }

  return (
    <main className="w-full h-full">
      <Block>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Панель преподавателя
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Добро пожаловать, {user?.firstname} {user?.lastname}
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800/30 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Всего оборудования</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.total_equipment || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                <Package size={20} className="text-indigo-500" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/30 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Мои кабинеты</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.rooms_count || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <DoorOpen size={20} className="text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/30 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">На обслуживании</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats?.maintenance_count || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                <Wrench size={20} className="text-amber-500" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/30 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Неисправно</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats?.broken_count || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Рекомендации по обслуживанию */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-500" />
              Рекомендации по обслуживанию
            </h2>
            <div className="space-y-3">
              {recommendations.slice(0, 5).map((rec) => {
                const style = getPriorityStyle(rec.priority);
                return (
                  <Link
                    key={rec.equipment_id}
                    href={`/dashboard/equipment/${rec.equipment_id}`}
                    className={`block p-4 rounded-xl border ${style.border} ${style.bg} hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                            {getPriorityLabel(rec.priority)}
                          </span>
                          <span className="text-xs text-gray-500">{rec.inventory_number}</span>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{rec.equipment_name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.recommendation}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>Тип: {rec.equipment_type || "Не указан"}</span>
                          {rec.room_number && <span>Кабинет: {rec.room_number}</span>}
                          {rec.warranty_expires_in_days !== null && rec.warranty_expires_in_days > 0 && (
                            <span className="text-amber-600">Гарантия: {rec.warranty_expires_in_days} дней</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Быстрые действия */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border rounded-xl p-5 bg-white dark:bg-gray-800/30">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              Быстрые действия
            </h2>
            <div className="space-y-2">
              <Link
                href="/dashboard/my-equipment"
                className="block text-indigo-600 hover:text-indigo-700 text-sm"
              >
                → Просмотреть моё оборудование
              </Link>
              <Link
                href="/dashboard/requests?my=true"
                className="block text-indigo-600 hover:text-indigo-700 text-sm"
              >
                → Мои заявки на ремонт
              </Link>
              <Link
                href="/dashboard/scan"
                className="block text-indigo-600 hover:text-indigo-700 text-sm"
              >
                → Сканировать QR-код
              </Link>
            </div>
          </div>

          <div className="border rounded-xl p-5 bg-white dark:bg-gray-800/30">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              Полезная информация
            </h2>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Вы можете создавать заявки на ремонт оборудования</li>
              <li>{`• Отслеживайте статус ваших заявок в разделе "Мои заявки"`}</li>
              <li>{`• Для срочных проблем используйте приоритет "Срочный"`}</li>
              <li>• QR-коды на оборудовании помогут быстро найти его в системе</li>
            </ul>
          </div>
        </div>
      </Block>
    </main>
  );
}