import { NextRequest, NextResponse } from "next/server";
import { User, UserRole } from "../db/schema";
import { getCurrentUser, getUserFromRequest } from "./get-user";
import { RequestUser, SelectUser } from "./types";


// Дженерик P — тип params конкретного роута
type Context<P = Record<string, string>> = {
  params: Promise<P>;
};

type Handler<P = Record<string, string>> = (
  req:     NextRequest,
  ctx:     Context<P>,
  user: RequestUser,
) => Promise<NextResponse>;

export function withAuth<P = Record<string, string>>(
  handler: Handler<P>,
  allowedRoles?: UserRole[]
){
  return async (req: NextRequest, ctx: Context<P>) => {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (allowedRoles && allowedRoles.length !== 0 && !allowedRoles.includes(user.role)){
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(req, ctx, user);
  };
}