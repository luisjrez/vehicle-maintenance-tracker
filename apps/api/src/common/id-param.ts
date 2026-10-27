import { z } from 'zod';

/** Route ids are UUIDs; anything else is a 400 before it reaches Postgres. */
export const idParamSchema = z.uuid('Invalid id.');
