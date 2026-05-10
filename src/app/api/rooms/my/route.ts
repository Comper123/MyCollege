import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { rooms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, ctx, user) => {
  try {
    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const myRooms = await db.query.rooms.findMany({
      where: eq(rooms.attached_teacher, user.userId),
      with: {
        attachedLaborant: true,
        attachedTeacher: true,
      },
    });

    // Добавляем оборудование для каждого кабинета отдельно, чтобы избежать ошибок
    const roomsWithEquipment = await Promise.all(
      myRooms.map(async (room) => {
        const equipment = await db.query.equipment.findMany({
          where: (eq, { eq: eqFn }) => eqFn(eq.roomId, room.id),
          with: {
            equipmentType: true,
          },
          limit: 5,
        });
        return { ...room, equipment };
      })
    );

    return NextResponse.json(roomsWithEquipment);
  } catch (error) {
    console.error("Error fetching my rooms:", error);
    return NextResponse.json({ error: "Ошибка загрузки кабинетов" }, { status: 500 });
  }
}, ["teacher"]);