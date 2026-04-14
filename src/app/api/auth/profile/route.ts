import { withAuth } from "@/lib/auth/withAuth"
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server"

export const PATCH = withAuth(async (req, ctx, user) => {
  const body = await req.json();
  const allowed = ["firstname", "lastname", "fathername"];
  const update  = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  await db.update(users).set(update).where(eq(users.id, user.userId));
  return NextResponse.json({ status: 200 })
}, [])