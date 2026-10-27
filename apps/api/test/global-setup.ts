import { execFileSync } from 'node:child_process';
import { seedCatalog } from '../src/catalog/seed-catalog.js';
import { createTestPrisma } from './database.js';
import './load-test-env.js';

/** Brings the test database schema and catalog up to date once per run. */
export default async function setup(): Promise<void> {
  execFileSync('prisma', ['migrate', 'deploy'], { stdio: 'inherit', env: process.env });
  const prisma = createTestPrisma();
  try {
    await seedCatalog(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
