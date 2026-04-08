import { relations } from "drizzle-orm";
import { boolean, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";



// ^ Система авторизации
export const userRoleEnum = pgEnum("userRole", [
    "admin",
    "laborant",
    "teacher"
]);

export const users = pgTable("users", {
    id:             uuid("id").primaryKey().defaultRandom(),
    // Основные данные
    email:          varchar("email", {length: 50}).notNull(),
    firstname:      varchar("firstname", {length: 50}).notNull(),
    lastname:       varchar("lastname", {length: 50}).notNull(),
    fathername:     varchar("fathername", {length: 50}),
    role:           userRoleEnum("role").notNull().default("teacher"),
    passwordHash:       text("passwordHash").notNull(),
    passwordShifr:  text("passwordShifr").notNull(),
    isActive:       boolean('is_active').notNull().default(false), // до подтверждения админом
    createdAt:      timestamp('created_at').notNull().defaultNow(),
})


export const sessions = pgTable("sessions", {
    id:             uuid("id").primaryKey().defaultRandom(),
    userId:         uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash:      text('token_hash').notNull().unique(), // храним хэш токена, не сам токен
    userAgent:      text('user_agent'),
    ip:             text('ip'),
    expiresAt:      timestamp('expires_at').notNull(),
    createdAt:      timestamp('created_at').notNull().defaultNow(),
})

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields:     [sessions.userId],
    references: [users.id],
  }),
}))

export type UserRole = typeof userRoleEnum.enumValues[number];
export type User     = typeof users.$inferSelect;
export type Session  = typeof sessions.$inferSelect;



// ^ Система оборудования
export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: varchar("number", { length: 6 }).notNull().unique(),
  description: text("description")
})