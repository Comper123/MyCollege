import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, ctx, user) => {
  // Преподаватели могут только просматривать типы оборудования
  const types = await db.query.equipmentTypes.findMany({
    orderBy: (types, { asc }) => [asc(types.name)],
  });

  return NextResponse.json(types);
}, ["teacher", "laborant", "admin"]);