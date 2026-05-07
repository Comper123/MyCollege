import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipment, equipmentMovements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;

  const item = await db.query.equipment.findFirst({
    where: eq(equipment.id, id),
    with: {
      equipmentType: true,
      room: true,
      responsible: true,
      lot: true,
      movements: {
        with: {
          fromRoom: true,
          toRoom: true,
          movedBy: true,
        },
        orderBy: (movements, { desc }) => [desc(movements.movedAt)],
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
  }

  return NextResponse.json(item);
}, ["admin", "laborant"]);

export const PATCH = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const { name, roomId, responsibleId, serialNumber, model, manufacturer, status, attributes, notes } = body;

  // Проверяем, меняется ли комната
  const oldEquipment = await db.query.equipment.findFirst({
    where: eq(equipment.id, id),
    columns: { roomId: true },
  });

  const [updated] = await db
    .update(equipment)
    .set({
      name,
      roomId,
      responsibleId,
      serialNumber,
      model,
      manufacturer,
      status,
      attributes,
      notes,
      updatedAt: new Date(),
    })
    .where(eq(equipment.id, id))
    .returning();

  // Если комната изменилась — записываем перемещение
  if (oldEquipment && oldEquipment.roomId !== roomId && roomId !== undefined) {
    await db.insert(equipmentMovements).values({
      equipmentId: id,
      fromRoomId: oldEquipment.roomId,
      toRoomId: roomId,
      movedById: user.userId,
      reason: body.moveReason || "Изменение местоположения",
      movedAt: new Date(),
    });
  }

  const fullEquipment = await db.query.equipment.findFirst({
    where: eq(equipment.id, id),
    with: {
      equipmentType: true,
      room: true,
      responsible: true,
      lot: true,
    },
  });

  return NextResponse.json(fullEquipment);
}, ["admin", "laborant"]);

export const DELETE = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;

  await db.delete(equipment).where(eq(equipment.id, id));

  return NextResponse.json({ success: true });
}, ["admin"]);