import { NextRequest, NextResponse } from 'next/server'
import { deleteAllUserSessions, findSession } from '@/lib/auth/sessions'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (token === undefined) return NextResponse.json({ error: "Ошибка выхода"}, { status: 500})
  
  const session = await findSession(token);
  if (session) {
    await deleteAllUserSessions(session?.user.id) // убиваем все сессии в БД
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.delete('session') // убираем cookie
  return response
}