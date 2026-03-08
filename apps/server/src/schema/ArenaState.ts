import { Schema, MapSchema, type } from "@colyseus/schema";
import { Player } from "./Player";
import { Monster } from "./Monster";

export class ArenaState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Monster }) monsters = new MapSchema<Monster>();
  @type("number") serverTime: number = 0;
}
