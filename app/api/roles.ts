import { json } from "remix";
import { db } from "~/utils/db.server";

export type role = { roleId: string, roleType: string; authorId: string; };

export async function getRoles() {
  const roles = await db.role.findMany({
    select: { roleId: true, roleType: true },
    orderBy: { roleType: 'asc' }
  });

  return json(roles);
}