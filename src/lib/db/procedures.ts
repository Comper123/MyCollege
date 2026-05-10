import { db } from "@/lib/db/db";
import { sql } from "drizzle-orm";

// ============================================================
// ТИПЫ ДАННЫХ
// ============================================================

export interface TeacherEquipmentStats {
  total_equipment: number;
  active_count: number;
  maintenance_count: number;
  broken_count: number;
  rooms_count: number;
}

export interface UserRequestHistory {
  request_id: string;
  request_title: string;
  equipment_name: string | null;
  status: string;
  type: string;
  priority: string;
  created_at: Date;
  days_ago: number;
  resolution_time_days: number | null;
}

export interface RoomEquipmentValue {
  status: string;
  equipment_count: number;
  total_value_cents: number;
  avg_value_cents: number;
  equipment_list: Array<{
    id: string;
    name: string;
    inventory_number: string;
    model: string | null;
    manufacturer: string | null;
  }>;
}

export interface MaintenanceRecommendation {
  equipment_id: string;
  equipment_name: string;
  inventory_number: string;
  equipment_type: string | null;
  room_number: string | null;
  warranty_expires_in_days: number | null;
  recommendation: string;
  priority: number;
}

// ============================================================
// 1. Получить статистику оборудования преподавателя
// ============================================================
export async function getTeacherEquipmentStats(teacherId: string): Promise<TeacherEquipmentStats | null> {
  const result = await db.execute(sql`
    SELECT * FROM get_teacher_equipment_stats(${teacherId}::UUID)
  `);
  return result.rows[0] as unknown as TeacherEquipmentStats || null;
}

// ============================================================
// 2. Получить историю заявок пользователя
// ============================================================
export async function getUserRequestsHistory(userId: string, daysBack: number = 30): Promise<UserRequestHistory[]> {
  const result = await db.execute(sql`
    SELECT * FROM get_user_requests_history(${userId}::UUID, ${daysBack})
  `);
  return result.rows as unknown as UserRequestHistory[];
}

// ============================================================
// 3. Автоматическое списание оборудования (вызов процедуры)
// ============================================================
export async function autoWriteOffEquipment(daysInactive: number = 365, reasonText?: string): Promise<{ success: boolean; message: string }> {
  try {
    await db.execute(sql`
      CALL auto_write_off_equipment(${daysInactive}, ${reasonText || 'Автоматическое списание за неиспользованием'})
    `);
    return { success: true, message: `Автоматическое списание выполнено (${daysInactive} дней неактивности)` };
  } catch (error) {
    console.error("Error in auto_write_off_equipment:", error);
    return { success: false, message: "Ошибка при автоматическом списании" };
  }
}

// ============================================================
// 4. Создание отчета по заявкам за период (через REFCURSOR)
// ============================================================
export async function getRequestsReportData(startDate: Date, endDate: Date): Promise<any[]> {
  const result = await db.execute(sql`
    SELECT 
      DATE(r.created_at) as request_date,
      COUNT(*) as total_requests,
      COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN r.status = 'rejected' THEN 1 END) as rejected,
      COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending,
      ROUND(COUNT(CASE WHEN r.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 1) as completion_rate,
      ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(r.resolved_at, NOW()) - r.created_at)) / 86400), 1) as avg_days_to_resolve,
      u.firstname || ' ' || u.lastname as created_by
    FROM requests r
    LEFT JOIN users u ON r.created_by_id = u.id
    WHERE DATE(r.created_at) BETWEEN ${startDate.toISOString()}::DATE AND ${endDate.toISOString()}::DATE
    GROUP BY DATE(r.created_at), u.id, u.firstname, u.lastname
    ORDER BY request_date DESC
  `);
  return result.rows;
}

// ============================================================
// 5. Подсчет стоимости оборудования в кабинете
// ============================================================
export async function getRoomEquipmentValue(roomId: string): Promise<RoomEquipmentValue[]> {
  const result = await db.execute(sql`
    SELECT * FROM get_room_equipment_value(${roomId}::UUID)
  `);
  return result.rows as unknown as RoomEquipmentValue[];
}

// ============================================================
// 6. Получить рекомендации по обслуживанию
// ============================================================
export async function getMaintenanceRecommendations(daysThreshold: number = 30): Promise<MaintenanceRecommendation[]> {
  const result = await db.execute(sql`
    SELECT * FROM get_maintenance_recommendations(${daysThreshold})
  `);
  return result.rows as unknown as MaintenanceRecommendation[];
}