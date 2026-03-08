import { MapSchema } from "@colyseus/schema";
import { Room } from "colyseus";
import { Monster } from "../schema/Monster";
import { Player } from "../schema/Player";
import { MAP_WIDTH, MAP_HEIGHT } from "@ro-pvp/shared";
import { clamp } from "../utils/spatial";

const MONSTER_RESPAWN_MS = 8000;
const PORING_HP = 300;
const DROPS_HP = 500;
const MARIN_HP = 400;
const POTION_HEAL = 500;
const FROZEN_DURATION_MS = 5000;

// Track active frozen effects
interface FrozenEffect {
  playerId: string;
  expiresAt: number;
}

const frozenEffects: FrozenEffect[] = [];

export function spawnInitialMonsters(monsters: MapSchema<Monster>): void {
  // 2 Porings
  for (let i = 0; i < 2; i++) {
    const m = new Monster();
    m.id = `poring_${i}`;
    m.monsterType = "poring";
    m.x = 300 + Math.random() * (MAP_WIDTH - 600);
    m.y = 300 + Math.random() * (MAP_HEIGHT - 600);
    m.hp = PORING_HP;
    m.maxHp = PORING_HP;
    m.alive = true;
    m.moveSpeed = 80;
    m.nextMoveTime = Date.now() + 1000 + Math.random() * 3000;
    monsters.set(m.id, m);
  }

  // 2 Blue Porings (Drops)
  for (let i = 0; i < 2; i++) {
    const m = new Monster();
    m.id = `drops_${i}`;
    m.monsterType = "drops";
    m.x = 300 + Math.random() * (MAP_WIDTH - 600);
    m.y = 300 + Math.random() * (MAP_HEIGHT - 600);
    m.hp = DROPS_HP;
    m.maxHp = DROPS_HP;
    m.alive = true;
    m.moveSpeed = 90;
    m.nextMoveTime = Date.now() + 1000 + Math.random() * 3000;
    monsters.set(m.id, m);
  }

  // 2 Marins (blue poring - MP recovery)
  for (let i = 0; i < 2; i++) {
    const m = new Monster();
    m.id = `marin_${i}`;
    m.monsterType = "marin";
    m.x = 300 + Math.random() * (MAP_WIDTH - 600);
    m.y = 300 + Math.random() * (MAP_HEIGHT - 600);
    m.hp = MARIN_HP;
    m.maxHp = MARIN_HP;
    m.alive = true;
    m.moveSpeed = 70;
    m.nextMoveTime = Date.now() + 1000 + Math.random() * 3000;
    monsters.set(m.id, m);
  }
}

export function updateMonsters(monsters: MapSchema<Monster>, deltaMs: number, now: number): void {
  const dt = deltaMs / 1000;

  monsters.forEach((monster) => {
    // Handle respawn
    if (!monster.alive) {
      if (monster.respawnAt > 0 && now >= monster.respawnAt) {
        monster.x = 200 + Math.random() * (MAP_WIDTH - 400);
        monster.y = 200 + Math.random() * (MAP_HEIGHT - 400);
        monster.hp = monster.maxHp;
        monster.alive = true;
        monster.moveTargetX = -1;
        monster.moveTargetY = -1;
        monster.nextMoveTime = now + 2000;
      }
      return;
    }

    // Random movement AI
    if (now >= monster.nextMoveTime && monster.moveTargetX < 0) {
      // Pick a random nearby point to walk to
      monster.moveTargetX = clamp(monster.x + (Math.random() - 0.5) * 300, 100, MAP_WIDTH - 100);
      monster.moveTargetY = clamp(monster.y + (Math.random() - 0.5) * 300, 100, MAP_HEIGHT - 100);
    }

    // Move towards target
    if (monster.moveTargetX >= 0 && monster.moveTargetY >= 0) {
      const dx = monster.moveTargetX - monster.x;
      const dy = monster.moveTargetY - monster.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        // Arrived
        monster.moveTargetX = -1;
        monster.moveTargetY = -1;
        monster.nextMoveTime = now + 2000 + Math.random() * 4000;
      } else {
        const nx = dx / dist;
        const ny = dy / dist;
        monster.x = clamp(monster.x + nx * monster.moveSpeed * dt, 16, MAP_WIDTH - 16);
        monster.y = clamp(monster.y + ny * monster.moveSpeed * dt, 16, MAP_HEIGHT - 16);

        // Update direction
        const angle = Math.atan2(ny, nx);
        const octant = Math.round((angle / (Math.PI / 4)) + 8) % 8;
        const mapping = [6, 7, 0, 1, 2, 3, 4, 5];
        monster.direction = mapping[octant];
      }
    }
  });
}

export function damageMonster(
  monster: Monster,
  damage: number,
  attackerId: string,
  players: MapSchema<Player>,
  room: Room,
  now: number,
): void {
  if (!monster.alive) return;

  monster.hp -= damage;

  room.broadcast("monster_damage", {
    monsterId: monster.id,
    amount: damage,
  });

  if (monster.hp <= 0) {
    monster.hp = 0;
    monster.alive = false;
    monster.respawnAt = now + MONSTER_RESPAWN_MS;

    const attacker = players.get(attackerId);

    room.broadcast("monster_die", {
      monsterId: monster.id,
      monsterType: monster.monsterType,
      x: monster.x,
      y: monster.y,
      killerId: attackerId,
    });

    if (monster.monsterType === "poring" && attacker && attacker.alive) {
      // Drop red potion - heal the killer
      const healAmount = Math.min(POTION_HEAL, attacker.maxHp - attacker.hp);
      attacker.hp += healAmount;

      room.broadcast("potion_drop", {
        x: monster.x,
        y: monster.y,
        playerId: attackerId,
        healAmount,
      });
    } else if (monster.monsterType === "marin" && attacker && attacker.alive) {
      // Drop blue potion - restore MP to 100%
      const mpRecovered = attacker.maxMp - attacker.mp;
      attacker.mp = attacker.maxMp;

      room.broadcast("blue_potion_drop", {
        x: monster.x,
        y: monster.y,
        playerId: attackerId,
        mpRecovered,
      });
    } else if (monster.monsterType === "drops" && attacker && attacker.alive) {
      // Freeze the killer!
      applyFrozen(attacker, now, room);
    }
  }
}

function applyFrozen(player: Player, now: number, room: Room): void {
  // Stop all movement
  player.inputDx = 0;
  player.inputDy = 0;
  player.moveToX = -1;
  player.moveToY = -1;
  player.speedMod = 0; // Can't move at all

  frozenEffects.push({
    playerId: player.sessionId,
    expiresAt: now + FROZEN_DURATION_MS,
  });

  room.broadcast("frozen_apply", {
    playerId: player.sessionId,
    durationMs: FROZEN_DURATION_MS,
  });
}

export function breakFrozen(playerId: string, players: MapSchema<Player>, room: Room): boolean {
  for (let i = frozenEffects.length - 1; i >= 0; i--) {
    if (frozenEffects[i].playerId === playerId) {
      frozenEffects.splice(i, 1);
      const player = players.get(playerId);
      if (player) {
        player.speedMod = 1;
      }
      room.broadcast("frozen_break", { playerId });
      return true;
    }
  }
  return false;
}

export function isPlayerFrozen(playerId: string): boolean {
  return frozenEffects.some(e => e.playerId === playerId);
}

export function updateFrozenEffects(players: MapSchema<Player>, now: number, room: Room): void {
  for (let i = frozenEffects.length - 1; i >= 0; i--) {
    const effect = frozenEffects[i];
    const player = players.get(effect.playerId);

    // Keep frozen player immobile
    if (player && player.alive) {
      player.inputDx = 0;
      player.inputDy = 0;
      player.moveToX = -1;
      player.moveToY = -1;
    }

    if (now >= effect.expiresAt) {
      // Expire
      if (player) {
        player.speedMod = 1;
      }
      frozenEffects.splice(i, 1);
      room.broadcast("frozen_break", { playerId: effect.playerId });
    }
  }
}

export function removeMonsterFrozen(playerId: string): void {
  for (let i = frozenEffects.length - 1; i >= 0; i--) {
    if (frozenEffects[i].playerId === playerId) {
      frozenEffects.splice(i, 1);
    }
  }
}
