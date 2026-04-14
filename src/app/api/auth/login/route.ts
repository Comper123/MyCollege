// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db }           from '@/lib/db/db'
import { users }        from '@/lib/db/schema'
import { eq }           from 'drizzle-orm'
import { signToken }    from '@/lib/auth/tokens'
import { createSession } from '@/lib/auth/sessions'
import bcrypt           from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  // 1. Найти пользователя
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  })

  if (!user) {
    return NextResponse.json({ error: 'Пользователя с таким email не существует' }, { status: 401 })
  }

  // 2. Проверить пароль
  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    return NextResponse.json({ error: 'Некорректный пароль' }, { status: 401 })
  }

  // 3. Проверить что аккаунт активирован
  if (!user.isActive) {
    return NextResponse.json({ error: 'Аккаунт ещё не подтверждён администратором' }, { status: 403 })
  }
  
  // 4. Создать JWT
  const token = await signToken({
    userId:    user.id,
    role:      user.role,
  })
  // 5. Сохранить сессию в БД
  await createSession({
    userId:    user.id,
    token,
    userAgent: req.headers.get('user-agent'),
    ip:        req.headers.get('x-forwarded-for') ?? null,
  })

  // 6. Отдать токен в httpOnly cookie
  const response = NextResponse.json({ ok: true, role: user.role })
  response.cookies.set('session', token, {
    httpOnly: true,   // JS на клиенте не видит cookie — защита от XSS
    secure:   true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7, // 7 дней в секундах
    path:     '/',
  })

  return response
}