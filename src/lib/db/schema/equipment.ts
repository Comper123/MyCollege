// ? Оборудование


import { InferSelectModel } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";


// & Enums


// & Tables
// Тип оборудования
export const equipmentTypes = pgTable("equipmentType", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  attributesSchema: jsonb("attributesSchema").array(),
  createdAt: timestamp("createdAt").defaultNow()
})


// & Relations


// & Types
export type EquipmentType = InferSelectModel<typeof equipmentTypes>;