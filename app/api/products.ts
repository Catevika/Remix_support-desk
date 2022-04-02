import { json } from "remix";
import { db } from "~/utils/db.server";

export type Product = { authorId: string, productId: string, device: string; };

export async function getProduct(productId: string) {
  const product = await db.product.findUnique({
    where: { productId },
    select: { authorId: true, productId: true, device: true }
  });

  return json(product);
}

export async function getProducts() {
  const products = await db.product.findMany({
    select: { productId: true, device: true, authorId: true },
    orderBy: { device: 'asc' }
  });

  return json(products);
}