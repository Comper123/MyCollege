import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import { createHash }         from 'crypto'


const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const EXPIRES_IN = '7d'

export interface SessionPayload  {
    userId:    string;
    role:      string;
}


// Создание токена
export async function signToken(payload: SessionPayload ): Promise<string>{
    return new SignJWT(payload as unknown as JWTPayload)
        .setProtectedHeader({alg: 'HS256'})
        .setIssuedAt()
        .setExpirationTime(EXPIRES_IN)
        .sign(SECRET)
}

// Проверить JWT (только подпись, без проверки БД)
export async function verifyToken(token: string): Promise<SessionPayload  | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    // Кастуем через unknown — говорим TS "я знаю что делаю"
    const data = payload as unknown as SessionPayload
    // Дополнительно проверяем что поля реально есть
    if (!data.userId || !data.role) return null
    return data
  } catch {
    return null // истёк или подделан
  }
}

// Хэш токена для хранения в БД
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}