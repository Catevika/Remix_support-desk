import type { Ticket } from "@prisma/client";
import { db } from "~/utils/db.server";

export type Product = { authorId: string, createdAt: string; updatedAt: string; productId: string, device: string; Tickets: Ticket[]; };

export async function getProducts() {
  const products = await db.product.findMany({
    select: { authorId: true, createdAt: true, updatedAt: true, productId: true, device: true, Tickets: true },
    orderBy: { device: 'asc' }
  });
  return products;
}
