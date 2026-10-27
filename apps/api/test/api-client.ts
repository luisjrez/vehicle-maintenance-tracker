import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

/** Supertest bound to one Device ID, i.e. one Owner. */
export function asDevice(app: INestApplication, deviceId: string) {
  const server = app.getHttpServer();
  return {
    get: (path: string) => request(server).get(path).set('X-Device-Id', deviceId),
    post: (path: string, body: object) => request(server).post(path).set('X-Device-Id', deviceId).send(body),
    patch: (path: string, body: object) => request(server).patch(path).set('X-Device-Id', deviceId).send(body),
    delete: (path: string) => request(server).delete(path).set('X-Device-Id', deviceId),
  };
}
