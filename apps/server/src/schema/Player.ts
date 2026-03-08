import { Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") sessionId: string = "";
  @type("string") username: string = "";
  @type("string") className: string = "";
  @type("string") gender: string = "m";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") hp: number = 0;
  @type("number") maxHp: number = 0;
  @type("number") mp: number = 0;
  @type("number") maxMp: number = 0;
  @type("boolean") alive: boolean = true;
  @type("number") kills: number = 0;
  @type("number") deaths: number = 0;
  @type("number") respawnAt: number = 0;
  @type("number") direction: number = 0; // 0-7 for 8-directional facing
  @type("boolean") invisible: boolean = false;
  @type("number") shieldHp: number = 0; // Kyrie Eleison shield

  // Server-only (not synced via @type)
  userId: number = 0;
  moveSpeed: number = 0;
  attackDamage: number = 0;
  attackRange: number = 0;
  attackSpeedMs: number = 0;
  defense: number = 0;
  lastAttackTime: number = 0;
  inputDx: number = 0;
  inputDy: number = 0;
  targetId: string = "";
  castingSkillId: string = "";
  castingEndTime: number = 0;
  castingTargetId: string = "";
  castingTargetX: number = 0;
  castingTargetY: number = 0;

  // Click-to-move target (server only)
  moveToX: number = -1;
  moveToY: number = -1;

  // Buff/debuff modifiers (multiplicative, 1.0 = no change)
  atkMod: number = 1;
  defMod: number = 1;
  speedMod: number = 1;
}
