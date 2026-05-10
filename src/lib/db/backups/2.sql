--
-- PostgreSQL database dump
--

\restrict ZfVgoO38gSkMZJH5aFYGmrhmwsCtES3JbC7EOflN8SqODe9YPibhS6nnMPz2XvE

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.6

-- Started on 2026-05-10 03:06:53

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: baryshnikov_ii; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA baryshnikov_ii;


ALTER SCHEMA baryshnikov_ii OWNER TO pg_database_owner;

--
-- TOC entry 5010 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA baryshnikov_ii; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA baryshnikov_ii IS 'standard baryshnikov_ii schema';


--
-- TOC entry 898 (class 1247 OID 124520)
-- Name: equipment_status; Type: TYPE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TYPE baryshnikov_ii.equipment_status AS ENUM (
    'active',
    'maintenance',
    'broken',
    'written_off',
    'reserved'
);


ALTER TYPE baryshnikov_ii.equipment_status OWNER TO postgres;

--
-- TOC entry 901 (class 1247 OID 124532)
-- Name: lot_status; Type: TYPE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TYPE baryshnikov_ii.lot_status AS ENUM (
    'draft',
    'accepted',
    'partial',
    'closed'
);


ALTER TYPE baryshnikov_ii.lot_status OWNER TO postgres;

--
-- TOC entry 913 (class 1247 OID 124643)
-- Name: request_priority; Type: TYPE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TYPE baryshnikov_ii.request_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE baryshnikov_ii.request_priority OWNER TO postgres;

--
-- TOC entry 916 (class 1247 OID 124652)
-- Name: request_status; Type: TYPE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TYPE baryshnikov_ii.request_status AS ENUM (
    'draft',
    'pending',
    'approved',
    'rejected',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE baryshnikov_ii.request_status OWNER TO postgres;

--
-- TOC entry 919 (class 1247 OID 124668)
-- Name: request_type; Type: TYPE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TYPE baryshnikov_ii.request_type AS ENUM (
    'repair',
    'maintenance',
    'replacement',
    'transfer',
    'write_off',
    'other'
);


ALTER TYPE baryshnikov_ii.request_type OWNER TO postgres;

--
-- TOC entry 883 (class 1247 OID 83320)
-- Name: userRole; Type: TYPE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TYPE baryshnikov_ii."userRole" AS ENUM (
    'admin',
    'laborant',
    'teacher'
);


ALTER TYPE baryshnikov_ii."userRole" OWNER TO postgres;

--
-- TOC entry 260 (class 1255 OID 124901)
-- Name: auto_write_off_equipment(integer, text); Type: PROCEDURE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE PROCEDURE baryshnikov_ii.auto_write_off_equipment(IN days_inactive integer DEFAULT 365, IN reason_text text DEFAULT 'Автоматическое списание за неиспользованием'::text)
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


ALTER PROCEDURE baryshnikov_ii.auto_write_off_equipment(IN days_inactive integer, IN reason_text text) OWNER TO postgres;

--
-- TOC entry 245 (class 1255 OID 124922)
-- Name: check_inventory_number_unique(); Type: FUNCTION; Schema: baryshnikov_ii; Owner: postgres
--

CREATE FUNCTION baryshnikov_ii.check_inventory_number_unique() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION baryshnikov_ii.check_inventory_number_unique() OWNER TO postgres;

--
-- TOC entry 261 (class 1255 OID 124902)
-- Name: generate_requests_report(date, date, refcursor); Type: PROCEDURE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE PROCEDURE baryshnikov_ii.generate_requests_report(IN start_date date, IN end_date date, INOUT report_data refcursor)
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


ALTER PROCEDURE baryshnikov_ii.generate_requests_report(IN start_date date, IN end_date date, INOUT report_data refcursor) OWNER TO postgres;

--
-- TOC entry 263 (class 1255 OID 124904)
-- Name: get_maintenance_recommendations(integer); Type: FUNCTION; Schema: baryshnikov_ii; Owner: postgres
--

CREATE FUNCTION baryshnikov_ii.get_maintenance_recommendations(days_threshold integer DEFAULT 30) RETURNS TABLE(equipment_id uuid, equipment_name character varying, inventory_number character varying, equipment_type character varying, room_number character varying, warranty_expires_in_days integer, recommendation text, priority integer)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION baryshnikov_ii.get_maintenance_recommendations(days_threshold integer) OWNER TO postgres;

--
-- TOC entry 262 (class 1255 OID 124903)
-- Name: get_room_equipment_value(uuid); Type: FUNCTION; Schema: baryshnikov_ii; Owner: postgres
--

CREATE FUNCTION baryshnikov_ii.get_room_equipment_value(room_id_param uuid) RETURNS TABLE(status character varying, equipment_count bigint, total_value_cents bigint, avg_value_cents numeric, equipment_list json)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION baryshnikov_ii.get_room_equipment_value(room_id_param uuid) OWNER TO postgres;

--
-- TOC entry 247 (class 1255 OID 124899)
-- Name: get_teacher_equipment_stats(uuid); Type: FUNCTION; Schema: baryshnikov_ii; Owner: postgres
--

CREATE FUNCTION baryshnikov_ii.get_teacher_equipment_stats(teacher_id uuid) RETURNS TABLE(total_equipment bigint, active_count bigint, maintenance_count bigint, broken_count bigint, rooms_count bigint)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION baryshnikov_ii.get_teacher_equipment_stats(teacher_id uuid) OWNER TO postgres;

--
-- TOC entry 259 (class 1255 OID 124900)
-- Name: get_user_requests_history(uuid, integer); Type: FUNCTION; Schema: baryshnikov_ii; Owner: postgres
--

CREATE FUNCTION baryshnikov_ii.get_user_requests_history(user_id uuid, days_back integer DEFAULT 30) RETURNS TABLE(request_id uuid, request_title character varying, equipment_name character varying, status character varying, type character varying, priority character varying, created_at timestamp without time zone, days_ago integer, resolution_time_days numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION baryshnikov_ii.get_user_requests_history(user_id uuid, days_back integer) OWNER TO postgres;

--
-- TOC entry 246 (class 1255 OID 124924)
-- Name: log_equipment_room_change(); Type: FUNCTION; Schema: baryshnikov_ii; Owner: postgres
--

CREATE FUNCTION baryshnikov_ii.log_equipment_room_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION baryshnikov_ii.log_equipment_room_change() OWNER TO postgres;

--
-- TOC entry 244 (class 1255 OID 124920)
-- Name: log_request_status_change(); Type: FUNCTION; Schema: baryshnikov_ii; Owner: postgres
--

CREATE FUNCTION baryshnikov_ii.log_request_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION baryshnikov_ii.log_request_status_change() OWNER TO postgres;

--
-- TOC entry 243 (class 1255 OID 124909)
-- Name: update_equipment_status_on_request(); Type: FUNCTION; Schema: baryshnikov_ii; Owner: postgres
--

CREATE FUNCTION baryshnikov_ii.update_equipment_status_on_request() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION baryshnikov_ii.update_equipment_status_on_request() OWNER TO postgres;

--
-- TOC entry 242 (class 1255 OID 124905)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: baryshnikov_ii; Owner: postgres
--

CREATE FUNCTION baryshnikov_ii.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION baryshnikov_ii.update_updated_at_column() OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 124637)
-- Name: inventory_number_seq; Type: SEQUENCE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE SEQUENCE baryshnikov_ii.inventory_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE baryshnikov_ii.inventory_number_seq OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 124541)
-- Name: equipment; Type: TABLE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TABLE baryshnikov_ii.equipment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    inventory_number character varying(64) DEFAULT ((('INV-'::text || EXTRACT(year FROM now())) || '-'::text) || lpad((nextval('baryshnikov_ii.inventory_number_seq'::regclass))::text, 10, '0'::text)) NOT NULL,
    qr_code text,
    lot_id uuid,
    equipment_type_id uuid NOT NULL,
    room_id uuid,
    responsible_id uuid,
    name character varying(255) NOT NULL,
    serial_number character varying(128),
    model character varying(255),
    manufacturer character varying(255),
    status baryshnikov_ii.equipment_status DEFAULT 'active'::baryshnikov_ii.equipment_status NOT NULL,
    attributes jsonb,
    photos jsonb,
    purchased_at timestamp without time zone,
    warranty_until timestamp without time zone,
    written_off_at timestamp without time zone,
    written_off_by_id uuid,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE baryshnikov_ii.equipment OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 83531)
-- Name: equipmentType; Type: TABLE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TABLE baryshnikov_ii."equipmentType" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    "attributesSchema" jsonb[],
    "createdAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE baryshnikov_ii."equipmentType" OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 124556)
-- Name: equipment_lot; Type: TABLE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TABLE baryshnikov_ii.equipment_lot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lot_number character varying(64) NOT NULL,
    equipment_type_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    quantity integer DEFAULT 1 NOT NULL,
    status baryshnikov_ii.lot_status DEFAULT 'draft'::baryshnikov_ii.lot_status NOT NULL,
    supplier character varying(255),
    invoice_number character varying(128),
    unit_price_cents integer,
    accepted_by_id uuid,
    accepted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE baryshnikov_ii.equipment_lot OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 83543)
-- Name: rooms; Type: TABLE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TABLE baryshnikov_ii.rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    number character varying(6) NOT NULL,
    description text,
    attached_lab_id uuid,
    attached_teacher_id uuid,
    "createdAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE baryshnikov_ii.rooms OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 124841)
-- Name: equipment_by_room; Type: VIEW; Schema: baryshnikov_ii; Owner: postgres
--

CREATE VIEW baryshnikov_ii.equipment_by_room AS
 SELECT r.id AS room_id,
    r.number AS room_number,
    r.description AS room_description,
    count(e.id) AS total_equipment,
    count(
        CASE
            WHEN (e.status = 'active'::baryshnikov_ii.equipment_status) THEN 1
            ELSE NULL::integer
        END) AS active_count,
    count(
        CASE
            WHEN (e.status = 'maintenance'::baryshnikov_ii.equipment_status) THEN 1
            ELSE NULL::integer
        END) AS maintenance_count,
    count(
        CASE
            WHEN (e.status = 'broken'::baryshnikov_ii.equipment_status) THEN 1
            ELSE NULL::integer
        END) AS broken_count,
    count(
        CASE
            WHEN (e.status = 'reserved'::baryshnikov_ii.equipment_status) THEN 1
            ELSE NULL::integer
        END) AS reserved_count,
    count(
        CASE
            WHEN (e.status = 'written_off'::baryshnikov_ii.equipment_status) THEN 1
            ELSE NULL::integer
        END) AS written_off_count,
    COALESCE(sum(el.unit_price_cents), (0)::bigint) AS total_value_cents
   FROM ((baryshnikov_ii.rooms r
     LEFT JOIN baryshnikov_ii.equipment e ON ((e.room_id = r.id)))
     LEFT JOIN baryshnikov_ii.equipment_lot el ON ((e.lot_id = el.id)))
  GROUP BY r.id, r.number, r.description
  ORDER BY (count(e.id)) DESC;


ALTER VIEW baryshnikov_ii.equipment_by_room OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 124846)
-- Name: equipment_by_type; Type: VIEW; Schema: baryshnikov_ii; Owner: postgres
--

CREATE VIEW baryshnikov_ii.equipment_by_type AS
 SELECT et.id AS type_id,
    et.name AS type_name,
    et.description AS type_description,
    count(e.id) AS total_equipment,
    count(
        CASE
            WHEN (e.status = 'active'::baryshnikov_ii.equipment_status) THEN 1
            ELSE NULL::integer
        END) AS active_count,
    count(
        CASE
            WHEN (e.status = 'maintenance'::baryshnikov_ii.equipment_status) THEN 1
            ELSE NULL::integer
        END) AS maintenance_count,
    count(
        CASE
            WHEN (e.status = 'broken'::baryshnikov_ii.equipment_status) THEN 1
            ELSE NULL::integer
        END) AS broken_count,
    count(
        CASE
            WHEN (e.status = 'reserved'::baryshnikov_ii.equipment_status) THEN 1
            ELSE NULL::integer
        END) AS reserved_count,
    count(
        CASE
            WHEN (e.status = 'written_off'::baryshnikov_ii.equipment_status) THEN 1
            ELSE NULL::integer
        END) AS written_off_count
   FROM (baryshnikov_ii."equipmentType" et
     LEFT JOIN baryshnikov_ii.equipment e ON ((e.equipment_type_id = et.id)))
  GROUP BY et.id, et.name, et.description
  ORDER BY (count(e.id)) DESC;


ALTER VIEW baryshnikov_ii.equipment_by_type OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 124570)
-- Name: equipment_movement; Type: TABLE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TABLE baryshnikov_ii.equipment_movement (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    equipment_id uuid NOT NULL,
    from_room_id uuid,
    to_room_id uuid,
    moved_by_id uuid,
    reason text,
    moved_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE baryshnikov_ii.equipment_movement OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 124890)
-- Name: equipment_no_responsible; Type: VIEW; Schema: baryshnikov_ii; Owner: postgres
--

CREATE VIEW baryshnikov_ii.equipment_no_responsible AS
 SELECT e.id,
    e.name,
    e.inventory_number,
    e.status,
    et.name AS equipment_type,
    r.number AS room_number,
    e.created_at
   FROM ((baryshnikov_ii.equipment e
     LEFT JOIN baryshnikov_ii."equipmentType" et ON ((e.equipment_type_id = et.id)))
     LEFT JOIN baryshnikov_ii.rooms r ON ((e.room_id = r.id)))
  WHERE (e.responsible_id IS NULL)
  ORDER BY e.created_at DESC;


ALTER VIEW baryshnikov_ii.equipment_no_responsible OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 124851)
-- Name: equipment_status_stats; Type: VIEW; Schema: baryshnikov_ii; Owner: postgres
--

CREATE VIEW baryshnikov_ii.equipment_status_stats AS
 SELECT status,
    count(*) AS count,
    round((((count(*))::numeric * 100.0) / sum(count(*)) OVER ()), 1) AS percentage
   FROM baryshnikov_ii.equipment
  GROUP BY status
  ORDER BY (count(*)) DESC;


ALTER VIEW baryshnikov_ii.equipment_status_stats OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 124870)
-- Name: equipment_value; Type: VIEW; Schema: baryshnikov_ii; Owner: postgres
--

CREATE VIEW baryshnikov_ii.equipment_value AS
 SELECT et.id AS type_id,
    et.name AS type_name,
    count(e.id) AS equipment_count,
    COALESCE(sum(el.unit_price_cents), (0)::bigint) AS total_value_cents,
    COALESCE(avg(el.unit_price_cents), (0)::numeric) AS avg_value_cents,
    COALESCE(min(el.unit_price_cents), 0) AS min_value_cents,
    COALESCE(max(el.unit_price_cents), 0) AS max_value_cents
   FROM ((baryshnikov_ii."equipmentType" et
     LEFT JOIN baryshnikov_ii.equipment e ON ((e.equipment_type_id = et.id)))
     LEFT JOIN baryshnikov_ii.equipment_lot el ON ((e.lot_id = el.id)))
  GROUP BY et.id, et.name
  ORDER BY COALESCE(sum(el.unit_price_cents), (0)::bigint) DESC;


ALTER VIEW baryshnikov_ii.equipment_value OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 83338)
-- Name: users; Type: TABLE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TABLE baryshnikov_ii.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(50) NOT NULL,
    firstname character varying(50) NOT NULL,
    lastname character varying(50) NOT NULL,
    role baryshnikov_ii."userRole" DEFAULT 'teacher'::baryshnikov_ii."userRole" NOT NULL,
    "passwordHash" text NOT NULL,
    "passwordShifr" text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    fathername character varying(50)
);


ALTER TABLE baryshnikov_ii.users OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 124875)
-- Name: equipment_warranty; Type: VIEW; Schema: baryshnikov_ii; Owner: postgres
--

CREATE VIEW baryshnikov_ii.equipment_warranty AS
 SELECT e.id,
    e.name,
    e.inventory_number,
    e.warranty_until,
    e.purchased_at,
    et.name AS equipment_type,
    r.number AS room_number,
    (((u.firstname)::text || ' '::text) || (u.lastname)::text) AS responsible_person,
        CASE
            WHEN (e.warranty_until < now()) THEN 'Просрочена'::text
            WHEN (e.warranty_until < (now() + '30 days'::interval)) THEN 'Заканчивается'::text
            ELSE 'Действительна'::text
        END AS warranty_status,
    EXTRACT(day FROM ((e.warranty_until)::timestamp with time zone - now())) AS days_left
   FROM (((baryshnikov_ii.equipment e
     LEFT JOIN baryshnikov_ii."equipmentType" et ON ((e.equipment_type_id = et.id)))
     LEFT JOIN baryshnikov_ii.rooms r ON ((e.room_id = r.id)))
     LEFT JOIN baryshnikov_ii.users u ON ((e.responsible_id = u.id)))
  WHERE (e.warranty_until IS NOT NULL)
  ORDER BY e.warranty_until;


ALTER VIEW baryshnikov_ii.equipment_warranty OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 124885)
-- Name: monthly_summary; Type: VIEW; Schema: baryshnikov_ii; Owner: postgres
--

CREATE VIEW baryshnikov_ii.monthly_summary AS
 SELECT date_trunc('month'::text, el.created_at) AS month,
    count(*) AS total_equipment_added,
    count(
        CASE
            WHEN (e.status = 'active'::baryshnikov_ii.equipment_status) THEN 1
            ELSE NULL::integer
        END) AS active_added,
    COALESCE(sum(el.unit_price_cents), (0)::bigint) AS total_value_added_cents
   FROM (baryshnikov_ii.equipment e
     LEFT JOIN baryshnikov_ii.equipment_lot el ON ((e.lot_id = el.id)))
  GROUP BY (date_trunc('month'::text, el.created_at))
  ORDER BY (date_trunc('month'::text, el.created_at)) DESC;


ALTER VIEW baryshnikov_ii.monthly_summary OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 124865)
-- Name: movement_history; Type: VIEW; Schema: baryshnikov_ii; Owner: postgres
--

CREATE VIEW baryshnikov_ii.movement_history AS
 SELECT m.id,
    m.moved_at,
    e.id AS equipment_id,
    e.name AS equipment_name,
    e.inventory_number,
    from_room.number AS from_room_number,
    to_room.number AS to_room_number,
    m.reason,
    (((u.firstname)::text || ' '::text) || (u.lastname)::text) AS moved_by_name
   FROM ((((baryshnikov_ii.equipment_movement m
     LEFT JOIN baryshnikov_ii.equipment e ON ((m.equipment_id = e.id)))
     LEFT JOIN baryshnikov_ii.rooms from_room ON ((m.from_room_id = from_room.id)))
     LEFT JOIN baryshnikov_ii.rooms to_room ON ((m.to_room_id = to_room.id)))
     LEFT JOIN baryshnikov_ii.users u ON ((m.moved_by_id = u.id)))
  ORDER BY m.moved_at DESC;


ALTER VIEW baryshnikov_ii.movement_history OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 124911)
-- Name: request_status_log; Type: TABLE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TABLE baryshnikov_ii.request_status_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    old_status character varying,
    new_status character varying,
    changed_by uuid,
    changed_at timestamp without time zone DEFAULT now(),
    notes text
);


ALTER TABLE baryshnikov_ii.request_status_log OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 124681)
-- Name: requests; Type: TABLE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TABLE baryshnikov_ii.requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    type baryshnikov_ii.request_type NOT NULL,
    priority baryshnikov_ii.request_priority DEFAULT 'medium'::baryshnikov_ii.request_priority,
    status baryshnikov_ii.request_status DEFAULT 'pending'::baryshnikov_ii.request_status,
    equipment_id uuid,
    created_by_id uuid NOT NULL,
    assigned_to_id uuid,
    attachments text[],
    admin_comment text,
    resolution text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved_at timestamp without time zone,
    deadline timestamp without time zone
);


ALTER TABLE baryshnikov_ii.requests OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 124895)
-- Name: requests_by_priority; Type: VIEW; Schema: baryshnikov_ii; Owner: postgres
--

CREATE VIEW baryshnikov_ii.requests_by_priority AS
 SELECT priority,
    status,
    count(*) AS count,
    (avg(EXTRACT(epoch FROM (COALESCE((resolved_at)::timestamp with time zone, now()) - (created_at)::timestamp with time zone))) / (86400)::numeric) AS avg_days_to_resolve
   FROM baryshnikov_ii.requests
  GROUP BY priority, status
  ORDER BY priority, status;


ALTER VIEW baryshnikov_ii.requests_by_priority OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 124855)
-- Name: requests_by_status; Type: VIEW; Schema: baryshnikov_ii; Owner: postgres
--

CREATE VIEW baryshnikov_ii.requests_by_status AS
 SELECT status,
    count(*) AS count,
    round((((count(*))::numeric * 100.0) / sum(count(*)) OVER ()), 1) AS percentage,
    min(created_at) AS oldest_request,
    max(created_at) AS newest_request
   FROM baryshnikov_ii.requests
  GROUP BY status
  ORDER BY (count(*)) DESC;


ALTER VIEW baryshnikov_ii.requests_by_status OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 124860)
-- Name: requests_daily_trend; Type: VIEW; Schema: baryshnikov_ii; Owner: postgres
--

CREATE VIEW baryshnikov_ii.requests_daily_trend AS
 SELECT date(created_at) AS date,
    count(*) AS created_count,
    count(
        CASE
            WHEN (status = 'completed'::baryshnikov_ii.request_status) THEN 1
            ELSE NULL::integer
        END) AS completed_count,
    count(
        CASE
            WHEN (status = 'rejected'::baryshnikov_ii.request_status) THEN 1
            ELSE NULL::integer
        END) AS rejected_count,
    round((((count(
        CASE
            WHEN (status = 'completed'::baryshnikov_ii.request_status) THEN 1
            ELSE NULL::integer
        END))::numeric * 100.0) / (NULLIF(count(*), 0))::numeric), 1) AS completion_rate
   FROM baryshnikov_ii.requests
  WHERE (created_at >= (now() - '30 days'::interval))
  GROUP BY (date(created_at))
  ORDER BY (date(created_at)) DESC;


ALTER VIEW baryshnikov_ii.requests_daily_trend OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 83327)
-- Name: sessions; Type: TABLE; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TABLE baryshnikov_ii.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    user_agent text,
    ip text,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE baryshnikov_ii.sessions OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 124880)
-- Name: user_activity; Type: VIEW; Schema: baryshnikov_ii; Owner: postgres
--

CREATE VIEW baryshnikov_ii.user_activity AS
 SELECT u.id AS user_id,
    (((u.firstname)::text || ' '::text) || (u.lastname)::text) AS user_name,
    u.email,
    u.role,
    count(DISTINCT r.id) AS requests_created,
    count(DISTINCT e.id) AS equipment_responsible,
    count(DISTINCT m.id) AS movements_made,
    max(r.created_at) AS last_request_date
   FROM (((baryshnikov_ii.users u
     LEFT JOIN baryshnikov_ii.requests r ON ((r.created_by_id = u.id)))
     LEFT JOIN baryshnikov_ii.equipment e ON ((e.responsible_id = u.id)))
     LEFT JOIN baryshnikov_ii.equipment_movement m ON ((m.moved_by_id = u.id)))
  GROUP BY u.id, u.firstname, u.lastname, u.email, u.role
  ORDER BY (count(DISTINCT r.id)) DESC;


ALTER VIEW baryshnikov_ii.user_activity OWNER TO postgres;

--
-- TOC entry 4999 (class 0 OID 124541)
-- Dependencies: 224
-- Data for Name: equipment; Type: TABLE DATA; Schema: baryshnikov_ii; Owner: postgres
--

COPY baryshnikov_ii.equipment (id, inventory_number, qr_code, lot_id, equipment_type_id, room_id, responsible_id, name, serial_number, model, manufacturer, status, attributes, photos, purchased_at, warranty_until, written_off_at, written_off_by_id, notes, created_at, updated_at) FROM stdin;
c059c699-ea37-4feb-88ce-700772954422	NB-002	\N	e39e201c-5b82-4975-8eb8-a9142fd2a088	9e76be83-ea3b-41d8-bc55-4e231c692f4d	267b8b01-b18d-4915-8f9e-e91d4d57df0f	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Ноутбук Lenovo E15	SN002	ThinkPad E15	Lenovo	active	{"os": "Windows 11 Pro", "ram": "8", "storage": "256", "processor": "Intel Core i5", "screen_size": "15.6"}	\N	\N	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
2ce2e21e-145a-4155-9336-dcb13136c1ac	PR-001	\N	d145934f-c068-484b-aad3-4db14b45be1c	fd8daaee-bc62-4789-b698-da5df6d2dec2	267b8b01-b18d-4915-8f9e-e91d4d57df0f	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Проектор Epson EB-695Wi	SN-PR001	EB-695Wi	Epson	active	{"contrast": "16000:1", "lamp_life": 5000, "brightness": 3500, "resolution": "WXGA", "throw_ratio": "0.32:1"}	\N	\N	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
ee35df60-7eb9-42cc-9e2a-90d05c1c54db	PR-002	\N	d145934f-c068-484b-aad3-4db14b45be1c	fd8daaee-bc62-4789-b698-da5df6d2dec2	c9507c6e-e098-441d-8599-5f46d981a02d	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Проектор Epson EB-695Wi	SN-PR002	EB-695Wi	Epson	active	{"contrast": "16000:1", "lamp_life": 4800, "brightness": 3500, "resolution": "WXGA", "throw_ratio": "0.32:1"}	\N	\N	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
157a9de2-8c3b-4738-86f0-ff89a9a8c78e	PC-001	\N	2a2b8be0-01f9-453c-8167-61c6540492b3	fd2b7100-3410-4909-9823-f765217549ee	267b8b01-b18d-4915-8f9e-e91d4d57df0f	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Компьютер Dell OptiPlex 7090	SN-PC001	OptiPlex 7090	Dell	active	{"os": "Windows 11 Pro", "ram": "16", "storage": "512", "graphics": "Intel UHD Graphics", "processor": "Intel Core i7"}	\N	\N	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
8b4d7603-66d3-40f2-97fa-ad25d371d19e	PC-002	\N	2a2b8be0-01f9-453c-8167-61c6540492b3	fd2b7100-3410-4909-9823-f765217549ee	267b8b01-b18d-4915-8f9e-e91d4d57df0f	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Компьютер Dell OptiPlex 3090	SN-PC002	OptiPlex 3090	Dell	active	{"os": "Windows 11 Pro", "ram": "8", "storage": "256", "graphics": "Intel UHD Graphics", "processor": "Intel Core i5"}	\N	\N	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
eb4d3e9e-3d1b-4638-8dad-667dbb6260a0	PC-003	\N	2a2b8be0-01f9-453c-8167-61c6540492b3	fd2b7100-3410-4909-9823-f765217549ee	c9507c6e-e098-441d-8599-5f46d981a02d	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Компьютер Dell OptiPlex 7090	SN-PC003	OptiPlex 7090	Dell	active	{"os": "Windows 11 Pro", "ram": "32", "storage": "1024", "graphics": "NVIDIA Quadro", "processor": "Intel Core i7"}	\N	\N	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
0fd8497d-280a-4c88-8457-9f95c0d63962	MON-001	\N	5944c8b5-1d60-403b-860f-b85afbe4b98b	0be9ba92-65d8-48a5-855f-57e189bbf27a	267b8b01-b18d-4915-8f9e-e91d4d57df0f	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Монитор Samsung 24"	SN-MON001	LF24T35	Samsung	active	{"size": 24, "resolution": "1920x1080", "matrix_type": "IPS", "refresh_rate": 75, "response_time": 5}	\N	\N	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
84dfa478-c7d7-4644-8149-42d753d69bf7	MON-002	\N	5944c8b5-1d60-403b-860f-b85afbe4b98b	0be9ba92-65d8-48a5-855f-57e189bbf27a	267b8b01-b18d-4915-8f9e-e91d4d57df0f	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Монитор Samsung 24"	SN-MON002	LF24T35	Samsung	active	{"size": 24, "resolution": "1920x1080", "matrix_type": "VA", "refresh_rate": 75, "response_time": 4}	\N	\N	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
1b67a472-65d8-4efe-adf5-9325fed20595	MON-003	\N	5944c8b5-1d60-403b-860f-b85afbe4b98b	0be9ba92-65d8-48a5-855f-57e189bbf27a	c9507c6e-e098-441d-8599-5f46d981a02d	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Монитор Samsung 24"	SN-MON003	LF24T35	Samsung	active	{"size": 24, "resolution": "1920x1080", "matrix_type": "IPS", "refresh_rate": 75, "response_time": 5}	\N	\N	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
aef33137-4324-481f-aeb7-c83a317e8eb5	MON-004	\N	5944c8b5-1d60-403b-860f-b85afbe4b98b	0be9ba92-65d8-48a5-855f-57e189bbf27a	c9507c6e-e098-441d-8599-5f46d981a02d	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Монитор Samsung 24"	SN-MON004	LF24T35	Samsung	active	{"size": 24, "resolution": "1920x1080", "matrix_type": "IPS", "refresh_rate": 75, "response_time": 5}	\N	\N	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
cbd1ef96-55e7-401a-a027-5df33abd37ff	MON-005	\N	5944c8b5-1d60-403b-860f-b85afbe4b98b	0be9ba92-65d8-48a5-855f-57e189bbf27a	5fdc1701-6340-4e61-af89-503fb583ce93	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Монитор Samsung 24"	SN-MON005	LF24T35	Samsung	active	{"size": 24, "resolution": "1920x1080", "matrix_type": "VA", "refresh_rate": 75, "response_time": 4}	\N	\N	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
40b818bb-4453-47c2-b716-692fbe98ec9a	NB-001	\N	e39e201c-5b82-4975-8eb8-a9142fd2a088	9e76be83-ea3b-41d8-bc55-4e231c692f4d	267b8b01-b18d-4915-8f9e-e91d4d57df0f	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Ноутбук Lenovo T14	SN001	ThinkPad T14	Lenovo	maintenance	{"os": "Windows 11 Pro", "ram": "16", "storage": "512", "processor": "Intel Core i7", "screen_size": "14"}	\N	\N	\N	\N	\N	Основной ноутбук\nЗаявка на ремонт #e0d97c26-77cf-4e52-a0bc-eb305b3acad9 от 2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
2ee07ba0-8ad3-42b5-b4e1-7b846f10e8fa	NB-003	\N	e39e201c-5b82-4975-8eb8-a9142fd2a088	9e76be83-ea3b-41d8-bc55-4e231c692f4d	267b8b01-b18d-4915-8f9e-e91d4d57df0f	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	Ноутбук Lenovo L14	SN003	ThinkPad L14	Lenovo	maintenance	{"os": "Windows 11 Pro", "ram": "16", "storage": "512", "processor": "AMD Ryzen 5", "screen_size": "14"}	\N	\N	\N	\N	\N	Замена клавиатуры\nЗаявка на ремонт #e744dc2e-f8af-4341-8a84-77be33eb5733 от 2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
\.


--
-- TOC entry 4997 (class 0 OID 83531)
-- Dependencies: 222
-- Data for Name: equipmentType; Type: TABLE DATA; Schema: baryshnikov_ii; Owner: postgres
--

COPY baryshnikov_ii."equipmentType" (id, name, description, "attributesSchema", "createdAt") FROM stdin;
9e76be83-ea3b-41d8-bc55-4e231c692f4d	Ноутбук	Портативный компьютер для работы и учебы	{"{\\"name\\": \\"processor\\", \\"type\\": \\"string\\", \\"label\\": \\"Процессор\\", \\"required\\": true}","{\\"name\\": \\"ram\\", \\"type\\": \\"string\\", \\"unit\\": \\"ГБ\\", \\"label\\": \\"Оперативная память\\", \\"required\\": true}","{\\"name\\": \\"storage\\", \\"type\\": \\"string\\", \\"unit\\": \\"ГБ\\", \\"label\\": \\"Накопитель\\", \\"required\\": true}","{\\"name\\": \\"screen_size\\", \\"type\\": \\"string\\", \\"unit\\": \\"дюймов\\", \\"label\\": \\"Диагональ экрана\\", \\"required\\": true}","{\\"name\\": \\"os\\", \\"type\\": \\"select\\", \\"label\\": \\"Операционная система\\", \\"options\\": [\\"Windows 11 Pro\\", \\"Windows 11 Home\\", \\"Linux Ubuntu\\", \\"macOS\\"], \\"required\\": true}"}	2026-05-10 02:57:28.217492
fd8daaee-bc62-4789-b698-da5df6d2dec2	Проектор	Мультимедийный проектор для презентаций	{"{\\"name\\": \\"brightness\\", \\"type\\": \\"number\\", \\"unit\\": \\"ANSI люмен\\", \\"label\\": \\"Яркость\\", \\"required\\": true}","{\\"name\\": \\"resolution\\", \\"type\\": \\"select\\", \\"label\\": \\"Разрешение\\", \\"options\\": [\\"XGA (1024x768)\\", \\"WXGA (1280x800)\\", \\"Full HD (1920x1080)\\", \\"4K (3840x2160)\\"], \\"required\\": true}","{\\"name\\": \\"lamp_life\\", \\"type\\": \\"number\\", \\"unit\\": \\"часов\\", \\"label\\": \\"Ресурс лампы\\", \\"required\\": true}","{\\"name\\": \\"contrast\\", \\"type\\": \\"string\\", \\"unit\\": \\":1\\", \\"label\\": \\"Контрастность\\", \\"required\\": true}","{\\"name\\": \\"throw_ratio\\", \\"type\\": \\"string\\", \\"label\\": \\"Проекционное отношение\\", \\"required\\": true}"}	2026-05-10 02:57:28.217492
a33a2784-489d-45a1-9774-c0e5698c564c	МФУ	Принтер, сканер, копир в одном устройстве	{"{\\"name\\": \\"print_speed\\", \\"type\\": \\"number\\", \\"unit\\": \\"стр/мин\\", \\"label\\": \\"Скорость печати\\", \\"required\\": true}","{\\"name\\": \\"print_resolution\\", \\"type\\": \\"string\\", \\"unit\\": \\"dpi\\", \\"label\\": \\"Разрешение печати\\", \\"required\\": true}","{\\"name\\": \\"print_technology\\", \\"type\\": \\"select\\", \\"label\\": \\"Технология печати\\", \\"options\\": [\\"Лазерная\\", \\"Струйная\\", \\"Светодиодная\\"], \\"required\\": true}","{\\"name\\": \\"paper_size\\", \\"type\\": \\"select\\", \\"label\\": \\"Максимальный формат\\", \\"options\\": [\\"A4\\", \\"A3\\"], \\"required\\": true}","{\\"name\\": \\"color_print\\", \\"type\\": \\"boolean\\", \\"label\\": \\"Цветная печать\\", \\"required\\": true}"}	2026-05-10 02:57:28.217492
f85e5639-7e45-4efb-ac32-2f737a25a9dd	Интерактивная панель	Сенсорная панель для презентаций и занятий	{"{\\"name\\": \\"screen_size\\", \\"type\\": \\"number\\", \\"unit\\": \\"дюймов\\", \\"label\\": \\"Диагональ экрана\\", \\"required\\": true}","{\\"name\\": \\"touch_points\\", \\"type\\": \\"number\\", \\"unit\\": \\"точек\\", \\"label\\": \\"Количество касаний\\", \\"required\\": true}","{\\"name\\": \\"resolution\\", \\"type\\": \\"string\\", \\"label\\": \\"Разрешение\\", \\"required\\": true}","{\\"name\\": \\"panel_type\\", \\"type\\": \\"select\\", \\"label\\": \\"Тип панели\\", \\"options\\": [\\"LCD\\", \\"LED\\", \\"OLED\\"], \\"required\\": true}","{\\"name\\": \\"os\\", \\"type\\": \\"select\\", \\"label\\": \\"Встроенная ОС\\", \\"options\\": [\\"Android\\", \\"Windows\\", \\"Без ОС\\"], \\"required\\": true}"}	2026-05-10 02:57:28.217492
fd2b7100-3410-4909-9823-f765217549ee	Компьютер	Стационарный компьютер	{"{\\"name\\": \\"processor\\", \\"type\\": \\"string\\", \\"label\\": \\"Процессор\\", \\"required\\": true}","{\\"name\\": \\"ram\\", \\"type\\": \\"string\\", \\"unit\\": \\"ГБ\\", \\"label\\": \\"Оперативная память\\", \\"required\\": true}","{\\"name\\": \\"storage\\", \\"type\\": \\"string\\", \\"unit\\": \\"ГБ\\", \\"label\\": \\"Накопитель\\", \\"required\\": true}","{\\"name\\": \\"graphics\\", \\"type\\": \\"string\\", \\"label\\": \\"Видеокарта\\", \\"required\\": true}","{\\"name\\": \\"os\\", \\"type\\": \\"select\\", \\"label\\": \\"Операционная система\\", \\"options\\": [\\"Windows 11 Pro\\", \\"Windows 10 Pro\\", \\"Linux\\"], \\"required\\": true}"}	2026-05-10 02:57:28.217492
0be9ba92-65d8-48a5-855f-57e189bbf27a	Монитор	Компьютерный дисплей	{"{\\"name\\": \\"size\\", \\"type\\": \\"number\\", \\"unit\\": \\"дюймов\\", \\"label\\": \\"Диагональ\\", \\"required\\": true}","{\\"name\\": \\"resolution\\", \\"type\\": \\"string\\", \\"label\\": \\"Разрешение\\", \\"required\\": true}","{\\"name\\": \\"matrix_type\\", \\"type\\": \\"select\\", \\"label\\": \\"Тип матрицы\\", \\"options\\": [\\"IPS\\", \\"TN\\", \\"VA\\", \\"OLED\\"], \\"required\\": true}","{\\"name\\": \\"refresh_rate\\", \\"type\\": \\"number\\", \\"unit\\": \\"Гц\\", \\"label\\": \\"Частота обновления\\", \\"required\\": true}","{\\"name\\": \\"response_time\\", \\"type\\": \\"number\\", \\"unit\\": \\"мс\\", \\"label\\": \\"Время отклика\\", \\"required\\": true}"}	2026-05-10 02:57:28.217492
639d6f60-e67c-46f6-9c51-676b9640f18c	Принтер	Устройство для печати	{"{\\"name\\": \\"print_speed\\", \\"type\\": \\"number\\", \\"unit\\": \\"стр/мин\\", \\"label\\": \\"Скорость печати\\", \\"required\\": true}","{\\"name\\": \\"print_technology\\", \\"type\\": \\"select\\", \\"label\\": \\"Технология печати\\", \\"options\\": [\\"Лазерная\\", \\"Струйная\\", \\"Термопечать\\"], \\"required\\": true}","{\\"name\\": \\"color_print\\", \\"type\\": \\"boolean\\", \\"label\\": \\"Цветная печать\\", \\"required\\": true}","{\\"name\\": \\"duplex\\", \\"type\\": \\"boolean\\", \\"label\\": \\"Автоматическая двусторонняя печать\\", \\"required\\": true}","{\\"name\\": \\"paper_capacity\\", \\"type\\": \\"number\\", \\"unit\\": \\"листов\\", \\"label\\": \\"Вместимость лотка\\", \\"required\\": true}"}	2026-05-10 02:57:28.217492
5eb3b67a-6d78-4fe8-ba25-43499bd80504	Планшет	Портативное устройство с сенсорным экраном	{"{\\"name\\": \\"screen_size\\", \\"type\\": \\"number\\", \\"unit\\": \\"дюймов\\", \\"label\\": \\"Диагональ экрана\\", \\"required\\": true}","{\\"name\\": \\"storage\\", \\"type\\": \\"number\\", \\"unit\\": \\"ГБ\\", \\"label\\": \\"Встроенная память\\", \\"required\\": true}","{\\"name\\": \\"ram\\", \\"type\\": \\"number\\", \\"unit\\": \\"ГБ\\", \\"label\\": \\"Оперативная память\\", \\"required\\": true}","{\\"name\\": \\"os\\", \\"type\\": \\"select\\", \\"label\\": \\"Операционная система\\", \\"options\\": [\\"iPadOS\\", \\"Android\\", \\"Windows\\"], \\"required\\": true}","{\\"name\\": \\"has_stylus\\", \\"type\\": \\"boolean\\", \\"label\\": \\"Поддержка стилуса\\", \\"required\\": true}"}	2026-05-10 02:57:28.217492
b678f155-a918-408a-8a9a-dfd8b66c7155	Документ-камера	Устройство для демонстрации документов	{"{\\"name\\": \\"sensor\\", \\"type\\": \\"string\\", \\"unit\\": \\"МП\\", \\"label\\": \\"Сенсор\\", \\"required\\": true}","{\\"name\\": \\"zoom\\", \\"type\\": \\"number\\", \\"unit\\": \\"x\\", \\"label\\": \\"Оптический зум\\", \\"required\\": true}","{\\"name\\": \\"resolution\\", \\"type\\": \\"string\\", \\"label\\": \\"Разрешение\\", \\"required\\": true}","{\\"name\\": \\"lighting\\", \\"type\\": \\"boolean\\", \\"label\\": \\"Подсветка\\", \\"required\\": true}","{\\"name\\": \\"focus\\", \\"type\\": \\"select\\", \\"label\\": \\"Тип фокуса\\", \\"options\\": [\\"Автофокус\\", \\"Ручной\\", \\"Авто и ручной\\"], \\"required\\": true}"}	2026-05-10 02:57:28.217492
f061b0ef-09ca-4ab6-859e-83c23aa04666	Акустическая система	Колонки для воспроизведения звука	{"{\\"name\\": \\"power\\", \\"type\\": \\"number\\", \\"unit\\": \\"Вт\\", \\"label\\": \\"Мощность\\", \\"required\\": true}","{\\"name\\": \\"channels\\", \\"type\\": \\"string\\", \\"label\\": \\"Количество каналов\\", \\"required\\": true}","{\\"name\\": \\"frequency\\", \\"type\\": \\"string\\", \\"unit\\": \\"Гц\\", \\"label\\": \\"Диапазон частот\\", \\"required\\": true}","{\\"name\\": \\"bluetooth\\", \\"type\\": \\"boolean\\", \\"label\\": \\"Bluetooth\\", \\"required\\": true}","{\\"name\\": \\"connection\\", \\"type\\": \\"select\\", \\"label\\": \\"Тип подключения\\", \\"options\\": [\\"Проводная\\", \\"Беспроводная\\", \\"Гибридная\\"], \\"required\\": true}"}	2026-05-10 02:57:28.217492
\.


--
-- TOC entry 5000 (class 0 OID 124556)
-- Dependencies: 225
-- Data for Name: equipment_lot; Type: TABLE DATA; Schema: baryshnikov_ii; Owner: postgres
--

COPY baryshnikov_ii.equipment_lot (id, lot_number, equipment_type_id, name, description, quantity, status, supplier, invoice_number, unit_price_cents, accepted_by_id, accepted_at, created_at, updated_at) FROM stdin;
e39e201c-5b82-4975-8eb8-a9142fd2a088	LOT-2024-001	9e76be83-ea3b-41d8-bc55-4e231c692f4d	Ноутбуки Lenovo ThinkPad	Для преподавательского состава	15	accepted	ООО Марвел	INV-001	8500000	97de0af3-e4d1-4023-8cb2-8e1ed0c8db49	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
962a030b-b741-49b0-9dd8-ffc89f56733e	LOT-2024-002	9e76be83-ea3b-41d8-bc55-4e231c692f4d	Ноутбуки HP ProBook	Для компьютерных классов	20	accepted	ООО Компьютеры	INV-002	6500000	97de0af3-e4d1-4023-8cb2-8e1ed0c8db49	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
d145934f-c068-484b-aad3-4db14b45be1c	LOT-2024-003	fd8daaee-bc62-4789-b698-da5df6d2dec2	Проекторы Epson	Для лекционных аудиторий	10	accepted	ООО Деловые решения	INV-003	12000000	97de0af3-e4d1-4023-8cb2-8e1ed0c8db49	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
2a2b8be0-01f9-453c-8167-61c6540492b3	LOT-2024-004	fd2b7100-3410-4909-9823-f765217549ee	Компьютеры Dell OptiPlex	Рабочие станции	25	accepted	ООО Компьютерный мир	INV-004	4500000	97de0af3-e4d1-4023-8cb2-8e1ed0c8db49	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
5944c8b5-1d60-403b-860f-b85afbe4b98b	LOT-2024-005	0be9ba92-65d8-48a5-855f-57e189bbf27a	Мониторы Samsung	Для компьютерных классов	30	accepted	ООО Цифровой мир	INV-005	1500000	97de0af3-e4d1-4023-8cb2-8e1ed0c8db49	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492
\.


--
-- TOC entry 5001 (class 0 OID 124570)
-- Dependencies: 226
-- Data for Name: equipment_movement; Type: TABLE DATA; Schema: baryshnikov_ii; Owner: postgres
--

COPY baryshnikov_ii.equipment_movement (id, equipment_id, from_room_id, to_room_id, moved_by_id, reason, moved_at) FROM stdin;
\.


--
-- TOC entry 5004 (class 0 OID 124911)
-- Dependencies: 241
-- Data for Name: request_status_log; Type: TABLE DATA; Schema: baryshnikov_ii; Owner: postgres
--

COPY baryshnikov_ii.request_status_log (id, request_id, old_status, new_status, changed_by, changed_at, notes) FROM stdin;
\.


--
-- TOC entry 5003 (class 0 OID 124681)
-- Dependencies: 228
-- Data for Name: requests; Type: TABLE DATA; Schema: baryshnikov_ii; Owner: postgres
--

COPY baryshnikov_ii.requests (id, title, description, type, priority, status, equipment_id, created_by_id, assigned_to_id, attachments, admin_comment, resolution, created_at, updated_at, resolved_at, deadline) FROM stdin;
e0d97c26-77cf-4e52-a0bc-eb305b3acad9	Не работает клавиатура	На ноутбуке перестала работать клавиатура	repair	high	pending	40b818bb-4453-47c2-b716-692fbe98ec9a	0b598aaf-4284-4158-9a7a-a583237bf7a5	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492	\N	\N
3d80f775-5bb6-400d-b0e9-73f91b41a62f	Требуется обслуживание проектора	Проектор стал тусклым, нужна чистка	maintenance	medium	in_progress	c059c699-ea37-4feb-88ce-700772954422	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	\N	\N	Принято в работу	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492	\N	\N
e744dc2e-f8af-4341-8a84-77be33eb5733	Замена жесткого диска	Компьютер не загружается, нужна диагностика	repair	urgent	pending	2ee07ba0-8ad3-42b5-b4e1-7b846f10e8fa	f018ae34-aed7-4a7e-9113-570913e837c3	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492	\N	\N
1deb7076-cbfa-42ee-a76d-f2dac48e9727	Перемещение оборудования	Перенести компьютер в кабинет 205	transfer	low	approved	2ce2e21e-145a-4155-9336-dcb13136c1ac	bd6a65ab-9556-4921-b66b-0dc971b14b7d	\N	\N	Одобрено	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492	\N	\N
22c8fbc5-7d77-4083-9c01-db47758f10be	Списание монитора	Монитор не включается	write_off	medium	pending	ee35df60-7eb9-42cc-9e2a-90d05c1c54db	f17221e9-da31-43b0-9c20-bf82d1695aae	\N	\N	\N	\N	2026-05-10 02:57:28.217492	2026-05-10 02:57:28.217492	\N	\N
\.


--
-- TOC entry 4998 (class 0 OID 83543)
-- Dependencies: 223
-- Data for Name: rooms; Type: TABLE DATA; Schema: baryshnikov_ii; Owner: postgres
--

COPY baryshnikov_ii.rooms (id, number, description, attached_lab_id, attached_teacher_id, "createdAt") FROM stdin;
267b8b01-b18d-4915-8f9e-e91d4d57df0f	101	Компьютерный класс	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	0b598aaf-4284-4158-9a7a-a583237bf7a5	2026-05-10 02:57:28.217492
c9507c6e-e098-441d-8599-5f46d981a02d	102	Лаборатория физики	bd6a65ab-9556-4921-b66b-0dc971b14b7d	f018ae34-aed7-4a7e-9113-570913e837c3	2026-05-10 02:57:28.217492
5fdc1701-6340-4e61-af89-503fb583ce93	103	Лекционная аудитория	f17221e9-da31-43b0-9c20-bf82d1695aae	28c1d963-f50c-4dbe-ba09-2e9a175facf5	2026-05-10 02:57:28.217492
c90a3a9e-ba0a-41a2-855c-c29f97792116	104	Кабинет информатики	c03ed991-9575-442f-82ed-d7fcc3a3cdfd	039e259e-d942-464d-a4a8-fefe0f84fd27	2026-05-10 02:57:28.217492
be7a852c-0206-4c51-966d-2a75d1972b85	105	Мультимедийный класс	77f1c88c-4ae1-4350-bc98-fe3422e73f88	\N	2026-05-10 02:57:28.217492
84c59b67-ba93-4d40-8b2f-99c348518604	201	Лаборатория химии	d06d5d3b-acf8-4ec0-8778-c78289ef6f16	0b598aaf-4284-4158-9a7a-a583237bf7a5	2026-05-10 02:57:28.217492
ea40842b-4aab-4926-9030-af4d09b09994	202	Кабинет математики	bd6a65ab-9556-4921-b66b-0dc971b14b7d	f018ae34-aed7-4a7e-9113-570913e837c3	2026-05-10 02:57:28.217492
cf116908-2d5e-4837-9a0f-78a6543c1557	203	Актовый зал	f17221e9-da31-43b0-9c20-bf82d1695aae	28c1d963-f50c-4dbe-ba09-2e9a175facf5	2026-05-10 02:57:28.217492
02ad1543-dc69-4012-8293-913dec233f9a	204	Библиотека	c03ed991-9575-442f-82ed-d7fcc3a3cdfd	039e259e-d942-464d-a4a8-fefe0f84fd27	2026-05-10 02:57:28.217492
d3afae51-f895-4ced-b9d2-20a1d3e0c432	205	Кабинет иностранных языков	77f1c88c-4ae1-4350-bc98-fe3422e73f88	\N	2026-05-10 02:57:28.217492
\.


--
-- TOC entry 4995 (class 0 OID 83327)
-- Dependencies: 220
-- Data for Name: sessions; Type: TABLE DATA; Schema: baryshnikov_ii; Owner: postgres
--

COPY baryshnikov_ii.sessions (id, user_id, token_hash, user_agent, ip, expires_at, created_at) FROM stdin;
\.


--
-- TOC entry 4996 (class 0 OID 83338)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: baryshnikov_ii; Owner: postgres
--

COPY baryshnikov_ii.users (id, email, firstname, lastname, role, "passwordHash", "passwordShifr", is_active, created_at, fathername) FROM stdin;
0b598aaf-4284-4158-9a7a-a583237bf7a5	artem@mail.ru	Артем	Удалов	teacher	$2b$12$XWJjSSx1Nv/7CcM2QVW83eCSvp7JASeeInlnqS7VazX7llNXRfeD.		t	2026-04-27 18:54:44.593897	
d06d5d3b-acf8-4ec0-8778-c78289ef6f16	maxim@mail.ru	Максим	Михеев	laborant	$2b$12$FtCJLlCRAuxonqTuWI5n4uJHApJHsVnhahu7kFGwaKT7ijhPBlinS		t	2026-04-27 18:56:55.791008	Денисович
f018ae34-aed7-4a7e-9113-570913e837c3	lr@mail.ru	Лариса	Цымбалюк	teacher	$2b$12$JCVLsLf3ywQ0x41yh1Rb9OPMOk2VrsvX5Cc4CZJqjmDp3Dk51./D.		t	2026-04-29 09:10:04.647095	Николаевна
bd6a65ab-9556-4921-b66b-0dc971b14b7d	fedor@mail.ru	Федор	Железков	laborant	$2b$12$VNt7iLf7FSxqVxPNHvFOweUxrAYtkJgaYXJkjc/CW1rLHaK35s6XG		t	2026-04-29 09:10:33.595588	\N
f17221e9-da31-43b0-9c20-bf82d1695aae	tim@mail.ru	Тимофей	Соколов	laborant	$2b$12$fDav5pgAh2VRK8pLqDG95ubTOYzgRERA8ik342mWYpA2bOICIN1ZG		t	2026-04-29 09:10:58.140505	\N
c03ed991-9575-442f-82ed-d7fcc3a3cdfd	egor@mail.ru	Егор	Русин	laborant	$2b$12$nrRlvd5SKbPyO.cfDsBQbe3EoN6OrX6m1Q1T6GgjB.uOM3QvMsOku		t	2026-04-29 09:11:24.145345	\N
77f1c88c-4ae1-4350-bc98-fe3422e73f88	maxy@mail.ru	Максим	Юфриков	laborant	$2b$12$J2fahHvMWK.vp9rWNSBuAer2ra6P2Z4e8U9Bn7OeUe/fVvy7j4L82		t	2026-04-29 09:12:01.290162	Игоревич
28c1d963-f50c-4dbe-ba09-2e9a175facf5	mih@mail.ru	Михаил	Богданов	teacher	$2b$12$nq36ebpK4jeC3B2kw2H8.uYWFWQme7jUt4OgI6mgilbjHJbj8SG6C		t	2026-04-29 09:12:31.080896	Михайлович
039e259e-d942-464d-a4a8-fefe0f84fd27	burbax@mail.ru	Владмир	Бурбах	teacher	$2b$12$zpu0cYYit1JgaM35ArjM8ezlfzGJCV1yMWw7dTJkyPeqsqsph0Vey		t	2026-04-29 09:13:16.871637	Витальевич
97de0af3-e4d1-4023-8cb2-8e1ed0c8db49	admin@novsu.ru	Илья	Барышников	admin	$2b$10$Ggcmy8440OcYI6hUMoFnJ.K3kJAhZwSaFNolzbirtFYTaWkgvqmYq	14a2cc05c4b9684fb200dd3407e20fd1:b40af51d519fdbb1ccace1c3e9fefea1	t	2026-04-07 15:21:02.818648	Игоревич
\.


--
-- TOC entry 5011 (class 0 OID 0)
-- Dependencies: 227
-- Name: inventory_number_seq; Type: SEQUENCE SET; Schema: baryshnikov_ii; Owner: postgres
--

SELECT pg_catalog.setval('baryshnikov_ii.inventory_number_seq', 10, true);


--
-- TOC entry 4791 (class 2606 OID 83542)
-- Name: equipmentType equipmentType_name_unique; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii."equipmentType"
    ADD CONSTRAINT "equipmentType_name_unique" UNIQUE (name);


--
-- TOC entry 4793 (class 2606 OID 83540)
-- Name: equipmentType equipmentType_pkey; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii."equipmentType"
    ADD CONSTRAINT "equipmentType_pkey" PRIMARY KEY (id);


--
-- TOC entry 4799 (class 2606 OID 124553)
-- Name: equipment equipment_inventory_number_unique; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment
    ADD CONSTRAINT equipment_inventory_number_unique UNIQUE (inventory_number);


--
-- TOC entry 4805 (class 2606 OID 124569)
-- Name: equipment_lot equipment_lot_lot_number_unique; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment_lot
    ADD CONSTRAINT equipment_lot_lot_number_unique UNIQUE (lot_number);


--
-- TOC entry 4807 (class 2606 OID 124567)
-- Name: equipment_lot equipment_lot_pkey; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment_lot
    ADD CONSTRAINT equipment_lot_pkey PRIMARY KEY (id);


--
-- TOC entry 4809 (class 2606 OID 124578)
-- Name: equipment_movement equipment_movement_pkey; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment_movement
    ADD CONSTRAINT equipment_movement_pkey PRIMARY KEY (id);


--
-- TOC entry 4801 (class 2606 OID 124551)
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- TOC entry 4803 (class 2606 OID 124555)
-- Name: equipment equipment_qr_code_unique; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment
    ADD CONSTRAINT equipment_qr_code_unique UNIQUE (qr_code);


--
-- TOC entry 4813 (class 2606 OID 124919)
-- Name: request_status_log request_status_log_pkey; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.request_status_log
    ADD CONSTRAINT request_status_log_pkey PRIMARY KEY (id);


--
-- TOC entry 4811 (class 2606 OID 124692)
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4795 (class 2606 OID 83552)
-- Name: rooms rooms_number_unique; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.rooms
    ADD CONSTRAINT rooms_number_unique UNIQUE (number);


--
-- TOC entry 4797 (class 2606 OID 83550)
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- TOC entry 4785 (class 2606 OID 83335)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4787 (class 2606 OID 83337)
-- Name: sessions sessions_token_hash_unique; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.sessions
    ADD CONSTRAINT sessions_token_hash_unique UNIQUE (token_hash);


--
-- TOC entry 4789 (class 2606 OID 83348)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4831 (class 2620 OID 124923)
-- Name: equipment trigger_check_inventory_number_unique; Type: TRIGGER; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TRIGGER trigger_check_inventory_number_unique BEFORE INSERT OR UPDATE OF inventory_number ON baryshnikov_ii.equipment FOR EACH ROW EXECUTE FUNCTION baryshnikov_ii.check_inventory_number_unique();


--
-- TOC entry 4832 (class 2620 OID 124925)
-- Name: equipment trigger_log_equipment_room_change; Type: TRIGGER; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TRIGGER trigger_log_equipment_room_change BEFORE UPDATE OF room_id ON baryshnikov_ii.equipment FOR EACH ROW EXECUTE FUNCTION baryshnikov_ii.log_equipment_room_change();


--
-- TOC entry 4835 (class 2620 OID 124921)
-- Name: requests trigger_log_request_status_change; Type: TRIGGER; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TRIGGER trigger_log_request_status_change BEFORE UPDATE OF status ON baryshnikov_ii.requests FOR EACH ROW EXECUTE FUNCTION baryshnikov_ii.log_request_status_change();


--
-- TOC entry 4834 (class 2620 OID 124907)
-- Name: equipment_lot trigger_update_equipment_lot_updated_at; Type: TRIGGER; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TRIGGER trigger_update_equipment_lot_updated_at BEFORE UPDATE ON baryshnikov_ii.equipment_lot FOR EACH ROW EXECUTE FUNCTION baryshnikov_ii.update_updated_at_column();


--
-- TOC entry 4836 (class 2620 OID 124910)
-- Name: requests trigger_update_equipment_status_on_request; Type: TRIGGER; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TRIGGER trigger_update_equipment_status_on_request AFTER INSERT ON baryshnikov_ii.requests FOR EACH ROW EXECUTE FUNCTION baryshnikov_ii.update_equipment_status_on_request();


--
-- TOC entry 4833 (class 2620 OID 124906)
-- Name: equipment trigger_update_equipment_updated_at; Type: TRIGGER; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TRIGGER trigger_update_equipment_updated_at BEFORE UPDATE ON baryshnikov_ii.equipment FOR EACH ROW EXECUTE FUNCTION baryshnikov_ii.update_updated_at_column();


--
-- TOC entry 4837 (class 2620 OID 124908)
-- Name: requests trigger_update_requests_updated_at; Type: TRIGGER; Schema: baryshnikov_ii; Owner: postgres
--

CREATE TRIGGER trigger_update_requests_updated_at BEFORE UPDATE ON baryshnikov_ii.requests FOR EACH ROW EXECUTE FUNCTION baryshnikov_ii.update_updated_at_column();


--
-- TOC entry 4817 (class 2606 OID 124584)
-- Name: equipment equipment_equipment_type_id_equipmentType_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment
    ADD CONSTRAINT "equipment_equipment_type_id_equipmentType_id_fk" FOREIGN KEY (equipment_type_id) REFERENCES baryshnikov_ii."equipmentType"(id);


--
-- TOC entry 4822 (class 2606 OID 124609)
-- Name: equipment_lot equipment_lot_accepted_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment_lot
    ADD CONSTRAINT equipment_lot_accepted_by_id_users_id_fk FOREIGN KEY (accepted_by_id) REFERENCES baryshnikov_ii.users(id) ON DELETE SET NULL;


--
-- TOC entry 4823 (class 2606 OID 124604)
-- Name: equipment_lot equipment_lot_equipment_type_id_equipmentType_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment_lot
    ADD CONSTRAINT "equipment_lot_equipment_type_id_equipmentType_id_fk" FOREIGN KEY (equipment_type_id) REFERENCES baryshnikov_ii."equipmentType"(id);


--
-- TOC entry 4818 (class 2606 OID 124579)
-- Name: equipment equipment_lot_id_equipment_lot_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment
    ADD CONSTRAINT equipment_lot_id_equipment_lot_id_fk FOREIGN KEY (lot_id) REFERENCES baryshnikov_ii.equipment_lot(id) ON DELETE RESTRICT;


--
-- TOC entry 4824 (class 2606 OID 124614)
-- Name: equipment_movement equipment_movement_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment_movement
    ADD CONSTRAINT equipment_movement_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES baryshnikov_ii.equipment(id) ON DELETE CASCADE;


--
-- TOC entry 4825 (class 2606 OID 124619)
-- Name: equipment_movement equipment_movement_from_room_id_rooms_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment_movement
    ADD CONSTRAINT equipment_movement_from_room_id_rooms_id_fk FOREIGN KEY (from_room_id) REFERENCES baryshnikov_ii.rooms(id) ON DELETE SET NULL;


--
-- TOC entry 4826 (class 2606 OID 124629)
-- Name: equipment_movement equipment_movement_moved_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment_movement
    ADD CONSTRAINT equipment_movement_moved_by_id_users_id_fk FOREIGN KEY (moved_by_id) REFERENCES baryshnikov_ii.users(id) ON DELETE SET NULL;


--
-- TOC entry 4827 (class 2606 OID 124624)
-- Name: equipment_movement equipment_movement_to_room_id_rooms_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment_movement
    ADD CONSTRAINT equipment_movement_to_room_id_rooms_id_fk FOREIGN KEY (to_room_id) REFERENCES baryshnikov_ii.rooms(id) ON DELETE SET NULL;


--
-- TOC entry 4819 (class 2606 OID 124594)
-- Name: equipment equipment_responsible_id_users_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment
    ADD CONSTRAINT equipment_responsible_id_users_id_fk FOREIGN KEY (responsible_id) REFERENCES baryshnikov_ii.users(id) ON DELETE SET NULL;


--
-- TOC entry 4820 (class 2606 OID 124589)
-- Name: equipment equipment_room_id_rooms_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment
    ADD CONSTRAINT equipment_room_id_rooms_id_fk FOREIGN KEY (room_id) REFERENCES baryshnikov_ii.rooms(id) ON DELETE SET NULL;


--
-- TOC entry 4821 (class 2606 OID 124599)
-- Name: equipment equipment_written_off_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.equipment
    ADD CONSTRAINT equipment_written_off_by_id_users_id_fk FOREIGN KEY (written_off_by_id) REFERENCES baryshnikov_ii.users(id) ON DELETE SET NULL;


--
-- TOC entry 4828 (class 2606 OID 124704)
-- Name: requests requests_assigned_to_id_users_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.requests
    ADD CONSTRAINT requests_assigned_to_id_users_id_fk FOREIGN KEY (assigned_to_id) REFERENCES baryshnikov_ii.users(id) ON DELETE SET NULL;


--
-- TOC entry 4829 (class 2606 OID 124699)
-- Name: requests requests_created_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.requests
    ADD CONSTRAINT requests_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES baryshnikov_ii.users(id) ON DELETE CASCADE;


--
-- TOC entry 4830 (class 2606 OID 124694)
-- Name: requests requests_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.requests
    ADD CONSTRAINT requests_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES baryshnikov_ii.equipment(id) ON DELETE SET NULL;


--
-- TOC entry 4815 (class 2606 OID 99940)
-- Name: rooms rooms_attached_lab_id_users_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.rooms
    ADD CONSTRAINT rooms_attached_lab_id_users_id_fk FOREIGN KEY (attached_lab_id) REFERENCES baryshnikov_ii.users(id);


--
-- TOC entry 4816 (class 2606 OID 99945)
-- Name: rooms rooms_attached_teacher_id_users_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.rooms
    ADD CONSTRAINT rooms_attached_teacher_id_users_id_fk FOREIGN KEY (attached_teacher_id) REFERENCES baryshnikov_ii.users(id);


--
-- TOC entry 4814 (class 2606 OID 83349)
-- Name: sessions sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: baryshnikov_ii; Owner: postgres
--

ALTER TABLE ONLY baryshnikov_ii.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES baryshnikov_ii.users(id) ON DELETE CASCADE;


-- Completed on 2026-05-10 03:06:53

--
-- PostgreSQL database dump complete
--

\unrestrict ZfVgoO38gSkMZJH5aFYGmrhmwsCtES3JbC7EOflN8SqODe9YPibhS6nnMPz2XvE

