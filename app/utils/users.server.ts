import { Board, Note, Product, Role, Status, Ticket } from "@prisma/client";
import { db } from "~/utils/db.server";
import { json } from "remix";

export type User = { id: string, createdAt: Date, updatedAt: Date; username: string; email: string, service: string; Roles: Role[]; Boards: Board[]; Tickets: Ticket[]; Products: Product[]; Status: Status[]; Notes: Note[]; };

export async function getUsers() {
  const users: User[] = await db.user.findMany({
    select: { id: true, createdAt: true, updatedAt: true, username: true, email: true, service: true, Roles: true, Boards: true, Tickets: true, Products: true, Status: true, Notes: true },
    orderBy: { username: 'asc' }
  });
  return json(users);
}