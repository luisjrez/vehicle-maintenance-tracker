import {
  CATALOG,
  catalogServiceBySlug,
  categoryOfService,
  COMMON_SERVICES,
  SCHEDULED_MAINTENANCE_SLUG,
  searchCatalog,
} from './catalog.js';

const allServices = CATALOG.flatMap((category) => category.services);

describe('service catalog', () => {
  it('has 14 fixed categories and unique kebab-case slugs', () => {
    expect(CATALOG).toHaveLength(14);
    const slugs = [...CATALOG.map((category) => category.slug), ...allServices.map((service) => service.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))).toBe(true);
  });

  it('carries the researched services plus EV/hybrid items', () => {
    expect(allServices.length).toBeGreaterThanOrEqual(117);
    expect(catalogServiceBySlug('hv-system-inspection')?.name).toMatch(/high-voltage/i);
  });

  it('puts every service in exactly one category', () => {
    expect(categoryOfService('oil-change')?.slug).toBe('routine-maintenance');
    expect(categoryOfService('brake-pads')?.slug).toBe('brakes');
    expect(categoryOfService('nope')).toBeUndefined();
  });

  it('offers quick picks that all exist in the catalog', () => {
    expect(COMMON_SERVICES).toHaveLength(8);
    expect(COMMON_SERVICES.every((pick) => catalogServiceBySlug(pick.serviceSlug) !== undefined)).toBe(true);
    expect(catalogServiceBySlug(SCHEDULED_MAINTENANCE_SLUG)).toBeDefined();
  });
});

describe('searchCatalog', () => {
  it('matches names and descriptions, case-insensitively, ignoring retired services', () => {
    const results = searchCatalog('rotation').map((service) => service.slug);
    expect(results).toContain('tire-rotation');
  });

  it('matches every word in any order', () => {
    expect(searchCatalog('filter cabin').map((service) => service.slug)).toEqual(['cabin-air-filter']);
  });

  it('returns nothing for a blank query', () => {
    expect(searchCatalog('   ')).toEqual([]);
  });
});
