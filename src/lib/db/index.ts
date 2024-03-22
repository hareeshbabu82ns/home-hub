import { PrismaClient } from "@prisma/client";

declare const global: any;

export const db: PrismaClient =
  global.db ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") global.db = db;
