import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const url = process.env['DATABASE_URL'];
    if (!url) {
      throw new Error(
        'DATABASE_URL is required for PostgreSQL. Set CONFIG_FILE=config.env.dev.postgres or ensure DATABASE_URL is set.'
      );
    }
    const adapter = new PrismaPg({ connectionString: url });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}
