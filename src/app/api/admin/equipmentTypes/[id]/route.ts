import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipmentTypes } from "@/lib/db/schema/equipment";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const type = await db.query.equipmentTypes.findFirst({
    where: eq(equipmentTypes.id, id),
  });

  if (!type) {
    return NextResponse.json({ error: "Тип не найден" }, { status: 404 });
  }

  return NextResponse.json(type);
}, ["admin"]);

export const PUT = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const { name, description, attributesSchema } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  }

  // Проверка на уникальность (исключая текущий)
  const existing = await db.query.equipmentTypes.findFirst({
    where: (types, { eq, and, ne }) => and(
      eq(types.name, name.trim()),
      ne(types.id, id)
    ),
  });

  if (existing) {
    return NextResponse.json({ error: "Тип с таким названием уже существует" }, { status: 400 });
  }

  const [updated] = await db
    .update(equipmentTypes)
    .set({
      name: name.trim(),
      description: description || null,
      attributesSchema: attributesSchema || [],
    })
    .where(eq(equipmentTypes.id, id))
    .returning();

  return NextResponse.json(updated);
}, ["admin"]);

export const DELETE = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;

  // Проверка, есть ли оборудование этого типа
  const equipment = await db.query.equipment.findFirst({
    where: (eq, { eq: eqFn }) => eqFn(eq.equipmentTypeId, id),
  });

  if (equipment) {
    return NextResponse.json(
      { error: "Нельзя удалить тип, у которого есть оборудование" },
      { status: 400 }
    );
  }

  await db.delete(equipmentTypes).where(eq(equipmentTypes.id, id));

  return NextResponse.json({ success: true });
}, ["admin"]);