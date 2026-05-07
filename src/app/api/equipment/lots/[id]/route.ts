import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipmentLots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;

  const lot = await db.query.equipmentLots.findFirst({
    where: eq(equipmentLots.id, id),
    with: {
      equipmentType: true,
      acceptedBy: true,
      items: {
        with: {
          room: true,
          responsible: true,
        },
      },
    },
  });

  if (!lot) {
    return NextResponse.json({ error: "Партия не найдена" }, { status: 404 });
  }

  return NextResponse.json(lot);
}, ["admin", "laborant"]);

export const PATCH = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const { name, supplier, invoiceNumber, unitPriceCents, status } = body;

  const [updated] = await db
    .update(equipmentLots)
    .set({
      name,
      supplier,
      invoiceNumber,
      unitPriceCents,
      status,
      updatedAt: new Date(),
    })
    .where(eq(equipmentLots.id, id))
    .returning();

  return NextResponse.json(updated);
}, ["admin"]);

export const DELETE = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;

  // Проверяем, есть ли оборудование в партии
  const lot = await db.query.equipmentLots.findFirst({
    where: eq(equipmentLots.id, id),
    with: { items: { limit: 1 } },
  });

  if (lot && lot.items.length > 0) {
    return NextResponse.json({ error: "Нельзя удалить партию с оборудованием" }, { status: 400 });
  }

  await db.delete(equipmentLots).where(eq(equipmentLots.id, id));

  return NextResponse.json({ success: true });
}, ["admin"]);