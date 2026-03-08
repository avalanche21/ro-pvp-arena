import { MapSchema } from "@colyseus/schema";
import { Room } from "colyseus";
import { Player } from "../schema/Player";
import {
  getClassDef, PlayerClass, SkillDef, SkillTarget,
  MP_REGEN_PER_SECOND, MAP_WIDTH, MAP_HEIGHT,
} from "@ro-pvp/shared";
import { distanceBetween, distance, clamp } from "../utils/spatial";
import { queueDamage } from "./CombatSystem";

// Track cooldowns: playerId -> skillId -> last used timestamp
const cooldowns = new Map<string, Map<string, number>>();

// Track active buffs/debuffs
interface ActiveEffect {
  playerId: string;
  effectType: string;
  expiresAt: number;
  atkMod?: number;
  defMod?: number;
  speedMod?: number;
  poisonDps?: number;
}

const activeEffects: ActiveEffect[] = [];

// Track active ground zones (Magnus Exorcismus)
interface GroundZone {
  casterId: string;
  x: number;
  y: number;
  radius: number;
  dps: number;
  expiresAt: number;
  lastTickAt: number;
  skillName: string;
}

const groundZones: GroundZone[] = [];

export function initPlayerCooldowns(sessionId: string): void {
  cooldowns.set(sessionId, new Map());
}

export function removePlayerCooldowns(sessionId: string): void {
  cooldowns.delete(sessionId);
  // Remove effects for this player
  for (let i = activeEffects.length - 1; i >= 0; i--) {
    if (activeEffects[i].playerId === sessionId) {
      activeEffects.splice(i, 1);
    }
  }
}

export function tryUseSkill(
  player: Player,
  skillId: string,
  targetId: string | undefined,
  targetPos: { x: number; y: number } | undefined,
  players: MapSchema<Player>,
  now: number,
  room: Room,
): boolean {
  if (!player.alive) return false;
  if (player.castingSkillId) return false; // already casting

  const classDef = getClassDef(player.className as PlayerClass);
  const skill = classDef.skills.find(s => s.id === skillId);
  if (!skill) return false;

  // Check cooldown
  const playerCooldowns = cooldowns.get(player.sessionId);
  if (!playerCooldowns) return false;
  const lastUsed = playerCooldowns.get(skillId) || 0;
  if (now - lastUsed < skill.cooldownMs) return false;

  // Check mana
  if (player.mp < skill.manaCost) return false;

  // Validate target for targeted skills
  if (skill.target === SkillTarget.SingleEnemy) {
    if (!targetId) return false;
    const target = players.get(targetId);
    if (!target || !target.alive) return false;
    if (target.invisible) return false;
    if (distanceBetween(player, target) > skill.range) return false;
  }

  // Consume mana and set cooldown
  player.mp -= skill.manaCost;
  playerCooldowns.set(skillId, now);

  // Break invisibility when using offensive skills
  if (skill.damage > 0 || skill.target === SkillTarget.SingleEnemy) {
    player.invisible = false;
  }

  // Handle cast time
  if (skill.castTimeMs > 0) {
    player.castingSkillId = skillId;
    player.castingEndTime = now + skill.castTimeMs;
    player.castingTargetId = targetId || "";
    player.castingTargetX = targetPos?.x || 0;
    player.castingTargetY = targetPos?.y || 0;
    return true; // Will execute when cast completes
  }

  // Instant cast - execute immediately
  executeSkill(player, skill, targetId, targetPos, players, now, room);
  return true;
}

export function executeSkill(
  caster: Player,
  skill: SkillDef,
  targetId: string | undefined,
  targetPos: { x: number; y: number } | undefined,
  players: MapSchema<Player>,
  now: number,
  room: Room,
): void {
  const classDef = getClassDef(caster.className as PlayerClass);
  const damageMultiplier = classDef.passive.damageMultiplier || 1;

  // Calculate base skill damage
  let baseDamage: number;
  if (skill.isMultiplier) {
    baseDamage = (caster.attackDamage * caster.atkMod * skill.damage + skill.bonusDamage) * damageMultiplier;
  } else if (skill.damage > 0) {
    baseDamage = skill.damage * damageMultiplier;
  } else {
    baseDamage = skill.damage; // negative = heal, don't multiply
  }

  // Self-targeted skills
  if (skill.target === SkillTarget.Self) {
    if (skill.damage < 0) {
      // Healing
      caster.hp = Math.min(caster.maxHp, caster.hp - Math.floor(skill.damage));
    }
    if (skill.effect) {
      applyEffect(caster, skill.effect, now, room);
    }
    room.broadcast("skill_effect", {
      casterId: caster.sessionId,
      skillId: skill.id,
      x: caster.x,
      y: caster.y,
    });
    return;
  }

  // Single target skills
  if (skill.target === SkillTarget.SingleEnemy && targetId) {
    const target = players.get(targetId);
    if (!target || !target.alive) return;

    // For dash skills like Cross Impact, move caster to target
    if (skill.id === "cross_impact") {
      const dx = target.x - caster.x;
      const dy = target.y - caster.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        caster.x = clamp(target.x - (dx / dist) * 40, 16, MAP_WIDTH - 16);
        caster.y = clamp(target.y - (dy / dist) * 40, 16, MAP_HEIGHT - 16);
      }
    }

    if (baseDamage > 0) {
      queueDamage({
        attackerId: caster.sessionId,
        targetId: target.sessionId,
        damage: baseDamage,
        skillName: skill.name,
        ignoreDefPercent: skill.ignoreDefPercent,
        knockback: skill.knockback,
        knockbackFromX: caster.x,
        knockbackFromY: caster.y,
      });
    }

    if (skill.effect) {
      applyEffect(target, skill.effect, now, room);
    }

    room.broadcast("skill_effect", {
      casterId: caster.sessionId,
      skillId: skill.id,
      targetId: target.sessionId,
      x: target.x,
      y: target.y,
    });
    return;
  }

  // AoE skills
  if (skill.target === SkillTarget.AoE) {
    const centerX = skill.range === 0 ? caster.x : (targetPos?.x || caster.x);
    const centerY = skill.range === 0 ? caster.y : (targetPos?.y || caster.y);

    room.broadcast("skill_effect", {
      casterId: caster.sessionId,
      skillId: skill.id,
      x: centerX,
      y: centerY,
    });

    players.forEach((target) => {
      if (target.sessionId === caster.sessionId) return;
      if (!target.alive) return;
      if (target.invisible) return;

      const dist = distance(centerX, centerY, target.x, target.y);
      if (dist <= skill.radius) {
        if (baseDamage > 0) {
          queueDamage({
            attackerId: caster.sessionId,
            targetId: target.sessionId,
            damage: baseDamage,
            skillName: skill.name,
            ignoreDefPercent: skill.ignoreDefPercent,
            knockback: skill.knockback,
            knockbackFromX: centerX,
            knockbackFromY: centerY,
          });
        }
        if (skill.effect && skill.effect.type !== "dot_zone") {
          applyEffect(target, skill.effect, now, room);
        }
      }
    });
    return;
  }

  // AoE Zone (persistent ground effect like Magnus Exorcismus)
  if (skill.target === SkillTarget.AoEZone && skill.effect?.type === "dot_zone") {
    const centerX = targetPos?.x || caster.x;
    const centerY = targetPos?.y || caster.y;

    groundZones.push({
      casterId: caster.sessionId,
      x: centerX,
      y: centerY,
      radius: skill.radius,
      dps: skill.effect.value,
      expiresAt: now + skill.effect.durationMs,
      lastTickAt: now,
      skillName: skill.name,
    });

    room.broadcast("skill_effect", {
      casterId: caster.sessionId,
      skillId: skill.id,
      x: centerX,
      y: centerY,
    });
  }
}

function applyEffect(
  target: Player,
  effect: NonNullable<SkillDef["effect"]>,
  now: number,
  room: Room,
): void {
  const expiresAt = now + effect.durationMs;

  switch (effect.type) {
    case "stun":
      // Stun = stop movement (handled via casting state as a simple approach)
      target.inputDx = 0;
      target.inputDy = 0;
      activeEffects.push({
        playerId: target.sessionId,
        effectType: "stun",
        expiresAt,
      });
      break;

    case "slow":
      target.speedMod *= (1 - effect.value);
      activeEffects.push({
        playerId: target.sessionId,
        effectType: "slow",
        expiresAt,
        speedMod: 1 - effect.value,
      });
      break;

    case "poison":
      activeEffects.push({
        playerId: target.sessionId,
        effectType: "poison",
        expiresAt,
        poisonDps: effect.value,
      });
      break;

    case "invisible":
      target.invisible = true;
      if (effect.speedMod) {
        target.speedMod *= effect.speedMod;
      }
      activeEffects.push({
        playerId: target.sessionId,
        effectType: "invisible",
        expiresAt,
        speedMod: effect.speedMod,
      });
      break;

    case "shield":
      target.shieldHp = effect.value;
      activeEffects.push({
        playerId: target.sessionId,
        effectType: "shield",
        expiresAt,
      });
      break;

    case "buff":
      if (effect.atkMod) target.atkMod *= effect.atkMod;
      if (effect.defMod) target.defMod *= effect.defMod;
      if (effect.speedMod) target.speedMod *= effect.speedMod;
      activeEffects.push({
        playerId: target.sessionId,
        effectType: "buff",
        expiresAt,
        atkMod: effect.atkMod,
        defMod: effect.defMod,
        speedMod: effect.speedMod,
      });
      break;

    case "debuff":
      if (effect.atkMod) target.atkMod *= effect.atkMod;
      if (effect.defMod) target.defMod *= effect.defMod;
      if (effect.speedMod) target.speedMod *= effect.speedMod;
      activeEffects.push({
        playerId: target.sessionId,
        effectType: "debuff",
        expiresAt,
        atkMod: effect.atkMod,
        defMod: effect.defMod,
        speedMod: effect.speedMod,
      });
      break;
  }

  room.broadcast("buff_applied", {
    targetId: target.sessionId,
    effectType: effect.type,
    durationMs: effect.durationMs,
  });
}

export function updateEffects(players: MapSchema<Player>, now: number, deltaMs: number): void {
  // Process ground zones
  for (let i = groundZones.length - 1; i >= 0; i--) {
    const zone = groundZones[i];
    if (now >= zone.expiresAt) {
      groundZones.splice(i, 1);
      continue;
    }

    // Tick damage every second
    if (now - zone.lastTickAt >= 1000) {
      zone.lastTickAt = now;
      players.forEach((target) => {
        if (target.sessionId === zone.casterId) return;
        if (!target.alive) return;
        const dist = distance(zone.x, zone.y, target.x, target.y);
        if (dist <= zone.radius) {
          queueDamage({
            attackerId: zone.casterId,
            targetId: target.sessionId,
            damage: zone.dps,
            skillName: zone.skillName,
            ignoreDefPercent: 0,
            knockback: 0,
            knockbackFromX: zone.x,
            knockbackFromY: zone.y,
          });
        }
      });
    }
  }

  // Process expiring effects
  for (let i = activeEffects.length - 1; i >= 0; i--) {
    const effect = activeEffects[i];
    const player = players.get(effect.playerId);

    // Process poison ticks
    if (effect.effectType === "poison" && player && player.alive && effect.poisonDps) {
      const poisonDamage = effect.poisonDps * (deltaMs / 1000);
      if (poisonDamage >= 1) {
        player.hp -= Math.floor(poisonDamage);
        if (player.hp <= 0) {
          player.hp = 0;
          player.alive = false;
          player.deaths++;
        }
      }
    }

    if (now >= effect.expiresAt) {
      // Revert effect
      if (player) {
        switch (effect.effectType) {
          case "slow":
            if (effect.speedMod) player.speedMod /= effect.speedMod;
            break;
          case "invisible":
            player.invisible = false;
            if (effect.speedMod) player.speedMod /= effect.speedMod;
            break;
          case "shield":
            player.shieldHp = 0;
            break;
          case "buff":
          case "debuff":
            if (effect.atkMod) player.atkMod /= effect.atkMod;
            if (effect.defMod) player.defMod /= effect.defMod;
            if (effect.speedMod) player.speedMod /= effect.speedMod;
            break;
        }
      }
      activeEffects.splice(i, 1);
    }
  }

  // MP regeneration
  const mpRegen = MP_REGEN_PER_SECOND * (deltaMs / 1000);
  players.forEach((player) => {
    if (!player.alive) return;
    player.mp = Math.min(player.maxMp, player.mp + mpRegen);
  });
}

export function updateCasting(players: MapSchema<Player>, now: number, room: Room): void {
  players.forEach((player) => {
    if (!player.castingSkillId) return;
    if (!player.alive) {
      player.castingSkillId = "";
      return;
    }

    if (now >= player.castingEndTime) {
      const classDef = getClassDef(player.className as PlayerClass);
      const skill = classDef.skills.find(s => s.id === player.castingSkillId);
      const targetId = player.castingTargetId || undefined;
      const targetPos = (player.castingTargetX || player.castingTargetY)
        ? { x: player.castingTargetX, y: player.castingTargetY }
        : undefined;

      player.castingSkillId = "";
      player.castingEndTime = 0;
      player.castingTargetId = "";

      if (skill) {
        executeSkill(player, skill, targetId, targetPos, players, now, room);
      }
    }
  });
}
