import { execFileSync } from 'node:child_process';
import './load-test-env.js';

/** Brings the test database schema up to date once per run. */
export default function setup(): void {
  execFileSync('prisma', ['migrate', 'deploy'], { stdio: 'inherit', env: process.env });
}
