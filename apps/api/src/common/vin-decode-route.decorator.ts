import { SetMetadata } from '@nestjs/common';

export const VIN_DECODE_ROUTE = 'vinDecodeRoute';

/** Opts a handler into the tighter per-Device VIN decode limit (ADR-0009). */
export const VinDecodeRoute = () => SetMetadata(VIN_DECODE_ROUTE, true);
