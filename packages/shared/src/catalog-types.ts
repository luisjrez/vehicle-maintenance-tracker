export type CatalogService = {
  /** Immutable identifier stored on line items. */
  slug: string;
  name: string;
  description: string;
  /** Indicative US interval, kept as data for future reminders; unused in v1. */
  typicalInterval: string | null;
  /** Hidden from the picker; existing records keep working. */
  retired: boolean;
};

export type CatalogCategory = {
  slug: string;
  name: string;
  services: readonly CatalogService[];
};
