// ? Расположение объектов 


import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";


// & Enums


// & Tables
export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: varchar("number", { length: 6 }).notNull().unique(),
  description: text("description")
})

// & Relations


// & Types