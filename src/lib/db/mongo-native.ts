import { MongoClient, type Db } from "mongodb";

/**
 * Native driver connection to the app database (DATABASE_URL), for features
 * Prisma can't express: time-series collections, TTL indexes and bulk writes.
 * Cached on globalThis so dev hot reloads reuse one connection pool.
 */
const globalForMongo = globalThis as unknown as {
  appMongo?: Promise<MongoClient>;
};

function connect(): Promise<MongoClient> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return Promise.reject(new Error("DATABASE_URL is not set"));
  }
  const client = new MongoClient(url, { serverSelectionTimeoutMS: 10_000 });
  return client.connect();
}

export async function getAppDb(): Promise<Db> {
  globalForMongo.appMongo ??= connect().catch((error) => {
    globalForMongo.appMongo = undefined; // retry on next call
    throw error;
  });
  return (await globalForMongo.appMongo).db();
}

export async function closeAppDb(): Promise<void> {
  const pending = globalForMongo.appMongo;
  globalForMongo.appMongo = undefined;
  if (pending) await (await pending).close();
}
