import Phaser from "phaser";
import { Room } from "colyseus.js";
import { ALL_CLASSES, PlayerClass } from "@ro-pvp/shared";

export class UIScene extends Phaser.Scene {
  private room: Room | null = null;
  private hpText!: Phaser.GameObjects.Text;
  private mpText!: Phaser.GameObjects.Text;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private mpBar!: Phaser.GameObjects.Rectangle;
  private skillTexts: Phaser.GameObjects.Text[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private killFeedTexts: Phaser.GameObjects.Text[] = [];
  private respawnText!: Phaser.GameObjects.Text;
  private controlsText!: Phaser.GameObjects.Text;
  private leaderboardTexts: Phaser.GameObjects.Text[] = [];
  private leaderboardBg!: Phaser.GameObjects.Rectangle;
  private leaderboardTitle!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "UIScene" });
  }

  create(data: { room: Room; className: string }): void {
    this.room = data.room;
    const classDef = ALL_CLASSES[data.className as PlayerClass];

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);

    // HP Bar
    this.add.rectangle(150, height - 60, 204, 24, 0x333333).setOrigin(0.5);
    this.hpBar = this.add.rectangle(50, height - 60, 200, 20, 0x22c55e).setOrigin(0, 0.5);
    this.hpText = this.add.text(150, height - 60, "HP", {
      fontSize: "12px", color: "#ffffff",
    }).setOrigin(0.5);

    // MP Bar
    this.add.rectangle(150, height - 32, 204, 24, 0x333333).setOrigin(0.5);
    this.mpBar = this.add.rectangle(50, height - 32, 200, 20, 0x3b82f6).setOrigin(0, 0.5);
    this.mpText = this.add.text(150, height - 32, "MP", {
      fontSize: "12px", color: "#ffffff",
    }).setOrigin(0.5);

    // Skill icons
    if (classDef) {
      classDef.skills.forEach((skill, i) => {
        const x = width / 2 - 100 + i * 70;
        const y = height - 45;

        this.add.rectangle(x, y, 60, 40, 0x1a1a1a).setStrokeStyle(2, 0x555555);
        const keyText = this.add.text(x, y - 10, `[${i + 1}]`, {
          fontSize: "10px", color: "#fbbf24",
        }).setOrigin(0.5);
        const nameText = this.add.text(x, y + 8, skill.name, {
          fontSize: "9px", color: "#cccccc",
        }).setOrigin(0.5);

        this.skillTexts.push(nameText);
      });
    }

    // --- Leaderboard panel (top-right, always visible) ---
    const lbX = width - 10;
    const lbTop = 10;
    const lbW = 180;
    const lbRowH = 16;
    const lbRows = 10;
    const lbHeaderH = 24;
    const lbH = lbHeaderH + lbRows * lbRowH + 8;

    // Semi-transparent background
    this.leaderboardBg = this.add.rectangle(
      lbX - lbW / 2, lbTop + lbH / 2, lbW, lbH, 0x000000, 0.45
    ).setOrigin(0.5, 0.5);
    this.leaderboardBg.setStrokeStyle(1, 0xfbbf24, 0.4);

    // Title
    this.leaderboardTitle = this.add.text(lbX - lbW + 8, lbTop + 4, "Top Kills", {
      fontSize: "12px", color: "#fbbf24", fontStyle: "bold",
    });

    // Column headers
    this.add.text(lbX - lbW + 8, lbTop + lbHeaderH - 4, "Player", {
      fontSize: "9px", color: "#888888",
    });
    this.add.text(lbX - 44, lbTop + lbHeaderH - 4, "K", {
      fontSize: "9px", color: "#888888",
    });
    this.add.text(lbX - 18, lbTop + lbHeaderH - 4, "D", {
      fontSize: "9px", color: "#888888",
    });

    // Leaderboard rows (monospace for column alignment)
    for (let i = 0; i < lbRows; i++) {
      const rowY = lbTop + lbHeaderH + 6 + i * lbRowH;
      const t = this.add.text(lbX - lbW + 8, rowY, "", {
        fontSize: "10px", color: "#cccccc",
        fontFamily: "Courier New, monospace",
        fixedWidth: lbW - 16,
      });
      this.leaderboardTexts.push(t);
    }

    // Score (own K/D below leaderboard)
    this.scoreText = this.add.text(lbX - lbW / 2, lbTop + lbH + 8, "K: 0 | D: 0", {
      fontSize: "13px", color: "#fbbf24", align: "center",
    }).setOrigin(0.5, 0);

    // Kill feed area (below leaderboard + score)
    const feedTop = lbTop + lbH + 30;
    for (let i = 0; i < 5; i++) {
      const t = this.add.text(width - 20, feedTop + i * 18, "", {
        fontSize: "11px", color: "#aaaaaa", align: "right",
      }).setOrigin(1, 0);
      this.killFeedTexts.push(t);
    }

    // Respawn overlay
    this.respawnText = this.add.text(width / 2, height / 2, "", {
      fontSize: "32px", color: "#ef4444", fontStyle: "bold",
    }).setOrigin(0.5).setAlpha(0);

    // Controls hint
    this.controlsText = this.add.text(20, 20, "WASD: Move | 1-4: Skills | Space: Attack | Click: Target", {
      fontSize: "11px", color: "#666666",
    });

    // Listen for kill feed events from ArenaScene
    const arenaScene = this.scene.get("ArenaScene");
    arenaScene.events.on("kill_feed", (data: any) => {
      this.addKillFeed(`${data.killerName} killed ${data.victimName} [${data.skillName}]`);
    });
  }

  update(): void {
    if (!this.room) return;

    const player = this.room.state.players.get(this.room.sessionId);
    if (!player) return;

    // Update HP/MP bars
    const hpRatio = player.hp / player.maxHp;
    this.hpBar.width = 200 * Math.max(0, hpRatio);
    this.hpText.setText(`HP: ${Math.floor(player.hp)} / ${player.maxHp}`);

    const mpRatio = player.mp / player.maxMp;
    this.mpBar.width = 200 * Math.max(0, mpRatio);
    this.mpText.setText(`MP: ${Math.floor(player.mp)} / ${player.maxMp}`);

    // Update score
    this.scoreText.setText(`K: ${player.kills} | D: ${player.deaths}`);

    // Update leaderboard - sort all players by kills descending
    const allPlayers: { name: string; kills: number; deaths: number; isLocal: boolean }[] = [];
    this.room.state.players.forEach((p: any) => {
      allPlayers.push({
        name: p.username || "???",
        kills: p.kills || 0,
        deaths: p.deaths || 0,
        isLocal: p.sessionId === this.room!.sessionId,
      });
    });
    allPlayers.sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);

    for (let i = 0; i < this.leaderboardTexts.length; i++) {
      if (i < allPlayers.length) {
        const p = allPlayers[i];
        const rank = `${i + 1}.`;
        const nameStr = p.name.length > 10 ? p.name.substring(0, 10) + ".." : p.name;
        const line = `${rank.padEnd(3)} ${nameStr.padEnd(13)} ${String(p.kills).padStart(3)} ${String(p.deaths).padStart(3)}`;
        this.leaderboardTexts[i].setText(line);
        this.leaderboardTexts[i].setColor(p.isLocal ? "#fbbf24" : "#cccccc");
      } else {
        this.leaderboardTexts[i].setText("");
      }
    }

    // Respawn text
    if (!player.alive && player.respawnAt > 0) {
      const remaining = Math.max(0, Math.ceil((player.respawnAt - this.room.state.serverTime) / 1000));
      this.respawnText.setText(`Respawning in ${remaining}...`).setAlpha(1);
    } else {
      this.respawnText.setAlpha(0);
    }
  }

  private addKillFeed(message: string): void {
    // Shift existing messages down
    for (let i = this.killFeedTexts.length - 1; i > 0; i--) {
      this.killFeedTexts[i].setText(this.killFeedTexts[i - 1].text);
      this.killFeedTexts[i].setAlpha(this.killFeedTexts[i - 1].alpha * 0.8);
    }
    this.killFeedTexts[0].setText(message).setAlpha(1);

    // Fade all entries
    this.killFeedTexts.forEach((t, i) => {
      this.tweens.add({
        targets: t,
        alpha: 0,
        delay: 5000 + i * 1000,
        duration: 1000,
      });
    });
  }
}
