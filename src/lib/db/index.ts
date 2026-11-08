import { PrismaClient } from "@/app/generated/prisma";

declare const global: { db?: PrismaClient };

export const db: PrismaClient =
  global.db ||
  new PrismaClient({
    // The network collector sets PRISMA_LOG_QUERIES=false to avoid log floods.
    log: process.env.PRISMA_LOG_QUERIES === "false" ? ["warn", "error"] : ["query"],
  });

if (process.env.NODE_ENV !== "production") global.db = db;
