import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { rooms } from "@/lib/db/schema";
import { FullRoom } from "@/types/rooms";
import { NextResponse } from "next/server";


export async function getRoom(id: string): Promise<FullRoom>{
  const room = await db.query.rooms.findFirst({
    columns: { id: true, description: true, number: true},
    where: (r, {eq}) => eq(r.id, id),
    with: {
      attachedLaborant: true,
      attachedTeacher: true
    }
  });
  return room as FullRoom;
}

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

export const POST = withAuth(async (req, ctx, user) => {
  const { number, description, teacher_id, laborant_id } = await req.json();
  const [room] = await db.insert(rooms).values({
    number, description, 
    attached_lab: laborant_id,
    attached_teacher: teacher_id 
  }).returning();

  const newRoom = getRoom(room.id);
  return NextResponse.json(newRoom, { status: 200 })
})