/** Who is calling: resolved from the Device ID by `DeviceGuard`. */
export type OwnerContext = {
  ownerId: string;
  deviceId: string;
};

declare module 'express-serve-static-core' {
  interface Request {
    owner?: OwnerContext;
  }
}
