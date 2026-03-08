export enum PlayerClass {
  Knight = "Knight",
  Assassin = "Assassin",
  Wizard = "Wizard",
  Priest = "Priest",
  Crusader = "Crusader",
  Rogue = "Rogue",
  Sage = "Sage",
  Monk = "Monk",
  Hunter = "Hunter",
  Bard = "Bard",
  Dancer = "Dancer",
  Alchemist = "Alchemist",
}

export enum SkillTarget {
  Self = "Self",
  SingleEnemy = "SingleEnemy",
  SingleAlly = "SingleAlly",
  AoE = "AoE",
  AoEZone = "AoEZone",
}

export interface SkillDef {
  id: string;
  name: string;
  damage: number; // flat damage or ATK multiplier (see isMultiplier)
  isMultiplier: boolean; // true = damage is % of ATK, false = flat
  bonusDamage: number; // flat bonus added after multiplier
  cooldownMs: number;
  castTimeMs: number;
  range: number; // px, 0 = self-centered
  radius: number; // px, 0 = single target
  manaCost: number;
  target: SkillTarget;
  duration: number; // ms, 0 = instant
  effect: SkillEffect | null;
  ignoreDefPercent: number; // 0-1, how much DEF to ignore
  knockback: number; // px, 0 = none
}

export interface SkillEffect {
  type: "stun" | "slow" | "poison" | "invisible" | "shield" | "buff" | "debuff" | "dot_zone";
  value: number; // effect-specific: slow%, poison dps, shield hp, etc.
  durationMs: number;
  // For buffs/debuffs
  atkMod?: number; // multiplier: 1.5 = +50%
  defMod?: number;
  speedMod?: number;
}

export interface ClassDef {
  className: PlayerClass;
  maxHp: number;
  maxMp: number;
  moveSpeed: number; // px/s
  attackDamage: number;
  attackRange: number; // px
  attackSpeedMs: number;
  defense: number;
  skills: SkillDef[];
  passive: PassiveDef;
}

export interface PassiveDef {
  id: string;
  name: string;
  description: string;
  // Passive effects
  blockChance?: number; // 0-1
  doubleAttackChance?: number; // 0-1
  damageMultiplier?: number; // e.g. 1.15 = +15%
  maxHpMultiplier?: number; // e.g. 1.1 = +10%
  moveSpeedMultiplier?: number; // e.g. 1.05 = +5%
  counterAttackChance?: number; // 0-1
  rangeMultiplier?: number; // e.g. 1.3 = +30% range
  healMultiplier?: number; // e.g. 1.2 = +20% healing
  reflectChance?: number; // 0-1
  reflectPercent?: number; // 0-1 how much damage to reflect
}

export interface Vector2 {
  x: number;
  y: number;
}

// Messages from client to server
export type ClientMessage =
  | { type: "move"; dx: number; dy: number }
  | { type: "stop" }
  | { type: "attack"; targetId: string }
  | { type: "skill"; skillId: string; targetId?: string; targetPos?: Vector2 }
  | { type: "select_target"; targetId: string };

// Messages broadcast from server to clients
export type ServerMessage =
  | { type: "skill_effect"; casterId: string; skillId: string; targetId?: string; x: number; y: number }
  | { type: "damage"; targetId: string; amount: number; isCrit: boolean }
  | { type: "kill_feed"; killerId: string; killerName: string; victimId: string; victimName: string; skillName: string }
  | { type: "buff_applied"; targetId: string; effectType: string; durationMs: number }
  | { type: "player_respawn"; playerId: string; x: number; y: number };
