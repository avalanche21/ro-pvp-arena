import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const pool = getPool();

  if (!pool) {
    return NextResponse.json([]);
  }

  try {
    const result = await pool.query(
      `SELECT username, total_kills, total_deaths,
              CASE WHEN total_deaths = 0 THEN total_kills
                   ELSE ROUND(total_kills::numeric / total_deaths, 2)
              END as kd_ratio
       FROM leaderboard_cache
       ORDER BY total_kills DESC
       LIMIT 50`,
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
