import { Schema, type } from "@colyseus/schema";

export class Monster extends Schema {
  @type("string") id: string = "";
  @type("string") monsterType: string = ""; // "poring" or "drops"
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") hp: number = 0;
  @type("number") maxHp: number = 0;
  @type("boolean") alive: boolean = true;
  @type("number") direction: number = 0;

  // Server-only
  moveTargetX: number = -1;
  moveTargetY: number = -1;
  nextMoveTime: number = 0;
  respawnAt: number = 0;
  moveSpeed: number = 80; // slow
}
