import { sql } from "drizzle-orm";
import { db } from "@/lib/db/db";

// ============================================================
// 1. ПРЕДСТАВЛЕНИЕ: Оборудование по кабинетам
// ============================================================
export const equipmentByRoomView = sql`
  CREATE OR REPLACE VIEW equipment_by_room AS
  SELECT 
    r.id as room_id,
    r.number as room_number,
    r.description as room_description,
    COUNT(e.id) as total_equipment,
    COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN e.status = 'maintenance' THEN 1 END) as maintenance_count,
    COUNT(CASE WHEN e.status = 'broken' THEN 1 END) as broken_count,
    COUNT(CASE WHEN e.status = 'reserved' THEN 1 END) as reserved_count,
    COUNT(CASE WHEN e.status = 'written_off' THEN 1 END) as written_off_count,
    COALESCE(SUM(el.unit_price_cents), 0) as total_value_cents
  FROM rooms r
  LEFT JOIN equipment e ON e.room_id = r.id
  LEFT JOIN equipment_lot el ON e.lot_id = el.id
  GROUP BY r.id, r.number, r.description
  ORDER BY total_equipment DESC
`;

// ============================================================
// 2. ПРЕДСТАВЛЕНИЕ: Оборудование по типам
// ============================================================
export const equipmentByTypeView = sql`
  CREATE OR REPLACE VIEW equipment_by_type AS
  SELECT 
    et.id as type_id,
    et.name as type_name,
    et.description as type_description,
    COUNT(e.id) as total_equipment,
    COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN e.status = 'maintenance' THEN 1 END) as maintenance_count,
    COUNT(CASE WHEN e.status = 'broken' THEN 1 END) as broken_count,
    COUNT(CASE WHEN e.status = 'reserved' THEN 1 END) as reserved_count,
    COUNT(CASE WHEN e.status = 'written_off' THEN 1 END) as written_off_count,
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'name', e.name,
        'inventory_number', e.inventory_number,
        'status', e.status
      )
      ORDER BY e.created_at DESC
    ) FILTER (WHERE e.id IS NOT NULL) as equipment_list
  FROM "equipmentType" et
  LEFT JOIN equipment e ON e.equipment_type_id = et.id
  GROUP BY et.id, et.name, et.description
  ORDER BY total_equipment DESC
`;

// ============================================================
// 3. ПРЕДСТАВЛЕНИЕ: Статистика по статусам оборудования
// ============================================================
export const equipmentStatusStatsView = sql`
  CREATE OR REPLACE VIEW equipment_status_stats AS
  SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
  FROM equipment
  GROUP BY status
  ORDER BY count DESC
`;

// ============================================================
// 4. ПРЕДСТАВЛЕНИЕ: Заявки по статусам
// ============================================================
export const requestsByStatusView = sql`
  CREATE OR REPLACE VIEW requests_by_status AS
  SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage,
    MIN(created_at) as oldest_request,
    MAX(created_at) as newest_request,
    AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - created_at))) / 86400 as avg_days_to_resolve
  FROM requests
  GROUP BY status
  ORDER BY count DESC
`;

// ============================================================
// 5. ПРЕДСТАВЛЕНИЕ: Динамика заявок по дням
// ============================================================
export const requestsDailyTrendView = sql`
  CREATE OR REPLACE VIEW requests_daily_trend AS
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as created_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
    ROUND(
      COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0),
      1
    ) as completion_rate
  FROM requests
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
  ORDER BY date DESC
`;

// ============================================================
// 6. ПРЕДСТАВЛЕНИЕ: История перемещений с деталями
// ============================================================
export const movementHistoryView = sql`
  CREATE OR REPLACE VIEW movement_history AS
  SELECT 
    m.id,
    m.moved_at,
    e.id as equipment_id,
    e.name as equipment_name,
    e.inventory_number,
    from_room.number as from_room_number,
    to_room.number as to_room_number,
    m.reason,
    u.firstname || ' ' || u.lastname as moved_by_name,
    u.email as moved_by_email,
    EXTRACT(DAY FROM NOW() - m.moved_at) as days_ago
  FROM equipment_movement m
  LEFT JOIN equipment e ON m.equipment_id = e.id
  LEFT JOIN rooms from_room ON m.from_room_id = from_room.id
  LEFT JOIN rooms to_room ON m.to_room_id = to_room.id
  LEFT JOIN users u ON m.moved_by_id = u.id
  ORDER BY m.moved_at DESC
`;

// ============================================================
// 7. ПРЕДСТАВЛЕНИЕ: Стоимость оборудования по типам
// ============================================================
export const equipmentValueView = sql`
  CREATE OR REPLACE VIEW equipment_value AS
  SELECT 
    et.id as type_id,
    et.name as type_name,
    COUNT(e.id) as equipment_count,
    COALESCE(SUM(el.unit_price_cents), 0) as total_value_cents,
    COALESCE(AVG(el.unit_price_cents), 0) as avg_value_cents,
    COALESCE(MIN(el.unit_price_cents), 0) as min_value_cents,
    COALESCE(MAX(el.unit_price_cents), 0) as max_value_cents,
    SUM(
      CASE 
        WHEN e.status = 'active' THEN COALESCE(el.unit_price_cents, 0)
        ELSE 0
      END
    ) as active_value_cents
  FROM "equipmentType" et
  LEFT JOIN equipment e ON e.equipment_type_id = et.id
  LEFT JOIN equipment_lot el ON e.lot_id = el.id
  GROUP BY et.id, et.name
  ORDER BY total_value_cents DESC
`;

// ============================================================
// 8. ПРЕДСТАВЛЕНИЕ: Оборудование на гарантии
// ============================================================
export const equipmentWarrantyView = sql`
  CREATE OR REPLACE VIEW equipment_warranty AS
  SELECT 
    e.id,
    e.name,
    e.inventory_number,
    e.warranty_until,
    e.purchased_at,
    et.name as equipment_type,
    r.number as room_number,
    u.firstname || ' ' || u.lastname as responsible_person,
    CASE 
      WHEN e.warranty_until < NOW() THEN 'expired'
      WHEN e.warranty_until < NOW() + INTERVAL '30 days' THEN 'expiring_soon'
      ELSE 'valid'
    END as warranty_status,
    EXTRACT(DAY FROM e.warranty_until - NOW()) as days_left
  FROM equipment e
  LEFT JOIN "equipmentType" et ON e.equipment_type_id = et.id
  LEFT JOIN rooms r ON e.room_id = r.id
  LEFT JOIN users u ON e.responsible_id = u.id
  WHERE e.warranty_until IS NOT NULL
  ORDER BY e.warranty_until ASC
`;

// ============================================================
// 9. ПРЕДСТАВЛЕНИЕ: Активность пользователей
// ============================================================
export const userActivityView = sql`
  CREATE OR REPLACE VIEW user_activity AS
  SELECT 
    u.id as user_id,
    u.firstname || ' ' || u.lastname as user_name,
    u.email,
    u.role,
    COUNT(DISTINCT r.id) as requests_created,
    COUNT(DISTINCT e.id) as equipment_responsible,
    COUNT(DISTINCT m.id) as movements_made,
    MAX(r.created_at) as last_request_date,
    MAX(m.moved_at) as last_movement_date
  FROM users u
  LEFT JOIN requests r ON r.created_by_id = u.id
  LEFT JOIN equipment e ON e.responsible_id = u.id
  LEFT JOIN equipment_movement m ON m.moved_by_id = u.id
  GROUP BY u.id, u.firstname, u.lastname, u.email, u.role
  ORDER BY requests_created DESC
`;

// ============================================================
// 10. ПРЕДСТАВЛЕНИЕ: Ежемесячная сводка
// ============================================================
export const monthlySummaryView = sql`
  CREATE OR REPLACE VIEW monthly_summary AS
  SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_equipment_added,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_added,
    SUM(COALESCE(el.unit_price_cents, 0)) as total_value_added
  FROM equipment e
  LEFT JOIN equipment_lot el ON e.lot_id = el.id
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY month DESC
`;

// Функция для создания всех представлений
export async function createAllViews() {
  try {
    await db.execute(equipmentByRoomView);
    await db.execute(equipmentByTypeView);
    await db.execute(equipmentStatusStatsView);
    await db.execute(requestsByStatusView);
    await db.execute(requestsDailyTrendView);
    await db.execute(movementHistoryView);
    await db.execute(equipmentValueView);
    await db.execute(equipmentWarrantyView);
    await db.execute(userActivityView);
    await db.execute(monthlySummaryView);
    console.log("All views created successfully");
  } catch (error) {
    console.error("Error creating views:", error);
    throw error;
  }
}

// Функция для удаления всех представлений
export async function dropAllViews() {
  const views = [
    "equipment_by_room",
    "equipment_by_type",
    "equipment_status_stats",
    "requests_by_status",
    "requests_daily_trend",
    "movement_history",
    "equipment_value",
    "equipment_warranty",
    "user_activity",
    "monthly_summary",
  ];

  for (const view of views) {
    await db.execute(sql`DROP VIEW IF EXISTS ${sql.raw(view)} CASCADE`);
  }
  console.log("All views dropped successfully");
}