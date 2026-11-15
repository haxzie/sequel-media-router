/**
 * Codegen entry point, not used at runtime.
 *
 * The Better Auth CLI has to introspect a live config to emit a schema, and it
 * cannot reach D1 — that binding only exists inside a Worker request. So the
 * CLI reads this file, which is the same options object pointed at a throwaway
 * SQLite file. Sharing `authOptions` is what keeps the generated schema honest.
 *
 *   pnpm db:generate   # rewrites migrations/0001_auth.sql
 */
import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';
import { authOptions } from './auth';

export const auth = betterAuth(authOptions(new Database(':memory:')));
