// Prisma config - DATABASE_URL env'den veya config dosyasından alınır
import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

// Önce config.env.dev.postgres yükle (PostgreSQL migrate için)
const envFile =
  process.env["CONFIG_FILE"] ||
  (process.env["NODE_ENV"] === "test"
    ? "config.env.test"
    : "config.env.dev.postgres");
dotenv.config({
  path: path.resolve(process.cwd(), `config/env/${envFile}`),
  override: true,
});
// .env fallback
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env["DATABASE_URL"] ||
      "postgresql://postgres:mbsusurluk1905@localhost:5433/QA_Platform",
  },
});
