import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { rooms } from "@/lib/db/schema/place";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, ctx, user) => {
  if (user.role !== "teacher") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  try {
    const teacherRooms = await db.query.rooms.findMany({
      where: eq(rooms.attached_teacher, user.userId),
      with: {
        attachedLaborant: true,
        attachedTeacher: true,
      },
    });

    return NextResponse.json(teacherRooms);
  } catch (error) {
    console.error("Error fetching teacher rooms:", error);
    return NextResponse.json({ error: "Ошибка загрузки кабинетов" }, { status: 500 });
  }
}, ["teacher"]);