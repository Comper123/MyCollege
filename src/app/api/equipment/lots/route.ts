import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipment, equipmentLots, EquipmentLotStatus } from "@/lib/db/schema";
import { generateQRCode } from "@/lib/equipment/inventory";
import { NextResponse } from "next/server";
import { eq, desc, ilike, and, sql } from "drizzle-orm";

export const GET = withAuth(async (req) => {
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

  // Валидация
  if (!name?.trim()) {
    return NextResponse.json({ error: "Название партии обязательно" }, { status: 400 });
  }
  if (!equipmentTypeId) {
    return NextResponse.json({ error: "Тип оборудования обязателен" }, { status: 400 });
  }
  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: "Количество должно быть не менее 1" }, { status: 400 });
  }

  try {
    // Используем транзакцию для атомарного создания
    const result = await db.transaction(async (tx) => {
      // Получаем количество партий для генерации номера
      const lotCountResult = await tx.execute(sql`SELECT COUNT(*) as count FROM equipment_lot`);
      const lotCount = parseInt((lotCountResult.rows[0] as any).count, 10);
      const year = new Date().getFullYear();
      const lotNumber = `LOT-${year}-${String(lotCount + 1).padStart(3, "0")}`;

      // Создаём партию
      const [lot] = await tx
        .insert(equipmentLots)
        .values({
          lotNumber,
          name: name.trim(),
          equipmentTypeId,
          quantity,
          supplier: supplier?.trim() || null,
          invoiceNumber: invoiceNumber?.trim() || null,
          unitPriceCents: unitPriceCents ? parseInt(String(unitPriceCents)) : null,
          acceptedById: user.userId,
          acceptedAt: new Date(),
          status: "accepted",
        })
        .returning();

      // Создаём все единицы оборудования
      // Инвентарные номера генерируются автоматически через DEFAULT
      const items = [];
      for (let i = 0; i < quantity; i++) {
        const qrCode = await generateQRCode(`temp-${Date.now()}-${i}`); // Временный QR
        
        const [item] = await tx
          .insert(equipment)
          .values({
            lotId: lot.id,
            equipmentTypeId,
            name: name.trim(),
            roomId: roomId || null,
            responsibleId: responsibleId || null,
            attributes: baseAttributes || {},
            status: "active",
            qrCode,
          })
          .returning();
        
        items.push(item);
      }

      return { lot, items };
    });

    // Загружаем полную информацию о партии
    const fullLot = await db.query.equipmentLots.findFirst({
      where: (lots, { eq }) => eq(lots.id, result.lot.id),
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

    return NextResponse.json(fullLot, { status: 201 });
  } catch (error: any) {
    console.error("Error creating lot:", error);
    
    if (error.code === '23505') {
      return NextResponse.json({ 
        error: "Ошибка генерации инвентарных номеров. Пожалуйста, попробуйте снова." 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: error.message || "Ошибка при создании партии" 
    }, { status: 500 });
  }
}, ["admin"]);