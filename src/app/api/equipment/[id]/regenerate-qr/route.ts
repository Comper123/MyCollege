import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipment } from "@/lib/db/schema/equipment";
import { generateEquipmentQRCode, parseQRCodeData } from "@/lib/equipment/qrcode";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const POST = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  
  // Получаем оборудование
  const item = await db.query.equipment.findFirst({
    where: eq(equipment.id, id),
  });
  
  if (!item) {
    return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
  }
  
  // Генерируем новый QR-код
  const qrCode = await generateEquipmentQRCode(item.id);
  console.log(parseQRCodeData(qrCode));
  
  // Обновляем запись
  await db.update(equipment)
    .set({ qrCode })
    .where(eq(equipment.id, id));
  
  return NextResponse.json({ success: true });
}, ["admin", "laborant"]);