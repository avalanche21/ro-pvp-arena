import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool | null {
  return pool;
}

export function initDb(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL not set, running without database");
    return null;
  }

  pool = new Pool({ connectionString });
  pool.on("error", (err) => {
    console.error("Unexpected DB error:", err);
  });

  console.log("Database pool created");
  return pool;
}
