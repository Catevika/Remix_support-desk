import { json } from "remix";
import { db } from "~/utils/db.server";

export type Ticket = { authorId: string, ticketProductId: string; ticketId: string, description: string; };

export async function getTickets() {
  const tickets = await db.ticket.findMany({
    select: { authorId: true, ticketProductId: true, ticketId: true, description: true },
    orderBy: { description: 'asc' }
  });

  return json(tickets);
}