import Phaser from "phaser";

const CLASS_COLORS: Record<string, number> = {
  Knight: 0x3b82f6,
  Crusader: 0x60a5fa,
  Assassin: 0xef4444,
  Rogue: 0xf87171,
  Wizard: 0xa855f7,
  Sage: 0xc084fc,
  Priest: 0xe5e7eb,
  Monk: 0xf59e0b,
  Hunter: 0x22c55e,
  Bard: 0x06b6d4,
  Dancer: 0xec4899,
  Alchemist: 0xf97316,
};

export class PlayerSprite extends Phaser.GameObjects.Container {
  private bodyVisual: Phaser.GameObjects.GameObject;
  private nameText: Phaser.GameObjects.Text;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private targetRing: Phaser.GameObjects.Arc | null = null;
  private useRealSprite: boolean = false;
  private classKey: string;
  private currentAnim: string = "";
  private attackAnimTimer: Phaser.Time.TimerEvent | null = null;
  private hurtAnimTimer: Phaser.Time.TimerEvent | null = null;
  private castingGraphic: Phaser.GameObjects.Graphics | null = null;

  public sessionId: string;
  public isLocal: boolean;

  // For interpolation
  private serverX = 0;
  private serverY = 0;
  private serverDirection = 0;
  private isMoving = false;
  private isAttacking = false;
  private isHurt = false;
  private prevX = 0;
  private prevY = 0;
  private moveAccum = 0;        // accumulated movement distance
  private walkStopTimer = 0;    // cooldown before switching to idle

  constructor(scene: Phaser.Scene, sessionId: string, x: number, y: number, className: string, gender: string, username: string, isLocal: boolean) {
    super(scene, x, y);

    this.sessionId = sessionId;
    this.isLocal = isLocal;
    this.serverX = x;
    this.serverY = y;
    this.prevX = x;
    this.prevY = y;
    this.classKey = `${className.toLowerCase()}_${gender}`;

    // Check if real sprite is available
    const realSprites = scene.registry.get("realSprites") as Record<string, boolean> | undefined;
    this.useRealSprite = !!realSprites?.[this.classKey];

    if (this.useRealSprite) {
      // Use real RO sprite sheet
      // The sprite anchor: feet are at anchorY=120 in a 150px frame
      // So offset the sprite upward so feet align with container position
      // Sprite center is at 75, feet at 120, so offset = -(120-75) = -45
      const sprite = scene.add.sprite(0, -45, `${this.classKey}_real`, 0);
      sprite.setScale(1);
      this.bodyVisual = sprite;
      this.add(sprite);

      // Set up animations
      const metaKey = `${this.classKey}_meta`;
      const meta = scene.cache.json.get(metaKey);
      if (meta) {
        this.setupAnimations(scene, this.classKey, meta);
      }
    } else {
      // Use procedural sprite
      const texKey = `${this.classKey}_sprite`;
      if (scene.textures.exists(texKey)) {
        const sprite = scene.add.image(0, 0, texKey);
        this.bodyVisual = sprite;
        this.add(sprite);
      } else {
        const color = CLASS_COLORS[className] || 0xffffff;
        const rect = scene.add.rectangle(0, 0, 32, 48, color);
        this.bodyVisual = rect;
        this.add(rect);
      }
    }

    // Username label
    this.nameText = scene.add.text(0, -50, username, {
      fontSize: "11px",
      color: isLocal ? "#fbbf24" : "#ffffff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.add(this.nameText);

    // HP bar background
    this.hpBarBg = scene.add.rectangle(0, -42, 40, 4, 0x333333);
    this.add(this.hpBarBg);

    // HP bar fill
    this.hpBarFill = scene.add.rectangle(0, -42, 40, 4, 0x22c55e);
    this.add(this.hpBarFill);

    // Shadow under character
    const shadow = scene.add.ellipse(0, 4, 30, 10, 0x000000, 0.3);
    this.add(shadow);
    this.sendToBack(shadow);

    scene.add.existing(this);
    this.setSize(40, 60);
    this.setInteractive();
    this.setDepth(y);
  }

  private setupAnimations(scene: Phaser.Scene, classKey: string, meta: any): void {
    if (!meta?.rows) return;

    const texKey = `${classKey}_real`;
    const texWidth = scene.textures.get(texKey).getSourceImage().width;
    const cols = Math.floor(texWidth / meta.frameSize);

    for (const row of meta.rows) {
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let f = 0; f < row.frameCount; f++) {
        frames.push({ key: texKey, frame: row.index * cols + f });
      }

      const animKey = `${classKey}_${row.label}`;
      if (!scene.anims.exists(animKey)) {
        let frameRate = 8;
        let repeat = 0;
        if (row.label.startsWith("idle")) { frameRate = 2; repeat = -1; }
        else if (row.label.startsWith("walk")) { frameRate = 4; repeat = -1; }
        else if (row.label.startsWith("attack")) { frameRate = 8; repeat = 0; }
        else if (row.label.startsWith("hurt")) { frameRate = 6; repeat = 0; }
        else if (row.label.startsWith("die")) { frameRate = 4; repeat = 0; }

        scene.anims.create({ key: animKey, frames, frameRate, repeat });
      }
    }

    // Play idle south by default
    this.playAnim("idle", 0);
  }

  private playAnim(action: string, direction: number): void {
    if (!this.useRealSprite) return;
    const sprite = this.bodyVisual as Phaser.GameObjects.Sprite;
    const animKey = `${this.classKey}_${action}_dir${direction}`;
    if (animKey === this.currentAnim) return;
    if (this.scene.anims.exists(animKey)) {
      sprite.play(animKey);
      this.currentAnim = animKey;
    }
  }

  updateHP(hp: number, maxHp: number): void {
    const ratio = Math.max(0, hp / maxHp);
    this.hpBarFill.width = 40 * ratio;
    this.hpBarFill.x = -20 * (1 - ratio);

    if (ratio > 0.5) {
      this.hpBarFill.fillColor = 0x22c55e;
    } else if (ratio > 0.25) {
      this.hpBarFill.fillColor = 0xeab308;
    } else {
      this.hpBarFill.fillColor = 0xef4444;
    }
  }

  setServerPosition(x: number, y: number): void {
    this.serverX = x;
    this.serverY = y;
  }

  setDirection(dir: number): void {
    this.serverDirection = dir;
  }

  interpolate(dt: number): void {
    if (this.isLocal) {
      this.x = this.serverX;
      this.y = this.serverY;
    } else {
      const lerpSpeed = 10;
      this.x += (this.serverX - this.x) * Math.min(1, lerpSpeed * dt);
      this.y += (this.serverY - this.y) * Math.min(1, lerpSpeed * dt);
    }

    // Smooth movement detection: accumulate distance and decay over time
    const dx = this.x - this.prevX;
    const dy = this.y - this.prevY;
    const moveDist = Math.sqrt(dx * dx + dy * dy);
    this.prevX = this.x;
    this.prevY = this.y;

    // Exponential moving average of movement speed
    this.moveAccum = this.moveAccum * 0.7 + moveDist * 0.3;

    const isCurrentlyWalking = this.currentAnim.includes("walk");

    // Use smoothed value with wide hysteresis gap to prevent flickering
    const startThreshold = 1.2;  // smoothed speed to start walking
    const stopThreshold = 0.3;   // smoothed speed to stop walking
    const isMovingNow = isCurrentlyWalking
      ? this.moveAccum > stopThreshold
      : this.moveAccum > startThreshold;

    // Cooldown timer: once walking, keep walking for at least 150ms after stopping
    if (isMovingNow) {
      this.walkStopTimer = 0.15; // reset cooldown
    } else {
      this.walkStopTimer = Math.max(0, this.walkStopTimer - dt);
    }

    const shouldWalk = isMovingNow || this.walkStopTimer > 0;

    if (this.useRealSprite && !this.isAttacking && !this.isHurt) {
      if (shouldWalk) {
        this.playAnim("walk", this.serverDirection);
      } else if (isCurrentlyWalking) {
        this.playAnim("idle", this.serverDirection);
      } else if (!this.currentAnim.includes("idle")) {
        this.playAnim("idle", this.serverDirection);
      }
    }

    // Update depth sorting
    this.setDepth(this.y);
  }

  playAttack(targetX?: number, targetY?: number): void {
    this.isAttacking = true;

    // Calculate angle toward target (or use facing direction as fallback)
    let towardAngle: number;
    if (targetX !== undefined && targetY !== undefined) {
      towardAngle = Math.atan2(targetY - this.y, targetX - this.x);
    } else {
      // Convert 8-direction to radians (dir0=south, clockwise)
      towardAngle = (this.serverDirection / 8) * Math.PI * 2 - Math.PI / 2;
    }

    if (this.useRealSprite) {
      const animKey = `${this.classKey}_attack_dir${this.serverDirection}`;
      if (this.scene.anims.exists(animKey)) {
        const sprite = this.bodyVisual as Phaser.GameObjects.Sprite;
        sprite.play(animKey);
        this.currentAnim = animKey;

        sprite.once("animationcomplete", () => {
          this.isAttacking = false;
          this.attackAnimTimer = null;
        });
      }
    }

    // Fallback timer
    if (this.attackAnimTimer) this.attackAnimTimer.destroy();
    this.attackAnimTimer = this.scene.time.delayedCall(600, () => {
      this.isAttacking = false;
      this.attackAnimTimer = null;
    });

    // For non-real-sprite characters: lunge toward target
    if (!this.useRealSprite && this.bodyVisual) {
      const body = this.bodyVisual as Phaser.GameObjects.Rectangle;
      const origColor = body.fillColor;
      const lungeX = Math.cos(towardAngle) * 10;
      const lungeY = Math.sin(towardAngle) * 10;
      body.fillColor = 0xffffff;
      this.scene.tweens.add({
        targets: body, x: body.x + lungeX, y: body.y + lungeY,
        duration: 80, yoyo: true,
        onComplete: () => { body.fillColor = origColor; },
      });
      this.scene.time.delayedCall(500, () => { this.isAttacking = false; });
    }

    // Half-circle swing arc toward the target
    this.spawnSwingArc(towardAngle);
  }

  private spawnSwingArc(towardAngle: number): void {
    const scene = this.scene;
    // The arc is placed between the attacker and the target direction
    const arcDist = 28;
    const cx = this.x + Math.cos(towardAngle) * arcDist;
    const cy = this.y + Math.sin(towardAngle) * arcDist;
    const arcRadius = 24;

    // Animated sweep: draw the arc expanding from one side to the other
    // Start angle perpendicular to attack direction, sweep 180 degrees
    const sweepStart = towardAngle - Math.PI / 2;
    const sweepEnd = towardAngle + Math.PI / 2;

    // Phase 1: Quick sweep arc appears
    const slash = scene.add.graphics().setDepth(this.depth + 10);

    // Draw the half-circle swing
    // Outer glow (thick, faint)
    slash.lineStyle(8, 0xffffff, 0.5);
    slash.beginPath();
    slash.arc(cx, cy, arcRadius, sweepStart, sweepEnd, false);
    slash.strokePath();
    // Mid layer
    slash.lineStyle(5, 0xffffcc, 0.7);
    slash.beginPath();
    slash.arc(cx, cy, arcRadius, sweepStart, sweepEnd, false);
    slash.strokePath();
    // Inner bright core
    slash.lineStyle(2, 0xffffff, 0.95);
    slash.beginPath();
    slash.arc(cx, cy, arcRadius, sweepStart, sweepEnd, false);
    slash.strokePath();

    // Animate: scale outward along the attack direction and fade
    scene.tweens.add({
      targets: slash, alpha: 0,
      duration: 180,
      onUpdate: (tween) => {
        const p = tween.progress;
        slash.setScale(1 + p * 0.4);
        slash.setPosition(Math.cos(towardAngle) * p * 6, Math.sin(towardAngle) * p * 6);
      },
      onComplete: () => slash.destroy(),
    });

    // Tip sparks at the ends of the arc
    for (let end = -1; end <= 1; end += 2) {
      const tipAngle = towardAngle + end * Math.PI / 2;
      const tipX = cx + Math.cos(tipAngle) * arcRadius;
      const tipY = cy + Math.sin(tipAngle) * arcRadius;
      const spark = scene.add.circle(tipX, tipY, 3, 0xffffff, 0.9).setDepth(this.depth + 11);
      scene.tweens.add({
        targets: spark,
        x: tipX + Math.cos(towardAngle) * 12,
        y: tipY + Math.sin(towardAngle) * 12,
        alpha: 0, scale: 0.3, duration: 150,
        onComplete: () => spark.destroy(),
      });
    }
  }

  playHurt(): void {
    if (this.isAttacking) return; // don't interrupt attacks

    if (this.useRealSprite) {
      const animKey = `${this.classKey}_hurt_dir0`;
      if (this.scene.anims.exists(animKey)) {
        this.isHurt = true;
        const sprite = this.bodyVisual as Phaser.GameObjects.Sprite;
        sprite.play(animKey);
        this.currentAnim = animKey;
        sprite.once("animationcomplete", () => {
          this.isHurt = false;
        });
      }
    }

    // Hurt flash (red tint)
    if (this.hurtAnimTimer) this.hurtAnimTimer.destroy();
    this.setAlpha(0.6);
    this.hurtAnimTimer = this.scene.time.delayedCall(200, () => {
      this.setAlpha(1);
      this.isHurt = false;
      this.hurtAnimTimer = null;
    });
  }

  showCasting(active: boolean): void {
    if (active && !this.castingGraphic) {
      this.castingGraphic = this.scene.add.graphics();
      this.castingGraphic.setDepth(999);
      this.add(this.castingGraphic);
      // Draw a spinning circle
      const draw = () => {
        if (!this.castingGraphic) return;
        this.castingGraphic.clear();
        this.castingGraphic.lineStyle(2, 0xfbbf24, 0.6);
        this.castingGraphic.strokeCircle(0, -20, 18);
        this.castingGraphic.fillStyle(0xfbbf24, 0.15);
        this.castingGraphic.fillCircle(0, -20, 16);
      };
      draw();
    } else if (!active && this.castingGraphic) {
      this.castingGraphic.destroy();
      this.castingGraphic = null;
    }
  }

  setDead(dead: boolean): void {
    if (dead && this.useRealSprite) {
      this.isAttacking = false;
      this.isHurt = false;
      this.playAnim("die", 0);
    }
    this.setAlpha(dead ? 0.5 : 1);
  }

  setInvisible(invisible: boolean, isLocal: boolean): void {
    if (invisible) {
      this.setAlpha(isLocal ? 0.4 : 0);
    } else {
      this.setAlpha(1);
    }
  }

  showTargetRing(show: boolean): void {
    if (show && !this.targetRing) {
      this.targetRing = this.scene.add.circle(0, 4, 20, 0xfbbf24, 0).setStrokeStyle(2, 0xfbbf24);
      this.add(this.targetRing);
    } else if (!show && this.targetRing) {
      this.targetRing.destroy();
      this.targetRing = null;
    }
  }

  showDamageNumber(amount: number, blocked: boolean = false): void {
    const text = blocked ? "BLOCK" : `-${amount}`;
    const color = blocked ? "#60a5fa" : "#ef4444";
    const dmgText = this.scene.add.text(this.x, this.y - 40, text, {
      fontSize: "16px",
      fontStyle: "bold",
      color,
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: dmgText,
      y: dmgText.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => dmgText.destroy(),
    });
  }
}
