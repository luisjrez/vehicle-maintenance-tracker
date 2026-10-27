-- CreateTable
CREATE TABLE "transfer_codes" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transfer_codes_code_hash_key" ON "transfer_codes"("code_hash");

-- CreateIndex
CREATE INDEX "transfer_codes_owner_id_idx" ON "transfer_codes"("owner_id");

-- AddForeignKey
ALTER TABLE "transfer_codes" ADD CONSTRAINT "transfer_codes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
