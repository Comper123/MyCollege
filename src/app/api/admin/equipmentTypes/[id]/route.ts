import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipmentTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export const GET = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const eqType = await db.select().from(equipmentTypes).where(eq(equipmentTypes.id, id));
  return NextResponse.json(eqType[0], { status: 200 })
});

export const DELETE = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const [removing] = await db.select().from(equipmentTypes).where(eq(equipmentTypes.id, id));
  if (!removing) {
    return NextResponse.json({ status: 404 })
  }

  await db.delete(equipmentTypes).where(eq(equipmentTypes.id, id));
  return NextResponse.json({ status: 204 });
});

export const PATCH = withAuth(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const allowed = ["name", "description", "attributesSchema"]
  const update  = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  const [updatedEqT] = await db.update(equipmentTypes).set(update).where(eq(equipmentTypes.id, id)).returning();
  return NextResponse.json(updatedEqT, { status: 200 });
});