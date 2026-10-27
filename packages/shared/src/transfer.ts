import { z } from 'zod';

/** Single-use transfer codes live 10 minutes (ADR-0001). */
export const TRANSFER_CODE_TTL_MS = 10 * 60 * 1000;
/** QR payloads carry a prefix so the scanner can tell a transfer code from any other QR. */
export const TRANSFER_QR_PREFIX = 'vmt-transfer:';

const transferCodeSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'This is not a valid transfer code.');

export function transferQrPayload(code: string): string {
  return `${TRANSFER_QR_PREFIX}${code}`;
}

/** The code inside a scanned QR, or null when the QR is not one of ours. */
export function parseTransferQr(value: string): string | null {
  if (!value.startsWith(TRANSFER_QR_PREFIX)) return null;
  const code = value.slice(TRANSFER_QR_PREFIX.length);
  return transferCodeSchema.safeParse(code).success ? code : null;
}

export const issuedTransferCodeSchema = z.object({
  code: transferCodeSchema,
  expiresAt: z.iso.datetime(),
});
export type IssuedTransferCode = z.infer<typeof issuedTransferCodeSchema>;

export const redeemTransferSchema = z.object({
  code: transferCodeSchema,
  /** Required once the API reported that this phone already has data. */
  replaceExisting: z.boolean().default(false),
});
export type RedeemTransferInput = z.input<typeof redeemTransferSchema>;
export type RedeemTransfer = z.output<typeof redeemTransferSchema>;

export const redeemedTransferSchema = z.object({ vehicleCount: z.number().int().nonnegative() });
export type RedeemedTransfer = z.infer<typeof redeemedTransferSchema>;

/** `details` of the 409 returned when this phone has vehicles and `replaceExisting` was false. */
export const transferConflictDetailsSchema = z.object({ vehicleCount: z.number().int().positive() });
