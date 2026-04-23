import { withAuth } from "@/lib/auth/withAuth"
import { db } from "@/lib/db/db"
import { equipmentTypes } from "@/lib/db/schema"
import { NextResponse } from "next/server"

export const GET = withAuth(async (req, ctx, user) => {
  const equipmentTypesList = await db.select().from(equipmentTypes)
  return NextResponse.json(equipmentTypesList, { status: 200 })
})

export const POST = withAuth(async (req, ctx, user) => {
  const body = await req.json();
  const { name, description, attributesSchema } = body;
  const [newEqT] = await db.insert(equipmentTypes).values({
    name,
    description,
    attributesSchema
  }).returning();
  return NextResponse.json(newEqT, { status: 200 })
}, ["admin"])