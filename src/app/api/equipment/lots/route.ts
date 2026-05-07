import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipmentLots, EquipmentLotStatus } from "@/lib/db/schema";
import { createLotWithItems } from "@/lib/equipment/inventory";
import { NextResponse } from "next/server";
import { eq, desc, ilike, and } from "drizzle-orm";

export const GET = withAuth(async (req, ctx, user) => {
  const url = new URL(req.url);
  const search = url.searchParams.get("search");
  const typeId = url.searchParams.get("typeId");
  const status = url.searchParams.get("status");

  const conditions = [];

  if (search) conditions.push(ilike(equipmentLots.name, `%${search}%`));
  if (typeId) conditions.push(eq(equipmentLots.equipmentTypeId, typeId));
  if (status) conditions.push(eq(equipmentLots.status, status as EquipmentLotStatus));

  const lots = await db.query.equipmentLots.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: {
      equipmentType: true,
      acceptedBy: true,
      items: {
        with: {
          room: true,
        },
        limit: 5,
      },
    },
    orderBy: desc(equipmentLots.createdAt),
  });

  return NextResponse.json(lots);
}, ["admin", "laborant"]);

export const POST = withAuth(async (req, ctx, user) => {
  const body = await req.json();
  const {
    name,
    equipmentTypeId,
    quantity,
    supplier,
    invoiceNumber,
    unitPriceCents,
    roomId,
    responsibleId,
    baseAttributes,
  } = body;

  if (!name || !equipmentTypeId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Название, тип и количество обязательны" }, { status: 400 });
  }

  const result = await createLotWithItems({
    name,
    equipmentTypeId,
    quantity,
    supplier,
    invoiceNumber,
    unitPriceCents,
    acceptedById: user.userId,
    roomId,
    responsibleId,
    baseAttributes,
  });

  return NextResponse.json(result);
}, ["admin"]);