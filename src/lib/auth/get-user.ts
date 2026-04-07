import { headers } from "next/headers";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";

export async function getCurrentUser(){
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) return null;

    return db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { 
            passwordHash: false,
            passwordShifr: false
        }
    })
}