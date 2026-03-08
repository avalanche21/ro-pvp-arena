import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

// In-memory user store (used when no DATABASE_URL is set)
const memoryUsers = new Map<string, { id: number; username: string; passwordHash: string }>();
let nextId = 1;

export function getMemoryUsers() {
  return { memoryUsers, getNextId: () => nextId++ };
}
