import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, ctx, user) => {
  const url = new URL(req.url);
  const isMy = url.searchParams.get("isMy");

  const rooms = await db.query.rooms.findMany({
    columns: { id: true, description: true, number: true},
    where: isMy !== null ? (r, {eq}) => eq(r.attached_teacher, user.userId) : undefined,
    with: {
      attachedLaborant: true,
      attachedTeacher: true
    }
  });
  console.log(rooms)
  return NextResponse.json(rooms, { status: 200 })
})