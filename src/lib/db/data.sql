-- ============================================================
-- ДОБАВЛЕНИЕ 100 ПОЛЬЗОВАТЕЛЕЙ
-- ============================================================
DO $$
DECLARE
  i INTEGER;
  first_names TEXT[] := ARRAY['Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Иван', 'Евгений', 'Владимир', 'Михаил', 'Николай', 'Павел', 'Роман', 'Тимофей', 'Даниил', 'Матвей', 'Артём', 'Кирилл', 'Никита', 'Илья'];
  last_names TEXT[] := ARRAY['Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Михайлов', 'Новиков', 'Фёдоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семёнов', 'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев'];
  roles TEXT[] := ARRAY['teacher', 'laborant'];
  emails TEXT[];
  current_email TEXT;
BEGIN
  FOR i IN 1..100 LOOP
    -- Генерируем уникальный email
    current_email := LOWER(last_names[(i % 20) + 1]) || '.' || LOWER(first_names[(i % 20) + 1]) || i || '@novsu.ru';
    
    INSERT INTO public.users (id, email, firstname, lastname, role, "passwordHash", "passwordShifr", is_active, created_at, fathername)
    VALUES (
      gen_random_uuid(),
      current_email,
      first_names[(i % 20) + 1],
      last_names[(i % 20) + 1],
      roles[((i % 2) + 1)]::public."userRole",
      '$2b$10$Ggcmy8440OcYI6hUMoFnJ.K3kJAhZwSaFNolzbirtFYTaWkgvqmYq',
      'hash' || i,
      (i % 10 != 0), -- 90% активных
      NOW() - (random() * 365) * INTERVAL '1 day',
      'Отчество ' || i
    );
  END LOOP;
END $$;


-- ============================================================
-- ДОБАВЛЕНИЕ 100 ТИПОВ ОБОРУДОВАНИЯ
-- ============================================================
DO $$
DECLARE
  i INTEGER;
  type_names TEXT[] := ARRAY[
    'Сканер', 'Моноблок', 
    'Микрофон', 
    'Веб-камера', 'Графический планшет', 'Внешний накопитель', 'Сетевое оборудование',
    'Роутер', 'Коммутатор', 'Сервер', 'Клавиатура', 'Мышь', 'Наушники',
    'Колонки', 'Фотокамера', 'Видеокамера', 'Диктофон', 'ТВ-тюнер', 'USB-хаб',
    'Блок питания', 'ИБП', 'Калькулятор', 'Ламинатор', 'Шреддер', 'Резак',
    'Переплетчик', 'Упаковщик', 'Маркиратор', 'Сканер штрих-кода', 'Терминал сбора данных'
  ];
BEGIN
  FOR i IN 1..100 LOOP
    INSERT INTO public."equipmentType" (id, name, description, "attributesSchema", "createdAt")
    VALUES (
      gen_random_uuid(),
      type_names[((i-1) % 40) + 1] || ' ' || i,
      'Описание типа оборудования ' || i,
      ARRAY[
        jsonb_build_object('name', 'param1', 'type', 'string', 'label', 'Параметр 1'),
        jsonb_build_object('name', 'param2', 'type', 'number', 'label', 'Параметр 2', 'unit', 'ед')
      ]::jsonb[],
      NOW() - (random() * 180) * INTERVAL '1 day'
    );
  END LOOP;
END $$;


-- ============================================================
-- ДОБАВЛЕНИЕ 100 КАБИНЕТОВ
-- ============================================================
DO $$
DECLARE
  i INTEGER;
  user_ids UUID[];
  teacher_ids UUID[];
  lab_ids UUID[];
BEGIN
  -- Получаем ID преподавателей и лаборантов
  SELECT ARRAY_AGG(id) INTO teacher_ids FROM public.users WHERE role = 'teacher' LIMIT 20;
  SELECT ARRAY_AGG(id) INTO lab_ids FROM public.users WHERE role = 'laborant' LIMIT 20;
  
  FOR i IN 1..100 LOOP
    INSERT INTO public.rooms (id, number, description, attached_lab_id, attached_teacher_id, "createdAt")
    VALUES (
      gen_random_uuid(),
      (200 + i)::TEXT,
      'Кабинет для занятий №' || i,
      lab_ids[((i-1) % array_length(lab_ids, 1)) + 1],
      teacher_ids[((i-1) % array_length(teacher_ids, 1)) + 1],
      NOW() - (random() * 365) * INTERVAL '1 day'
    );
  END LOOP;
END $$;


-- ============================================================
-- ДОБАВЛЕНИЕ 100 ПАРТИЙ ОБОРУДОВАНИЯ
-- ============================================================
DO $$
DECLARE
  i INTEGER;
  type_ids UUID[];
  user_ids UUID[];
  lot_statuses TEXT[] := ARRAY['accepted', 'accepted', 'accepted', 'draft', 'partial'];
  suppliers TEXT[] := ARRAY['ООО ТехноПарт', 'ООО Компьютерный Мир', 'ООО Цифровые Технологии', 'ООО Офисная Техника', 'ООО Электроника Плюс'];
BEGIN
  SELECT ARRAY_AGG(id) INTO type_ids FROM public."equipmentType";
  SELECT ARRAY_AGG(id) INTO user_ids FROM public.users WHERE role = 'admin' OR role = 'laborant';
  
  FOR i IN 3..100 LOOP
    INSERT INTO public.equipment_lot (
      id, lot_number, equipment_type_id, name, description, quantity, status, 
      supplier, invoice_number, unit_price_cents, accepted_by_id, accepted_at, 
      created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      'LOT-2026-' || LPAD(i::TEXT, 3, '0'),
      type_ids[((i-1) % array_length(type_ids, 1)) + 1],
      'Партия №' || i,
      'Описание партии ' || i,
      5 + (i % 20),
      lot_statuses[((i-1) % 5) + 1]::public.lot_status,
      suppliers[((i-1) % 5) + 1],
      'INV-' || i,
      100000 + (random() * 10000000)::INT,
      user_ids[((i-1) % array_length(user_ids, 1)) + 1],
      CASE WHEN (i % 10 != 0) THEN NOW() - (random() * 180) * INTERVAL '1 day' ELSE NULL END,
      NOW() - (random() * 365) * INTERVAL '1 day',
      NOW() - (random() * 30) * INTERVAL '1 day'
    );
  END LOOP;
END $$;


-- ============================================================
-- ДОБАВЛЕНИЕ 1000 ЕДИНИЦ ОБОРУДОВАНИЯ
-- ============================================================
DO $$
DECLARE
  i INTEGER;
  lot_ids UUID[];
  type_ids UUID[];
  room_ids UUID[];
  user_ids UUID[];
  statuses TEXT[] := ARRAY['active', 'active', 'active', 'maintenance', 'broken', 'reserved'];
  models TEXT[] := ARRAY['Model X1', 'Model X2', 'Pro Max', 'Lite', 'Ultra', 'Basic', 'Advanced', 'Standard'];
  manufacturers TEXT[] := ARRAY['Lenovo', 'HP', 'Dell', 'Apple', 'Asus', 'Acer', 'MSI', 'Xiaomi'];
BEGIN
  SELECT ARRAY_AGG(id) INTO lot_ids FROM public.equipment_lot;
  SELECT ARRAY_AGG(id) INTO type_ids FROM public."equipmentType";
  SELECT ARRAY_AGG(id) INTO room_ids FROM public.rooms;
  SELECT ARRAY_AGG(id) INTO user_ids FROM public.users WHERE role IN ('laborant', 'admin');
  
  FOR i IN 15..1000 LOOP
    INSERT INTO public.equipment (
      id, inventory_number, qr_code, lot_id, equipment_type_id, room_id, responsible_id,
      name, serial_number, model, manufacturer, status, attributes, notes, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      'INV-2026-' || LPAD(i::TEXT, 10, '0'),
      NULL,
      lot_ids[((i-1) % array_length(lot_ids, 1)) + 1],
      type_ids[((i-1) % array_length(type_ids, 1)) + 1],
      room_ids[((i-1) % array_length(room_ids, 1)) + 1],
      user_ids[((i-1) % array_length(user_ids, 1)) + 1],
      'Оборудование ' || i,
      'SN' || LPAD(i::TEXT, 8, '0'),
      models[((i-1) % 8) + 1],
      manufacturers[((i-1) % 8) + 1],
      statuses[((i-1) % 6) + 1]::public.equipment_status,
      jsonb_build_object('param1', 'value' || i, 'param2', i % 100),
      CASE WHEN i % 10 = 0 THEN 'Примечание для оборудования ' || i ELSE NULL END,
      NOW() - (random() * 730) * INTERVAL '1 day',
      NOW() - (random() * 30) * INTERVAL '1 day'
    );
  END LOOP;
END $$;


-- ============================================================
-- ДОБАВЛЕНИЕ 200 ЗАЯВОК
-- ============================================================
DO $$
DECLARE
  i INTEGER;
  equipment_ids UUID[];
  user_ids UUID[];
  request_types TEXT[] := ARRAY['repair', 'maintenance', 'replacement', 'transfer', 'write_off', 'other'];
  statuses TEXT[] := ARRAY['pending', 'pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'];
  priorities TEXT[] := ARRAY['low', 'medium', 'high', 'urgent'];
  titles TEXT[] := ARRAY[
    'Не работает оборудование', 'Требуется обслуживание', 'Необходима замена',
    'Перемещение оборудования', 'Списание техники', 'Проблемы с софтом',
    'Шумит при работе', 'Перегрев', 'Не включается', 'Зависает'
  ];
BEGIN
  SELECT ARRAY_AGG(id) INTO equipment_ids FROM public.equipment;
  SELECT ARRAY_AGG(id) INTO user_ids FROM public.users;
  
  FOR i IN 1..200 LOOP
    INSERT INTO public.requests (
      id, title, description, type, priority, status, equipment_id, created_by_id, 
      assigned_to_id, admin_comment, resolution, created_at, updated_at, resolved_at
    )
    VALUES (
      gen_random_uuid(),
      titles[((i-1) % 10) + 1] || ' ' || i,
      'Подробное описание заявки №' || i || '. Проблема требует внимания специалиста.',
      request_types[((i-1) % 6) + 1]::public.request_type,
      priorities[((i-1) % 4) + 1]::public.request_priority,
      statuses[((i-1) % 7) + 1]::public.request_status,
      equipment_ids[((i-1) % array_length(equipment_ids, 1)) + 1],
      user_ids[((i-1) % array_length(user_ids, 1)) + 1],
      user_ids[((i-1) % array_length(user_ids, 1)) + 1],
      CASE WHEN i % 5 = 0 THEN 'Комментарий администратора для заявки ' || i ELSE NULL END,
      CASE WHEN statuses[((i-1) % 7) + 1] IN ('completed', 'rejected') THEN 'Решение по заявке ' || i ELSE NULL END,
      NOW() - (random() * 180) * INTERVAL '1 day',
      NOW() - (random() * 30) * INTERVAL '1 day',
      CASE WHEN statuses[((i-1) % 7) + 1] IN ('completed', 'rejected') 
           THEN NOW() - (random() * 60) * INTERVAL '1 day' 
           ELSE NULL END
    );
  END LOOP;
END $$;


-- ============================================================
-- ДОБАВЛЕНИЕ 300 ПЕРЕМЕЩЕНИЙ ОБОРУДОВАНИЯ
-- ============================================================
DO $$
DECLARE
  i INTEGER;
  equipment_ids UUID[];
  room_ids UUID[];
  user_ids UUID[];
  reasons TEXT[] := ARRAY[
    'Плановое перемещение', 'Ремонт', 'Временное размещение', 
    'Переезд кабинета', 'Замена оборудования', 'Техническое обслуживание'
  ];
BEGIN
  -- Получаем ID оборудования, кабинетов и пользователей
  SELECT ARRAY_AGG(id) INTO equipment_ids FROM public.equipment;
  SELECT ARRAY_AGG(id) INTO room_ids FROM public.rooms;
  SELECT ARRAY_AGG(id) INTO user_ids FROM public.users WHERE role IN ('admin', 'laborant');
  
  FOR i IN 1..300 LOOP
    INSERT INTO public.equipment_movement (
      id, equipment_id, from_room_id, to_room_id, moved_by_id, reason, moved_at
    )
    VALUES (
      gen_random_uuid(),
      equipment_ids[((i-1) % array_length(equipment_ids, 1)) + 1],
      room_ids[((i-1) % array_length(room_ids, 1)) + 1],
      room_ids[((i*3) % array_length(room_ids, 1)) + 1],
      user_ids[((i-1) % array_length(user_ids, 1)) + 1],
      reasons[((i-1) % 6) + 1] || ' ' || i,
      NOW() - (random() * 365) * INTERVAL '1 day'
    );
  END LOOP;
END $$;


-- ============================================================
-- ДОБАВЛЕНИЕ 200 СЕССИЙ ПОЛЬЗОВАТЕЛЕЙ
-- ============================================================
DO $$
DECLARE
  i INTEGER;
  user_ids UUID[];
  user_agents TEXT[] := ARRAY[
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148'
  ];
BEGIN
  SELECT ARRAY_AGG(id) INTO user_ids FROM public.users;
  
  FOR i IN 1..200 LOOP
    INSERT INTO public.sessions (
      id, user_id, token_hash, user_agent, ip, expires_at, created_at
    )
    VALUES (
      gen_random_uuid(),
      user_ids[((i-1) % array_length(user_ids, 1)) + 1],
      encode(sha256(('token_' || i || '_' || random()::TEXT)::BYTEA), 'hex'),
      user_agents[((i-1) % 4) + 1],
      '192.168.' || (i % 255) || '.' || ((i*2) % 255),
      NOW() + INTERVAL '7 days',
      NOW() - (random() * 30) * INTERVAL '1 day'
    );
  END LOOP;
END $$;


-- ============================================================
-- ДОБАВЛЕНИЕ ЗАПИСЕЙ В ЛОГ СТАТУСОВ ЗАЯВОК
-- ============================================================
DO $$
DECLARE
  i INTEGER;
  request_ids UUID[];
  user_ids UUID[];
  old_statuses TEXT[] := ARRAY['pending', 'approved', 'in_progress', 'rejected'];
  new_statuses TEXT[] := ARRAY['approved', 'in_progress', 'completed', 'cancelled'];
BEGIN
  SELECT ARRAY_AGG(id) INTO request_ids FROM public.requests WHERE status != 'draft';
  SELECT ARRAY_AGG(id) INTO user_ids FROM public.users;
  
  FOR i IN 1..500 LOOP
    INSERT INTO request_status_log (
      id, request_id, old_status, new_status, changed_by, changed_at, notes
    )
    VALUES (
      gen_random_uuid(),
      request_ids[((i-1) % array_length(request_ids, 1)) + 1],
      old_statuses[((i-1) % 4) + 1],
      new_statuses[((i-1) % 4) + 1],
      user_ids[((i-1) % array_length(user_ids, 1)) + 1],
      NOW() - (random() * 180) * INTERVAL '1 day',
      'Статус изменен автоматически'
    );
  END LOOP;
END $$;

-- ============================================================
-- ДОБАВЛЕНИЕ ТИПОВ ОБОРУДОВАНИЯ С ХАРАКТЕРИСТИКАМИ
-- ============================================================

-- 1. Ноутбук
INSERT INTO public."equipmentType" (id, name, description, "attributesSchema", "createdAt") VALUES (
  gen_random_uuid(),
  'Ноутбук',
  'Портативный компьютер для работы и учебы',
  ARRAY[
    jsonb_build_object('name', 'processor', 'label', 'Процессор', 'type', 'string', 'required', true),
    jsonb_build_object('name', 'ram', 'label', 'Оперативная память', 'type', 'string', 'unit', 'ГБ', 'required', true),
    jsonb_build_object('name', 'storage', 'label', 'Накопитель', 'type', 'string', 'unit', 'ГБ', 'required', true),
    jsonb_build_object('name', 'screen_size', 'label', 'Диагональ экрана', 'type', 'string', 'unit', 'дюймов', 'required', true),
    jsonb_build_object('name', 'os', 'label', 'Операционная система', 'type', 'select', 'options', ARRAY['Windows 11 Pro', 'Windows 11 Home', 'Linux Ubuntu', 'macOS'], 'required', true)
  ]::jsonb[],
  NOW()
);

-- 2. Проектор
INSERT INTO public."equipmentType" (id, name, description, "attributesSchema", "createdAt") VALUES (
  gen_random_uuid(),
  'Проектор',
  'Мультимедийный проектор для презентаций',
  ARRAY[
    jsonb_build_object('name', 'brightness', 'label', 'Яркость', 'type', 'number', 'unit', 'ANSI люмен', 'required', true),
    jsonb_build_object('name', 'resolution', 'label', 'Разрешение', 'type', 'select', 'options', ARRAY['XGA (1024x768)', 'WXGA (1280x800)', 'Full HD (1920x1080)', '4K (3840x2160)'], 'required', true),
    jsonb_build_object('name', 'lamp_life', 'label', 'Ресурс лампы', 'type', 'number', 'unit', 'часов', 'required', true),
    jsonb_build_object('name', 'contrast', 'label', 'Контрастность', 'type', 'string', 'unit', ':1', 'required', true),
    jsonb_build_object('name', 'throw_ratio', 'label', 'Проекционное отношение', 'type', 'string', 'required', true)
  ]::jsonb[],
  NOW()
);

-- 3. МФУ (Многофункциональное устройство)
INSERT INTO public."equipmentType" (id, name, description, "attributesSchema", "createdAt") VALUES (
  gen_random_uuid(),
  'МФУ',
  'Принтер, сканер, копир в одном устройстве',
  ARRAY[
    jsonb_build_object('name', 'print_speed', 'label', 'Скорость печати', 'type', 'number', 'unit', 'стр/мин', 'required', true),
    jsonb_build_object('name', 'print_resolution', 'label', 'Разрешение печати', 'type', 'string', 'unit', 'dpi', 'required', true),
    jsonb_build_object('name', 'print_technology', 'label', 'Технология печати', 'type', 'select', 'options', ARRAY['Лазерная', 'Струйная', 'Светодиодная'], 'required', true),
    jsonb_build_object('name', 'paper_size', 'label', 'Максимальный формат', 'type', 'select', 'options', ARRAY['A4', 'A3'], 'required', true),
    jsonb_build_object('name', 'color_print', 'label', 'Цветная печать', 'type', 'boolean', 'required', true)
  ]::jsonb[],
  NOW()
);

-- 4. Интерактивная панель
INSERT INTO public."equipmentType" (id, name, description, "attributesSchema", "createdAt") VALUES (
  gen_random_uuid(),
  'Интерактивная панель',
  'Сенсорная панель для презентаций и занятий',
  ARRAY[
    jsonb_build_object('name', 'screen_size', 'label', 'Диагональ экрана', 'type', 'number', 'unit', 'дюймов', 'required', true),
    jsonb_build_object('name', 'touch_points', 'label', 'Количество касаний', 'type', 'number', 'unit', 'точек', 'required', true),
    jsonb_build_object('name', 'resolution', 'label', 'Разрешение', 'type', 'string', 'required', true),
    jsonb_build_object('name', 'panel_type', 'label', 'Тип панели', 'type', 'select', 'options', ARRAY['LCD', 'LED', 'OLED'], 'required', true),
    jsonb_build_object('name', 'os', 'label', 'Встроенная ОС', 'type', 'select', 'options', ARRAY['Android', 'Windows', 'Без ОС'], 'required', true)
  ]::jsonb[],
  NOW()
);

-- 5. Компьютер (системный блок)
INSERT INTO public."equipmentType" (id, name, description, "attributesSchema", "createdAt") VALUES (
  gen_random_uuid(),
  'Компьютер',
  'Стационарный компьютер',
  ARRAY[
    jsonb_build_object('name', 'processor', 'label', 'Процессор', 'type', 'string', 'required', true),
    jsonb_build_object('name', 'ram', 'label', 'Оперативная память', 'type', 'string', 'unit', 'ГБ', 'required', true),
    jsonb_build_object('name', 'storage', 'label', 'Накопитель', 'type', 'string', 'unit', 'ГБ', 'required', true),
    jsonb_build_object('name', 'graphics', 'label', 'Видеокарта', 'type', 'string', 'required', true),
    jsonb_build_object('name', 'os', 'label', 'Операционная система', 'type', 'select', 'options', ARRAY['Windows 11 Pro', 'Windows 10 Pro', 'Linux'], 'required', true)
  ]::jsonb[],
  NOW()
);

-- 6. Монитор
INSERT INTO public."equipmentType" (id, name, description, "attributesSchema", "createdAt") VALUES (
  gen_random_uuid(),
  'Монитор',
  'Компьютерный дисплей',
  ARRAY[
    jsonb_build_object('name', 'size', 'label', 'Диагональ', 'type', 'number', 'unit', 'дюймов', 'required', true),
    jsonb_build_object('name', 'resolution', 'label', 'Разрешение', 'type', 'string', 'required', true),
    jsonb_build_object('name', 'matrix_type', 'label', 'Тип матрицы', 'type', 'select', 'options', ARRAY['IPS', 'TN', 'VA', 'OLED'], 'required', true),
    jsonb_build_object('name', 'refresh_rate', 'label', 'Частота обновления', 'type', 'number', 'unit', 'Гц', 'required', true),
    jsonb_build_object('name', 'response_time', 'label', 'Время отклика', 'type', 'number', 'unit', 'мс', 'required', true)
  ]::jsonb[],
  NOW()
);

-- 7. Принтер
INSERT INTO public."equipmentType" (id, name, description, "attributesSchema", "createdAt") VALUES (
  gen_random_uuid(),
  'Принтер',
  'Устройство для печати',
  ARRAY[
    jsonb_build_object('name', 'print_speed', 'label', 'Скорость печати', 'type', 'number', 'unit', 'стр/мин', 'required', true),
    jsonb_build_object('name', 'print_technology', 'label', 'Технология печати', 'type', 'select', 'options', ARRAY['Лазерная', 'Струйная', 'Термопечать'], 'required', true),
    jsonb_build_object('name', 'color_print', 'label', 'Цветная печать', 'type', 'boolean', 'required', true),
    jsonb_build_object('name', 'duplex', 'label', 'Автоматическая двусторонняя печать', 'type', 'boolean', 'required', true),
    jsonb_build_object('name', 'paper_capacity', 'label', 'Вместимость лотка', 'type', 'number', 'unit', 'листов', 'required', true)
  ]::jsonb[],
  NOW()
);

-- 8. Планшет
INSERT INTO public."equipmentType" (id, name, description, "attributesSchema", "createdAt") VALUES (
  gen_random_uuid(),
  'Планшет',
  'Портативное устройство с сенсорным экраном',
  ARRAY[
    jsonb_build_object('name', 'screen_size', 'label', 'Диагональ экрана', 'type', 'number', 'unit', 'дюймов', 'required', true),
    jsonb_build_object('name', 'storage', 'label', 'Встроенная память', 'type', 'number', 'unit', 'ГБ', 'required', true),
    jsonb_build_object('name', 'ram', 'label', 'Оперативная память', 'type', 'number', 'unit', 'ГБ', 'required', true),
    jsonb_build_object('name', 'os', 'label', 'Операционная система', 'type', 'select', 'options', ARRAY['iPadOS', 'Android', 'Windows'], 'required', true),
    jsonb_build_object('name', 'has_stylus', 'label', 'Поддержка стилуса', 'type', 'boolean', 'required', true)
  ]::jsonb[],
  NOW()
);

-- 9. Документ-камера
INSERT INTO public."equipmentType" (id, name, description, "attributesSchema", "createdAt") VALUES (
  gen_random_uuid(),
  'Документ-камера',
  'Устройство для демонстрации документов',
  ARRAY[
    jsonb_build_object('name', 'sensor', 'label', 'Сенсор', 'type', 'string', 'unit', 'МП', 'required', true),
    jsonb_build_object('name', 'zoom', 'label', 'Оптический зум', 'type', 'number', 'unit', 'x', 'required', true),
    jsonb_build_object('name', 'resolution', 'label', 'Разрешение', 'type', 'string', 'required', true),
    jsonb_build_object('name', 'lighting', 'label', 'Подсветка', 'type', 'boolean', 'required', true),
    jsonb_build_object('name', 'focus', 'label', 'Тип фокуса', 'type', 'select', 'options', ARRAY['Автофокус', 'Ручной', 'Авто и ручной'], 'required', true)
  ]::jsonb[],
  NOW()
);

-- 10. Акустическая система
INSERT INTO public."equipmentType" (id, name, description, "attributesSchema", "createdAt") VALUES (
  gen_random_uuid(),
  'Акустическая система',
  'Колонки для воспроизведения звука',
  ARRAY[
    jsonb_build_object('name', 'power', 'label', 'Мощность', 'type', 'number', 'unit', 'Вт', 'required', true),
    jsonb_build_object('name', 'channels', 'label', 'Количество каналов', 'type', 'string', 'required', true),
    jsonb_build_object('name', 'frequency', 'label', 'Диапазон частот', 'type', 'string', 'unit', 'Гц', 'required', true),
    jsonb_build_object('name', 'bluetooth', 'label', 'Bluetooth', 'type', 'boolean', 'required', true),
    jsonb_build_object('name', 'connection', 'label', 'Тип подключения', 'type', 'select', 'options', ARRAY['Проводная', 'Беспроводная', 'Гибридная'], 'required', true)
  ]::jsonb[],
  NOW()
);

-- ============================================================
-- СОЗДАНИЕ ПАРТИЙ ОБОРУДОВАНИЯ
-- ============================================================

-- Получаем ID типов оборудования для связи
DO $$
DECLARE
  laptop_type UUID;
  projector_type UUID;
  mfu_type UUID;
  interactive_type UUID;
  computer_type UUID;
  monitor_type UUID;
  printer_type UUID;
  tablet_type UUID;
  doc_cam_type UUID;
  audio_type UUID;
BEGIN
  SELECT id INTO laptop_type FROM public."equipmentType" WHERE name = 'Ноутбук';
  SELECT id INTO projector_type FROM public."equipmentType" WHERE name = 'Проектор';
  SELECT id INTO mfu_type FROM public."equipmentType" WHERE name = 'МФУ';
  SELECT id INTO interactive_type FROM public."equipmentType" WHERE name = 'Интерактивная панель';
  SELECT id INTO computer_type FROM public."equipmentType" WHERE name = 'Компьютер';
  SELECT id INTO monitor_type FROM public."equipmentType" WHERE name = 'Монитор';
  SELECT id INTO printer_type FROM public."equipmentType" WHERE name = 'Принтер';
  SELECT id INTO tablet_type FROM public."equipmentType" WHERE name = 'Планшет';
  SELECT id INTO doc_cam_type FROM public."equipmentType" WHERE name = 'Документ-камера';
  SELECT id INTO audio_type FROM public."equipmentType" WHERE name = 'Акустическая система';

  -- Партия ноутбуков Lenovo
  INSERT INTO public.equipment_lot (id, lot_number, equipment_type_id, name, description, quantity, status, supplier, invoice_number, unit_price_cents, accepted_by_id, accepted_at) VALUES (
    gen_random_uuid(), 'LOT-NB-2024-001', laptop_type, 'Ноутбуки Lenovo ThinkPad', 'Ноутбуки для преподавательского состава', 15, 'accepted', 'ООО Марвел Дистрибуция', 'INV-001/2024', 8500000, (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), NOW()
  );

  -- Партия ноутбуков HP
  INSERT INTO public.equipment_lot (id, lot_number, equipment_type_id, name, description, quantity, status, supplier, invoice_number, unit_price_cents, accepted_by_id, accepted_at) VALUES (
    gen_random_uuid(), 'LOT-NB-2024-002', laptop_type, 'Ноутбуки HP ProBook', 'Ноутбуки для компьютерных классов', 20, 'accepted', 'ООО Компьютеры и сети', 'INV-002/2024', 6500000, (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), NOW()
  );

  -- Партия проекторов Epson
  INSERT INTO public.equipment_lot (id, lot_number, equipment_type_id, name, description, quantity, status, supplier, invoice_number, unit_price_cents, accepted_by_id, accepted_at) VALUES (
    gen_random_uuid(), 'LOT-PR-2024-001', projector_type, 'Проекторы Epson EB-695Wi', 'Проекторы для лекционных аудиторий', 10, 'accepted', 'ООО Деловые решения', 'INV-003/2024', 12000000, (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), NOW()
  );

  -- Партия МФУ Canon
  INSERT INTO public.equipment_lot (id, lot_number, equipment_type_id, name, description, quantity, status, supplier, invoice_number, unit_price_cents, accepted_by_id, accepted_at) VALUES (
    gen_random_uuid(), 'LOT-MFU-2024-001', mfu_type, 'МФУ Canon i-SENSYS', 'Многофункциональные устройства для администрации', 8, 'accepted', 'ООО Офисная техника', 'INV-004/2024', 2500000, (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), NOW()
  );

  -- Партия интерактивных панелей
  INSERT INTO public.equipment_lot (id, lot_number, equipment_type_id, name, description, quantity, status, supplier, invoice_number, unit_price_cents, accepted_by_id, accepted_at) VALUES (
    gen_random_uuid(), 'LOT-INT-2024-001', interactive_type, 'Интерактивные панели ViewSonic', 'Панели для учебных аудиторий', 5, 'accepted', 'ООО Образовательные технологии', 'INV-005/2024', 18000000, (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), NOW()
  );

  -- Партия компьютеров Dell
  INSERT INTO public.equipment_lot (id, lot_number, equipment_type_id, name, description, quantity, status, supplier, invoice_number, unit_price_cents, accepted_by_id, accepted_at) VALUES (
    gen_random_uuid(), 'LOT-PC-2024-001', computer_type, 'Компьютеры Dell OptiPlex', 'Рабочие станции для лабораторий', 25, 'accepted', 'ООО Компьютерный мир', 'INV-006/2024', 4500000, (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), NOW()
  );

  -- Партия мониторов Samsung
  INSERT INTO public.equipment_lot (id, lot_number, equipment_type_id, name, description, quantity, status, supplier, invoice_number, unit_price_cents, accepted_by_id, accepted_at) VALUES (
    gen_random_uuid(), 'LOT-MON-2024-001', monitor_type, 'Мониторы Samsung LF24T35', 'Мониторы для компьютерных классов', 30, 'accepted', 'ООО Цифровой мир', 'INV-007/2024', 1500000, (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1), NOW()
  );
END $$;

-- ============================================================
-- ДОБАВЛЕНИЕ ОБОРУДОВАНИЯ С КОНКРЕТНЫМИ ХАРАКТЕРИСТИКАМИ
-- ============================================================

DO $$
DECLARE
  lot_nb1 UUID;
  lot_nb2 UUID;
  lot_pr1 UUID;
  lot_mfu1 UUID;
  lot_int1 UUID;
  lot_pc1 UUID;
  lot_mon1 UUID;
  room1 UUID;
  room2 UUID;
  room3 UUID;
  lab_user UUID;
BEGIN
  -- Получаем ID партий
  SELECT id INTO lot_nb1 FROM public.equipment_lot WHERE lot_number = 'LOT-NB-2024-001';
  SELECT id INTO lot_nb2 FROM public.equipment_lot WHERE lot_number = 'LOT-NB-2024-002';
  SELECT id INTO lot_pr1 FROM public.equipment_lot WHERE lot_number = 'LOT-PR-2024-001';
  SELECT id INTO lot_mfu1 FROM public.equipment_lot WHERE lot_number = 'LOT-MFU-2024-001';
  SELECT id INTO lot_int1 FROM public.equipment_lot WHERE lot_number = 'LOT-INT-2024-001';
  SELECT id INTO lot_pc1 FROM public.equipment_lot WHERE lot_number = 'LOT-PC-2024-001';
  SELECT id INTO lot_mon1 FROM public.equipment_lot WHERE lot_number = 'LOT-MON-2024-001';
  
  -- Получаем ID кабинетов
  SELECT id INTO room1 FROM public.rooms LIMIT 1 OFFSET 0;
  SELECT id INTO room2 FROM public.rooms LIMIT 1 OFFSET 1;
  SELECT id INTO room3 FROM public.rooms LIMIT 1 OFFSET 2;
  
  -- Получаем лаборанта для ответственного
  SELECT id INTO lab_user FROM public.users WHERE role = 'laborant' LIMIT 1;
  
  -- ============================================================
  -- НОУТБУКИ LENOVO (5 штук с разными характеристиками)
  -- ============================================================
  
  -- Ноутбук 1 (преподавательский)
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, notes, created_at) VALUES (
    gen_random_uuid(), 'NB-2024-001', lot_nb1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_nb1), room1, lab_user, 'Ноутбук Lenovo ThinkPad T14', 'SN-NB001', 'ThinkPad T14 Gen 3', 'Lenovo', 'active',
    jsonb_build_object('processor', 'Intel Core i7-1260P', 'ram', '16 ГБ', 'storage', '512 ГБ SSD', 'screen_size', '14 дюймов', 'os', 'Windows 11 Pro'),
    'Основной ноутбук для преподавателя информатики', NOW()
  );
  
  -- Ноутбук 2
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, notes, created_at) VALUES (
    gen_random_uuid(), 'NB-2024-002', lot_nb1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_nb1), room1, lab_user, 'Ноутбук Lenovo ThinkPad E15', 'SN-NB002', 'ThinkPad E15 Gen 4', 'Lenovo', 'active',
    jsonb_build_object('processor', 'Intel Core i5-1235U', 'ram', '8 ГБ', 'storage', '256 ГБ SSD', 'screen_size', '15.6 дюймов', 'os', 'Windows 11 Pro'),
    'Для демонстрации учебных материалов', NOW()
  );
  
  -- Ноутбук 3 (с проблемами)
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, notes, created_at) VALUES (
    gen_random_uuid(), 'NB-2024-003', lot_nb1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_nb1), room1, lab_user, 'Ноутбук Lenovo ThinkPad L14', 'SN-NB003', 'ThinkPad L14 Gen 3', 'Lenovo', 'maintenance',
    jsonb_build_object('processor', 'AMD Ryzen 5 Pro 5650U', 'ram', '16 ГБ', 'storage', '512 ГБ SSD', 'screen_size', '14 дюймов', 'os', 'Windows 11 Pro'),
    'Требуется замена клавиатуры', NOW()
  );
  
  -- Ноутбуки HP (2 штуки)
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, notes, created_at) VALUES (
    gen_random_uuid(), 'NB-HP-001', lot_nb2, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_nb2), room2, lab_user, 'Ноутбук HP ProBook 450', 'SN-HP001', 'ProBook 450 G9', 'HP', 'active',
    jsonb_build_object('processor', 'Intel Core i7-1255U', 'ram', '16 ГБ', 'storage', '512 ГБ SSD', 'screen_size', '15.6 дюймов', 'os', 'Windows 11 Pro'),
    'Для лаборатории программирования', NOW()
  );
  
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, notes, created_at) VALUES (
    gen_random_uuid(), 'NB-HP-002', lot_nb2, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_nb2), room2, lab_user, 'Ноутбук HP ProBook 440', 'SN-HP002', 'ProBook 440 G9', 'HP', 'broken',
    jsonb_build_object('processor', 'Intel Core i5-1235U', 'ram', '8 ГБ', 'storage', '256 ГБ SSD', 'screen_size', '14 дюймов', 'os', 'Windows 11 Pro'),
    'Не включается, требуется диагностика', NOW()
  );
  
  -- ============================================================
  -- ПРОЕКТОРЫ (3 штуки)
  -- ============================================================
  
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, created_at) VALUES (
    gen_random_uuid(), 'PR-001', lot_pr1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_pr1), room1, lab_user, 'Проектор Epson EB-695Wi', 'SN-PR001', 'EB-695Wi', 'Epson', 'active',
    jsonb_build_object('brightness', 3500, 'resolution', 'WXGA (1280x800)', 'lamp_life', 5000, 'contrast', '16000:1', 'throw_ratio', '0.32:1'),
    NOW()
  );
  
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, created_at) VALUES (
    gen_random_uuid(), 'PR-002', lot_pr1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_pr1), room2, lab_user, 'Проектор Epson EB-695Wi', 'SN-PR002', 'EB-695Wi', 'Epson', 'active',
    jsonb_build_object('brightness', 3500, 'resolution', 'WXGA (1280x800)', 'lamp_life', 4800, 'contrast', '16000:1', 'throw_ratio', '0.32:1'),
    NOW()
  );
  
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, created_at) VALUES (
    gen_random_uuid(), 'PR-003', lot_pr1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_pr1), room3, lab_user, 'Проектор Epson EB-695Wi', 'SN-PR003', 'EB-695Wi', 'Epson', 'maintenance',
    jsonb_build_object('brightness', 3200, 'resolution', 'WXGA (1280x800)', 'lamp_life', 500, 'contrast', '16000:1', 'throw_ratio', '0.32:1'),
    NOW()
  );
  
  -- ============================================================
  -- КОМПЬЮТЕРЫ (5 штук)
  -- ============================================================
  
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, created_at) VALUES (
    gen_random_uuid(), 'PC-001', lot_pc1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_pc1), room1, lab_user, 'Компьютер Dell OptiPlex 7090', 'SN-PC001', 'OptiPlex 7090 SFF', 'Dell', 'active',
    jsonb_build_object('processor', 'Intel Core i7-11700', 'ram', '16 ГБ', 'storage', '512 ГБ SSD', 'graphics', 'Intel UHD Graphics 750', 'os', 'Windows 11 Pro'),
    NOW()
  );
  
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, created_at) VALUES (
    gen_random_uuid(), 'PC-002', lot_pc1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_pc1), room1, lab_user, 'Компьютер Dell OptiPlex 3090', 'SN-PC002', 'OptiPlex 3090 MT', 'Dell', 'active',
    jsonb_build_object('processor', 'Intel Core i5-10505', 'ram', '8 ГБ', 'storage', '256 ГБ SSD', 'graphics', 'Intel UHD Graphics 630', 'os', 'Windows 11 Pro'),
    NOW()
  );
  
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, created_at) VALUES (
    gen_random_uuid(), 'PC-003', lot_pc1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_pc1), room2, lab_user, 'Компьютер Dell OptiPlex 7090', 'SN-PC003', 'OptiPlex 7090 MT', 'Dell', 'active',
    jsonb_build_object('processor', 'Intel Core i7-11700', 'ram', '32 ГБ', 'storage', '1 ТБ SSD', 'graphics', 'NVIDIA Quadro P400', 'os', 'Windows 11 Pro'),
    NOW()
  );
  
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, created_at) VALUES (
    gen_random_uuid(), 'PC-004', lot_pc1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_pc1), room2, lab_user, 'Компьютер Dell OptiPlex 3090', 'SN-PC004', 'OptiPlex 3090 SFF', 'Dell', 'maintenance',
    jsonb_build_object('processor', 'Intel Core i5-10505', 'ram', '8 ГБ', 'storage', '256 ГБ SSD', 'graphics', 'Intel UHD Graphics 630', 'os', 'Windows 11 Pro'),
    NOW()
  );
  
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, created_at) VALUES (
    gen_random_uuid(), 'PC-005', lot_pc1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_pc1), room3, lab_user, 'Компьютер Dell OptiPlex 7090', 'SN-PC005', 'OptiPlex 7090 SFF', 'Dell', 'active',
    jsonb_build_object('processor', 'Intel Core i7-11700', 'ram', '16 ГБ', 'storage', '512 ГБ SSD', 'graphics', 'Intel UHD Graphics 750', 'os', 'Windows 11 Pro'),
    NOW()
  );
  
  -- ============================================================
  -- МОНИТОРЫ (5 штук, привязаны к компьютерам)
  -- ============================================================
  
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, created_at) VALUES (
    gen_random_uuid(), 'MON-001', lot_mon1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_mon1), room1, lab_user, 'Монитор Samsung LF24T35', 'SN-MON001', 'LF24T35', 'Samsung', 'active',
    jsonb_build_object('size', 24, 'resolution', '1920x1080', 'matrix_type', 'IPS', 'refresh_rate', 75, 'response_time', 5),
    NOW()
  );
  
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, created_at) VALUES (
    gen_random_uuid(), 'MON-002', lot_mon1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_mon1), room1, lab_user, 'Монитор Samsung LF24T35', 'SN-MON002', 'LF24T35', 'Samsung', 'active',
    jsonb_build_object('size', 24, 'resolution', '1920x1080', 'matrix_type', 'VA', 'refresh_rate', 75, 'response_time', 4),
    NOW()
  );
  
  INSERT INTO public.equipment (id, inventory_number, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, created_at) VALUES (
    gen_random_uuid(), 'MON-003', lot_mon1, (SELECT equipment_type_id FROM public.equipment_lot WHERE id = lot_mon1), room2, lab_user, 'Монитор Samsung LF24T35', 'SN-MON003', 'LF24T35', 'Samsung', 'active',
    jsonb_build_object('size', 24, 'resolution', '1920x1080', 'matrix_type', 'IPS', 'refresh_rate', 75, 'response_time', 5),
    NOW()
  );
END $$;