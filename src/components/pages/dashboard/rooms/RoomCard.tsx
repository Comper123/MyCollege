"use client";

import Card from "@/components/ui/forms/Card";
import { FullRoom } from "@/types/rooms";

interface RoomCardProps {
  room: FullRoom;
}

export default function RoomCard({ room }: RoomCardProps) {
  return (
    <Card>
      <div className="flex justify-between">
        <div>
          {/* Номер кабинета */}
          <h1 className="text-gray-800 font-semibold">
            Кабинет {room.number}
          </h1>

          {/* Описание */}
          <p className="text-gray-400 text-xs mb-2 line-clamp-1">
            {room.description || "Нет описания"}
          </p>
        </div>
      </div>

      <hr className="border-b-0 mb-2" />

      <div className="flex flex-col gap-1 text-sm">
        {/* Преподаватель */}
        <div>
          <span className="text-gray-600 font-medium">Преподаватель: </span>
          <span className="text-gray-400">
            {room.attachedTeacher
              ? `${room.attachedTeacher.lastname} ${room.attachedTeacher.firstname}`
              : "Не назначен"}
          </span>
        </div>

        {/* Лаборант */}
        <div>
          <span className="text-gray-600 font-medium">Лаборант: </span>
          <span className="text-gray-400">
            {room.attachedLaborant
              ? `${room.attachedLaborant.lastname} ${room.attachedLaborant.firstname}`
              : "Не назначен"}
          </span>
        </div>
      </div>
    </Card>
  );
}