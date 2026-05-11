import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipment, EquipmentStatus } from "@/lib/db/schema";
import { generateInventoryNumber, generateQRCode } from "@/lib/equipment/inventory";
import { NextResponse } from "next/server";
import { eq, desc, and, ilike } from "drizzle-orm";
import { generateEquipmentQRCode } from "@/lib/equipment/qrcode";


export const GET = withAuth(async (req, ctx, user) => {
  const url = new URL(req.url);
  const search = url.searchParams.get("search");
  const typeId = url.searchParams.get("typeId");
  const roomId = url.searchParams.get("roomId");
  const status = url.searchParams.get("status");
  const lotId = url.searchParams.get("lotId");

  const conditions = [];

  if (search) conditions.push(ilike(equipment.name, `%${search}%`));
  if (typeId) conditions.push(eq(equipment.equipmentTypeId, typeId));
  if (roomId) conditions.push(eq(equipment.roomId, roomId));
  if (status) conditions.push(eq(equipment.status, status as EquipmentStatus));
  if (lotId) conditions.push(eq(equipment.lotId, lotId));

  const items = await db.query.equipment.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: {
      equipmentType: true,
      room: true,
      responsible: true,
      lot: true,
    },
    orderBy: desc(equipment.createdAt),
  });

  return NextResponse.json(items);
}, ["admin", "laborant"]);

export const POST = withAuth(async (req, ctx, user) => {
  const body = await req.json();
  const {
    name,
    equipmentTypeId,
    lotId,
    roomId,
    responsibleId,
    serialNumber,
    model,
    manufacturer,
    status,
    attributes,
    notes,
  } = body;

  if (!name || !equipmentTypeId) {
    return NextResponse.json({ error: "Название и тип оборудования обязательны" }, { status: 400 });
  }

  const inventoryNumber = await generateInventoryNumber();

  const [newEquipment] = await db
    .insert(equipment)
    .values({
      inventoryNumber,
      name,
      equipmentTypeId,
      lotId: lotId || null,
      roomId: roomId || null,
      responsibleId: responsibleId || null,
      serialNumber: serialNumber || null,
      model: model || null,
      manufacturer: manufacturer || null,
      status: status || "active",
      attributes: attributes || {},
      notes: notes || null,
    })
    .returning();
  console.log("New equipment ID:", newEquipment.id);

  // Генерируем QR-код на основе ID
  const qrCode = await generateEquipmentQRCode(newEquipment.id);
  // Обновляем запись
  await db
    .update(equipment)
    .set({ qrCode })
    .where(eq(equipment.id, newEquipment.id));
    
  const fullEquipment = await db.query.equipment.findFirst({
    where: eq(equipment.id, newEquipment.id),
    with: {
      equipmentType: true,
      room: true,
      responsible: true,
      lot: true,
    },
  });

  return NextResponse.json(fullEquipment);
}, ["admin", "laborant"]);