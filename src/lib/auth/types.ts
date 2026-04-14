import { User, UserRole } from "../db/schema";

export type SelectUser = NonNullable<Awaited<Omit<User, "passwordHash" | "passwordShifr">>>;

export type RequestUser = {
  userId: string;
  role: UserRole;
}