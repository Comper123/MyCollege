-- ============================================================
-- ТРИГГЕР 1: Автоматическое обновление updated_at
-- ============================================================
-- Обновляет поле updated_at при изменении записи
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггер к таблице equipment
DROP TRIGGER IF EXISTS trigger_update_equipment_updated_at ON equipment;
CREATE TRIGGER trigger_update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Применяем триггер к таблице equipment_lot
DROP TRIGGER IF EXISTS trigger_update_equipment_lot_updated_at ON equipment_lot;
CREATE TRIGGER trigger_update_equipment_lot_updated_at
  BEFORE UPDATE ON equipment_lot
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Применяем триггер к таблице requests
DROP TRIGGER IF EXISTS trigger_update_requests_updated_at ON requests;
CREATE TRIGGER trigger_update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- ТРИГГЕР 2: Автоматическое обновление статуса оборудования при создании заявки
-- ============================================================
-- При создании заявки с типом "repair" меняет статус оборудования на "maintenance"
CREATE OR REPLACE FUNCTION update_equipment_status_on_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Если создается заявка на ремонт
  IF NEW.type = 'repair' AND NEW.equipment_id IS NOT NULL THEN
    -- Обновляем статус оборудования на "на обслуживании"
    UPDATE equipment 
    SET status = 'maintenance', updated_at = NOW()
    WHERE id = NEW.equipment_id 
      AND status = 'active';
    
    -- Добавляем примечание
    UPDATE equipment 
    SET notes = COALESCE(notes, '') || E'\n' || 'Заявка на ремонт #' || NEW.id::TEXT || ' от ' || NEW.created_at::TEXT
    WHERE id = NEW.equipment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер на таблицу requests
DROP TRIGGER IF EXISTS trigger_update_equipment_status_on_request ON requests;
CREATE TRIGGER trigger_update_equipment_status_on_request
  AFTER INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_status_on_request();


-- ============================================================
-- ТРИГГЕР 3: Логирование изменений статуса заявки
-- ============================================================
-- Создаем таблицу для логов
CREATE TABLE IF NOT EXISTS request_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL,
  old_status VARCHAR,
  new_status VARCHAR,
  changed_by UUID,
  changed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Функция для логирования изменений статуса заявки
CREATE OR REPLACE FUNCTION log_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Если статус изменился
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO request_status_log (request_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, OLD.status::TEXT, NEW.status::TEXT, NEW.assigned_to_id, 
            'Статус изменен с ' || OLD.status::TEXT || ' на ' || NEW.status::TEXT);
    
    -- Если заявка выполнена, обновляем resolved_at
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      NEW.resolved_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер на таблицу requests
DROP TRIGGER IF EXISTS trigger_log_request_status_change ON requests;
CREATE TRIGGER trigger_log_request_status_change
  BEFORE UPDATE OF status ON requests
  FOR EACH ROW
  EXECUTE FUNCTION log_request_status_change();


-- ============================================================
-- ТРИГГЕР 4: Проверка уникальности инвентарного номера (дополнительная защита)
-- ============================================================
CREATE OR REPLACE FUNCTION check_inventory_number_unique()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM equipment 
    WHERE inventory_number = NEW.inventory_number 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ) THEN
    RAISE EXCEPTION 'Инвентарный номер % уже существует', NEW.inventory_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер (хотя уникальность уже обеспечивается CONSTRAINT)
DROP TRIGGER IF EXISTS trigger_check_inventory_number_unique ON equipment;
CREATE TRIGGER trigger_check_inventory_number_unique
  BEFORE INSERT OR UPDATE OF inventory_number ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION check_inventory_number_unique();


-- ============================================================
-- ТРИГГЕР 5: Автоматическое создание записи о перемещении при смене комнаты
-- ============================================================
CREATE OR REPLACE FUNCTION log_equipment_room_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Если комната изменилась
  IF OLD.room_id IS DISTINCT FROM NEW.room_id THEN
    INSERT INTO equipment_movement (
      equipment_id, 
      from_room_id, 
      to_room_id, 
      moved_by_id, 
      reason, 
      moved_at
    ) VALUES (
      NEW.id,
      OLD.room_id,
      NEW.room_id,
      NEW.responsible_id,
      COALESCE(NEW.notes, 'Автоматическая запись о перемещении'),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер на таблицу equipment
DROP TRIGGER IF EXISTS trigger_log_equipment_room_change ON equipment;
CREATE TRIGGER trigger_log_equipment_room_change
  BEFORE UPDATE OF room_id ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION log_equipment_room_change();