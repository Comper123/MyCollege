import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { equipment } from "./equipment";

// Статусы заявки
export const requestStatusEnum = pgEnum("request_status", [
  "draft",      // Черновик
  "pending",    // На рассмотрении
  "approved",   // Одобрена
  "rejected",   // Отклонена
  "in_progress",// В работе
  "completed",  // Выполнена
  "cancelled",  // Отменена
]);

// Типы заявок
export const requestTypeEnum = pgEnum("request_type", [
  "repair",        // Ремонт
  "maintenance",   // Обслуживание
  "replacement",   // Замена
  "transfer",      // Перемещение
  "write_off",     // Списание
  "other",         // Другое
]);

// Приоритеты
export const requestPriorityEnum = pgEnum("request_priority", [
  "low",      // Низкий
  "medium",   // Средний
  "high",     // Высокий
  "urgent",   // Срочный
]);

// Таблица заявок
export const requests = pgTable("requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Основная информация
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: requestTypeEnum("type").notNull(),
  priority: requestPriorityEnum("priority").default("medium"),
  status: requestStatusEnum("status").default("pending"),
  
  // Связи
  equipmentId: uuid("equipment_id").references(() => equipment.id, {
    onDelete: "set null",
  }),
  createdById: uuid("created_by_id").notNull().references(() => users.id, {
    onDelete: "cascade",
  }),
  assignedToId: uuid("assigned_to_id").references(() => users.id, {
    onDelete: "set null",
  }),
  
  // Дополнительная информация
  attachments: text("attachments").array(), // Массив URL файлов
  adminComment: text("admin_comment"),      // Комментарий администратора
  resolution: text("resolution"),            // Результат выполнения
  
  // Даты
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  deadline: timestamp("deadline"),
});

// Relations
export const requestsRelations = relations(requests, ({ one }) => ({
  equipment: one(equipment, {
    fields: [requests.equipmentId],
    references: [equipment.id],
  }),
  createdBy: one(users, {
    fields: [requests.createdById],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [requests.assignedToId],
    references: [users.id],
  }),
}));

// Types
export type Request = InferSelectModel<typeof requests>;
export type NewRequest = InferInsertModel<typeof requests>;

export type RequestType = typeof requestTypeEnum.enumValues[number];
export type RequestStatus = typeof requestStatusEnum.enumValues[number];
export type RequestPriority = typeof requestPriorityEnum.enumValues[number];