import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipment, rooms } from "@/lib/db/schema";
import { requests, RequestStatus, RequestType } from "@/lib/db/schema/requests";
import { eq, desc, and, or, ilike, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/requests
export const GET = withAuth(async (req, ctx, user) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  const search = url.searchParams.get("search");
  const my = url.searchParams.get("my");
  const equipmentId = url.searchParams.get("equipmentId");

  const conditions = [];

  if (type && type !== "all") {
    conditions.push(eq(requests.type, type as RequestType));
  }
  if (search) {
    conditions.push(
      or(
        ilike(requests.title, `%${search}%`),
        ilike(requests.description, `%${search}%`)
      )
    );
  }
  if (equipmentId) {
    conditions.push(eq(requests.equipmentId, equipmentId));
  }
  
  // Обработка статусов - разделяем по запятой
  if (status && status !== "all") {
    const statuses = status.split(",");
    if (statuses.length === 1) {
      conditions.push(eq(requests.status, statuses[0] as RequestStatus));
    } else {
      conditions.push(inArray(requests.status, statuses as RequestStatus[]));
    }
  }
  
  // Обработка "мои заявки"
  if (my === "true" || user.role === "teacher") {
    conditions.push(eq(requests.createdById, user.userId));
  }

  const requestsList = await db.query.requests.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: {
      equipment: true,
      createdBy: true,
      assignedTo: true,
    },
    orderBy: desc(requests.createdAt),
  });

  return NextResponse.json(requestsList);
}, ["admin", "laborant", "teacher"]);

// POST /api/requests
export const POST = withAuth(async (req, ctx, user) => {
  const body = await req.json();
  const { title, description, type, priority, equipmentId, deadline } = body;

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Заполните заголовок и описание" }, { status: 400 });
  }

  // Проверка прав доступа для преподавателей
  if (user.role === "teacher" && equipmentId) {
    // Находим оборудование
    const targetEquipment = await db.query.equipment.findFirst({
      where: eq(equipment.id, equipmentId),
      with: {
        room: true,
      },
    });

    if (!targetEquipment) {
      return NextResponse.json({ error: "Оборудование не найдено" }, { status: 404 });
    }

    // Проверяем, принадлежит ли кабинет этому преподавателю
    const isTeacherRoom = await db.query.rooms.findFirst({
      where: and(
        eq(rooms.id, targetEquipment.roomId || ""),
        eq(rooms.attached_teacher, user.userId)
      ),
    });

    if (!isTeacherRoom && targetEquipment.roomId) {
      return NextResponse.json(
        { error: "Вы не можете создавать заявки на оборудование в этом кабинете" },
        { status: 403 }
      );
    }
  }

  const [newRequest] = await db
    .insert(requests)
    .values({
      title: title.trim(),
      description: description.trim(),
      type: type || "repair",
      priority: priority || "medium",
      equipmentId: equipmentId || null,
      createdById: user.userId,
      deadline: deadline ? new Date(deadline) : null,
      status: "pending",
    })
    .returning();

  const fullRequest = await db.query.requests.findFirst({
    where: eq(requests.id, newRequest.id),
    with: {
      equipment: true,
      createdBy: true,
      assignedTo: true,
    },
  });

  return NextResponse.json(fullRequest, { status: 201 });
}, ["teacher", "laborant", "admin"]);