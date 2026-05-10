import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { rooms } from "@/lib/db/schema";
import { equipment } from "@/lib/db/schema/equipment";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, ctx, user) => {
  try {
    // Для преподавателей - показываем оборудование в их кабинетах
    if (user.role === "teacher") {
      // Находим кабинеты, где пользователь является ответственным преподавателем
      const teacherRooms = await db.query.rooms.findMany({
        where: eq(rooms.attached_teacher, user.userId),
        columns: { id: true },
      });

      const roomIds = teacherRooms.map(r => r.id);

      if (roomIds.length === 0) {
        return NextResponse.json([]);
      }

      // Получаем оборудование в этих кабинетах
      const equipmentList = await db.query.equipment.findMany({
        where: inArray(equipment.roomId, roomIds),
        with: {
          equipmentType: true,
          room: true,
          responsible: true,
        },
        orderBy: (eq, { desc }) => [desc(eq.createdAt)],
      });

      return NextResponse.json(equipmentList);
    }

    // Для админов и лаборантов - всё оборудование
    const equipmentList = await db.query.equipment.findMany({
      with: {
        equipmentType: true,
        room: true,
        responsible: true,
      },
      orderBy: (eq, { desc }) => [desc(eq.createdAt)],
    });

    return NextResponse.json(equipmentList);
  } catch (error) {
    console.error("Error fetching my equipment:", error);
    return NextResponse.json({ error: "Ошибка загрузки оборудования" }, { status: 500 });
  }
}, ["admin", "laborant", "teacher"]);