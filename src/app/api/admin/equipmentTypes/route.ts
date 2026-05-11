import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipmentTypes } from "@/lib/db/schema/equipment";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export const GET = withAuth(async (req, ctx, user) => {
  const types = await db.query.equipmentTypes.findMany({
    orderBy: (types, { desc }) => [desc(types.createdAt)],
  });
  return NextResponse.json(types);
}, ["admin", "laborant"]);

export const POST = withAuth(async (req, ctx, user) => {
  const body = await req.json();
  const { name, description, attributesSchema } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  }

  // Проверка на уникальность
  const existing = await db.query.equipmentTypes.findFirst({
    where: eq(equipmentTypes.name, name.trim()),
  });

  if (existing) {
    return NextResponse.json({ error: "Тип с таким названием уже существует" }, { status: 400 });
  }

  const [newType] = await db
    .insert(equipmentTypes)
    .values({
      name: name.trim(),
      description: description || null,
      attributesSchema: attributesSchema || [],
    })
    .returning();

  return NextResponse.json(newType);
}, ["admin"]);