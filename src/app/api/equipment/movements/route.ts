import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { equipmentMovements } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

export const GET = withAuth(async (req, ctx, user) => {
  const url = new URL(req.url);
  const equipmentId = url.searchParams.get("equipmentId");

  const movements = await db.query.equipmentMovements.findMany({
    where: equipmentId ? (m, { eq }) => eq(m.equipmentId, equipmentId) : undefined,
    with: {
      equipment: {
        with: {
          equipmentType: true,
        },
      },
      fromRoom: true,
      toRoom: true,
      movedBy: true,
    },
    orderBy: desc(equipmentMovements.movedAt),
    limit: 50,
  });

  return NextResponse.json(movements);
}, ["admin", "laborant"]);