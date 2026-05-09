import { encryptPassword, hashPassword, verifyPassword } from "@/lib/auth/helpers";
import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export const POST = withAuth(async (req, ctx, user) => {
  const body = await req.json();
  const { currentPassword, newPassword } = body;

  // Валидация
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Все поля обязательны для заполнения" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "Новый пароль должен содержать минимум 6 символов" },
      { status: 400 }
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "Новый пароль должен отличаться от текущего" },
      { status: 400 }
    );
  }

  try {
    // Получаем текущего пользователя из БД
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Проверяем текущий пароль
    const isPasswordValid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Неверный текущий пароль" },
        { status: 401 }
      );
    }

    // Хешируем новый пароль
    const newPasswordHash = await hashPassword(newPassword);
    
    // Шифруем новый пароль (если нужно хранить в открытом виде для некоторых целей)
    const newPasswordShifr = await encryptPassword(newPassword);

    // Обновляем пароль в базе данных
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        passwordShifr: newPasswordShifr,
      })
      .where(eq(users.id, user.userId));

    return NextResponse.json({
      success: true,
      message: "Пароль успешно изменён",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Ошибка при смене пароля" },
      { status: 500 }
    );
  }
}, ["admin", "laborant", "teacher"]);