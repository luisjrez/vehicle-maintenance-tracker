import { CATALOG } from '@vmt/shared';
import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Upserts the shared catalog into the database so line items can reference
 * it. Idempotent, and it never deletes: a slug removed from code by mistake
 * keeps its row, so old records stay valid (ADR-0004).
 */
export async function seedCatalog(prisma: PrismaClient): Promise<{ categories: number; services: number }> {
  let services = 0;
  await prisma.$transaction(async (tx) => {
    for (const [position, category] of CATALOG.entries()) {
      await tx.catalogCategory.upsert({
        where: { slug: category.slug },
        create: { slug: category.slug, name: category.name, position },
        update: { name: category.name, position },
      });
      for (const service of category.services) {
        const data = {
          categorySlug: category.slug,
          name: service.name,
          description: service.description,
          typicalInterval: service.typicalInterval,
          retired: service.retired,
        };
        await tx.catalogService.upsert({ where: { slug: service.slug }, create: { slug: service.slug, ...data }, update: data });
        services += 1;
      }
    }
  }, { timeout: 30_000 });
  return { categories: CATALOG.length, services };
}
