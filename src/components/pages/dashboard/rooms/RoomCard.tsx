'use client';

import Card from "@/components/ui/forms/Card";
import { Room } from "@/lib/db/schema";

interface RoomCardProps {
  room: Room
}

export default function RoomCard({ room } : RoomCardProps){
  return (
    <Card key={eqT.id}>
      <div className="flex justify-between">
        <div>
          <h1 className="text-gray-800 font-semibold">{eqT.name}</h1>
          <p className="text-gray-400 text-xs mb-2 line-clamp-1">{eqT.description || "Нет описания"}</p>
        </div>
        <ContextMenu items={[
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
        ]} />
      </div>
      <hr className="border-b-0 mb-2"/>
      {eqT.attributesSchema && eqT.attributesSchema?.length > 0 ? (
        <div className="">
          {/* Список характеристик типа оборудования */}
          <p className="text-gray-600 text-sm font-medium">Характеристики:</p>
          {eqT.attributesSchema.slice(0, 3).map((field, i) => (
            <div key={i} className="flex items-center mb-1">
              <span className="rounded-full aspect-square h-4 bg-gray-200 p-0.5 text-xs text-gray-600 mr-1 flex items-center justify-center">{i + 1}</span>
              <p className="text-gray-400 text-xs"> {(field as CustomField).name}</p>
            </div>
          ))}
          {eqT.attributesSchema?.length > 3 && (
            <p className="text-gray-400 text-xs -mt-1">И еще + {eqT.attributesSchema?.length - 3}</p>
          )}
        </div>
      ) : (
        <p className="text-gray-600 text-sm font-medium">Характеристик не загружено</p>
      )}
    </Card>
  )   
}