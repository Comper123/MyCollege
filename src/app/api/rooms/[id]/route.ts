import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { rooms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, id),
    with: {
      attachedLaborant: true,
      attachedTeacher: true,
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Кабинет не найден" }, { status: 404 });
  }

  return NextResponse.json(room);
}, ["admin", "laborant", "teacher"]);

export const PATCH = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const { number, description, teacher_id, laborant_id } = body;

  if (!number?.trim()) {
    return NextResponse.json({ error: "Номер кабинета обязателен" }, { status: 400 });
  }

  const [updated] = await db
    .update(rooms)
    .set({
      number: number.trim(),
      description: description || null,
      attached_teacher: teacher_id || null,
      attached_lab: laborant_id || null,
    })
    .where(eq(rooms.id, id))
    .returning();

  const fullRoom = await db.query.rooms.findFirst({
    where: eq(rooms.id, updated.id),
    with: {
      attachedLaborant: true,
      attachedTeacher: true,
    },
  });

  return NextResponse.json(fullRoom);
}, ["admin"]);

export const DELETE = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;

  // Проверяем, есть ли оборудование в кабинете
  const equipment = await db.query.equipment.findFirst({
    where: (eq, { eq: eqFn }) => eqFn(eq.roomId, id),
  });

  if (equipment) {
    return NextResponse.json(
      { error: "Нельзя удалить кабинет, в котором есть оборудование" },
      { status: 400 }
    );
  }

  await db.delete(rooms).where(eq(rooms.id, id));

  return NextResponse.json({ success: true });
}, ["admin"]);