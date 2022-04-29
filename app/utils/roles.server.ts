import { Board } from "@prisma/client";
import { db } from "~/utils/db.server";
import { json } from "remix";

export type Role = { roleId: string, roleType: string; authorId: string; createdAt: Date, updatedAt: Date; Boards: Board[]; };

export async function getRoles() {
  const roles = await db.role.findMany({
    select: { roleId: true, roleType: true, authorId: true, createdAt: true, updatedAt: true },
    orderBy: { roleType: 'asc' }
  });

  return json(roles);
}