import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Marks a route that works without a Device ID (e.g. the health check). */
export const Public = () => SetMetadata(IS_PUBLIC, true);
