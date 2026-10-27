-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "vin" CHAR(17),
    "year" SMALLINT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "body_class" TEXT,
    "vehicle_type" TEXT,
    "fuel_type" TEXT,
    "electrification" TEXT,
    "cylinders" SMALLINT,
    "displacement_l" DECIMAL(4,1),
    "drive_type" TEXT,
    "nickname" TEXT,
    "plate" TEXT,
    "plate_state" CHAR(2),
    "color" TEXT,
    "initial_odometer" INTEGER NOT NULL,
    "initial_odometer_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicles_owner_id_idx" ON "vehicles"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_owner_id_vin_key" ON "vehicles"("owner_id", "vin");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Business rules the database can enforce on its own.
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_initial_odometer_range" CHECK ("initial_odometer" BETWEEN 0 AND 9999999);
