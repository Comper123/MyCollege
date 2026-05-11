import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipment } from "@/lib/db/schema/equipment";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { parseQRCodeData } from "@/lib/equipment/qrcode";

export const GET = withAuth(async (req, ctx, user) => {
  const url = new URL(req.url);
  const inventoryNumber = url.searchParams.get("inventoryNumber");
  const qrData = url.searchParams.get("qrData");

  try {
    let equipmentId = null;

    // Если передан QR-код как строка
    if (qrData) {
      const parsed = parseQRCodeData(qrData);
      if (parsed && parsed.type === "equipment") {
        equipmentId = parsed.id;
      }
    }
    
    // Если передан инвентарный номер (старый формат)
    if (!equipmentId && inventoryNumber) {
      const item = await db.query.equipment.findFirst({
        where: eq(equipment.inventoryNumber, inventoryNumber),
        columns: { id: true },
      });
      if (item) {
        equipmentId = item.id;
      }
    }

    if (!equipmentId) {
      return NextResponse.json(
        { error: "Оборудование не найдено" },
        { status: 404 }
      );
    }

    const item = await db.query.equipment.findFirst({
      where: eq(equipment.id, equipmentId),
      with: {
        equipmentType: true,
        room: true,
        responsible: true,
        lot: true,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error searching equipment:", error);
    return NextResponse.json(
      { error: "Ошибка при поиске оборудования" },
      { status: 500 }
    );
  }
}, ["admin", "laborant", "teacher"]);