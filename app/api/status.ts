import { json } from "remix";
import { db } from "~/utils/db.server";

export type Status = { technicianId: string; statusId: string, createdAt: Date, updatedAt: Date; type: string; };

export async function getStatus() {
  const status = await db.status.findMany({
    select: { technicianId: true, statusId: true, createdAt: true, updatedAt: true, type: true },
    orderBy: { type: 'asc' }
  });

  return json(status);
}