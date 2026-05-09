// ? Оборудование


import { InferSelectModel, relations, sql } from "drizzle-orm";
import { integer, jsonb, pgEnum, pgSequence, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { rooms } from "./place";
import { users } from "./users";

// Определяем последовательность для инвентарных номеров
export const inventoryNumberSeq = pgSequence("inventory_number_seq", {
  startWith: 1,
  increment: 1,
  cache: 1
});

// Функция для генерации инвентарного номера
export const generateInventoryNumber = sql<string>`'INV-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('inventory_number_seq')::text, 10, '0')`;

// & Enums
export const equipmentStatusEnum = pgEnum("equipment_status", [
  "active",       // в эксплуатации
  "maintenance",  // на обслуживании / ремонте
  "broken",       // неисправно
  "written_off",  // списано
  "reserved",     // зарезервировано
]);

export const lotStatusEnum = pgEnum("lot_status", [
  "draft",      // черновик, ещё не принят
  "accepted",   // принят на баланс
  "partial",    // часть списана / перемещена
  "closed",     // все единицы списаны
]);


// & Tables
// Тип оборудования
export const equipmentTypes = pgTable("equipmentType", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  attributesSchema: jsonb("attributesSchema").array(),
  createdAt: timestamp("createdAt").defaultNow()
})

// ─── Партия (Lot) ─────────────────────────────────────────────────────────────
// Группа однотипного оборудования, поступившего вместе (например, закупка 10 компьютеров)
export const equipmentLots = pgTable("equipment_lot", {
  id:              uuid("id").defaultRandom().primaryKey(),
  // Человекочитаемый номер партии, например "LOT-2024-001"
  lotNumber:       varchar("lot_number", { length: 64 }).notNull().unique(),
  equipmentTypeId: uuid("equipment_type_id").notNull().references(() => equipmentTypes.id),
  name:            varchar("name", { length: 255 }).notNull(),
  description:     text("description"),
  // Сколько единиц было в партии изначально (для быстрой проверки)
  quantity:        integer("quantity").notNull().default(1),
  status:          lotStatusEnum("status").notNull().default("draft"),
  // Откуда поступило (поставщик, основание)
  supplier:        varchar("supplier", { length: 255 }),
  invoiceNumber:   varchar("invoice_number", { length: 128 }),
  // Стоимость одной единицы (в копейках / центах, чтобы не хранить float)
  unitPriceCents:  integer("unit_price_cents"),
  // Кто принял партию на баланс
  acceptedById:    uuid("accepted_by_id").references(() => users.id, {onDelete: "set null"}),
  acceptedAt:      timestamp("accepted_at"),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
});

// ─── Единица оборудования ────────────────────────────────────────────────────
// Конкретный физический предмет с уникальным инвентарным номером
export const equipment = pgTable("equipment", {
  id:              uuid("id").defaultRandom().primaryKey(),
  // Инвентарный номер — уникальный, генерируется при создании
  // Формат: INV-{YEAR}-{SEQUENCE}, например INV-2024-00042
  inventoryNumber: varchar("inventory_number", { length: 64 }).notNull().unique().default(generateInventoryNumber), // unique() → уникальный индекс на уровне БД
  // QR-код хранится как строка (обычно просто inventoryNumber, но можно URL)
  // Сам PNG генерируется на лету или при создании записи
  qrCode:          text("qr_code").unique(), // тоже уникален
  // Связи
  lotId:           uuid("lot_id").references(() => equipmentLots.id, {onDelete: "restrict"}),
  equipmentTypeId: uuid("equipment_type_id").notNull().references(() => equipmentTypes.id),
  roomId:          uuid("room_id").references(() => rooms.id, {onDelete: "set null"}),
  // Ответственный лаборант / сотрудник
  responsibleId:   uuid("responsible_id").references(() => users.id, {onDelete: "set null"}),
  // Описание конкретной единицы
  name:            varchar("name", { length: 255 }).notNull(),
  serialNumber:    varchar("serial_number", { length: 128 }),
  model:           varchar("model", { length: 255 }),
  manufacturer:    varchar("manufacturer", { length: 255 }),
  status:          equipmentStatusEnum("status").notNull().default("active"),
  // Произвольные атрибуты по схеме типа: { "ram": "16GB", "cpu": "i7-12700" }
  attributes:      jsonb("attributes"),
  // Фотографии — массив URL/путей
  photos:          jsonb("photos").$type<string[]>(),
  // Даты
  purchasedAt:     timestamp("purchased_at"),   // дата закупки
  warrantyUntil:   timestamp("warranty_until"), // гарантия до
  writtenOffAt:    timestamp("written_off_at"), // дата списания
  writtenOffById:  uuid("written_off_by_id").references(() => users.id, {onDelete: "set null"}),
  notes:           text("notes"),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
});

// ─── История перемещений ─────────────────────────────────────────────────────
export const equipmentMovements = pgTable("equipment_movement", {
  id:            uuid("id").defaultRandom().primaryKey(),
  equipmentId:   uuid("equipment_id").notNull().references(() => equipment.id, { onDelete: "cascade" }),
  fromRoomId:    uuid("from_room_id").references(() => rooms.id, {onDelete: "set null"}),
  toRoomId:      uuid("to_room_id").references(() => rooms.id, {onDelete: "set null"}),
  movedById:     uuid("moved_by_id").references(() => users.id, {onDelete: "set null"}),
  reason:        text("reason"),
  movedAt:       timestamp("moved_at").defaultNow().notNull(),
});

// & Relations
export const equipmentTypesRelations = relations(equipmentTypes, ({ many }) => ({
  lots:      many(equipmentLots),
  equipment: many(equipment),
}));

export const equipmentLotsRelations = relations(equipmentLots, ({ one, many }) => ({
  equipmentType: one(equipmentTypes, {
    fields:     [equipmentLots.equipmentTypeId],
    references: [equipmentTypes.id],
  }),
  acceptedBy: one(users, {
    fields:     [equipmentLots.acceptedById],
    references: [users.id],
  }),
  items: many(equipment), // все единицы в партии
}));

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  lot: one(equipmentLots, {
    fields:     [equipment.lotId],
    references: [equipmentLots.id],
  }),
  equipmentType: one(equipmentTypes, {
    fields:     [equipment.equipmentTypeId],
    references: [equipmentTypes.id],
  }),
  room: one(rooms, {
    fields:     [equipment.roomId],
    references: [rooms.id],
  }),
  responsible: one(users, {
    fields:     [equipment.responsibleId],
    references: [users.id],
  }),
  writtenOffBy: one(users, {
    fields:     [equipment.writtenOffById],
    references: [users.id],
  }),
  movements: many(equipmentMovements),
}));

export const equipmentMovementsRelations = relations(equipmentMovements, ({ one }) => ({
  equipment: one(equipment, {
    fields:     [equipmentMovements.equipmentId],
    references: [equipment.id],
  }),
  fromRoom: one(rooms, {
    fields:     [equipmentMovements.fromRoomId],
    references: [rooms.id],
  }),
  toRoom: one(rooms, {
    fields:     [equipmentMovements.toRoomId],
    references: [rooms.id],
  }),
  movedBy: one(users, {
    fields:     [equipmentMovements.movedById],
    references: [users.id],
  }),
}));


// & Types
export type EquipmentType     = InferSelectModel<typeof equipmentTypes>;
export type EquipmentLot      = InferSelectModel<typeof equipmentLots>;
export type Equipment         = InferSelectModel<typeof equipment>;
export type EquipmentMovement = InferSelectModel<typeof equipmentMovements>;

export type EquipmentStatus = typeof equipmentStatusEnum.enumValues[number];
export type EquipmentLotStatus = typeof lotStatusEnum.enumValues[number];

export interface AttributeSchema {
  name: string;      // техническое имя (например, "ram_size")
  label: string;     // отображаемое имя (например, "Объём ОЗУ")
  type: "string" | "number" | "boolean" | "select";
  unit?: string;     // единица измерения (например, "ГБ", "мм")
  options?: string[]; // для type: "select"
  required?: boolean;
  description?: string;
}

export interface CustomField {
  name: string;
}