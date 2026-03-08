import { Room, Client } from "colyseus";
import { ArenaState } from "../schema/ArenaState";
import { Player } from "../schema/Player";
import { verifyToken } from "../auth";
import { getPool } from "../db";
import {
  TICK_MS, MAX_PLAYERS, MAP_WIDTH, MAP_HEIGHT, getRandomSpawnPoint,
  getClassDef, PlayerClass, generateMapLayout, isWalkable,
} from "@ro-pvp/shared";
import { updateMovement } from "../systems/MovementSystem";
import { processBasicAttacks, processDamageQueue } from "../systems/CombatSystem";
import { tryUseSkill, updateEffects, updateCasting, initPlayerCooldowns, removePlayerCooldowns } from "../systems/SkillSystem";
import { updateRespawns } from "../systems/RespawnSystem";
import { persistPlayerStats } from "../systems/ScoreSystem";
import {
  spawnInitialMonsters, updateMonsters, damageMonster,
  updateFrozenEffects, breakFrozen, isPlayerFrozen, removeMonsterFrozen,
} from "../systems/MonsterSystem";

export class ArenaRoom extends Room<ArenaState> {
  maxClients = MAX_PLAYERS;
  private lastTickTime = 0;
  private mapLayout: number[][] = [];

  onCreate() {
    this.setState(new ArenaState());
    this.lastTickTime = Date.now();
    this.mapLayout = generateMapLayout();

    // Spawn monsters
    spawnInitialMonsters(this.state.monsters);

    // Set simulation interval
    this.setSimulationInterval((deltaTime) => {
      const now = Date.now();
      const deltaMs = deltaTime;

      updateCasting(this.state.players, now, this);
      updateMovement(this.state.players, deltaMs);
      processBasicAttacks(this.state.players, now, this);
      updateEffects(this.state.players, now, deltaMs);
      processDamageQueue(this.state.players, this);
      updateRespawns(this.state.players, now, this);
      updateMonsters(this.state.monsters, deltaMs, now);
      updateFrozenEffects(this.state.players, now, this);

      this.state.serverTime = now;
    }, TICK_MS);

    // Message handlers
    this.onMessage("move", (client, data: { dx: number; dy: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.alive) return;
      // Clamp input to -1..1
      player.inputDx = Math.max(-1, Math.min(1, data.dx || 0));
      player.inputDy = Math.max(-1, Math.min(1, data.dy || 0));
    });

    this.onMessage("stop", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.inputDx = 0;
      player.inputDy = 0;
      player.moveToX = -1;
      player.moveToY = -1;
    });

    this.onMessage("move_to", (client, data: { x: number; y: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.alive) return;
      const tx = Math.max(16, Math.min(MAP_WIDTH - 16, data.x || 0));
      const ty = Math.max(16, Math.min(MAP_HEIGHT - 16, data.y || 0));
      // Only allow movement to walkable tiles
      if (!isWalkable(tx, ty, this.mapLayout)) return;
      player.moveToX = tx;
      player.moveToY = ty;
      // Clear WASD input when clicking
      player.inputDx = 0;
      player.inputDy = 0;
    });

    this.onMessage("attack", (client, data: { targetId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.alive) return;
      player.targetId = data.targetId || "";
    });

    this.onMessage("skill", (client, data: { skillId: string; targetId?: string; targetPos?: { x: number; y: number } }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.alive) return;

      tryUseSkill(
        player,
        data.skillId,
        data.targetId,
        data.targetPos,
        this.state.players,
        Date.now(),
        this,
      );
    });

    this.onMessage("select_target", (client, data: { targetId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.targetId = data.targetId || "";
    });

    this.onMessage("attack_monster", (client, data: { monsterId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.alive) return;
      if (isPlayerFrozen(client.sessionId)) return;

      const monster = this.state.monsters.get(data.monsterId);
      if (!monster || !monster.alive) return;

      // Check range
      const dx = monster.x - player.x;
      const dy = monster.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > player.attackRange + 40) return; // 40px monster hitbox

      // Attack speed check
      const now = Date.now();
      if (now - player.lastAttackTime < player.attackSpeedMs) return;
      player.lastAttackTime = now;

      const damage = Math.max(1, player.attackDamage * player.atkMod);
      damageMonster(monster, damage, client.sessionId, this.state.players, this, now);

      this.broadcast("basic_attack", {
        attackerId: client.sessionId,
        targetId: data.monsterId,
      });
    });

    console.log("ArenaRoom created");
  }

  async onAuth(client: Client, options: { token?: string; className?: string; gender?: string }) {
    if (!options.token) throw new Error("No token provided");

    const payload = verifyToken(options.token);
    if (!payload) throw new Error("Invalid token");

    // Validate class selection
    const className = options.className as PlayerClass;
    if (!className || !Object.values(PlayerClass).includes(className)) {
      throw new Error("Invalid class");
    }

    const gender = options.gender === "f" ? "f" : "m";

    // Enforce gender locks
    if (className === PlayerClass.Bard && gender === "f") throw new Error("Bard is male only");
    if (className === PlayerClass.Dancer && gender === "m") throw new Error("Dancer is female only");

    return { userId: payload.userId, username: payload.username, className, gender };
  }

  onJoin(client: Client, options?: any, auth?: { userId: number; username: string; className: PlayerClass; gender: string }) {
    if (!auth) return;
    const classDef = getClassDef(auth.className);
    const spawn = getRandomSpawnPoint();

    const player = new Player();
    player.sessionId = client.sessionId;
    player.userId = auth.userId;
    player.username = auth.username;
    player.className = auth.className;
    player.gender = auth.gender;
    player.x = spawn.x;
    player.y = spawn.y;

    // Apply base stats
    player.maxHp = classDef.maxHp;
    player.maxMp = classDef.maxMp;
    player.moveSpeed = classDef.moveSpeed;
    player.attackDamage = classDef.attackDamage;
    player.attackRange = classDef.attackRange;
    player.attackSpeedMs = classDef.attackSpeedMs;
    player.defense = classDef.defense;

    // Apply passive bonuses
    if (classDef.passive.maxHpMultiplier) {
      player.maxHp = Math.floor(player.maxHp * classDef.passive.maxHpMultiplier);
    }
    if (classDef.passive.moveSpeedMultiplier) {
      player.moveSpeed *= classDef.passive.moveSpeedMultiplier;
    }
    if (classDef.passive.rangeMultiplier) {
      player.attackRange = Math.floor(player.attackRange * classDef.passive.rangeMultiplier);
    }

    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.alive = true;

    initPlayerCooldowns(client.sessionId);
    this.state.players.set(client.sessionId, player);

    console.log(`${auth.username} joined as ${auth.className}`);
  }

  async onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      await persistPlayerStats(getPool(), player);
      removePlayerCooldowns(client.sessionId);
      removeMonsterFrozen(client.sessionId);
      this.state.players.delete(client.sessionId);
      console.log(`${player.username} left`);
    }
  }

  onDispose() {
    console.log("ArenaRoom disposed");
  }
}
