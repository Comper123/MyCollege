import { headers } from "next/headers";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { UserRole, users } from "../db/schema";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { RequestUser } from "./types";
import { SessionPayload } from "./tokens";


export async function getCurrentUser(){
  try {
    const resp = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });
    if (resp.ok){
      const data = await resp.json();
      return data
    } else {
      return null
    }
  } catch {
    return null
  }
}

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);


export async function getUserFromRequest(req: NextRequest): Promise<RequestUser | undefined | null>{
  try {
    const sessionCookie = req.cookies.get("session")?.value;
    if (!sessionCookie) return null;
    const { payload } = await jwtVerify(sessionCookie, SECRET);
    return {
      userId: payload.userId as string,
      role: payload.role as UserRole
    }
  } catch {
    return null;
  }
}