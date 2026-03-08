import Phaser from "phaser";
import { Room } from "colyseus.js";

export class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null = null;
  private skillKeys: Phaser.Input.Keyboard.Key[] = [];
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;
  private room: Room | null = null;
  private lastDx = 0;
  private lastDy = 0;
  private skills: string[] = [];

  init(scene: Phaser.Scene, room: Room, skillIds: string[]): void {
    this.room = room;
    this.skills = skillIds;

    if (!scene.input.keyboard) return;

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Number keys 1-4 for skills
    this.skillKeys = [
      scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    ];

    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(): void {
    if (!this.room || !this.wasd) return;

    // WASD movement (overrides click-to-move)
    let dx = 0;
    let dy = 0;

    if (this.wasd.A.isDown || this.cursors?.left.isDown) dx -= 1;
    if (this.wasd.D.isDown || this.cursors?.right.isDown) dx += 1;
    if (this.wasd.W.isDown || this.cursors?.up.isDown) dy -= 1;
    if (this.wasd.S.isDown || this.cursors?.down.isDown) dy += 1;

    // Only send if direction changed
    if (dx !== this.lastDx || dy !== this.lastDy) {
      this.lastDx = dx;
      this.lastDy = dy;
      if (dx === 0 && dy === 0) {
        this.room.send("stop");
      } else {
        this.room.send("move", { dx, dy });
      }
    }

    // Skills: 1-4
    for (let i = 0; i < this.skillKeys.length; i++) {
      if (Phaser.Input.Keyboard.JustDown(this.skillKeys[i]) && this.skills[i]) {
        this.useSkill(i);
      }
    }

    // Space = basic attack on current target
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.room.send("attack", { targetId: this.getCurrentTarget() });
    }
  }

  private useSkill(index: number): void {
    if (!this.room || !this.skills[index]) return;
    this.room.send("skill", {
      skillId: this.skills[index],
      targetId: this.getCurrentTarget(),
    });
  }

  private getCurrentTarget(): string {
    return (this.room as any)?._targetId || "";
  }

  setTarget(targetId: string): void {
    if (this.room) {
      (this.room as any)._targetId = targetId;
      this.room.send("select_target", { targetId });
    }
  }
}
