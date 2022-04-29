import { Note } from "@prisma/client";
import { db } from "~/utils/db.server";
import { json } from "remix";

export type Ticket = { authorId: string, ticketProductId: string; ticketStatusId: string; ticketId: string, createdAt: string; updatedAt: string; description: string; Notes: Note[]; };

export async function getTickets() {
  const tickets = await db.ticket.findMany({
    select: { authorId: true, ticketProductId: true, ticketStatusId: true, ticketId: true, createdAt: true, updatedAt: true, description: true, Notes: true },
    orderBy: { description: 'asc' }
  });

  return json(tickets);
}