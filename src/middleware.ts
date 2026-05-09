import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth/tokens';

// Какие пути защищать
const PROTECTED = ['/dashboard', '/api/equipment', '/api/rooms', '/api/profile', '/api/equipment/lots'];
const AUTH_ONLY = ['/login', '/register']; // редиректить если уже вошёл
const PUBLIC_API = ['/api/auth/login', '/api/auth/register']; // публичные API

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Пропускаем публичные API
  if (PUBLIC_API.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Пробуем получить токен из разных мест (для совместимости с сетью)
  let token = req.cookies.get('session')?.value;
  
  // Также проверяем Authorization header (для API запросов из сети)
  const authHeader = req.headers.get('authorization');
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isAuthPage = AUTH_ONLY.some(p => pathname === p || pathname.startsWith(p));

  // Быстрая проверка подписи JWT (без БД — очень быстро)
  let payload = null;
  if (token) {
    try {
      payload = await verifyToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      // Если токен невалидный, удаляем cookie
      if (isProtected) {
        const response = NextResponse.redirect(new URL('/login', req.url));
        response.cookies.delete('session');
        return response;
      }
    }
  }

  // Защищённые маршруты
  if (isProtected) {
    if (!payload) {
      // Нет токена или он истёк — на логин
      const loginUrl = new URL('/login', req.url);
      // Сохраняем оригинальный URL для редиректа после логина
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Прокидываем данные пользователя в заголовки для страниц/API
    const res = NextResponse.next();
    res.headers.set('x-user-id', payload.userId);
    res.headers.set('x-user-role', payload.role);
    
    // Добавляем CORS заголовки для API ответов
    if (pathname.startsWith('/api/')) {
      const origin = req.headers.get('origin');
      if (origin) {
        res.headers.set('Access-Control-Allow-Origin', origin);
        res.headers.set('Access-Control-Allow-Credentials', 'true');
        res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }
    }
    
    return res;
  }

  // Страницы авторизации (если уже вошёл)
  if (isAuthPage && payload) {
    // Уже вошёл — не пускаем на страницу логина
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Для всех остальных запросов
  const response = NextResponse.next();
  
  // Добавляем CORS для API (если нужно)
  if (pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin');
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
  }
  
  return response;
}

// Обработка OPTIONS запросов (CORS preflight)
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  const response = new NextResponse(null, { status: 204 });
  
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/equipment/:path*',
    '/api/rooms/:path*',
    '/api/profile/:path*',
    '/login',
    '/register',
  ],
};