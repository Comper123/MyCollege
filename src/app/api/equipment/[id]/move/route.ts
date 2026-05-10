import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipment, equipmentMovements } from "@/lib/db/schema/equipment";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const { toRoomId, reason } = body;

  if (!toRoomId) {
    return NextResponse.json({ error: "Укажите целевой кабинет" }, { status: 400 });
  }

  if (!reason?.trim()) {
    return NextResponse.json({ error: "Укажите причину перемещения" }, { status: 400 });
  }

  try {
    // Получаем текущее оборудование
    const currentEquipment = await db.query.equipment.findFirst({
      where: eq(equipment.id, id),
      with: {
        room: true,
      },
    });

    if (!currentEquipment) {
      return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
    }

    const fromRoomId = currentEquipment.roomId;
    const fromRoomNumber = currentEquipment.room?.number;

    // Проверяем, что целевой кабинет существует
    const targetRoom = await db.query.rooms.findFirst({
      where: (rooms, { eq }) => eq(rooms.id, toRoomId),
    });

    if (!targetRoom) {
      return NextResponse.json({ error: "Целевой кабинет не найден" }, { status: 404 });
    }

    // Создаём запись о перемещении
    await db.insert(equipmentMovements).values({
      equipmentId: id,
      fromRoomId: fromRoomId,
      toRoomId: toRoomId,
      movedById: user.userId,
      reason: reason.trim(),
      movedAt: new Date(),
    });

    // Обновляем текущее местоположение оборудования
    const [updatedEquipment] = await db
      .update(equipment)
      .set({
        roomId: toRoomId,
        updatedAt: new Date(),
      })
      .where(eq(equipment.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      equipment: updatedEquipment,
      movement: {
        fromRoom: fromRoomNumber,
        toRoom: targetRoom.number,
        reason: reason.trim(),
        movedBy: user.userId,
        movedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error moving equipment:", error);
    return NextResponse.json({ error: "Ошибка при перемещении оборудования" }, { status: 500 });
  }
}, ["admin", "laborant"]);