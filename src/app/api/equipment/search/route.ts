import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipment } from "@/lib/db/schema/equipment";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, ctx, user) => {
  const url = new URL(req.url);
  const inventoryNumber = url.searchParams.get("inventoryNumber");

  if (!inventoryNumber) {
    return NextResponse.json({ error: "Инвентарный номер обязателен" }, { status: 400 });
  }

  const item = await db.query.equipment.findFirst({
    where: eq(equipment.inventoryNumber, inventoryNumber),
    with: {
      equipmentType: true,
      room: true,
      responsible: true,
      lot: true,
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
  }

  return NextResponse.json(item);
}, ["admin", "laborant", "teacher"]);