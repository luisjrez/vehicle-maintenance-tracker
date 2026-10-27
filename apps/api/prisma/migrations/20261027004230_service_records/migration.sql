-- CreateEnum
CREATE TYPE "provider_type" AS ENUM ('dealer', 'chain', 'independent', 'diy');

-- CreateTable
CREATE TABLE "service_records" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "odometer" INTEGER,
    "provider_name" TEXT,
    "provider_type" "provider_type",
    "notes" TEXT,
    "total_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_items" (
    "id" UUID NOT NULL,
    "record_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,
    "service_slug" TEXT,
    "custom_name" TEXT,
    "cost_cents" INTEGER,
    "notes" TEXT,
    "package_code" TEXT,

    CONSTRAINT "line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_categories" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" SMALLINT NOT NULL,

    CONSTRAINT "catalog_categories_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "catalog_services" (
    "slug" TEXT NOT NULL,
    "category_slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "typical_interval" TEXT,
    "retired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "catalog_services_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE INDEX "service_records_vehicle_id_date_idx" ON "service_records"("vehicle_id", "date");

-- CreateIndex
CREATE INDEX "line_items_record_id_idx" ON "line_items"("record_id");

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "service_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_service_slug_fkey" FOREIGN KEY ("service_slug") REFERENCES "catalog_services"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_services" ADD CONSTRAINT "catalog_services_category_slug_fkey" FOREIGN KEY ("category_slug") REFERENCES "catalog_categories"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business rules the database can enforce on its own (the shared Zod schemas are the first line).
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_total_non_negative" CHECK ("total_cents" >= 0);
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_currency_usd" CHECK ("currency" = 'USD');
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_odometer_range" CHECK ("odometer" IS NULL OR "odometer" BETWEEN 0 AND 9999999);
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_service_xor_custom" CHECK (("service_slug" IS NULL) <> ("custom_name" IS NULL));
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_cost_non_negative" CHECK ("cost_cents" IS NULL OR "cost_cents" >= 0);
