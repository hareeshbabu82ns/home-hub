import { PrismaClient } from "@/app/generated/prisma";

declare const global: { db?: PrismaClient };

export const db: PrismaClient =
  global.db ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") global.db = db;
