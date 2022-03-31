import { json } from "remix";
import { db } from "~/utils/db.server";

export type product = { authorId: string, productId: string, device: string; };

export async function getProducts() {
  const products = await db.product.findMany({
    select: { productId: true, device: true, authorId: true },
    orderBy: { device: 'asc' }
  });

  return json(products);
}