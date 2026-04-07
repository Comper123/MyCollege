import { NextRequest, NextResponse } from 'next/server'
import { verifyToken }  from './lib/auth/tokens'

// Какие пути защищать
const PROTECTED = ['/dashboard', '/api/equipment', '/api/rooms']
const AUTH_ONLY  = ['/login'] // редиректить если уже вошёл


export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('session')?.value

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  const isAuthPage   = AUTH_ONLY.some(p => pathname.startsWith(p))

  // Быстрая проверка подписи JWT (без БД — очень быстро)
  const payload = token ? await verifyToken(token) : null

  if (isProtected) {
    if (!payload) {
      // Нет токена или он истёк — на логин
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Полная проверка в БД (сессия не была убита?) не проверяем потому что это добивает Middleware
    // const session = await findSession(token!)
    // if (!session) {
    //   const res = NextResponse.redirect(new URL('/login', req.url))
    //   res.cookies.delete('session')
    //   return res
    // }

    // Прокидываем данные пользователя в заголовки для страниц/API
    const res = NextResponse.next()
    res.headers.set('x-user-id',   payload.userId)
    res.headers.set('x-user-role', payload.role)
    return res
  }

  if (isAuthPage && payload) {
    // Уже вошёл — не пускаем на страницу логина
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/equipment/:path*', '/api/rooms/:path*', '/login'],
}