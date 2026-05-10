import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export const GET = withAuth(async (req, ctx, user) => {
  try {
    // ============================================================
    // 1. СТАТИСТИКА ОБОРУДОВАНИЯ
    // ============================================================
    const equipmentStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance,
        COUNT(CASE WHEN status = 'broken' THEN 1 END) as broken,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved,
        COUNT(CASE WHEN status = 'written_off' THEN 1 END) as written_off
      FROM equipment
    `);

    // ============================================================
    // 2. СТАТИСТИКА КАБИНЕТОВ
    // ============================================================
    const roomStats = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM rooms
    `);

    const occupiedRooms = await db.execute(sql`
      SELECT COUNT(DISTINCT room_id) as occupied
      FROM equipment
      WHERE room_id IS NOT NULL
    `);

    // ============================================================
    // 3. СТАТИСТИКА ЗАЯВОК
    // ============================================================
    const requestStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM requests
    `);

    // ============================================================
    // 4. СТАТИСТИКА ПОЛЬЗОВАТЕЛЕЙ
    // ============================================================
    const userStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active
      FROM users
    `);

    // ============================================================
    // 5. СОСТОЯНИЕ ОБОРУДОВАНИЯ ДЛЯ КРУГОВОЙ ДИАГРАММЫ
    // ============================================================
    const equipmentStatus = await db.execute(sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM equipment
      GROUP BY status
    `);

    // ============================================================
    // 6. ДИНАМИКА ЗАЯВОК ЗА ПОСЛЕДНИЕ 7 ДНЕЙ
    // ============================================================
    const requestTrend = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as created,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM requests
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // ============================================================
    // 7. ТОП КАБИНЕТОВ ПО КОЛИЧЕСТВУ ОБОРУДОВАНИЯ
    // ============================================================
    const topRooms = await db.execute(sql`
      SELECT 
        r.id,
        r.number,
        COUNT(e.id) as equipment_count
      FROM rooms r
      LEFT JOIN equipment e ON e.room_id = r.id
      GROUP BY r.id, r.number
      ORDER BY equipment_count DESC
      LIMIT 5
    `);

    // ============================================================
    // 8. ТОП ТИПОВ ОБОРУДОВАНИЯ
    // ============================================================
    const topTypes = await db.execute(sql`
      SELECT 
        et.id,
        et.name,
        COUNT(e.id) as equipment_count
      FROM "equipmentType" et
      LEFT JOIN equipment e ON e.equipment_type_id = et.id
      GROUP BY et.id, et.name
      ORDER BY equipment_count DESC
      LIMIT 5
    `);

    // ============================================================
    // 9. ПОСЛЕДНЯЯ АКТИВНОСТЬ
    // ============================================================
    
    // Оборудование
    const recentEquipment = await db.execute(sql`
      SELECT 
        'equipment' as type,
        'equipment_added' as action,
        e.name as title,
        'Добавлено новое оборудование' as description,
        COALESCE(u.firstname || ' ' || u.lastname, 'Система') as user_name,
        e.created_at as timestamp,
        e.inventory_number as details
      FROM equipment e
      LEFT JOIN users u ON e.responsible_id = u.id
      ORDER BY e.created_at DESC
      LIMIT 3
    `);

    // Заявки
    const recentRequests = await db.execute(sql`
      SELECT 
        'request' as type,
        'request_created' as action,
        r.title as title,
        'Создана новая заявка' as description,
        COALESCE(u.firstname || ' ' || u.lastname, 'Система') as user_name,
        r.created_at as timestamp,
        r.status as details
      FROM requests r
      LEFT JOIN users u ON r.created_by_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 3
    `);

    // Перемещения оборудования
    const recentMovements = await db.execute(sql`
      SELECT 
        'movement' as type,
        'equipment_moved' as action,
        COALESCE(e.name, 'Оборудование') as title,
        'Оборудование перемещено в другой кабинет' as description,
        COALESCE(u.firstname || ' ' || u.lastname, 'Система') as user_name,
        m.moved_at as timestamp,
        m.reason as details
      FROM equipment_movement m
      LEFT JOIN equipment e ON m.equipment_id = e.id
      LEFT JOIN users u ON m.moved_by_id = u.id
      ORDER BY m.moved_at DESC
      LIMIT 2
    `);

    // Объединяем все активности
    const allActivities = [...recentEquipment.rows, ...recentRequests.rows, ...recentMovements.rows];
    const sortedActivities = allActivities
      .sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime())
      .slice(0, 8);

    // ============================================================
    // 10. ПОСЛЕДНИЕ ДОБАВЛЕННОЕ ОБОРУДОВАНИЕ
    // ============================================================
    const recentEquipmentList = await db.execute(sql`
      SELECT 
        e.id,
        e.name,
        e.inventory_number,
        e.created_at,
        et.name as equipment_type
      FROM equipment e
      LEFT JOIN "equipmentType" et ON e.equipment_type_id = et.id
      ORDER BY e.created_at DESC
      LIMIT 5
    `);

    return NextResponse.json({
      // Основная статистика
      stats: {
        totalEquipment: Number(equipmentStats.rows[0].total) || 0,
        activeEquipment: Number(equipmentStats.rows[0].active) || 0,
        maintenanceEquipment: Number(equipmentStats.rows[0].maintenance) || 0,
        brokenEquipment: Number(equipmentStats.rows[0].broken) || 0,
        reservedEquipment: Number(equipmentStats.rows[0].reserved) || 0,
        writtenOffEquipment: Number(equipmentStats.rows[0].written_off) || 0,
        totalRooms: Number(roomStats.rows[0].total) || 0,
        occupiedRooms: Number(occupiedRooms.rows[0]?.occupied || 0),
        totalRequests: Number(requestStats.rows[0].total) || 0,
        pendingRequests: Number(requestStats.rows[0].pending) || 0,
        approvedRequests: Number(requestStats.rows[0].approved) || 0,
        rejectedRequests: Number(requestStats.rows[0].rejected) || 0,
        inProgressRequests: Number(requestStats.rows[0].in_progress) || 0,
        completedRequests: Number(requestStats.rows[0].completed) || 0,
        totalUsers: Number(userStats.rows[0].total) || 0,
        activeUsers: Number(userStats.rows[0].active) || 0,
      },
      
      // Данные для графиков
      equipmentStatus: equipmentStatus.rows.map(row => ({
        status: getStatusLabel(row.status as string),
        count: Number(row.count),
        value: row.status,
        color: getStatusColor(row.status as string),
      })),
      
      requestTrend: requestTrend.rows.map(row => ({
        date: new Date(row.date as string).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        created: Number(row.created),
        completed: Number(row.completed),
      })),
      
      // Топ-листы
      topRooms: topRooms.rows.map(row => ({
        id: row.id,
        name: row.number,
        value: Number(row.equipment_count),
      })),
      
      topEquipmentTypes: topTypes.rows.map(row => ({
        id: row.id,
        name: row.name,
        value: Number(row.equipment_count),
      })),
      
      // Активность
      activities: sortedActivities.map((row, index) => ({
        id: `${row.action}_${Date.now()}_${index}`,
        type: row.action,
        title: row.title,
        description: row.description,
        user: row.user_name,
        timestamp: row.timestamp,
        details: row.details,
      })),
      
      // Недавнее оборудование
      recentEquipment: recentEquipmentList.rows.map(row => ({
        id: row.id,
        name: row.name,
        inventoryNumber: row.inventory_number,
        equipmentType: row.equipment_type,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Ошибка загрузки статистики" }, { status: 500 });
  }
}, ["admin", "laborant", "teacher"]);

// Вспомогательные функции
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "В эксплуатации",
    maintenance: "На обслуживании",
    broken: "Неисправно",
    reserved: "Зарезервировано",
    written_off: "Списано",
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "#10B981",
    maintenance: "#F59E0B",
    broken: "#EF4444",
    reserved: "#3B82F6",
    written_off: "#6B7280",
  };
  return colors[status] || "#603EF9";
}