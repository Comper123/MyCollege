import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipment } from "@/lib/db/schema/equipment";
import { rooms } from "@/lib/db/schema/place";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, ctx, user) => {
  if (user.role !== "teacher") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  try {
    // Находим кабинеты преподавателя
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
  } catch (error) {
    console.error("Error fetching teacher equipment:", error);
    return NextResponse.json({ error: "Ошибка загрузки оборудования" }, { status: 500 });
  }
}, ["teacher"]);