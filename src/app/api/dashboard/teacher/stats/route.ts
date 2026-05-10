import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export const GET = withAuth(async (req, ctx, user) => {
  if (user.role !== "teacher") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  try {
    // Вызов хранимой функции для получения статистики
    const statsResult = await db.execute(sql`
      SELECT * FROM get_teacher_equipment_stats(${user.userId}::UUID)
    `);
    
    // Вызов функции для получения рекомендаций
    const recommendationsResult = await db.execute(sql`
      SELECT * FROM get_maintenance_recommendations(30)
    `);

    return NextResponse.json({
      stats: statsResult.rows[0] || {
        total_equipment: 0,
        active_count: 0,
        maintenance_count: 0,
        broken_count: 0,
        rooms_count: 0,
      },
      recommendations: recommendationsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching teacher dashboard data:", error);
    return NextResponse.json({ error: "Ошибка загрузки данных" }, { status: 500 });
  }
}, ["teacher"]);