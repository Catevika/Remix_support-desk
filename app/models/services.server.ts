import { prisma } from "~/utils/db.server";

export type Service = { authorId: string, createdAt: string; updatedAt: string; serviceId: string, name: string; };

export async function getServices() {
  return await prisma.service.findMany();
}

export async function getService(serviceId: string | undefined) {
  return await prisma.service.findUnique({ where: { serviceId } });
}

export async function deleteService(serviceId: string | undefined) {
  return await prisma.service.delete({ where: { serviceId } });
}