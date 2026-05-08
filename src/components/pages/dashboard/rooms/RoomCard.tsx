"use client";

import { FullRoom } from "@/types/rooms";
import { fio } from "@/lib/db/schema";
import { Building2, User, UserCog, FileText, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface RoomCardProps {
  room: FullRoom;
}

export default function RoomCard({ room }: RoomCardProps) {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(`/dashboard/rooms/${room.id}`)}
      className="group cursor-pointer border rounded-xl p-5 bg-white dark:bg-gray-800/50 hover:shadow-lg transition-all duration-200 hover:border-indigo-200 dark:hover:border-indigo-800"
    >
      {/* Заголовок */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
            <Building2 size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Кабинет {room.number}
            </h3>
          </div>
        </div>
      </div>

      {/* Описание */}
      {room.description && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
          <div className="flex items-start gap-2">
            <FileText size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {room.description}
            </p>
          </div>
        </div>
      )}

      {/* Ответственные */}
      <div className="space-y-2">
        {room.attachedTeacher && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <User size={12} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-gray-600 dark:text-gray-400">Преподаватель:</span>
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {fio(room.attachedTeacher)}
            </span>
          </div>
        )}
        
        {room.attachedLaborant && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <UserCog size={12} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-gray-600 dark:text-gray-400">Лаборант:</span>
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {fio(room.attachedLaborant)}
            </span>
          </div>
        )}

        {!room.attachedTeacher && !room.attachedLaborant && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin size={14} />
            <span>Нет назначенных ответственных</span>
          </div>
        )}
      </div>

      {/* Статистика оборудования (если добавить) */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Оборудования:</span>
          <span className="font-medium text-gray-900 dark:text-white">0 ед.</span>
        </div>
      </div>
    </div>
  );
}