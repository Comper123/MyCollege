import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/db'
import { users, sessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { withAuth } from '@/lib/auth/withAuth'



// PATCH /api/users/[id] — обновить пользователя (роль, активность, сброс пароля)
export const PATCH = withAuth(async(req, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json()

  const updateData: Record<string, unknown> = {}

  if (body.role !== undefined) updateData.role = body.role
  if (body.isActive !== undefined) updateData.isActive = body.isActive
  if (body.firstname !== undefined) updateData.firstname = body.firstname
  if (body.lastname !== undefined) updateData.lastname = body.lastname
  if (body.fathername !== undefined) updateData.fathername = body.fathername
  if (body.email !== undefined) updateData.email = body.email.toLowerCase().trim()

  // Сброс пароля
  if (body.newPassword) {
    updateData.passwordHash = await bcrypt.hash(body.newPassword, 12)
    // Инвалидировать все сессии пользователя
    await db.delete(sessions).where(eq(sessions.userId, id))
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Нет данных для обновления' }, { status: 400 })
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      firstname: users.firstname,
      lastname: users.lastname,
      fathername: users.fathername,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })

  if (!updated) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })

  return NextResponse.json({ user: updated })
}, ["admin"]);


// DELETE /api/users/[id]
export const DELETE = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;

  // Нельзя удалить самого себя
  if (user.userId === id) {
    return NextResponse.json({ error: 'Нельзя удалить собственную учётную запись' }, { status: 400 })
  }

  const deleted = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id })
  if (!deleted.length) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })

  return NextResponse.json({ ok: true })
}, ["admin"]);