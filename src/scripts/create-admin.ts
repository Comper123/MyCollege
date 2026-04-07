import { users }  from '@/lib/db/schema'
import { eq }     from 'drizzle-orm'
import bcrypt     from 'bcryptjs'
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './../lib/db/schema'


async function createAdmin() {
  // Создаем подключение напрямую
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',     // Ваш пользователь
    password: 'postgres', // Ваш пароль
    database: 'mycollege', // Имя БД
  });

  const db = drizzle(pool, { schema });

  const email = 'admin@novsu.ru';
  const password = '';

  // Проверяем что такого пользователя ещё нет
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (existing) {
    console.log('Администратор уже существует')
    process.exit(0)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const [admin] = await db.insert(users).values({
    email,
    firstname: '',
    fathername: '',
    lastname: '',
    passwordHash,
    passwordShifr: "",
    role:     'admin',
    isActive: true, // сразу активен, без подтверждения
  }).returning()

  console.log('Администратор создан:', admin.email)
  process.exit(0)
}

createAdmin().catch((err) => {
  console.error('Ошибка:', err)
  process.exit(1)
})