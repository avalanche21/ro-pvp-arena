"use client";

import Link from "next/link";
import CharacterPreview from "@/components/CharacterPreview";

const CLASSES = [
  { name: "Knight", gender: "m" as const, role: "Tanky Melee", color: "#3b82f6" },
  { name: "Crusader", gender: "m" as const, role: "Holy Tank", color: "#60a5fa" },
  { name: "Assassin", gender: "m" as const, role: "Burst DPS", color: "#ef4444" },
  { name: "Rogue", gender: "m" as const, role: "Agile Debuffer", color: "#f87171" },
  { name: "Wizard", gender: "m" as const, role: "Ranged AoE", color: "#a855f7" },
  { name: "Sage", gender: "f" as const, role: "Elemental Caster", color: "#c084fc" },
  { name: "Priest", gender: "f" as const, role: "Support/Sustain", color: "#fbbf24" },
  { name: "Monk", gender: "m" as const, role: "Melee Burst", color: "#f59e0b" },
  { name: "Hunter", gender: "m" as const, role: "Ranged DPS", color: "#22c55e" },
  { name: "Bard", gender: "m" as const, role: "Music Support", color: "#06b6d4" },
  { name: "Dancer", gender: "f" as const, role: "Dance Support", color: "#ec4899" },
  { name: "Alchemist", gender: "m" as const, role: "Potion/DoT", color: "#f97316" },
];

export default function Home() {
  return (
    <div className="relative flex flex-col items-center min-h-screen overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Decorative top bar */}
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

      {/* Title section */}
      <div className="relative z-10 text-center mt-12 mb-4 px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-amber-400 drop-shadow-lg tracking-wide">
          RO PvP Arena
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mt-3 max-w-xl mx-auto">
          Browser-playable Ragnarok-inspired PvP arena
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Choose your class. Enter the arena. Fight to the death.
        </p>
      </div>

      {/* Action buttons */}
      <div className="relative z-10 flex gap-4 mt-4 mb-8">
        <Link
          href="/login"
          className="px-10 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 hover:scale-105 transition-all shadow-lg shadow-amber-500/20"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="px-10 py-3 border-2 border-amber-500 text-amber-400 font-bold rounded-lg hover:bg-amber-500/10 hover:scale-105 transition-all"
        >
          Register
        </Link>
      </div>

      {/* Character showcase - all 12 classes */}
      <div className="relative z-10 w-full max-w-6xl px-4 mb-8">
        <h2 className="text-center text-amber-400/80 text-sm font-semibold uppercase tracking-widest mb-4">
          12 Playable Classes
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1 md:gap-2 items-end justify-center">
          {CLASSES.map((cls) => (
            <div key={cls.name} className="flex flex-col items-center group">
              <div className="relative transition-transform group-hover:scale-110 group-hover:-translate-y-1">
                <CharacterPreview
                  className={cls.name}
                  gender={cls.gender}
                  size={80}
                />
              </div>
              <span
                className="text-[10px] md:text-xs font-bold mt-1 opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ color: cls.color }}
              >
                {cls.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ground line */}
      <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-amber-800/50 to-transparent" />

      {/* Feature highlights */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl px-6 my-8">
        <div className="text-center p-4 rounded-lg border border-gray-800 bg-gray-900/50">
          <div className="text-2xl mb-2">&#9876;</div>
          <h3 className="font-bold text-amber-400 mb-1">12 Classes</h3>
          <p className="text-sm text-gray-400">Each with 4 unique skills, gender selection, and animated sprites</p>
        </div>
        <div className="text-center p-4 rounded-lg border border-gray-800 bg-gray-900/50">
          <div className="text-2xl mb-2">&#9881;</div>
          <h3 className="font-bold text-amber-400 mb-1">Real-time PvP</h3>
          <p className="text-sm text-gray-400">Fast-paced multiplayer combat with classic RO mechanics</p>
        </div>
        <div className="text-center p-4 rounded-lg border border-gray-800 bg-gray-900/50">
          <div className="text-2xl mb-2">&#127760;</div>
          <h3 className="font-bold text-amber-400 mb-1">No Downloads</h3>
          <p className="text-sm text-gray-400">Play instantly in your browser, no installs required</p>
        </div>
      </div>

      {/* Leaderboard link */}
      <Link
        href="/leaderboard"
        className="relative z-10 mb-8 text-amber-400 hover:text-amber-300 underline text-sm"
      >
        View Leaderboard
      </Link>

      {/* Bottom decorative bar */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mt-auto" />
      <p className="text-gray-600 text-xs py-4">Ragnarok Online inspired PvP Arena</p>
    </div>
  );
}
