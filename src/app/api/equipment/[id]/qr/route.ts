import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipment } from "@/lib/db/schema/equipment";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const GET = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  
  const item = await db.query.equipment.findFirst({
    where: eq(equipment.id, id),
  });
  
  if (!item) {
    return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
  }
  
  // Формируем данные для QR-кода
  const qrData = JSON.stringify({
    type: "equipment",
    version: 1,
    id: item.id,
    inventoryNumber: item.inventoryNumber,
  });
  
  // Генерируем QR-код на лету
  const qrImage = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: "H",
  });
  
  return NextResponse.json({ qrImage, qrData });
}, ["admin", "laborant", "teacher"]);