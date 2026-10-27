import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { DomainError } from '../common/domain-error.js';
import type { OwnerContext } from './owner-context.js';
import './owner-context.js';

/** Injects the Owner resolved by `DeviceGuard`. */
export const CurrentOwner = createParamDecorator((_: unknown, context: ExecutionContext): OwnerContext => {
  const owner = context.switchToHttp().getRequest<Request>().owner;
  if (owner === undefined) {
    // Only reachable if a route is marked @Public() and still asks for an Owner.
    throw new DomainError(500, 'OWNER_NOT_RESOLVED', 'Something went wrong. Please try again.');
  }
  return owner;
});
