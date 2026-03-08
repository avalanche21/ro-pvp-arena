import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { ArenaScene } from "./scenes/ArenaScene";
import { UIScene } from "./scenes/UIScene";

export function createGame(parent: HTMLElement, token: string, className: string, gender: string = "m"): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: "#1a1a1a",
    scene: [BootScene, ArenaScene, UIScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    callbacks: {
      preBoot: (game) => {
        game.registry.set("token", token);
        game.registry.set("className", className);
        game.registry.set("gender", gender);
      },
    },
  });

  return game;
}
