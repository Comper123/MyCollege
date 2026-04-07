import { and, eq, gt } from "drizzle-orm"
import { db } from "../db/db"
import { sessions } from "../db/schema"
import { hashToken } from "./tokens"


// Создать новую сессию в БД
export async function createSession(params: {
    userId: string,
    token: string,
    userAgent: string | null,
    ip: string | null
}) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней

    // Вставляем сессию
    const newtoken = await db.insert(sessions).values({
        userId: params.userId,
        tokenHash: await hashToken(params.token),
        userAgent: params.userAgent,
        ip: params.ip,
        expiresAt
    }).returning();
    console.log(newtoken[0].tokenHash)
}


// Найти сессию по токену и убедиться что она не истекла
export async function findSession(token: string){
    const tokenHash = await hashToken(token);
    const result = await db.query.sessions.findFirst({
        where: and(
            eq(sessions.tokenHash, tokenHash),
            gt(sessions.expiresAt, new Date()) // expiresAt > now
        ),
        with: { user: true }, // JOIN с таблицей users
    })

    return result ?? null
}


// Удалить одну сессию (выход с текущего устройства)
export async function deleteSession(token: string) {
    const th = await hashToken(token);
    console.log(th, token)
    await db
        .delete(sessions)
        .where(eq(sessions.tokenHash, th))
}


// Удалить все сессии пользователя (выход отовсюду)
export async function deleteAllUserSessions(userId: string) {
  await db
    .delete(sessions)
    .where(eq(sessions.userId, userId))
}