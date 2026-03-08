import { MapSchema } from "@colyseus/schema";
import { Room } from "colyseus";
import { Player } from "../schema/Player";
import { RESPAWN_TIME_MS, getRandomSpawnPoint, getClassDef, PlayerClass } from "@ro-pvp/shared";

export function updateRespawns(players: MapSchema<Player>, now: number, room: Room): void {
  players.forEach((player) => {
    if (player.alive) return;

    // Set respawn timer on first death frame
    if (player.respawnAt === 0) {
      player.respawnAt = now + RESPAWN_TIME_MS;
      return;
    }

    if (now >= player.respawnAt) {
      const spawn = getRandomSpawnPoint();
      const classDef = getClassDef(player.className as PlayerClass);

      player.x = spawn.x;
      player.y = spawn.y;
      player.hp = player.maxHp;
      player.mp = player.maxMp;
      player.alive = true;
      player.respawnAt = 0;
      player.invisible = false;
      player.shieldHp = 0;
      player.atkMod = 1;
      player.defMod = 1;
      player.speedMod = 1;
      player.castingSkillId = "";
      player.inputDx = 0;
      player.inputDy = 0;
      player.targetId = "";

      room.broadcast("player_respawn", {
        playerId: player.sessionId,
        x: spawn.x,
        y: spawn.y,
      });
    }
  });
}
