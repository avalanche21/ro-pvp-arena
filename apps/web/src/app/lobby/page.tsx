"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlayerClass, ALL_CLASSES } from "@ro-pvp/shared";
import CharacterPreview from "@/components/CharacterPreview";

const CLASS_COLORS: Record<string, string> = {
  Knight: "#3b82f6",
  Crusader: "#60a5fa",
  Assassin: "#ef4444",
  Rogue: "#f87171",
  Wizard: "#a855f7",
  Sage: "#c084fc",
  Priest: "#fbbf24",
  Monk: "#f59e0b",
  Hunter: "#22c55e",
  Bard: "#06b6d4",
  Dancer: "#ec4899",
  Alchemist: "#f97316",
};

const CLASS_ROLES: Record<string, string> = {
  Knight: "Tanky Melee",
  Crusader: "Holy Tank",
  Assassin: "Burst DPS",
  Rogue: "Agile Debuffer",
  Wizard: "Ranged AoE",
  Sage: "Elemental Caster",
  Priest: "Support/Sustain",
  Monk: "Melee Burst",
  Hunter: "Ranged DPS",
  Bard: "Music Support",
  Dancer: "Dance Support",
  Alchemist: "Potion/DoT",
};

// Gender-locked classes
const MALE_ONLY = new Set([PlayerClass.Bard]);
const FEMALE_ONLY = new Set([PlayerClass.Dancer]);

export default function LobbyPage() {
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null);
  const [gender, setGender] = useState<"m" | "f">("m");
  const [username, setUsername] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("username");
    if (!token) {
      router.push("/login");
      return;
    }
    setUsername(name || "Player");
  }, [router]);

  // Auto-correct gender for gender-locked classes
  useEffect(() => {
    if (selectedClass && MALE_ONLY.has(selectedClass)) setGender("m");
    if (selectedClass && FEMALE_ONLY.has(selectedClass)) setGender("f");
  }, [selectedClass]);

  function handlePlay() {
    if (!selectedClass) return;
    router.push(`/play?class=${selectedClass}&gender=${gender}`);
  }

  const isGenderLocked = selectedClass
    ? MALE_ONLY.has(selectedClass) || FEMALE_ONLY.has(selectedClass)
    : false;

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-1 text-amber-400">Choose Your Class</h1>
      <p className="text-gray-400 mb-4">Welcome, {username}</p>

      {/* Gender Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => !isGenderLocked && setGender("m")}
          className={`px-6 py-2 rounded-lg font-bold transition ${
            gender === "m"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          } ${isGenderLocked && gender !== "m" ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Male
        </button>
        <button
          onClick={() => !isGenderLocked && setGender("f")}
          className={`px-6 py-2 rounded-lg font-bold transition ${
            gender === "f"
              ? "bg-pink-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          } ${isGenderLocked && gender !== "f" ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Female
        </button>
      </div>

      {/* Class Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mb-6">
        {Object.values(PlayerClass).map((cls) => {
          const def = ALL_CLASSES[cls];
          const isSelected = selectedClass === cls;
          const isLocked =
            (MALE_ONLY.has(cls) && gender === "f") ||
            (FEMALE_ONLY.has(cls) && gender === "m");

          return (
            <button
              key={cls}
              onClick={() => {
                if (isLocked) {
                  // Auto-switch gender for locked classes
                  if (MALE_ONLY.has(cls)) setGender("m");
                  if (FEMALE_ONLY.has(cls)) setGender("f");
                }
                setSelectedClass(cls);
              }}
              className={`p-4 rounded-lg border-2 text-left transition ${
                isSelected
                  ? "border-amber-400 bg-amber-500/10"
                  : isLocked
                    ? "border-gray-800 opacity-60 hover:opacity-80"
                    : "border-gray-700 hover:border-gray-500"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <CharacterPreview
                  className={cls}
                  gender={
                    MALE_ONLY.has(cls) ? "m" : FEMALE_ONLY.has(cls) ? "f" : gender
                  }
                  size={64}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold">{cls}</h3>
                  <p className="text-xs text-gray-500">{CLASS_ROLES[cls]}</p>
                </div>
                {MALE_ONLY.has(cls) && (
                  <span className="text-xs text-blue-400">M only</span>
                )}
                {FEMALE_ONLY.has(cls) && (
                  <span className="text-xs text-pink-400">F only</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                <div><span className="text-gray-500">HP</span> {def.maxHp}</div>
                <div><span className="text-gray-500">MP</span> {def.maxMp}</div>
                <div><span className="text-gray-500">ATK</span> {def.attackDamage}</div>
                <div><span className="text-gray-500">DEF</span> {def.defense}</div>
                <div><span className="text-gray-500">SPD</span> {def.moveSpeed}</div>
                <div><span className="text-gray-500">RNG</span> {def.attackRange}</div>
              </div>

              <div className="flex gap-1 flex-wrap">
                {def.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-300"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>

              <p className="text-[10px] text-gray-500 mt-1 italic">{def.passive.name}: {def.passive.description}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={handlePlay}
        disabled={!selectedClass}
        className={`px-12 py-4 text-xl font-bold rounded-lg transition ${
          selectedClass
            ? "bg-amber-500 text-black hover:bg-amber-400"
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
        }`}
      >
        Enter Arena
      </button>

      <Link href="/leaderboard" className="mt-4 text-amber-400 hover:underline">
        View Leaderboard
      </Link>
    </div>
  );
}
