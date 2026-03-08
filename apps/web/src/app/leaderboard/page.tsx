"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  username: string;
  total_kills: number;
  total_deaths: number;
  kd_ratio: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEntries(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-amber-400">Leaderboard</h1>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-400">No stats yet. Be the first to fight!</p>
      ) : (
        <table className="w-full max-w-2xl border-collapse">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="py-3 px-4 text-gray-400">#</th>
              <th className="py-3 px-4 text-gray-400">Player</th>
              <th className="py-3 px-4 text-gray-400">Kills</th>
              <th className="py-3 px-4 text-gray-400">Deaths</th>
              <th className="py-3 px-4 text-gray-400">K/D</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={entry.username} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                <td className="py-3 px-4 font-bold">{entry.username}</td>
                <td className="py-3 px-4 text-green-400">{entry.total_kills}</td>
                <td className="py-3 px-4 text-red-400">{entry.total_deaths}</td>
                <td className="py-3 px-4 text-amber-400">{entry.kd_ratio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-8 flex gap-4">
        <Link href="/lobby" className="text-amber-400 hover:underline">
          Play
        </Link>
        <Link href="/" className="text-gray-500 hover:text-gray-300">
          Home
        </Link>
      </div>
    </div>
  );
}
