-- ============================================================
-- СОЗДАНИЕ ТИПОВ ENUM
-- ============================================================

CREATE TYPE equipment_status AS ENUM (
    'active',
    'maintenance',
    'broken',
    'written_off',
    'reserved'
);

CREATE TYPE lot_status AS ENUM (
    'draft',
    'accepted',
    'partial',
    'closed'
);

CREATE TYPE request_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

CREATE TYPE request_status AS ENUM (
    'draft',
    'pending',
    'approved',
    'rejected',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TYPE request_type AS ENUM (
    'repair',
    'maintenance',
    'replacement',
    'transfer',
    'write_off',
    'other'
);

CREATE TYPE "userRole" AS ENUM (
    'admin',
    'laborant',
    'teacher'
);

-- ============================================================
-- СОЗДАНИЕ ПОСЛЕДОВАТЕЛЬНОСТИ
-- ============================================================

CREATE SEQUENCE inventory_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ============================================================
-- СОЗДАНИЕ ТАБЛИЦ
-- ============================================================

CREATE TABLE users (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    email character varying(50) NOT NULL,
    firstname character varying(50) NOT NULL,
    lastname character varying(50) NOT NULL,
    role "userRole" DEFAULT 'teacher' NOT NULL,
    "passwordHash" text NOT NULL,
    "passwordShifr" text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    fathername character varying(50)
);

CREATE TABLE "equipmentType" (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name character varying(255) NOT NULL UNIQUE,
    description text,
    "attributesSchema" jsonb[],
    "createdAt" timestamp without time zone DEFAULT now()
);

CREATE TABLE rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    number character varying(6) NOT NULL UNIQUE,
    description text,
    attached_lab_id uuid,
    attached_teacher_id uuid,
    "createdAt" timestamp without time zone DEFAULT now(),
    FOREIGN KEY (attached_lab_id) REFERENCES users(id),
    FOREIGN KEY (attached_teacher_id) REFERENCES users(id)
);

CREATE TABLE equipment_lot (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    lot_number character varying(64) NOT NULL UNIQUE,
    equipment_type_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    quantity integer DEFAULT 1 NOT NULL,
    status lot_status DEFAULT 'draft' NOT NULL,
    supplier character varying(255),
    invoice_number character varying(128),
    unit_price_cents integer,
    accepted_by_id uuid,
    accepted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    FOREIGN KEY (equipment_type_id) REFERENCES "equipmentType"(id),
    FOREIGN KEY (accepted_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE equipment (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    inventory_number character varying(64) DEFAULT ('INV-' || EXTRACT(year FROM now()) || '-' || LPAD(nextval('inventory_number_seq')::text, 10, '0')) NOT NULL UNIQUE,
    qr_code text UNIQUE,
    lot_id uuid,
    equipment_type_id uuid NOT NULL,
    room_id uuid,
    responsible_id uuid,
    name character varying(255) NOT NULL,
    serial_number character varying(128),
    model character varying(255),
    manufacturer character varying(255),
    status equipment_status DEFAULT 'active' NOT NULL,
    attributes jsonb,
    photos jsonb,
    purchased_at timestamp without time zone,
    warranty_until timestamp without time zone,
    written_off_at timestamp without time zone,
    written_off_by_id uuid,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    FOREIGN KEY (lot_id) REFERENCES equipment_lot(id) ON DELETE RESTRICT,
    FOREIGN KEY (equipment_type_id) REFERENCES "equipmentType"(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (responsible_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (written_off_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE equipment_movement (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    equipment_id uuid NOT NULL,
    from_room_id uuid,
    to_room_id uuid,
    moved_by_id uuid,
    reason text,
    moved_at timestamp without time zone DEFAULT now() NOT NULL,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (from_room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (to_room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (moved_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    type request_type NOT NULL,
    priority request_priority DEFAULT 'medium',
    status request_status DEFAULT 'pending',
    equipment_id uuid,
    created_by_id uuid NOT NULL,
    assigned_to_id uuid,
    attachments text[],
    admin_comment text,
    resolution text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved_at timestamp without time zone,
    deadline timestamp without time zone,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    token_hash text NOT NULL UNIQUE,
    user_agent text,
    ip text,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE request_status_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    request_id uuid NOT NULL,
    old_status character varying,
    new_status character varying,
    changed_by uuid,
    changed_at timestamp without time zone DEFAULT now(),
    notes text
);

-- ============================================================
-- СОЗДАНИЕ ФУНКЦИЙ И ТРИГГЕРОВ
-- ============================================================

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для updated_at
CREATE TRIGGER trigger_update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_equipment_lot_updated_at BEFORE UPDATE ON equipment_lot FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_requests_updated_at BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция обновления статуса оборудования при создании заявки
CREATE OR REPLACE FUNCTION update_equipment_status_on_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'repair' AND NEW.equipment_id IS NOT NULL THEN
    UPDATE equipment 
    SET status = 'maintenance', updated_at = NOW()
    WHERE id = NEW.equipment_id 
      AND status = 'active';
    
    UPDATE equipment 
    SET notes = COALESCE(notes, '') || E'\n' || 'Заявка на ремонт #' || NEW.id::TEXT || ' от ' || NEW.created_at::TEXT
    WHERE id = NEW.equipment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_equipment_status_on_request AFTER INSERT ON requests FOR EACH ROW EXECUTE FUNCTION update_equipment_status_on_request();

-- Функция логирования изменения статуса
CREATE OR REPLACE FUNCTION log_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO request_status_log (request_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, OLD.status::TEXT, NEW.status::TEXT, NEW.assigned_to_id, 
            'Статус изменен с ' || OLD.status::TEXT || ' на ' || NEW.status::TEXT);
    
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      NEW.resolved_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_request_status_change BEFORE UPDATE OF status ON requests FOR EACH ROW EXECUTE FUNCTION log_request_status_change();

-- Функция проверки уникальности инвентарного номера
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

CREATE TRIGGER trigger_check_inventory_number_unique BEFORE INSERT OR UPDATE OF inventory_number ON equipment FOR EACH ROW EXECUTE FUNCTION check_inventory_number_unique();

-- Функция логирования перемещения комнаты
CREATE OR REPLACE FUNCTION log_equipment_room_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.room_id IS DISTINCT FROM NEW.room_id THEN
    INSERT INTO equipment_movement (
      equipment_id, from_room_id, to_room_id, moved_by_id, reason, moved_at
    ) VALUES (
      NEW.id, OLD.room_id, NEW.room_id, NEW.responsible_id,
      COALESCE(NEW.notes, 'Автоматическая запись о перемещении'), NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_equipment_room_change BEFORE UPDATE OF room_id ON equipment FOR EACH ROW EXECUTE FUNCTION log_equipment_room_change();

-- ============================================================
-- ВСТАВКА ДАННЫХ
-- ============================================================

-- Пользователи
INSERT INTO users (id, email, firstname, lastname, role, "passwordHash", "passwordShifr", is_active, created_at, fathername) VALUES
('0b598aaf-4284-4158-9a7a-a583237bf7a5', 'artem@mail.ru', 'Артем', 'Удалов', 'teacher', '$2b$12$XWJjSSx1Nv/7CcM2QVW83eCSvp7JASeeInlnqS7VazX7llNXRfeD.', '', true, '2026-04-27 18:54:44.593897', NULL),
('d06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'maxim@mail.ru', 'Максим', 'Михеев', 'laborant', '$2b$12$FtCJLlCRAuxonqTuWI5n4uJHApJHsVnhahu7kFGwaKT7ijhPBlinS', '', true, '2026-04-27 18:56:55.791008', 'Денисович'),
('f018ae34-aed7-4a7e-9113-570913e837c3', 'lr@mail.ru', 'Лариса', 'Цымбалюк', 'teacher', '$2b$12$JCVLsLf3ywQ0x41yh1Rb9OPMOk2VrsvX5Cc4CZJqjmDp3Dk51./D.', '', true, '2026-04-29 09:10:04.647095', 'Николаевна'),
('bd6a65ab-9556-4921-b66b-0dc971b14b7d', 'fedor@mail.ru', 'Федор', 'Железков', 'laborant', '$2b$12$VNt7iLf7FSxqVxPNHvFOweUxrAYtkJgaYXJkjc/CW1rLHaK35s6XG', '', true, '2026-04-29 09:10:33.595588', NULL),
('f17221e9-da31-43b0-9c20-bf82d1695aae', 'tim@mail.ru', 'Тимофей', 'Соколов', 'laborant', '$2b$12$fDav5pgAh2VRK8pLqDG95ubTOYzgRERA8ik342mWYpA2bOICIN1ZG', '', true, '2026-04-29 09:10:58.140505', NULL),
('c03ed991-9575-442f-82ed-d7fcc3a3cdfd', 'egor@mail.ru', 'Егор', 'Русин', 'laborant', '$2b$12$nrRlvd5SKbPyO.cfDsBQbe3EoN6OrX6m1Q1T6GgjB.uOM3QvMsOku', '', true, '2026-04-29 09:11:24.145345', NULL),
('77f1c88c-4ae1-4350-bc98-fe3422e73f88', 'maxy@mail.ru', 'Максим', 'Юфриков', 'laborant', '$2b$12$J2fahHvMWK.vp9rWNSBuAer2ra6P2Z4e8U9Bn7OeUe/fVvy7j4L82', '', true, '2026-04-29 09:12:01.290162', 'Игоревич'),
('28c1d963-f50c-4dbe-ba09-2e9a175facf5', 'mih@mail.ru', 'Михаил', 'Богданов', 'teacher', '$2b$12$nq36ebpK4jeC3B2kw2H8.uYWFWQme7jUt4OgI6mgilbjHJbj8SG6C', '', true, '2026-04-29 09:12:31.080896', 'Михайлович'),
('039e259e-d942-464d-a4a8-fefe0f84fd27', 'burbax@mail.ru', 'Владмир', 'Бурбах', 'teacher', '$2b$12$zpu0cYYit1JgaM35ArjM8ezlfzGJCV1yMWw7dTJkyPeqsqsph0Vey', '', true, '2026-04-29 09:13:16.871637', 'Витальевич'),
('97de0af3-e4d1-4023-8cb2-8e1ed0c8db49', 'admin@novsu.ru', 'Илья', 'Барышников', 'admin', '$2b$10$Ggcmy8440OcYI6hUMoFnJ.K3kJAhZwSaFNolzbirtFYTaWkgvqmYq', '14a2cc05c4b9684fb200dd3407e20fd1:b40af51d519fdbb1ccace1c3e9fefea1', true, '2026-04-07 15:21:02.818648', 'Игоревич');

-- Типы оборудования
INSERT INTO "equipmentType" (id, name, description, "attributesSchema", "createdAt") VALUES
('9e76be83-ea3b-41d8-bc55-4e231c692f4d', 'Ноутбук', 'Портативный компьютер для работы и учебы', ARRAY[
    '{"name": "processor", "type": "string", "label": "Процессор", "required": true}',
    '{"name": "ram", "type": "string", "unit": "ГБ", "label": "Оперативная память", "required": true}',
    '{"name": "storage", "type": "string", "unit": "ГБ", "label": "Накопитель", "required": true}',
    '{"name": "screen_size", "type": "string", "unit": "дюймов", "label": "Диагональ экрана", "required": true}',
    '{"name": "os", "type": "select", "label": "Операционная система", "options": ["Windows 11 Pro", "Windows 11 Home", "Linux Ubuntu", "macOS"], "required": true}'
]::jsonb[], '2026-05-10 02:57:28.217492'),
('fd8daaee-bc62-4789-b698-da5df6d2dec2', 'Проектор', 'Мультимедийный проектор для презентаций', ARRAY[
    '{"name": "brightness", "type": "number", "unit": "ANSI люмен", "label": "Яркость", "required": true}',
    '{"name": "resolution", "type": "select", "label": "Разрешение", "options": ["XGA (1024x768)", "WXGA (1280x800)", "Full HD (1920x1080)", "4K (3840x2160)"], "required": true}',
    '{"name": "lamp_life", "type": "number", "unit": "часов", "label": "Ресурс лампы", "required": true}',
    '{"name": "contrast", "type": "string", "unit": ":1", "label": "Контрастность", "required": true}',
    '{"name": "throw_ratio", "type": "string", "label": "Проекционное отношение", "required": true}'
]::jsonb[], '2026-05-10 02:57:28.217492'),
('a33a2784-489d-45a1-9774-c0e5698c564c', 'МФУ', 'Принтер, сканер, копир в одном устройстве', ARRAY[
    '{"name": "print_speed", "type": "number", "unit": "стр/мин", "label": "Скорость печати", "required": true}',
    '{"name": "print_resolution", "type": "string", "unit": "dpi", "label": "Разрешение печати", "required": true}',
    '{"name": "print_technology", "type": "select", "label": "Технология печати", "options": ["Лазерная", "Струйная", "Светодиодная"], "required": true}',
    '{"name": "paper_size", "type": "select", "label": "Максимальный формат", "options": ["A4", "A3"], "required": true}',
    '{"name": "color_print", "type": "boolean", "label": "Цветная печать", "required": true}'
]::jsonb[], '2026-05-10 02:57:28.217492'),
('f85e5639-7e45-4efb-ac32-2f737a25a9dd', 'Интерактивная панель', 'Сенсорная панель для презентаций и занятий', ARRAY[
    '{"name": "screen_size", "type": "number", "unit": "дюймов", "label": "Диагональ экрана", "required": true}',
    '{"name": "touch_points", "type": "number", "unit": "точек", "label": "Количество касаний", "required": true}',
    '{"name": "resolution", "type": "string", "label": "Разрешение", "required": true}',
    '{"name": "panel_type", "type": "select", "label": "Тип панели", "options": ["LCD", "LED", "OLED"], "required": true}',
    '{"name": "os", "type": "select", "label": "Встроенная ОС", "options": ["Android", "Windows", "Без ОС"], "required": true}'
]::jsonb[], '2026-05-10 02:57:28.217492'),
('fd2b7100-3410-4909-9823-f765217549ee', 'Компьютер', 'Стационарный компьютер', ARRAY[
    '{"name": "processor", "type": "string", "label": "Процессор", "required": true}',
    '{"name": "ram", "type": "string", "unit": "ГБ", "label": "Оперативная память", "required": true}',
    '{"name": "storage", "type": "string", "unit": "ГБ", "label": "Накопитель", "required": true}',
    '{"name": "graphics", "type": "string", "label": "Видеокарта", "required": true}',
    '{"name": "os", "type": "select", "label": "Операционная система", "options": ["Windows 11 Pro", "Windows 10 Pro", "Linux"], "required": true}'
]::jsonb[], '2026-05-10 02:57:28.217492'),
('0be9ba92-65d8-48a5-855f-57e189bbf27a', 'Монитор', 'Компьютерный дисплей', ARRAY[
    '{"name": "size", "type": "number", "unit": "дюймов", "label": "Диагональ", "required": true}',
    '{"name": "resolution", "type": "string", "label": "Разрешение", "required": true}',
    '{"name": "matrix_type", "type": "select", "label": "Тип матрицы", "options": ["IPS", "TN", "VA", "OLED"], "required": true}',
    '{"name": "refresh_rate", "type": "number", "unit": "Гц", "label": "Частота обновления", "required": true}',
    '{"name": "response_time", "type": "number", "unit": "мс", "label": "Время отклика", "required": true}'
]::jsonb[], '2026-05-10 02:57:28.217492'),
('639d6f60-e67c-46f6-9c51-676b9640f18c', 'Принтер', 'Устройство для печати', ARRAY[
    '{"name": "print_speed", "type": "number", "unit": "стр/мин", "label": "Скорость печати", "required": true}',
    '{"name": "print_technology", "type": "select", "label": "Технология печати", "options": ["Лазерная", "Струйная", "Термопечать"], "required": true}',
    '{"name": "color_print", "type": "boolean", "label": "Цветная печать", "required": true}',
    '{"name": "duplex", "type": "boolean", "label": "Автоматическая двусторонняя печать", "required": true}',
    '{"name": "paper_capacity", "type": "number", "unit": "листов", "label": "Вместимость лотка", "required": true}'
]::jsonb[], '2026-05-10 02:57:28.217492'),
('5eb3b67a-6d78-4fe8-ba25-43499bd80504', 'Планшет', 'Портативное устройство с сенсорным экраном', ARRAY[
    '{"name": "screen_size", "type": "number", "unit": "дюймов", "label": "Диагональ экрана", "required": true}',
    '{"name": "storage", "type": "number", "unit": "ГБ", "label": "Встроенная память", "required": true}',
    '{"name": "ram", "type": "number", "unit": "ГБ", "label": "Оперативная память", "required": true}',
    '{"name": "os", "type": "select", "label": "Операционная система", "options": ["iPadOS", "Android", "Windows"], "required": true}',
    '{"name": "has_stylus", "type": "boolean", "label": "Поддержка стилуса", "required": true}'
]::jsonb[], '2026-05-10 02:57:28.217492'),
('b678f155-a918-408a-8a9a-dfd8b66c7155', 'Документ-камера', 'Устройство для демонстрации документов', ARRAY[
    '{"name": "sensor", "type": "string", "unit": "МП", "label": "Сенсор", "required": true}',
    '{"name": "zoom", "type": "number", "unit": "x", "label": "Оптический зум", "required": true}',
    '{"name": "resolution", "type": "string", "label": "Разрешение", "required": true}',
    '{"name": "lighting", "type": "boolean", "label": "Подсветка", "required": true}',
    '{"name": "focus", "type": "select", "label": "Тип фокуса", "options": ["Автофокус", "Ручной", "Авто и ручной"], "required": true}'
]::jsonb[], '2026-05-10 02:57:28.217492'),
('f061b0ef-09ca-4ab6-859e-83c23aa04666', 'Акустическая система', 'Колонки для воспроизведения звука', ARRAY[
    '{"name": "power", "type": "number", "unit": "Вт", "label": "Мощность", "required": true}',
    '{"name": "channels", "type": "string", "label": "Количество каналов", "required": true}',
    '{"name": "frequency", "type": "string", "unit": "Гц", "label": "Диапазон частот", "required": true}',
    '{"name": "bluetooth", "type": "boolean", "label": "Bluetooth", "required": true}',
    '{"name": "connection", "type": "select", "label": "Тип подключения", "options": ["Проводная", "Беспроводная", "Гибридная"], "required": true}'
]::jsonb[], '2026-05-10 02:57:28.217492');

-- Кабинеты
INSERT INTO rooms (id, number, description, attached_lab_id, attached_teacher_id, "createdAt") VALUES
('267b8b01-b18d-4915-8f9e-e91d4d57df0f', '101', 'Компьютерный класс', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', '0b598aaf-4284-4158-9a7a-a583237bf7a5', '2026-05-10 02:57:28.217492'),
('c9507c6e-e098-441d-8599-5f46d981a02d', '102', 'Лаборатория физики', 'bd6a65ab-9556-4921-b66b-0dc971b14b7d', 'f018ae34-aed7-4a7e-9113-570913e837c3', '2026-05-10 02:57:28.217492'),
('5fdc1701-6340-4e61-af89-503fb583ce93', '103', 'Лекционная аудитория', 'f17221e9-da31-43b0-9c20-bf82d1695aae', '28c1d963-f50c-4dbe-ba09-2e9a175facf5', '2026-05-10 02:57:28.217492'),
('c90a3a9e-ba0a-41a2-855c-c29f97792116', '104', 'Кабинет информатики', 'c03ed991-9575-442f-82ed-d7fcc3a3cdfd', '039e259e-d942-464d-a4a8-fefe0f84fd27', '2026-05-10 02:57:28.217492'),
('be7a852c-0206-4c51-966d-2a75d1972b85', '105', 'Мультимедийный класс', '77f1c88c-4ae1-4350-bc98-fe3422e73f88', NULL, '2026-05-10 02:57:28.217492'),
('84c59b67-ba93-4d40-8b2f-99c348518604', '201', 'Лаборатория химии', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', '0b598aaf-4284-4158-9a7a-a583237bf7a5', '2026-05-10 02:57:28.217492'),
('ea40842b-4aab-4926-9030-af4d09b09994', '202', 'Кабинет математики', 'bd6a65ab-9556-4921-b66b-0dc971b14b7d', 'f018ae34-aed7-4a7e-9113-570913e837c3', '2026-05-10 02:57:28.217492'),
('cf116908-2d5e-4837-9a0f-78a6543c1557', '203', 'Актовый зал', 'f17221e9-da31-43b0-9c20-bf82d1695aae', '28c1d963-f50c-4dbe-ba09-2e9a175facf5', '2026-05-10 02:57:28.217492'),
('02ad1543-dc69-4012-8293-913dec233f9a', '204', 'Библиотека', 'c03ed991-9575-442f-82ed-d7fcc3a3cdfd', '039e259e-d942-464d-a4a8-fefe0f84fd27', '2026-05-10 02:57:28.217492'),
('d3afae51-f895-4ced-b9d2-20a1d3e0c432', '205', 'Кабинет иностранных языков', '77f1c88c-4ae1-4350-bc98-fe3422e73f88', NULL, '2026-05-10 02:57:28.217492');

-- Партии оборудования
INSERT INTO equipment_lot (id, lot_number, equipment_type_id, name, description, quantity, status, supplier, invoice_number, unit_price_cents, accepted_by_id, accepted_at, created_at, updated_at) VALUES
('e39e201c-5b82-4975-8eb8-a9142fd2a088', 'LOT-2024-001', '9e76be83-ea3b-41d8-bc55-4e231c692f4d', 'Ноутбуки Lenovo ThinkPad', 'Для преподавательского состава', 15, 'accepted', 'ООО Марвел', 'INV-001', 8500000, '97de0af3-e4d1-4023-8cb2-8e1ed0c8db49', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('962a030b-b741-49b0-9dd8-ffc89f56733e', 'LOT-2024-002', '9e76be83-ea3b-41d8-bc55-4e231c692f4d', 'Ноутбуки HP ProBook', 'Для компьютерных классов', 20, 'accepted', 'ООО Компьютеры', 'INV-002', 6500000, '97de0af3-e4d1-4023-8cb2-8e1ed0c8db49', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('d145934f-c068-484b-aad3-4db14b45be1c', 'LOT-2024-003', 'fd8daaee-bc62-4789-b698-da5df6d2dec2', 'Проекторы Epson', 'Для лекционных аудиторий', 10, 'accepted', 'ООО Деловые решения', 'INV-003', 12000000, '97de0af3-e4d1-4023-8cb2-8e1ed0c8db49', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('2a2b8be0-01f9-453c-8167-61c6540492b3', 'LOT-2024-004', 'fd2b7100-3410-4909-9823-f765217549ee', 'Компьютеры Dell OptiPlex', 'Рабочие станции', 25, 'accepted', 'ООО Компьютерный мир', 'INV-004', 4500000, '97de0af3-e4d1-4023-8cb2-8e1ed0c8db49', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('5944c8b5-1d60-403b-860f-b85afbe4b98b', 'LOT-2024-005', '0be9ba92-65d8-48a5-855f-57e189bbf27a', 'Мониторы Samsung', 'Для компьютерных классов', 30, 'accepted', 'ООО Цифровой мир', 'INV-005', 1500000, '97de0af3-e4d1-4023-8cb2-8e1ed0c8db49', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492');

-- Оборудование
INSERT INTO equipment (id, inventory_number, qr_code, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, notes, created_at, updated_at) VALUES
('40b818bb-4453-47c2-b716-692fbe98ec9a', 'NB-001', NULL, 'e39e201c-5b82-4975-8eb8-a9142fd2a088', '9e76be83-ea3b-41d8-bc55-4e231c692f4d', '267b8b01-b18d-4915-8f9e-e91d4d57df0f', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Ноутбук Lenovo T14', 'SN001', 'ThinkPad T14', 'Lenovo', 'maintenance', '{"processor": "Intel Core i7", "ram": "16", "storage": "512", "screen_size": "14", "os": "Windows 11 Pro"}', 'Основной ноутбук', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('c059c699-ea37-4feb-88ce-700772954422', 'NB-002', NULL, 'e39e201c-5b82-4975-8eb8-a9142fd2a088', '9e76be83-ea3b-41d8-bc55-4e231c692f4d', '267b8b01-b18d-4915-8f9e-e91d4d57df0f', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Ноутбук Lenovo E15', 'SN002', 'ThinkPad E15', 'Lenovo', 'active', '{"processor": "Intel Core i5", "ram": "8", "storage": "256", "screen_size": "15.6", "os": "Windows 11 Pro"}', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('2ee07ba0-8ad3-42b5-b4e1-7b846f10e8fa', 'NB-003', NULL, 'e39e201c-5b82-4975-8eb8-a9142fd2a088', '9e76be83-ea3b-41d8-bc55-4e231c692f4d', '267b8b01-b18d-4915-8f9e-e91d4d57df0f', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Ноутбук Lenovo L14', 'SN003', 'ThinkPad L14', 'Lenovo', 'maintenance', '{"processor": "AMD Ryzen 5", "ram": "16", "storage": "512", "screen_size": "14", "os": "Windows 11 Pro"}', 'Замена клавиатуры', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('2ce2e21e-145a-4155-9336-dcb13136c1ac', 'PR-001', NULL, 'd145934f-c068-484b-aad3-4db14b45be1c', 'fd8daaee-bc62-4789-b698-da5df6d2dec2', '267b8b01-b18d-4915-8f9e-e91d4d57df0f', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Проектор Epson EB-695Wi', 'SN-PR001', 'EB-695Wi', 'Epson', 'active', '{"brightness": 3500, "resolution": "WXGA", "lamp_life": 5000, "contrast": "16000:1", "throw_ratio": "0.32:1"}', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('ee35df60-7eb9-42cc-9e2a-90d05c1c54db', 'PR-002', NULL, 'd145934f-c068-484b-aad3-4db14b45be1c', 'fd8daaee-bc62-4789-b698-da5df6d2dec2', 'c9507c6e-e098-441d-8599-5f46d981a02d', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Проектор Epson EB-695Wi', 'SN-PR002', 'EB-695Wi', 'Epson', 'active', '{"brightness": 3500, "resolution": "WXGA", "lamp_life": 4800, "contrast": "16000:1", "throw_ratio": "0.32:1"}', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('157a9de2-8c3b-4738-86f0-ff89a9a8c78e', 'PC-001', NULL, '2a2b8be0-01f9-453c-8167-61c6540492b3', 'fd2b7100-3410-4909-9823-f765217549ee', '267b8b01-b18d-4915-8f9e-e91d4d57df0f', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Компьютер Dell OptiPlex 7090', 'SN-PC001', 'OptiPlex 7090', 'Dell', 'active', '{"processor": "Intel Core i7", "ram": "16", "storage": "512", "graphics": "Intel UHD Graphics", "os": "Windows 11 Pro"}', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('8b4d7603-66d3-40f2-97fa-ad25d371d19e', 'PC-002', NULL, '2a2b8be0-01f9-453c-8167-61c6540492b3', 'fd2b7100-3410-4909-9823-f765217549ee', '267b8b01-b18d-4915-8f9e-e91d4d57df0f', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Компьютер Dell OptiPlex 3090', 'SN-PC002', 'OptiPlex 3090', 'Dell', 'active', '{"processor": "Intel Core i5", "ram": "8", "storage": "256", "graphics": "Intel UHD Graphics", "os": "Windows 11 Pro"}', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('eb4d3e9e-3d1b-4638-8dad-667dbb6260a0', 'PC-003', NULL, '2a2b8be0-01f9-453c-8167-61c6540492b3', 'fd2b7100-3410-4909-9823-f765217549ee', 'c9507c6e-e098-441d-8599-5f46d981a02d', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Компьютер Dell OptiPlex 7090', 'SN-PC003', 'OptiPlex 7090', 'Dell', 'active', '{"processor": "Intel Core i7", "ram": "32", "storage": "1024", "graphics": "NVIDIA Quadro", "os": "Windows 11 Pro"}', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('0fd8497d-280a-4c88-8457-9f95c0d63962', 'MON-001', NULL, '5944c8b5-1d60-403b-860f-b85afbe4b98b', '0be9ba92-65d8-48a5-855f-57e189bbf27a', '267b8b01-b18d-4915-8f9e-e91d4d57df0f', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Монитор Samsung 24"', 'SN-MON001', 'LF24T35', 'Samsung', 'active', '{"size": 24, "resolution": "1920x1080", "matrix_type": "IPS", "refresh_rate": 75, "response_time": 5}', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('84dfa478-c7d7-4644-8149-42d753d69bf7', 'MON-002', NULL, '5944c8b5-1d60-403b-860f-b85afbe4b98b', '0be9ba92-65d8-48a5-855f-57e189bbf27a', '267b8b01-b18d-4915-8f9e-e91d4d57df0f', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Монитор Samsung 24"', 'SN-MON002', 'LF24T35', 'Samsung', 'active', '{"size": 24, "resolution": "1920x1080", "matrix_type": "VA", "refresh_rate": 75, "response_time": 4}', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('1b67a472-65d8-4efe-adf5-9325fed20595', 'MON-003', NULL, '5944c8b5-1d60-403b-860f-b85afbe4b98b', '0be9ba92-65d8-48a5-855f-57e189bbf27a', 'c9507c6e-e098-441d-8599-5f46d981a02d', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Монитор Samsung 24"', 'SN-MON003', 'LF24T35', 'Samsung', 'active', '{"size": 24, "resolution": "1920x1080", "matrix_type": "IPS", "refresh_rate": 75, "response_time": 5}', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('aef33137-4324-481f-aeb7-c83a317e8eb5', 'MON-004', NULL, '5944c8b5-1d60-403b-860f-b85afbe4b98b', '0be9ba92-65d8-48a5-855f-57e189bbf27a', 'c9507c6e-e098-441d-8599-5f46d981a02d', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Монитор Samsung 24"', 'SN-MON004', 'LF24T35', 'Samsung', 'active', '{"size": 24, "resolution": "1920x1080", "matrix_type": "IPS", "refresh_rate": 75, "response_time": 5}', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('cbd1ef96-55e7-401a-a027-5df33abd37ff', 'MON-005', NULL, '5944c8b5-1d60-403b-860f-b85afbe4b98b', '0be9ba92-65d8-48a5-855f-57e189bbf27a', '5fdc1701-6340-4e61-af89-503fb583ce93', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Монитор Samsung 24"', 'SN-MON005', 'LF24T35', 'Samsung', 'active', '{"size": 24, "resolution": "1920x1080", "matrix_type": "VA", "refresh_rate": 75, "response_time": 4}', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492');

-- Заявки
INSERT INTO requests (id, title, description, type, priority, status, equipment_id, created_by_id, admin_comment, created_at, updated_at) VALUES
('e0d97c26-77cf-4e52-a0bc-eb305b3acad9', 'Не работает клавиатура', 'На ноутбуке перестала работать клавиатура', 'repair', 'high', 'pending', '40b818bb-4453-47c2-b716-692fbe98ec9a', '0b598aaf-4284-4158-9a7a-a583237bf7a5', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('3d80f775-5bb6-400d-b0e9-73f91b41a62f', 'Требуется обслуживание проектора', 'Проектор стал тусклым, нужна чистка', 'maintenance', 'medium', 'in_progress', 'c059c699-ea37-4feb-88ce-700772954422', 'd06d5d3b-acf8-4ec0-8778-c78289ef6f16', 'Принято в работу', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('e744dc2e-f8af-4341-8a84-77be33eb5733', 'Замена жесткого диска', 'Компьютер не загружается, нужна диагностика', 'repair', 'urgent', 'pending', '2ee07ba0-8ad3-42b5-b4e1-7b846f10e8fa', 'f018ae34-aed7-4a7e-9113-570913e837c3', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('1deb7076-cbfa-42ee-a76d-f2dac48e9727', 'Перемещение оборудования', 'Перенести компьютер в кабинет 205', 'transfer', 'low', 'approved', '2ce2e21e-145a-4155-9336-dcb13136c1ac', 'bd6a65ab-9556-4921-b66b-0dc971b14b7d', 'Одобрено', '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492'),
('22c8fbc5-7d77-4083-9c01-db47758f10be', 'Списание монитора', 'Монитор не включается', 'write_off', 'medium', 'pending', 'ee35df60-7eb9-42cc-9e2a-90d05c1c54db', 'f17221e9-da31-43b0-9c20-bf82d1695aae', NULL, '2026-05-10 02:57:28.217492', '2026-05-10 02:57:28.217492');

-- ============================================================
-- ИНИЦИАЛИЗАЦИЯ ПОСЛЕДОВАТЕЛЬНОСТИ
-- ============================================================

SELECT setval('inventory_number_seq', 10, true);