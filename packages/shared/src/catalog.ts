import { CATALOG } from './catalog-data.js';
import type { CatalogCategory, CatalogService } from './catalog-types.js';

export { CATALOG };
export type { CatalogCategory, CatalogService };

export const SCHEDULED_MAINTENANCE_SLUG = 'scheduled-maintenance';
/** Line items without a catalog service count toward this category in reports. */
export const OTHER_CATEGORY_SLUG = 'other';

const serviceIndex = new Map<string, { service: CatalogService; category: CatalogCategory }>(
  CATALOG.flatMap((category) => category.services.map((service) => [service.slug, { service, category }] as const)),
);

export function catalogServiceBySlug(slug: string): CatalogService | undefined {
  return serviceIndex.get(slug)?.service;
}

export function categoryOfService(slug: string): CatalogCategory | undefined {
  return serviceIndex.get(slug)?.category;
}

export function categoryBySlug(slug: string): CatalogCategory | undefined {
  return CATALOG.find((category) => category.slug === slug);
}

/** Quick picks above search (service catalog decision 8). `notes` prefills variants such as the axle. */
export const COMMON_SERVICES: readonly { label: string; serviceSlug: string; notes?: string }[] = [
  { label: 'Oil change', serviceSlug: 'oil-change' },
  { label: 'Tire rotation', serviceSlug: 'tire-rotation' },
  { label: 'Front brake pads', serviceSlug: 'brake-pads', notes: 'Front axle' },
  { label: 'Battery', serviceSlug: 'battery-replacement' },
  { label: 'New tires', serviceSlug: 'tire-replacement' },
  { label: 'Full detailing', serviceSlug: 'full-detail' },
  { label: 'State inspection', serviceSlug: 'state-safety-inspection' },
  { label: 'Wiper blades', serviceSlug: 'wiper-blades' },
];

/** Every query word must appear in the service's name, description or category name. */
export function searchCatalog(query: string): CatalogService[] {
  const words = query.toLowerCase().split(/\s+/).filter((word) => word !== '');
  if (words.length === 0) return [];
  return CATALOG.flatMap((category) =>
    category.services.filter((service) => {
      if (service.retired) return false;
      const haystack = `${service.name} ${service.description} ${category.name}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    }),
  );
}
