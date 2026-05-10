import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

const viewQueries: Record<string, string> = {
  equipment_by_room: "SELECT * FROM equipment_by_room",
  equipment_by_type: "SELECT * FROM equipment_by_type",
  equipment_status_stats: "SELECT * FROM equipment_status_stats",
  requests_by_status: "SELECT * FROM requests_by_status",
  requests_daily_trend: "SELECT * FROM requests_daily_trend",
  movement_history: "SELECT * FROM movement_history ORDER BY moved_at DESC LIMIT 500",
  equipment_value: "SELECT * FROM equipment_value",
  equipment_warranty: "SELECT * FROM equipment_warranty",
  user_activity: "SELECT * FROM user_activity",
  monthly_summary: "SELECT * FROM monthly_summary",
  equipment_no_responsible: "SELECT * FROM equipment_no_responsible",
  requests_by_priority: "SELECT * FROM requests_by_priority",
};

export const GET = withAuth(async (req, ctx, user) => {
  const url = new URL(req.url);
  const viewId = url.searchParams.get("view");
  const limit = url.searchParams.get("limit");
  const offset = url.searchParams.get("offset");

  if (!viewId || !viewQueries[viewId]) {
    return NextResponse.json({ error: "Представление не найдено" }, { status: 404 });
  }

  try {
    let query = viewQueries[viewId];
    
    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    if (offset) {
      query += ` OFFSET ${parseInt(offset)}`;
    }

    const result = await db.execute(sql.raw(query));
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching view data:", error);
    return NextResponse.json({ error: "Ошибка получения данных" }, { status: 500 });
  }
}, ["admin", "laborant"]);