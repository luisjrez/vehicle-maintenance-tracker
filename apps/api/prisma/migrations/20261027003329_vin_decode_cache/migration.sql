-- CreateTable
CREATE TABLE "vin_decode_cache" (
    "vin" CHAR(17) NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "payload" JSONB NOT NULL,
    "fetched_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3),

    CONSTRAINT "vin_decode_cache_pkey" PRIMARY KEY ("vin")
);
