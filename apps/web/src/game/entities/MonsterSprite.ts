import Phaser from "phaser";

const MONSTER_COLORS: Record<string, number> = {
  poring: 0xff88aa,
  drops: 0x4488ff,
  marin: 0x4488cc,
};

export class MonsterSprite extends Phaser.GameObjects.Container {
  private bodyVisual: Phaser.GameObjects.GameObject;
  private nameText: Phaser.GameObjects.Text;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private useRealSprite: boolean = false;
  private monsterType: string;
  private currentAnim: string = "";
  private targetRing: Phaser.GameObjects.Arc | null = null;

  public monsterId: string;

  private serverX = 0;
  private serverY = 0;
  private prevX = 0;
  private prevY = 0;
  private moveAccum = 0;
  private walkStopTimer = 0;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number, monsterType: string) {
    super(scene, x, y);

    this.monsterId = id;
    this.monsterType = monsterType;
    this.serverX = x;
    this.serverY = y;
    this.prevX = x;
    this.prevY = y;

    const monsterSprites = scene.registry.get("monsterSprites") as Record<string, boolean> | undefined;
    this.useRealSprite = !!monsterSprites?.[monsterType];

    if (this.useRealSprite) {
      const sprite = scene.add.sprite(0, -20, `${monsterType}_real`, 0);
      sprite.setScale(1.2);
      this.bodyVisual = sprite;
      this.add(sprite);

      // Set up animations from meta
      const meta = scene.cache.json.get(`${monsterType}_meta`);
      if (meta) {
        this.setupAnimations(scene, monsterType, meta);
      }
    } else {
      const color = MONSTER_COLORS[monsterType] || 0xff88aa;
      const body = scene.add.circle(0, -5, 16, color);
      this.bodyVisual = body;
      this.add(body);
    }

    // Name label
    const displayName = monsterType === "poring" ? "Poring" : monsterType === "marin" ? "Marin" : "Drops";
    this.nameText = scene.add.text(0, -45, displayName, {
      fontSize: "10px",
      color: "#ffffff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.add(this.nameText);

    // HP bar
    this.hpBarBg = scene.add.rectangle(0, -38, 30, 3, 0x333333);
    this.add(this.hpBarBg);
    this.hpBarFill = scene.add.rectangle(0, -38, 30, 3, 0x22c55e);
    this.add(this.hpBarFill);

    // Shadow
    const shadow = scene.add.ellipse(0, 4, 24, 8, 0x000000, 0.25);
    this.add(shadow);
    this.sendToBack(shadow);

    scene.add.existing(this);
    this.setSize(32, 40);
    this.setInteractive();
    this.setDepth(y);
  }

  private setupAnimations(scene: Phaser.Scene, monsterType: string, meta: any): void {
    if (!meta?.rows) return;

    const texKey = `${monsterType}_real`;
    const texWidth = scene.textures.get(texKey).getSourceImage().width;
    const cols = Math.floor(texWidth / meta.frameSize);

    for (const row of meta.rows) {
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let f = 0; f < row.frameCount; f++) {
        frames.push({ key: texKey, frame: row.index * cols + f });
      }

      const animKey = `${monsterType}_${row.label}`;
      if (!scene.anims.exists(animKey)) {
        let frameRate = 6;
        let repeat = 0;
        if (row.label === "idle") { frameRate = 4; repeat = -1; }
        else if (row.label === "walk") { frameRate = 8; repeat = -1; }
        else if (row.label === "attack") { frameRate = 8; repeat = 0; }
        else if (row.label === "hurt") { frameRate = 8; repeat = 0; }
        else if (row.label === "die") { frameRate = 6; repeat = 0; }

        scene.anims.create({ key: animKey, frames, frameRate, repeat });
      }
    }

    this.playMonsterAnim("idle");
  }

  private playMonsterAnim(action: string): void {
    if (!this.useRealSprite) return;
    const sprite = this.bodyVisual as Phaser.GameObjects.Sprite;
    const animKey = `${this.monsterType}_${action}`;
    if (animKey === this.currentAnim) return;
    if (this.scene.anims.exists(animKey)) {
      sprite.play(animKey);
      this.currentAnim = animKey;
    }
  }

  updateHP(hp: number, maxHp: number): void {
    const ratio = Math.max(0, hp / maxHp);
    this.hpBarFill.width = 30 * ratio;
    this.hpBarFill.x = -15 * (1 - ratio);
    this.hpBarFill.fillColor = ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xeab308 : 0xef4444;
  }

  setServerPosition(x: number, y: number): void {
    this.serverX = x;
    this.serverY = y;
  }

  interpolate(dt: number): void {
    const lerpSpeed = 8;
    this.x += (this.serverX - this.x) * Math.min(1, lerpSpeed * dt);
    this.y += (this.serverY - this.y) * Math.min(1, lerpSpeed * dt);

    const dx = this.x - this.prevX;
    const dy = this.y - this.prevY;
    const moveDist = Math.sqrt(dx * dx + dy * dy);
    this.prevX = this.x;
    this.prevY = this.y;

    // Smooth movement detection to prevent animation flickering
    this.moveAccum = this.moveAccum * 0.7 + moveDist * 0.3;

    const isCurrentlyWalking = this.currentAnim.includes("walk");
    const isMovingNow = isCurrentlyWalking
      ? this.moveAccum > 0.3
      : this.moveAccum > 1.0;

    if (isMovingNow) {
      this.walkStopTimer = 0.15;
    } else {
      this.walkStopTimer = Math.max(0, this.walkStopTimer - dt);
    }

    const shouldWalk = isMovingNow || this.walkStopTimer > 0;

    if (this.useRealSprite) {
      if (shouldWalk) {
        this.playMonsterAnim("walk");
      } else if (isCurrentlyWalking) {
        this.playMonsterAnim("idle");
      }
    }

    this.setDepth(this.y);
  }

  playDie(): void {
    this.playMonsterAnim("die");
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 1000,
      delay: 500,
    });
  }

  playHurt(): void {
    this.playMonsterAnim("hurt");
    this.setAlpha(0.7);
    this.scene.time.delayedCall(200, () => this.setAlpha(1));
  }

  revive(): void {
    this.setAlpha(1);
    this.playMonsterAnim("idle");
  }

  showTargetRing(show: boolean): void {
    if (show && !this.targetRing) {
      this.targetRing = this.scene.add.circle(0, 4, 18, 0xef4444, 0).setStrokeStyle(2, 0xef4444);
      this.add(this.targetRing);
    } else if (!show && this.targetRing) {
      this.targetRing.destroy();
      this.targetRing = null;
    }
  }

  showDamageNumber(amount: number): void {
    const dmgText = this.scene.add.text(this.x, this.y - 30, `-${amount}`, {
      fontSize: "14px",
      fontStyle: "bold",
      color: "#ffdd44",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: dmgText,
      y: dmgText.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => dmgText.destroy(),
    });
  }
}
