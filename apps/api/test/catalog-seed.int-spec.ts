import { CATALOG } from '@vmt/shared';
import { seedCatalog } from '../src/catalog/seed-catalog.js';
import { createTestPrisma } from './database.js';

describe('catalog seed', () => {
  const prisma = createTestPrisma();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('is idempotent and mirrors the shared catalog', async () => {
    await seedCatalog(prisma);
    await seedCatalog(prisma);

    const expected = CATALOG.flatMap((category) => category.services).length;
    expect(await prisma.catalogCategory.count()).toBe(CATALOG.length);
    expect(await prisma.catalogService.count()).toBe(expected);
    expect(await prisma.catalogService.findUnique({ where: { slug: 'oil-change' } })).toMatchObject({
      categorySlug: 'routine-maintenance',
      retired: false,
    });
  });

  it('updates names in place without touching slugs', async () => {
    await prisma.catalogService.update({ where: { slug: 'oil-change' }, data: { name: 'Stale name' } });

    await seedCatalog(prisma);

    expect((await prisma.catalogService.findUniqueOrThrow({ where: { slug: 'oil-change' } })).name).toBe(
      'Oil & filter change',
    );
  });
});
