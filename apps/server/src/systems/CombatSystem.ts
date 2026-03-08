import { MapSchema } from "@colyseus/schema";
import { Room } from "colyseus";
import { Player } from "../schema/Player";
import { MIN_DAMAGE, getClassDef, PlayerClass } from "@ro-pvp/shared";
import { distanceBetween } from "../utils/spatial";
import { breakFrozen, isPlayerFrozen } from "./MonsterSystem";

export interface DamageEvent {
  attackerId: string;
  targetId: string;
  damage: number;
  skillName: string;
  ignoreDefPercent: number;
  knockback: number;
  knockbackFromX: number;
  knockbackFromY: number;
}

const pendingDamage: DamageEvent[] = [];

export function queueDamage(event: DamageEvent): void {
  pendingDamage.push(event);
}

export function processBasicAttacks(players: MapSchema<Player>, now: number, room: Room): void {
  players.forEach((player) => {
    if (!player.alive) return;
    if (!player.targetId) return;
    if (player.castingSkillId) return;
    if (isPlayerFrozen(player.sessionId)) return;

    const target = players.get(player.targetId);
    if (!target || !target.alive) {
      player.targetId = "";
      return;
    }

    // Check if target is invisible
    if (target.invisible) {
      player.targetId = "";
      return;
    }

    const dist = distanceBetween(player, target);
    if (dist > player.attackRange) return;

    if (now - player.lastAttackTime < player.attackSpeedMs) return;

    player.lastAttackTime = now;

    // Broadcast basic attack animation
    room.broadcast("basic_attack", {
      attackerId: player.sessionId,
      targetId: target.sessionId,
    });

    const classDef = getClassDef(player.className as PlayerClass);
    let damage = player.attackDamage * player.atkMod;

    // Check passive: double attack
    let hits = 1;
    if (classDef.passive.doubleAttackChance && Math.random() < classDef.passive.doubleAttackChance) {
      hits = 2;
    }

    for (let i = 0; i < hits; i++) {
      queueDamage({
        attackerId: player.sessionId,
        targetId: target.sessionId,
        damage,
        skillName: "Attack",
        ignoreDefPercent: 0,
        knockback: 0,
        knockbackFromX: player.x,
        knockbackFromY: player.y,
      });
    }
  });
}

export function processDamageQueue(players: MapSchema<Player>, room: Room): void {
  while (pendingDamage.length > 0) {
    const event = pendingDamage.shift()!;
    const target = players.get(event.targetId);
    const attacker = players.get(event.attackerId);
    if (!target || !target.alive) continue;

    // Check passive: guard (block)
    const targetClassDef = getClassDef(target.className as PlayerClass);
    if (targetClassDef.passive.blockChance && Math.random() < targetClassDef.passive.blockChance) {
      // Blocked!
      room.broadcast("damage", {
        targetId: target.sessionId,
        amount: 0,
        isCrit: false,
        blocked: true,
      });
      continue;
    }

    // Break invisibility on hit
    if (target.invisible) {
      target.invisible = false;
    }

    // Break frozen on hit
    breakFrozen(target.sessionId, players, room);

    // Calculate effective defense
    const effectiveDef = target.defense * target.defMod * (1 - event.ignoreDefPercent);
    const finalDamage = Math.max(MIN_DAMAGE, Math.floor(event.damage - effectiveDef));

    // Apply damage to shield first
    if (target.shieldHp > 0) {
      if (target.shieldHp >= finalDamage) {
        target.shieldHp -= finalDamage;
        room.broadcast("damage", {
          targetId: target.sessionId,
          amount: finalDamage,
          isCrit: false,
          shielded: true,
        });
        continue;
      } else {
        const remainder = finalDamage - target.shieldHp;
        target.shieldHp = 0;
        target.hp -= remainder;
      }
    } else {
      target.hp -= finalDamage;
    }

    room.broadcast("damage", {
      targetId: target.sessionId,
      amount: finalDamage,
      isCrit: false,
    });

    // Apply knockback
    if (event.knockback > 0) {
      const dx = target.x - event.knockbackFromX;
      const dy = target.y - event.knockbackFromY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const { clamp } = require("../utils/spatial");
        const { MAP_WIDTH, MAP_HEIGHT } = require("@ro-pvp/shared");
        target.x = clamp(target.x + (dx / dist) * event.knockback, 16, MAP_WIDTH - 16);
        target.y = clamp(target.y + (dy / dist) * event.knockback, 16, MAP_HEIGHT - 16);
      }
    }

    // Check death
    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
      target.deaths++;

      if (attacker) {
        attacker.kills++;
        room.broadcast("kill_feed", {
          killerId: attacker.sessionId,
          killerName: attacker.username,
          victimId: target.sessionId,
          victimName: target.username,
          skillName: event.skillName,
        });
      }
    }
  }
}
