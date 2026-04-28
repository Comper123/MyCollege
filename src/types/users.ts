import { User } from "@/lib/db/schema";

export type SelectUser = Omit<User, "password_shifr" | "password_hash">;