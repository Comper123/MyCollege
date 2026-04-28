// ? Расположение объектов 


import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import { InferSelectModel, relations } from "drizzle-orm";




// & Tables
export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: varchar("number", { length: 6 }).notNull().unique(),
  description: text("description"),
  attached_lab: uuid("attached_lab_id").references(() => users.id, {onDelete: 'no action'}),
  attached_teacher: uuid("attached_teacher_id").references(() => users.id, {onDelete: 'no action'}),
})

// & Relations
export const roomRelations = relations(rooms, ({ one }) => ({
  attachedTeacher: one(users, {
    fields: [rooms.attached_teacher],
    references: [users.id] 
  }),
  attachedLaborant: one(users, {
    fields: [rooms.attached_lab],
    references: [users.id] 
  })
}))

// & Types
export type Room = InferSelectModel<typeof rooms>;