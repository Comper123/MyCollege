-- 1. Функция: Получить статистику по оборудованию преподавателя
-- Возвращает количество оборудования в кабинетах преподавателя
CREATE OR REPLACE FUNCTION get_teacher_equipment_stats(teacher_id UUID)
RETURNS TABLE(
  total_equipment BIGINT,
  active_count BIGINT,
  maintenance_count BIGINT,
  broken_count BIGINT,
  rooms_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(e.id)::BIGINT as total_equipment,
    COUNT(CASE WHEN e.status = 'active' THEN 1 END)::BIGINT as active_count,
    COUNT(CASE WHEN e.status = 'maintenance' THEN 1 END)::BIGINT as maintenance_count,
    COUNT(CASE WHEN e.status = 'broken' THEN 1 END)::BIGINT as broken_count,
    COUNT(DISTINCT r.id)::BIGINT as rooms_count
  FROM rooms r
  LEFT JOIN equipment e ON e.room_id = r.id
  WHERE r.attached_teacher_id = teacher_id;
END;
$$ LANGUAGE plpgsql;

-- Пример использования:
-- SELECT * FROM get_teacher_equipment_stats('0b598aaf-4284-4158-9a7a-a583237bf7a5');


-- 2. Функция: Получить историю заявок пользователя с детализацией
CREATE OR REPLACE FUNCTION get_user_requests_history(
  user_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  request_id UUID,
  request_title VARCHAR,
  equipment_name VARCHAR,
  status VARCHAR,
  type VARCHAR,
  priority VARCHAR,
  created_at TIMESTAMP,
  days_ago INTEGER,
  resolution_time_days NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    e.name,
    r.status::VARCHAR,
    r.type::VARCHAR,
    r.priority::VARCHAR,
    r.created_at,
    EXTRACT(DAY FROM NOW() - r.created_at)::INTEGER as days_ago,
    CASE 
      WHEN r.resolved_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (r.resolved_at - r.created_at)) / 86400
      ELSE NULL
    END as resolution_time_days
  FROM requests r
  LEFT JOIN equipment e ON r.equipment_id = e.id
  WHERE r.created_by_id = user_id
    AND r.created_at >= NOW() - (days_back || ' days')::INTERVAL
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Пример использования:
-- SELECT * FROM get_user_requests_history('0b598aaf-4284-4158-9a7a-a583237bf7a5', 90);


-- 3. Процедура: Автоматическое списание устаревшего оборудования
-- Процедура помечает оборудование как списанное, если оно не использовалось долгое время
CREATE OR REPLACE PROCEDURE auto_write_off_equipment(
  days_inactive INTEGER DEFAULT 365,
  reason_text TEXT DEFAULT 'Автоматическое списание за неиспользованием'
)
LANGUAGE plpgsql
AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Обновляем статус оборудования, которое не имеет перемещений за указанный период
  UPDATE equipment e
  SET 
    status = 'written_off',
    written_off_at = NOW(),
    notes = COALESCE(notes, '') || ' | ' || reason_text
  WHERE e.status = 'active'
    AND NOT EXISTS (
      SELECT 1 
      FROM equipment_movement em 
      WHERE em.equipment_id = e.id 
        AND em.moved_at >= NOW() - (days_inactive || ' days')::INTERVAL
    )
    AND e.created_at <= NOW() - (days_inactive || ' days')::INTERVAL;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Автоматически списано оборудования: % шт.', affected_count;
END;
$$;

-- Пример использования:
-- CALL auto_write_off_equipment(365, 'Долго не использовалось');


-- 4. Процедура: Создание отчета по заявкам за период
CREATE OR REPLACE PROCEDURE generate_requests_report(
  start_date DATE,
  end_date DATE,
  INOUT report_data REFCURSOR
)
LANGUAGE plpgsql
AS $$
BEGIN
  OPEN report_data FOR
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
  WHERE DATE(r.created_at) BETWEEN start_date AND end_date
  GROUP BY DATE(r.created_at), u.id, u.firstname, u.lastname
  ORDER BY request_date DESC;
END;
$$;

-- Пример использования в приложении:
-- BEGIN;
-- CALL generate_requests_report('2026-01-01', '2026-12-31', 'my_cursor');
-- FETCH ALL IN "my_cursor";
-- COMMIT;


-- 5. Функция: Подсчет стоимости оборудования в кабинете с группировкой по статусу
CREATE OR REPLACE FUNCTION get_room_equipment_value(
  room_id_param UUID
)
RETURNS TABLE(
  status VARCHAR,
  equipment_count BIGINT,
  total_value_cents BIGINT,
  avg_value_cents NUMERIC,
  equipment_list JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.status::VARCHAR,
    COUNT(e.id) as equipment_count,
    COALESCE(SUM(el.unit_price_cents), 0)::BIGINT as total_value_cents,
    COALESCE(AVG(el.unit_price_cents), 0) as avg_value_cents,
    COALESCE(
      json_agg(
        json_build_object(
          'id', e.id,
          'name', e.name,
          'inventory_number', e.inventory_number,
          'model', e.model,
          'manufacturer', e.manufacturer
        )
      ) FILTER (WHERE e.id IS NOT NULL),
      '[]'::JSON
    ) as equipment_list
  FROM equipment e
  LEFT JOIN equipment_lot el ON e.lot_id = el.id
  WHERE e.room_id = room_id_param
  GROUP BY e.status
  ORDER BY e.status;
END;
$$ LANGUAGE plpgsql;

-- Пример использования:
-- SELECT * FROM get_room_equipment_value('56a240f4-3851-44fb-a763-082618e0fe6b');


-- 6. Функция: Получить рекомендации по обслуживанию оборудования
CREATE OR REPLACE FUNCTION get_maintenance_recommendations(
  days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE(
  equipment_id UUID,
  equipment_name VARCHAR,
  inventory_number VARCHAR,
  equipment_type VARCHAR,
  room_number VARCHAR,
  warranty_expires_in_days INTEGER,
  recommendation TEXT,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.inventory_number,
    et.name as equipment_type,
    r.number as room_number,
    EXTRACT(DAY FROM (e.warranty_until - NOW()))::INTEGER as warranty_expires_in_days,
    CASE 
      WHEN e.warranty_until <= NOW() THEN 
        'СРОЧНО: Гарантия истекла! Необходимо провести техническое обслуживание за плату'::TEXT
      WHEN e.warranty_until <= NOW() + (days_threshold || ' days')::INTERVAL THEN 
        'Плановое обслуживание: Гарантия истекает через ' || 
        EXTRACT(DAY FROM (e.warranty_until - NOW()))::TEXT || ' дней'::TEXT
      WHEN e.status = 'maintenance' THEN 
        'Требуется обслуживание, оборудование в статусе "на обслуживании"'
      WHEN e.status = 'broken' THEN 
        'КРИТИЧНО: Оборудование неисправно, требуется срочный ремонт'
      ELSE 'Плановое ТО не требуется'
    END as recommendation,
    CASE 
      WHEN e.warranty_until <= NOW() THEN 1
      WHEN e.status = 'broken' THEN 2
      WHEN e.warranty_until <= NOW() + (days_threshold || ' days')::INTERVAL THEN 3
      WHEN e.status = 'maintenance' THEN 4
      ELSE 5
    END as priority
  FROM equipment e
  LEFT JOIN "equipmentType" et ON e.equipment_type_id = et.id
  LEFT JOIN rooms r ON e.room_id = r.id
  WHERE e.status IN ('active', 'maintenance', 'broken')
    AND (e.warranty_until IS NOT NULL OR e.status IN ('maintenance', 'broken'))
  ORDER BY priority, warranty_expires_in_days;
END;
$$ LANGUAGE plpgsql;