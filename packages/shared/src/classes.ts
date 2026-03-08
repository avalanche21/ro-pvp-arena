import { ClassDef, PlayerClass } from "./types";
import {
  BASH, MAGNUM_BREAK, PROVOKE, BERSERK,
  SONIC_BLOW, CLOAKING, POISON_BREATH, CROSS_IMPACT,
  FIRE_BOLT, STORM_GUST, JUPITEL_THUNDER, METEOR_STORM,
  HEAL, HOLY_LIGHT, KYRIE_ELEISON, MAGNUS_EXORCISMUS,
  HOLY_CROSS, GRAND_CROSS, DEVOTION, SHIELD_BOOMERANG,
  BACKSTAB, STRIP_ARMOR, INTIMIDATE, CLOSE_CONFINE,
  FIRE_WALL, DISPELL, VOLCANO_BUFF, EARTH_SPIKE,
  OCCULT_IMPACTION, INVESTIGATE, ZEN, ASURA_STRIKE,
  DOUBLE_STRAFE, ARROW_SHOWER, ANKLE_SNARE, BLITZ_BEAT,
  MELODY_STRIKE, FROST_JOKER, DRUM_BATTLE, LOKIS_VEIL,
  SLINGING_ARROW, SCREAM, HUMMING, CHARM,
  ACID_TERROR, DEMONSTRATION, POTION_PITCHER, BIO_CANNIBALIZE,
} from "./skills";

export const KNIGHT: ClassDef = {
  className: PlayerClass.Knight,
  maxHp: 5000,
  maxMp: 200,
  moveSpeed: 150,
  attackDamage: 120,
  attackRange: 64,
  attackSpeedMs: 800,
  defense: 40,
  skills: [BASH, MAGNUM_BREAK, PROVOKE, BERSERK],
  passive: {
    id: "guard",
    name: "Guard",
    description: "15% chance to block any incoming attack",
    blockChance: 0.15,
  },
};

export const ASSASSIN: ClassDef = {
  className: PlayerClass.Assassin,
  maxHp: 3200,
  maxMp: 250,
  moveSpeed: 220,
  attackDamage: 100,
  attackRange: 48,
  attackSpeedMs: 500,
  defense: 15,
  skills: [SONIC_BLOW, CLOAKING, POISON_BREATH, CROSS_IMPACT],
  passive: {
    id: "double_attack",
    name: "Double Attack",
    description: "30% chance normal attacks hit twice",
    doubleAttackChance: 0.3,
  },
};

export const WIZARD: ClassDef = {
  className: PlayerClass.Wizard,
  maxHp: 2800,
  maxMp: 500,
  moveSpeed: 130,
  attackDamage: 80,
  attackRange: 250,
  attackSpeedMs: 1200,
  defense: 10,
  skills: [FIRE_BOLT, STORM_GUST, JUPITEL_THUNDER, METEOR_STORM],
  passive: {
    id: "arcane_mastery",
    name: "Arcane Mastery",
    description: "+15% all skill damage",
    damageMultiplier: 1.15,
  },
};

export const PRIEST: ClassDef = {
  className: PlayerClass.Priest,
  maxHp: 3800,
  maxMp: 600,
  moveSpeed: 140,
  attackDamage: 60,
  attackRange: 48,
  attackSpeedMs: 1000,
  defense: 25,
  skills: [HEAL, HOLY_LIGHT, KYRIE_ELEISON, MAGNUS_EXORCISMUS],
  passive: {
    id: "blessing",
    name: "Blessing",
    description: "+10% max HP, +5% move speed",
    maxHpMultiplier: 1.1,
    moveSpeedMultiplier: 1.05,
  },
};

export const CRUSADER: ClassDef = {
  className: PlayerClass.Crusader,
  maxHp: 5500,
  maxMp: 250,
  moveSpeed: 135,
  attackDamage: 110,
  attackRange: 64,
  attackSpeedMs: 900,
  defense: 50,
  skills: [HOLY_CROSS, GRAND_CROSS, DEVOTION, SHIELD_BOOMERANG],
  passive: {
    id: "faith",
    name: "Faith",
    description: "+20% max HP",
    maxHpMultiplier: 1.2,
  },
};

export const ROGUE: ClassDef = {
  className: PlayerClass.Rogue,
  maxHp: 3400,
  maxMp: 220,
  moveSpeed: 210,
  attackDamage: 95,
  attackRange: 48,
  attackSpeedMs: 550,
  defense: 18,
  skills: [BACKSTAB, STRIP_ARMOR, INTIMIDATE, CLOSE_CONFINE],
  passive: {
    id: "plagiarism",
    name: "Plagiarism",
    description: "20% chance to reflect 50% damage",
    reflectChance: 0.2,
    reflectPercent: 0.5,
  },
};

export const SAGE: ClassDef = {
  className: PlayerClass.Sage,
  maxHp: 3000,
  maxMp: 480,
  moveSpeed: 135,
  attackDamage: 75,
  attackRange: 250,
  attackSpeedMs: 1200,
  defense: 12,
  skills: [FIRE_WALL, DISPELL, VOLCANO_BUFF, EARTH_SPIKE],
  passive: {
    id: "free_cast",
    name: "Free Cast",
    description: "+15% damage",
    damageMultiplier: 1.15,
  },
};

export const MONK: ClassDef = {
  className: PlayerClass.Monk,
  maxHp: 3800,
  maxMp: 300,
  moveSpeed: 170,
  attackDamage: 130,
  attackRange: 48,
  attackSpeedMs: 600,
  defense: 22,
  skills: [OCCULT_IMPACTION, INVESTIGATE, ZEN, ASURA_STRIKE],
  passive: {
    id: "counter",
    name: "Counter",
    description: "25% chance to counter-attack",
    counterAttackChance: 0.25,
  },
};

export const HUNTER: ClassDef = {
  className: PlayerClass.Hunter,
  maxHp: 3000,
  maxMp: 250,
  moveSpeed: 160,
  attackDamage: 90,
  attackRange: 300,
  attackSpeedMs: 700,
  defense: 12,
  skills: [DOUBLE_STRAFE, ARROW_SHOWER, ANKLE_SNARE, BLITZ_BEAT],
  passive: {
    id: "vultures_eye",
    name: "Vulture's Eye",
    description: "+30% range",
    rangeMultiplier: 1.3,
  },
};

export const BARD: ClassDef = {
  className: PlayerClass.Bard,
  maxHp: 3200,
  maxMp: 350,
  moveSpeed: 155,
  attackDamage: 85,
  attackRange: 250,
  attackSpeedMs: 800,
  defense: 18,
  skills: [MELODY_STRIKE, FROST_JOKER, DRUM_BATTLE, LOKIS_VEIL],
  passive: {
    id: "music_lessons",
    name: "Music Lessons",
    description: "+10% damage, +5% speed",
    damageMultiplier: 1.1,
    moveSpeedMultiplier: 1.05,
  },
};

export const DANCER: ClassDef = {
  className: PlayerClass.Dancer,
  maxHp: 3200,
  maxMp: 350,
  moveSpeed: 165,
  attackDamage: 85,
  attackRange: 250,
  attackSpeedMs: 800,
  defense: 18,
  skills: [SLINGING_ARROW, SCREAM, HUMMING, CHARM],
  passive: {
    id: "dance_lessons",
    name: "Dance Lessons",
    description: "+10% damage, +5% speed",
    damageMultiplier: 1.1,
    moveSpeedMultiplier: 1.05,
  },
};

export const ALCHEMIST: ClassDef = {
  className: PlayerClass.Alchemist,
  maxHp: 4000,
  maxMp: 400,
  moveSpeed: 140,
  attackDamage: 100,
  attackRange: 200,
  attackSpeedMs: 900,
  defense: 30,
  skills: [ACID_TERROR, DEMONSTRATION, POTION_PITCHER, BIO_CANNIBALIZE],
  passive: {
    id: "pharmacy",
    name: "Pharmacy",
    description: "+20% healing",
    healMultiplier: 1.2,
  },
};

export const ALL_CLASSES: Record<PlayerClass, ClassDef> = {
  [PlayerClass.Knight]: KNIGHT,
  [PlayerClass.Assassin]: ASSASSIN,
  [PlayerClass.Wizard]: WIZARD,
  [PlayerClass.Priest]: PRIEST,
  [PlayerClass.Crusader]: CRUSADER,
  [PlayerClass.Rogue]: ROGUE,
  [PlayerClass.Sage]: SAGE,
  [PlayerClass.Monk]: MONK,
  [PlayerClass.Hunter]: HUNTER,
  [PlayerClass.Bard]: BARD,
  [PlayerClass.Dancer]: DANCER,
  [PlayerClass.Alchemist]: ALCHEMIST,
};

export function getClassDef(className: PlayerClass): ClassDef {
  return ALL_CLASSES[className];
}
