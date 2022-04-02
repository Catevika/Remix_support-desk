import { json } from "remix";
import { db } from "~/utils/db.server";

export type User = { id: string, createdAt: Date, updatedAt: Date; username: string; email: string, service: string; };

export async function getUsers() {
  const users = await db.user.findMany({
    select: { id: true, createdAt: true, updatedAt: true, username: true, email: true, service: true },
    orderBy: { username: 'asc' }
  });
  return json(users);
}