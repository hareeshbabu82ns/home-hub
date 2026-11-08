// Loading a prisma.config.ts disables Prisma's automatic .env loading, so
// load it explicitly. The datasource URL stays in schema.prisma: this app
// uses MongoDB, which Prisma 7's query compiler doesn't support, so prisma
// is pinned to v6 (classic engine).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
});
