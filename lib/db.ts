import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __rhPrisma: PrismaClient | undefined;
}

function init(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export function getDb(): PrismaClient {
  if (!global.__rhPrisma) {
    global.__rhPrisma = init();
  }
  return global.__rhPrisma;
}

export const db = getDb();
