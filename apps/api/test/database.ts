import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

/** Direct database access for arranging and asserting integration tests. */
export function createTestPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString === undefined) throw new Error('DATABASE_URL is not set for integration tests');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/** Wipes Owner data; everything else hangs off owners with ON DELETE CASCADE. */
export async function resetOwners(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRaw`TRUNCATE TABLE owners CASCADE`;
}
