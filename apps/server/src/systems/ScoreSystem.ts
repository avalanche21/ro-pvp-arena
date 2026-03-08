import { Pool } from "pg";
import { Player } from "../schema/Player";

export async function persistPlayerStats(pool: Pool | null, player: Player): Promise<void> {
  if (!pool) return;
  if (player.kills === 0 && player.deaths === 0) return;

  try {
    await pool.query(
      `INSERT INTO match_stats (user_id, kills, deaths, class) VALUES ($1, $2, $3, $4)`,
      [player.userId, player.kills, player.deaths, player.className],
    );

    // Upsert leaderboard cache
    await pool.query(
      `INSERT INTO leaderboard_cache (user_id, username, total_kills, total_deaths, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         total_kills = leaderboard_cache.total_kills + $3,
         total_deaths = leaderboard_cache.total_deaths + $4,
         updated_at = NOW()`,
      [player.userId, player.username, player.kills, player.deaths],
    );
  } catch (err) {
    console.error("Failed to persist player stats:", err);
  }
}
