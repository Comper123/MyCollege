import { db } from "@/lib/db/db";
import { sql } from "drizzle-orm";

// ─── Генерация инвентарного номера ───────────────────────────────────────────
// Формат: INV-2024-0000000042

export async function generateInventoryNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Извлекаем максимальное числовое значение суффикса
  const result = await db.execute(sql`
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(inventory_number FROM '\\d+$') AS INTEGER)), 
      0
    ) as max_seq
    FROM equipment
    WHERE inventory_number LIKE ${prefix + '%'}
  `);
  
  const maxSeq = parseInt(result.rows[0].max_seq as string, 10);
  const nextSeq = maxSeq + 1;
  
  return `${prefix}${String(nextSeq).padStart(10, '0')}`;
}

// ─── Генерация QR-кода ────────────────────────────────────────────────────────
// Возвращает data URL (base64 PNG) — можно сразу вставить в <img src={qr} />

// export async function generateQRCode(inventoryNumber: string): Promise<string> {
//   // QR ведёт на страницу оборудования — можно заменить на просто номер
//   const url = `${process.env.NEXT_PUBLIC_APP_URL}/equipment/inv/${inventoryNumber}`;
//   return QRCode.toDataURL(url, {
//     errorCorrectionLevel: "M",
//     margin: 2,
//     width: 256,
//   });
// }

// ─── Создание партии с N единицами за одну транзакцию ────────────────────────

import { equipmentLots } from "@/lib/db/schema/equipment";

interface CreateLotInput {
  name:            string;
  equipmentTypeId: string;
  quantity:        number;
  supplier?:       string;
  invoiceNumber?:  string;
  unitPriceCents?: number;
  acceptedById?:   string;
  roomId?:         string;    // куда сразу разместить
  responsibleId?:  string;
  baseAttributes?: Record<string, string | number>;
}

// export async function createLotWithItems(input: CreateLotInput) {
//   const year  = new Date().getFullYear();
//   const lotSeq = await db.$count(equipmentLots); // порядковый номер партии
//   const lotNumber = `LOT-${year}-${String(lotSeq + 1).padStart(3, "0")}`;

//   return db.transaction(async (tx) => {
//     // 1. Создаём партию
//     const [lot] = await tx
//       .insert(equipmentLots)
//       .values({
//         lotNumber,
//         name:            input.name,
//         equipmentTypeId: input.equipmentTypeId,
//         quantity:        input.quantity,
//         supplier:        input.supplier,
//         invoiceNumber:   input.invoiceNumber,
//         unitPriceCents:  input.unitPriceCents,
//         acceptedById:    input.acceptedById,
//         acceptedAt:      input.acceptedById ? new Date() : null,
//         status:          input.acceptedById ? "accepted" : "draft",
//       })
//       .returning();

//     // 2. Создаём N единиц оборудования
//     const items = [];
//     for (let i = 0; i < input.quantity; i++) {
//       const inventoryNumber = await generateInventoryNumber();
//       const qrCode          = await generateQRCode(inventoryNumber);

//       const [item] = await tx
//         .insert(equipment)
//         .values({
//           inventoryNumber,
//           qrCode,
//           lotId:           lot.id,
//           equipmentTypeId: input.equipmentTypeId,
//           name:            input.name,
//           roomId:          input.roomId,
//           responsibleId:   input.responsibleId,
//           attributes:      input.baseAttributes,
//           status:          "active",
//         })
//         .returning();

//       items.push(item);
//     }

//     return { lot, items };
//   });
// }