import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { requests } from "@/lib/db/schema/requests";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/requests/:id
export const GET = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;

  const request = await db.query.requests.findFirst({
    where: eq(requests.id, id),
    with: {
      equipment: true,
      createdBy: true,
      assignedTo: true,
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  return NextResponse.json(request);
}, ["admin", "laborant", "teacher"]);

// PATCH /api/requests/:id
export const PATCH = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const { status, assignedToId, adminComment, resolution } = body;

  const updateData: any = { updatedAt: new Date() };
  if (status) updateData.status = status;
  if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
  if (adminComment !== undefined) updateData.adminComment = adminComment;
  if (resolution !== undefined) updateData.resolution = resolution;
  if (status === "completed") updateData.resolvedAt = new Date();

  const [updated] = await db
    .update(requests)
    .set(updateData)
    .where(eq(requests.id, id))
    .returning();

  const fullRequest = await db.query.requests.findFirst({
    where: eq(requests.id, id),
    with: {
      equipment: true,
      createdBy: true,
      assignedTo: true,
    },
  });

  return NextResponse.json(fullRequest);
}, ["admin", "laborant"]);

// DELETE /api/requests/:id
export const DELETE = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;

  await db.delete(requests).where(eq(requests.id, id));

  return NextResponse.json({ success: true });
}, ["admin"]);