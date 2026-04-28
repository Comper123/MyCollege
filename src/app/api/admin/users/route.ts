import { withAuth } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/db";
import { UserRole, users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, ctx, user) => {
  const url = new URL(req.url);
  const role = url.searchParams.get("role");

  const allUsers = await db.query.users.findMany({
    columns: { passwordHash: false, passwordShifr: false },
    orderBy: (users, { desc }) => [desc(users.createdAt)],
    where: role === null ? undefined : (u, {eq}) => eq(u.role, role as UserRole)
  })
 
  return NextResponse.json({ users: allUsers })
}, ["admin"]);

export const POST = withAuth(async (req, ctx, user) => {
  const body = await req.json()
  const { email, firstname, lastname, fathername, role, password } = body
 
  if (!email || !firstname || !lastname || !role || !password) {
    return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 })
  }
 
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  })
  if (existing) {
    return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 409 })
  }
 
  const passwordHash = await bcrypt.hash(password, 12)
 
  const [newUser] = await db.insert(users).values({
    email: email.toLowerCase().trim(),
    firstname,
    lastname,
    fathername: fathername || null,
    role,
    passwordHash,
    passwordShifr: '',
    isActive: true,
  }).returning({
    id: users.id,
    email: users.email,
    firstname: users.firstname,
    lastname: users.lastname,
    fathername: users.fathername,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
  })
 
  return NextResponse.json({ user: newUser }, { status: 201 })
}, ["admin"]);