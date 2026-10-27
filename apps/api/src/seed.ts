import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { seedCatalog } from './catalog/seed-catalog.js';

// Runs after `prisma migrate deploy` in the migrate job (docker-compose and deploys).
const connectionString = process.env.DATABASE_URL;
if (connectionString === undefined || connectionString === '') {
  throw new Error('DATABASE_URL is required to seed the catalog');
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
try {
  const { categories, services } = await seedCatalog(prisma);
  console.log(`Catalog seeded: ${categories} categories, ${services} services`);
} finally {
  await prisma.$disconnect();
}
