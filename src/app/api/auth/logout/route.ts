import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth/sessions'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value

  if (token) {
    await deleteSession(token) // убиваем сессию в БД
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.delete('session') // убираем cookie
  return response
}