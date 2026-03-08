import Phaser from "phaser";

function shake(scene: Phaser.Scene, intensity = 0.005, duration = 150): void {
  scene.cameras.main.shake(duration, intensity);
}

function screenFlash(scene: Phaser.Scene, color: number, duration = 100, alpha = 0.3): void {
  scene.cameras.main.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
}

function glowCircle(scene: Phaser.Scene, x: number, y: number, radius: number, color: number, alpha: number, depth = 999): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(depth);
  const steps = 5;
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    g.fillStyle(color, alpha * (1 - t) * 0.5);
    g.fillCircle(x, y, radius * (1 + t * 0.8));
  }
  g.fillStyle(0xffffff, alpha * 0.3);
  g.fillCircle(x, y, radius * 0.3);
  return g;
}

export function spawnSkillEffect(
  scene: Phaser.Scene,
  skillId: string,
  x: number,
  y: number,
  casterX?: number,
  casterY?: number,
): void {
  switch (skillId) {
    // Knight
    case "bash": spawnBashEffect(scene, x, y); break;
    case "magnum_break": spawnMagnumBreak(scene, x, y); break;
    case "provoke": spawnProvokeEffect(scene, x, y); break;
    case "berserk": spawnBerserkEffect(scene, x, y); break;
    // Assassin
    case "sonic_blow": spawnSonicBlowEffect(scene, x, y); break;
    case "cloaking": spawnCloakEffect(scene, x, y); break;
    case "poison_breath": spawnPoisonBreath(scene, x, y); break;
    case "cross_impact": spawnCrossImpactEffect(scene, x, y, casterX, casterY); break;
    // Wizard
    case "fire_bolt": if (casterX !== undefined && casterY !== undefined) spawnFireBolt(scene, casterX, casterY, x, y); break;
    case "storm_gust": spawnStormGust(scene, x, y); break;
    case "jupitel_thunder": if (casterX !== undefined && casterY !== undefined) spawnJupitelThunder(scene, casterX, casterY, x, y); break;
    case "meteor_storm": spawnMeteorStorm(scene, x, y); break;
    // Priest
    case "heal": spawnHealEffect(scene, x, y); break;
    case "holy_light": if (casterX !== undefined && casterY !== undefined) spawnHolyLight(scene, casterX, casterY, x, y); break;
    case "kyrie_eleison": spawnKyrieEleison(scene, x, y); break;
    case "magnus_exorcismus": spawnMagnusExorcismus(scene, x, y); break;
    // Crusader
    case "holy_cross": spawnHolyCross(scene, x, y); break;
    case "grand_cross": spawnGrandCross(scene, x, y); break;
    case "devotion": spawnDevotionEffect(scene, x, y); break;
    case "shield_boomerang": if (casterX !== undefined && casterY !== undefined) spawnShieldBoomerang(scene, casterX, casterY, x, y); break;
    // Rogue
    case "backstab": spawnBackstab(scene, x, y); break;
    case "strip_armor": spawnStripArmor(scene, x, y); break;
    case "intimidate": spawnIntimidate(scene, x, y, casterX, casterY); break;
    case "close_confine": spawnCloseConfine(scene, x, y); break;
    // Sage
    case "fire_wall": spawnFireWall(scene, x, y); break;
    case "dispell": spawnDispell(scene, x, y); break;
    case "volcano_buff": spawnVolcanoBuff(scene, x, y); break;
    case "earth_spike": spawnEarthSpike(scene, x, y); break;
    // Monk
    case "occult_impaction": spawnOccultImpaction(scene, x, y); break;
    case "investigate": spawnInvestigate(scene, x, y); break;
    case "zen": spawnZen(scene, x, y); break;
    case "asura_strike": spawnAsuraStrike(scene, x, y); break;
    // Hunter
    case "double_strafe": if (casterX !== undefined && casterY !== undefined) spawnDoubleStrafe(scene, casterX, casterY, x, y); break;
    case "arrow_shower": spawnArrowShower(scene, x, y); break;
    case "ankle_snare": spawnAnkleSnare(scene, x, y); break;
    case "blitz_beat": spawnBlitzBeat(scene, x, y); break;
    // Bard
    case "melody_strike": if (casterX !== undefined && casterY !== undefined) spawnMelodyStrike(scene, casterX, casterY, x, y); break;
    case "frost_joker": spawnFrostJoker(scene, x, y); break;
    case "drum_battle": spawnDrumBattle(scene, x, y); break;
    case "lokis_veil": spawnLokisVeil(scene, x, y); break;
    // Dancer
    case "slinging_arrow": if (casterX !== undefined && casterY !== undefined) spawnSlingingArrow(scene, casterX, casterY, x, y); break;
    case "scream": spawnScream(scene, x, y); break;
    case "humming": spawnHumming(scene, x, y); break;
    case "charm": spawnCharmEffect(scene, x, y); break;
    // Alchemist
    case "acid_terror": spawnAcidTerror(scene, x, y); break;
    case "demonstration": spawnDemonstration(scene, x, y); break;
    case "potion_pitcher": spawnPotionPitcher(scene, x, y); break;
    case "bio_cannibalize": spawnBioCannibalize(scene, x, y); break;
    default: spawnGenericEffect(scene, x, y);
  }
}

// ===== KNIGHT SKILLS =====

function spawnBashEffect(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.006, 120);
  screenFlash(scene, 0xffdd44, 80);
  // Big white impact flash
  const impactFlash = scene.add.circle(x, y, 25, 0xffffff, 0.9).setDepth(1002);
  scene.tweens.add({ targets: impactFlash, scale: 3, alpha: 0, duration: 150, onComplete: () => impactFlash.destroy() });
  // Multi-layered slashes
  for (let i = 0; i < 6; i++) {
    const slash = scene.add.graphics().setDepth(1000);
    const angle = -60 + i * 20;
    const rad = (angle * Math.PI) / 180;
    const len = 50 + i * 5;
    slash.lineStyle(6, 0xffffff, 0.9);
    slash.lineBetween(x - Math.cos(rad) * len, y - Math.sin(rad) * len, x + Math.cos(rad) * len, y + Math.sin(rad) * len);
    slash.lineStyle(3, 0xffdd44, 0.8);
    slash.lineBetween(x - Math.cos(rad) * len, y - Math.sin(rad) * len, x + Math.cos(rad) * len, y + Math.sin(rad) * len);
    scene.tweens.add({ targets: slash, alpha: 0, scaleX: 1.8, scaleY: 1.8, duration: 300, delay: i * 25, onComplete: () => slash.destroy() });
  }
  // Sparks flying out
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spark = scene.add.circle(x, y, 2 + Math.random() * 3, 0xffffaa, 0.9).setDepth(1001);
    scene.tweens.add({ targets: spark, x: x + Math.cos(angle) * (40 + Math.random() * 40), y: y + Math.sin(angle) * (40 + Math.random() * 40), alpha: 0, duration: 300 + Math.random() * 200, onComplete: () => spark.destroy() });
  }
  const glow = glowCircle(scene, x, y, 30, 0xffdd44, 0.6);
  scene.tweens.add({ targets: glow, alpha: 0, duration: 300, onComplete: () => glow.destroy() });
}

function spawnMagnumBreak(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.012, 200);
  screenFlash(scene, 0xff4400, 120);
  // Central white-hot flash
  const coreFlash = scene.add.circle(x, y, 35, 0xffffff, 1).setDepth(1002);
  scene.tweens.add({ targets: coreFlash, scale: 4, alpha: 0, duration: 200, onComplete: () => coreFlash.destroy() });
  // 20 outward flame particles
  const numFlames = 20;
  for (let i = 0; i < numFlames; i++) {
    const angle = (i / numFlames) * Math.PI * 2;
    const flame = scene.add.graphics().setDepth(1000);
    flame.fillStyle(0xff4400, 0.9); flame.fillCircle(0, 0, 12);
    flame.fillStyle(0xffaa00, 0.7); flame.fillCircle(0, -3, 8);
    flame.fillStyle(0xffee44, 0.5); flame.fillCircle(0, -5, 4);
    flame.fillStyle(0xffffff, 0.4); flame.fillCircle(0, -5, 2);
    flame.setPosition(x + Math.cos(angle) * 15, y + Math.sin(angle) * 15);
    scene.tweens.add({
      targets: flame, x: x + Math.cos(angle) * 160, y: y + Math.sin(angle) * 160,
      alpha: 0, scale: { from: 0.8, to: 2 }, duration: 450, delay: i * 15,
      onComplete: () => flame.destroy(),
    });
  }
  // Multiple expanding fire rings
  for (let wave = 0; wave < 3; wave++) {
    const ring = scene.add.circle(x, y, 20, 0xff6600, 0).setStrokeStyle(5, 0xff8800, 0.8).setDepth(1000);
    scene.tweens.add({ targets: ring, scale: 7 + wave * 2, alpha: 0, duration: 500, delay: wave * 80, onComplete: () => ring.destroy() });
  }
  // Ground fire glow
  const groundGlow = scene.add.circle(x, y, 80, 0xff4400, 0.4).setDepth(998);
  scene.tweens.add({ targets: groundGlow, scale: 2, alpha: 0, duration: 600, onComplete: () => groundGlow.destroy() });
  // Ember particles rising
  for (let i = 0; i < 15; i++) {
    const ember = scene.add.circle(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 80, 2 + Math.random() * 3, 0xffaa00, 0.8).setDepth(1001);
    scene.tweens.add({ targets: ember, y: ember.y - 60 - Math.random() * 40, alpha: 0, duration: 600 + Math.random() * 400, delay: 100 + i * 30, onComplete: () => ember.destroy() });
  }
}

function spawnProvokeEffect(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.003, 100);
  // Large angry exclamation
  const text = scene.add.text(x, y - 35, "!", {
    fontSize: "42px", fontStyle: "bold", color: "#ff2222", stroke: "#000000", strokeThickness: 4,
  }).setOrigin(0.5).setDepth(1001);
  scene.tweens.add({ targets: text, y: y - 70, alpha: 0, scale: { from: 0.5, to: 1.5 }, duration: 800, onComplete: () => text.destroy() });
  // Multiple anger veins
  for (let v = 0; v < 3; v++) {
    const vein = scene.add.graphics().setDepth(1000);
    vein.lineStyle(3, 0xff2222, 0.9);
    const vx = x + 15 + v * 12, vy = y - 50 + v * 8;
    vein.lineBetween(vx, vy - 8, vx + 10, vy + 2);
    vein.lineBetween(vx + 10, vy - 8, vx, vy + 2);
    scene.tweens.add({ targets: vein, y: "-=20", alpha: 0, duration: 700, delay: v * 80, onComplete: () => vein.destroy() });
  }
  // Red aura pulse
  const aura = scene.add.circle(x, y, 30, 0xff2222, 0.4).setDepth(999);
  scene.tweens.add({ targets: aura, scale: 2.5, alpha: 0, duration: 500, onComplete: () => aura.destroy() });
  // Red particles
  for (let i = 0; i < 8; i++) {
    const p = scene.add.circle(x + (Math.random() - 0.5) * 30, y, 3, 0xff4444, 0.7).setDepth(1001);
    scene.tweens.add({ targets: p, y: y - 40 - Math.random() * 30, alpha: 0, duration: 500, delay: i * 40, onComplete: () => p.destroy() });
  }
}

function spawnBerserkEffect(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.01, 300);
  screenFlash(scene, 0xff0000, 150);
  // Massive red explosion
  const coreFlash = scene.add.circle(x, y, 40, 0xff0000, 0.8).setDepth(1002);
  scene.tweens.add({ targets: coreFlash, scale: 4, alpha: 0, duration: 300, onComplete: () => coreFlash.destroy() });
  // 5 expanding red rings
  for (let wave = 0; wave < 5; wave++) {
    const ring = scene.add.circle(x, y, 15, 0xff2222, 0).setStrokeStyle(4, 0xff4444, 0.8).setDepth(1000);
    scene.tweens.add({ targets: ring, scale: { from: 0.5, to: 5 + wave * 2 }, alpha: 0, duration: 600, delay: wave * 120, onComplete: () => ring.destroy() });
  }
  // Fire column rising
  for (let i = 0; i < 20; i++) {
    const spark = scene.add.circle(x + (Math.random() - 0.5) * 40, y + 10, 3 + Math.random() * 4, 0xff4444, 0.9).setDepth(1001);
    scene.tweens.add({ targets: spark, y: y - 60 - Math.random() * 60, x: spark.x + (Math.random() - 0.5) * 20, alpha: 0, duration: 600 + Math.random() * 400, delay: i * 40, onComplete: () => spark.destroy() });
  }
  // Dark red aura on ground
  const groundAura = scene.add.circle(x, y, 50, 0x880000, 0.3).setDepth(998);
  scene.tweens.add({ targets: groundAura, scale: 3, alpha: 0, duration: 1000, onComplete: () => groundAura.destroy() });
  // "BERSERK" text burst
  const txt = scene.add.text(x, y - 50, "BERSERK", { fontSize: "18px", fontStyle: "bold", color: "#ff2222", stroke: "#000", strokeThickness: 3 }).setOrigin(0.5).setDepth(1002);
  scene.tweens.add({ targets: txt, y: y - 80, alpha: 0, scale: { from: 0.5, to: 1.5 }, duration: 800, onComplete: () => txt.destroy() });
}

// ===== ASSASSIN SKILLS =====

function spawnSonicBlowEffect(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.008, 250);
  screenFlash(scene, 0x8855ff, 100);
  // Rapid 14-hit slashes
  for (let i = 0; i < 14; i++) {
    const angle = (Math.random() * 360) * Math.PI / 180;
    const len = 35 + Math.random() * 25;
    const slash = scene.add.graphics().setDepth(1000);
    slash.lineStyle(5, 0xffffff, 0.9);
    slash.lineBetween(x - Math.cos(angle) * len, y - Math.sin(angle) * len, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    slash.lineStyle(3, 0xccccff, 0.8);
    slash.lineBetween(x - Math.cos(angle) * len, y - Math.sin(angle) * len, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    scene.tweens.add({ targets: slash, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 200, delay: i * 30, onComplete: () => slash.destroy() });
  }
  // Purple energy burst
  const aura = scene.add.circle(x, y, 20, 0x8855ff, 0.7).setDepth(999);
  scene.tweens.add({ targets: aura, scale: 5, alpha: 0, duration: 500, onComplete: () => aura.destroy() });
  // White flash per hit
  for (let i = 0; i < 7; i++) {
    scene.time.delayedCall(i * 50, () => {
      const hitFlash = scene.add.circle(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30, 10, 0xffffff, 0.7).setDepth(1002);
      scene.tweens.add({ targets: hitFlash, scale: 2, alpha: 0, duration: 120, onComplete: () => hitFlash.destroy() });
    });
  }
  // Purple sparks
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spark = scene.add.circle(x, y, 2, 0xccaaff, 0.9).setDepth(1001);
    scene.tweens.add({ targets: spark, x: x + Math.cos(angle) * (50 + Math.random() * 40), y: y + Math.sin(angle) * (50 + Math.random() * 40), alpha: 0, duration: 400, onComplete: () => spark.destroy() });
  }
}

function spawnCrossImpactEffect(scene: Phaser.Scene, x: number, y: number, casterX?: number, casterY?: number): void {
  shake(scene, 0.015, 200);
  screenFlash(scene, 0xdd44ff, 120);
  // Dash trail with multiple fading copies
  if (casterX !== undefined && casterY !== undefined) {
    for (let t = 0; t < 5; t++) {
      const frac = t / 5;
      const tx = casterX + (x - casterX) * frac;
      const ty = casterY + (y - casterY) * frac;
      const afterimage = scene.add.circle(tx, ty, 12, 0x8844cc, 0.5 - t * 0.08).setDepth(999);
      scene.tweens.add({ targets: afterimage, scale: 2, alpha: 0, duration: 300, delay: t * 30, onComplete: () => afterimage.destroy() });
    }
    const trail = scene.add.graphics().setDepth(999);
    trail.lineStyle(10, 0x8844cc, 0.5);
    trail.lineBetween(casterX, casterY, x, y);
    trail.lineStyle(4, 0xdd88ff, 0.8);
    trail.lineBetween(casterX, casterY, x, y);
    scene.tweens.add({ targets: trail, alpha: 0, duration: 400, onComplete: () => trail.destroy() });
  }
  // Large X cross slash
  const cross = scene.add.graphics().setDepth(1000);
  cross.lineStyle(8, 0xffffff, 0.9);
  cross.lineBetween(x - 50, y - 50, x + 50, y + 50);
  cross.lineBetween(x + 50, y - 50, x - 50, y + 50);
  cross.lineStyle(4, 0xdd88ff, 0.9);
  cross.lineBetween(x - 50, y - 50, x + 50, y + 50);
  cross.lineBetween(x + 50, y - 50, x - 50, y + 50);
  scene.tweens.add({ targets: cross, alpha: 0, scale: 1.8, duration: 400, onComplete: () => cross.destroy() });
  // Impact explosion
  const burst = scene.add.circle(x, y, 30, 0xdd44ff, 0.7).setDepth(1001);
  scene.tweens.add({ targets: burst, scale: 3.5, alpha: 0, duration: 350, onComplete: () => burst.destroy() });
}

function spawnPoisonBreath(scene: Phaser.Scene, x: number, y: number): void {
  // Toxic cloud expanding
  for (let wave = 0; wave < 3; wave++) {
    const cloud = scene.add.circle(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, 30, 0x33aa33, 0.25).setDepth(999);
    scene.tweens.add({ targets: cloud, scale: 3, alpha: 0, duration: 1000, delay: wave * 150, onComplete: () => cloud.destroy() });
  }
  // 16 poison bubbles
  for (let i = 0; i < 16; i++) {
    const bubble = scene.add.circle(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60, 5 + Math.random() * 8, 0x44cc44, 0.7).setDepth(1000);
    const ring = scene.add.circle(bubble.x, bubble.y, bubble.radius, 0x66ff66, 0).setStrokeStyle(1, 0x66ff66, 0.5).setDepth(1000);
    scene.tweens.add({ targets: [bubble, ring], y: `-=${25 + Math.random() * 40}`, alpha: 0, scale: { from: 0.5, to: 2 }, duration: 700 + Math.random() * 500, delay: i * 50, onComplete: () => { bubble.destroy(); ring.destroy(); } });
  }
  // Green skull icon
  const skull = scene.add.text(x, y - 20, "\u2620", { fontSize: "28px" }).setOrigin(0.5).setDepth(1001);
  scene.tweens.add({ targets: skull, y: y - 55, alpha: 0, scale: { from: 0.5, to: 1.5 }, duration: 800, onComplete: () => skull.destroy() });
}

function spawnCloakEffect(scene: Phaser.Scene, x: number, y: number): void {
  // Smoke cloud vanish effect
  for (let i = 0; i < 12; i++) {
    const puff = scene.add.circle(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30, 10 + Math.random() * 12, 0x666688, 0.5).setDepth(1000);
    scene.tweens.add({ targets: puff, scale: 2.5, alpha: 0, y: puff.y - 15 - Math.random() * 20, duration: 500 + Math.random() * 300, delay: i * 30, onComplete: () => puff.destroy() });
  }
  // Fading afterimage ring
  const ring = scene.add.circle(x, y, 25, 0x444466, 0).setStrokeStyle(3, 0x8888aa, 0.7).setDepth(999);
  scene.tweens.add({ targets: ring, scale: 2.5, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
  // Shadow wisps
  for (let i = 0; i < 6; i++) {
    const wisp = scene.add.circle(x + (Math.random() - 0.5) * 20, y, 4, 0x222244, 0.6).setDepth(1001);
    scene.tweens.add({ targets: wisp, y: wisp.y - 40, x: wisp.x + (Math.random() - 0.5) * 40, alpha: 0, duration: 600, delay: i * 50, onComplete: () => wisp.destroy() });
  }
}

// ===== WIZARD SKILLS =====

function spawnFireBolt(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number): void {
  // Large fiery projectile
  const proj = scene.add.graphics().setDepth(1000);
  proj.fillStyle(0xff4400, 1); proj.fillCircle(0, 0, 14);
  proj.fillStyle(0xffaa00, 0.9); proj.fillCircle(0, 0, 10);
  proj.fillStyle(0xffee44, 0.7); proj.fillCircle(0, 0, 6);
  proj.fillStyle(0xffffff, 0.6); proj.fillCircle(0, 0, 3);
  proj.setPosition(fromX, fromY);
  // Outer glow
  const glow = scene.add.circle(fromX, fromY, 22, 0xff6600, 0.3).setDepth(999);
  const trailInterval = scene.time.addEvent({
    delay: 20, callback: () => {
      const trail = scene.add.circle(proj.x, proj.y, 6 + Math.random() * 4, 0xff6600, 0.7).setDepth(999);
      scene.tweens.add({ targets: trail, scale: 0.1, alpha: 0, duration: 250, onComplete: () => trail.destroy() });
    }, loop: true,
  });
  scene.tweens.add({
    targets: [proj, glow], x: toX, y: toY, duration: 220,
    onComplete: () => {
      trailInterval.destroy(); proj.destroy(); glow.destroy();
      shake(scene, 0.006, 100);
      screenFlash(scene, 0xff4400, 60);
      // Big explosion on impact
      const flash = scene.add.circle(toX, toY, 20, 0xffffff, 0.9).setDepth(1002);
      scene.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
      const impact = scene.add.circle(toX, toY, 20, 0xff4400, 0.8).setDepth(1000);
      scene.tweens.add({ targets: impact, scale: 4, alpha: 0, duration: 350, onComplete: () => impact.destroy() });
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const ember = scene.add.circle(toX, toY, 2 + Math.random() * 3, 0xffaa00, 0.8).setDepth(1001);
        scene.tweens.add({ targets: ember, x: toX + Math.cos(angle) * (30 + Math.random() * 30), y: toY + Math.sin(angle) * (30 + Math.random() * 30), alpha: 0, duration: 300, onComplete: () => ember.destroy() });
      }
    },
  });
}

function spawnStormGust(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.008, 400);
  const radius = 160;
  // Large icy ground circle with pulsing
  const ground = scene.add.circle(x, y, radius, 0x4488ff, 0.25).setDepth(998);
  const groundRing = scene.add.circle(x, y, radius, 0x88ccff, 0).setStrokeStyle(4, 0xaaddff, 0.6).setDepth(998);
  scene.tweens.add({ targets: ground, alpha: 0, duration: 2500, onComplete: () => ground.destroy() });
  scene.tweens.add({ targets: groundRing, scale: 1.2, alpha: 0, duration: 2500, onComplete: () => groundRing.destroy() });
  // 35 ice crystals swirling
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    const crystal = scene.add.graphics().setDepth(1000);
    crystal.fillStyle(0xffffff, 0.9);
    crystal.fillPoints([new Phaser.Geom.Point(0, -8), new Phaser.Geom.Point(5, 0), new Phaser.Geom.Point(0, 8), new Phaser.Geom.Point(-5, 0)], true);
    crystal.fillStyle(0xaaddff, 0.7);
    crystal.fillPoints([new Phaser.Geom.Point(0, -5), new Phaser.Geom.Point(3, 0), new Phaser.Geom.Point(0, 5), new Phaser.Geom.Point(-3, 0)], true);
    crystal.setPosition(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    scene.tweens.add({ targets: crystal, x: x + Math.cos(angle + 3) * radius * 0.9, y: y + Math.sin(angle + 3) * radius * 0.9, rotation: Math.PI * 6, alpha: 0, duration: 1800 + Math.random() * 700, delay: i * 50, onComplete: () => crystal.destroy() });
  }
  // Ice pillars erupting
  for (let i = 0; i < 8; i++) {
    scene.time.delayedCall(i * 150, () => {
      const px = x + (Math.random() - 0.5) * radius * 1.5;
      const py = y + (Math.random() - 0.5) * radius * 1.5;
      const pillar = scene.add.graphics().setDepth(1001);
      pillar.fillStyle(0xaaddff, 0.8);
      pillar.fillRect(-4, -20, 8, 40);
      pillar.fillStyle(0xffffff, 0.5);
      pillar.fillRect(-2, -18, 4, 36);
      pillar.setPosition(px, py);
      pillar.setScale(1, 0);
      scene.tweens.add({ targets: pillar, scaleY: 1, duration: 150, onComplete: () => {
        scene.tweens.add({ targets: pillar, alpha: 0, scaleY: 0, duration: 300, delay: 200, onComplete: () => pillar.destroy() });
      }});
    });
  }
  // Snowflake text particles
  for (let i = 0; i < 6; i++) {
    scene.time.delayedCall(i * 200, () => {
      const sf = scene.add.text(x + (Math.random() - 0.5) * radius, y + (Math.random() - 0.5) * radius, "\u2744", { fontSize: "18px", color: "#aaddff" }).setOrigin(0.5).setDepth(1001);
      scene.tweens.add({ targets: sf, y: sf.y - 30, rotation: Math.PI * 2, alpha: 0, duration: 800, onComplete: () => sf.destroy() });
    });
  }
}

function spawnJupitelThunder(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number): void {
  const ball = scene.add.circle(fromX, fromY, 16, 0xffff44, 0.9).setDepth(1000);
  const glow = scene.add.circle(fromX, fromY, 28, 0xffff88, 0.4).setDepth(999);
  const outerGlow = scene.add.circle(fromX, fromY, 40, 0xffff44, 0.15).setDepth(998);
  const lightning = scene.add.graphics().setDepth(999);
  scene.tweens.add({
    targets: [ball, glow, outerGlow], x: toX, y: toY, duration: 180,
    onUpdate: () => {
      lightning.clear();
      // Triple lightning bolt
      for (let b = 0; b < 3; b++) {
        lightning.lineStyle(4 - b, b === 0 ? 0xffff44 : 0xffffff, 0.7 - b * 0.1);
        let px = fromX, py = fromY;
        const dx = ball.x - fromX, dy = ball.y - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(4, Math.floor(dist / 15));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const nx = fromX + dx * t + (Math.random() - 0.5) * 20;
          const ny = fromY + dy * t + (Math.random() - 0.5) * 20;
          lightning.lineBetween(px, py, nx, ny); px = nx; py = ny;
        }
      }
    },
    onComplete: () => {
      ball.destroy(); glow.destroy(); outerGlow.destroy(); lightning.destroy();
      shake(scene, 0.008, 150);
      screenFlash(scene, 0xffff44, 80);
      // Large thunder explosion
      const flash = scene.add.circle(toX, toY, 25, 0xffffff, 0.9).setDepth(1002);
      scene.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
      const impact = scene.add.circle(toX, toY, 20, 0xffff44, 0.8).setDepth(1000);
      scene.tweens.add({ targets: impact, scale: 4, alpha: 0, duration: 350, onComplete: () => impact.destroy() });
      // Electric sparks radiating
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const sparkLine = scene.add.graphics().setDepth(1001);
        sparkLine.lineStyle(2, 0xffff88, 0.8);
        let sx = toX, sy = toY;
        for (let s = 0; s < 3; s++) {
          const nx = sx + Math.cos(a) * 15 + (Math.random() - 0.5) * 10;
          const ny = sy + Math.sin(a) * 15 + (Math.random() - 0.5) * 10;
          sparkLine.lineBetween(sx, sy, nx, ny); sx = nx; sy = ny;
        }
        scene.tweens.add({ targets: sparkLine, alpha: 0, duration: 300, onComplete: () => sparkLine.destroy() });
      }
    },
  });
}

function spawnMeteorStorm(scene: Phaser.Scene, x: number, y: number): void {
  // Pulsing warning zone
  const warning = scene.add.circle(x, y, 200, 0xff2200, 0.1).setStrokeStyle(3, 0xff4400, 0.6).setDepth(998);
  scene.tweens.add({ targets: warning, alpha: { from: 0.1, to: 0.25 }, duration: 500, yoyo: true, repeat: 2, onComplete: () => warning.destroy() });
  // Warning cross pattern
  const crossWarn = scene.add.graphics().setDepth(998);
  crossWarn.lineStyle(2, 0xff4400, 0.3);
  crossWarn.lineBetween(x - 200, y, x + 200, y);
  crossWarn.lineBetween(x, y - 200, x, y + 200);
  scene.tweens.add({ targets: crossWarn, alpha: 0, duration: 1500, onComplete: () => crossWarn.destroy() });
  scene.time.delayedCall(1500, () => {
    shake(scene, 0.02, 500);
    screenFlash(scene, 0xff4400, 200);
    // 10 massive meteors
    for (let i = 0; i < 10; i++) {
      const mx = x + (Math.random() - 0.5) * 350;
      const my = y + (Math.random() - 0.5) * 350;
      const meteor = scene.add.graphics().setDepth(1001);
      meteor.fillStyle(0xff2200, 0.9); meteor.fillCircle(0, 0, 16);
      meteor.fillStyle(0xff6600, 0.8); meteor.fillCircle(0, -4, 12);
      meteor.fillStyle(0xffaa00, 0.7); meteor.fillCircle(0, -7, 8);
      meteor.fillStyle(0xffee44, 0.5); meteor.fillCircle(0, -9, 5);
      meteor.fillStyle(0xffffff, 0.4); meteor.fillCircle(0, -9, 2);
      meteor.setPosition(mx, my - 400);
      // Fire trail as meteor falls
      const trailTimer = scene.time.addEvent({
        delay: 25, callback: () => {
          const t = scene.add.circle(meteor.x, meteor.y, 5 + Math.random() * 4, 0xff6600, 0.6).setDepth(1000);
          scene.tweens.add({ targets: t, scale: 0.1, alpha: 0, duration: 200, onComplete: () => t.destroy() });
        }, loop: true,
      });
      scene.tweens.add({
        targets: meteor, y: my, duration: 280, delay: i * 80,
        onComplete: () => {
          trailTimer.destroy(); meteor.destroy();
          shake(scene, 0.006, 80);
          // Crater explosion
          const coreFlash = scene.add.circle(mx, my, 15, 0xffffff, 0.9).setDepth(1002);
          scene.tweens.add({ targets: coreFlash, scale: 3, alpha: 0, duration: 150, onComplete: () => coreFlash.destroy() });
          const crater = scene.add.circle(mx, my, 12, 0xff2200, 0.7).setDepth(1000);
          scene.tweens.add({ targets: crater, scale: 5, alpha: 0, duration: 500, onComplete: () => crater.destroy() });
          // Debris
          for (let d = 0; d < 6; d++) {
            const angle = Math.random() * Math.PI * 2;
            const debris = scene.add.circle(mx, my, 2 + Math.random() * 3, 0xff8800, 0.8).setDepth(1001);
            scene.tweens.add({ targets: debris, x: mx + Math.cos(angle) * (20 + Math.random() * 30), y: my + Math.sin(angle) * (20 + Math.random() * 30), alpha: 0, duration: 350, onComplete: () => debris.destroy() });
          }
        },
      });
    }
  });
}

// ===== PRIEST SKILLS =====

function spawnHealEffect(scene: Phaser.Scene, x: number, y: number): void {
  // Bright green column of light
  const column = scene.add.graphics().setDepth(999);
  column.fillStyle(0x44ff66, 0.15);
  column.fillRect(x - 20, y - 80, 40, 100);
  column.fillStyle(0x88ffaa, 0.1);
  column.fillRect(x - 30, y - 80, 60, 100);
  scene.tweens.add({ targets: column, alpha: 0, duration: 800, onComplete: () => column.destroy() });
  // 14 rising green crosses
  for (let i = 0; i < 14; i++) {
    const cross = scene.add.graphics().setDepth(1000);
    cross.fillStyle(0x44ff66, 0.9);
    cross.fillRect(-3, -8, 6, 16); cross.fillRect(-8, -3, 16, 6);
    cross.fillStyle(0xffffff, 0.5);
    cross.fillRect(-1, -6, 2, 12); cross.fillRect(-6, -1, 12, 2);
    cross.setPosition(x + (Math.random() - 0.5) * 40, y + 10);
    scene.tweens.add({ targets: cross, y: y - 60 - Math.random() * 40, alpha: 0, scale: { from: 0.3, to: 1.5 }, rotation: Math.random() * 0.5, duration: 800 + Math.random() * 400, delay: i * 60, onComplete: () => cross.destroy() });
  }
  // Bright green ground glow
  const glow = scene.add.circle(x, y, 35, 0x44ff66, 0.5).setDepth(999);
  scene.tweens.add({ targets: glow, scale: 2.5, alpha: 0, duration: 700, onComplete: () => glow.destroy() });
  // Sparkle ring
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const sparkle = scene.add.circle(x + Math.cos(angle) * 25, y + Math.sin(angle) * 25, 3, 0xaaffcc, 0.8).setDepth(1001);
    scene.tweens.add({ targets: sparkle, y: sparkle.y - 40, alpha: 0, scale: { from: 1, to: 0.2 }, duration: 600, delay: i * 50, onComplete: () => sparkle.destroy() });
  }
}

function spawnHolyLight(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number): void {
  // Multi-layered holy beam
  const beam = scene.add.graphics().setDepth(1000);
  beam.lineStyle(14, 0xffffcc, 0.3); beam.lineBetween(fromX, fromY, toX, toY);
  beam.lineStyle(8, 0xffffcc, 0.6); beam.lineBetween(fromX, fromY, toX, toY);
  beam.lineStyle(4, 0xffffff, 0.9); beam.lineBetween(fromX, fromY, toX, toY);
  scene.tweens.add({ targets: beam, alpha: 0, duration: 400, onComplete: () => beam.destroy() });
  // Light particles along beam
  const dx = toX - fromX, dy = toY - fromY;
  for (let i = 0; i < 6; i++) {
    const t = Math.random();
    const px = fromX + dx * t + (Math.random() - 0.5) * 10;
    const py = fromY + dy * t + (Math.random() - 0.5) * 10;
    const p = scene.add.circle(px, py, 3, 0xffffdd, 0.8).setDepth(1001);
    scene.tweens.add({ targets: p, y: py - 20, alpha: 0, duration: 400, delay: i * 30, onComplete: () => p.destroy() });
  }
  // Impact burst
  shake(scene, 0.004, 80);
  const flash = scene.add.circle(toX, toY, 20, 0xffffff, 0.9).setDepth(1002);
  scene.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
  const sparkle = scene.add.circle(toX, toY, 18, 0xffffdd, 0.8).setDepth(1001);
  scene.tweens.add({ targets: sparkle, scale: 4, alpha: 0, duration: 400, onComplete: () => sparkle.destroy() });
}

function spawnKyrieEleison(scene: Phaser.Scene, x: number, y: number): void {
  // Brilliant blue shield dome
  const dome = scene.add.circle(x, y, 40, 0x4488ff, 0.2).setDepth(999);
  scene.tweens.add({ targets: dome, alpha: 0, duration: 1500, onComplete: () => dome.destroy() });
  // Double rotating rings
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + r * (Math.PI / 8);
      const radius = 35 + r * 15;
      const orb = scene.add.circle(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 5, 0x66aaff, 0.8).setDepth(1000);
      // Orb glow
      const orbGlow = scene.add.circle(orb.x, orb.y, 10, 0x88ccff, 0.2).setDepth(999);
      const endAngle = angle + Math.PI * 2 * (r === 0 ? 1 : -1);
      scene.tweens.add({ targets: [orb, orbGlow],
        x: x + Math.cos(endAngle) * radius, y: y + Math.sin(endAngle) * radius,
        alpha: 0, duration: 1500, delay: i * 40,
        onComplete: () => { orb.destroy(); orbGlow.destroy(); }
      });
    }
  }
  // Expanding shield rings
  for (let wave = 0; wave < 3; wave++) {
    const ring = scene.add.circle(x, y, 30, 0x4488ff, 0).setStrokeStyle(4, 0x88bbff, 0.8).setDepth(1000);
    scene.tweens.add({ targets: ring, scale: 2 + wave * 0.5, alpha: 0, duration: 800, delay: wave * 150, onComplete: () => ring.destroy() });
  }
  // Shield sparkles
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spark = scene.add.circle(x + Math.cos(angle) * 35, y + Math.sin(angle) * 35, 2, 0xffffff, 0.9).setDepth(1001);
    scene.tweens.add({ targets: spark, y: spark.y - 20, alpha: 0, duration: 500, delay: i * 80, onComplete: () => spark.destroy() });
  }
}

function spawnMagnusExorcismus(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.006, 300);
  screenFlash(scene, 0xffee66, 100);
  const radius = 190;
  // Pulsing golden zone
  const zone = scene.add.circle(x, y, radius, 0xffee66, 0.15).setStrokeStyle(3, 0xffdd44, 0.5).setDepth(998);
  scene.tweens.add({ targets: zone, alpha: { from: 0.15, to: 0.03 }, duration: 5000, onComplete: () => zone.destroy() });
  // Giant cross pattern
  const cross = scene.add.graphics().setDepth(999);
  cross.fillStyle(0xffdd44, 0.4);
  cross.fillRect(x - 15, y - radius * 0.8, 30, radius * 1.6);
  cross.fillRect(x - radius * 0.8, y - 15, radius * 1.6, 30);
  cross.fillStyle(0xffffff, 0.15);
  cross.fillRect(x - 5, y - radius * 0.7, 10, radius * 1.4);
  cross.fillRect(x - radius * 0.7, y - 5, radius * 1.4, 10);
  scene.tweens.add({ targets: cross, alpha: 0, duration: 5000, onComplete: () => cross.destroy() });
  // Holy light pillars bursting up
  for (let i = 0; i < 25; i++) {
    scene.time.delayedCall(i * 180, () => {
      const sx = x + (Math.random() - 0.5) * radius * 1.5;
      const sy = y + (Math.random() - 0.5) * radius * 1.5;
      // Light pillar
      const pillar = scene.add.graphics().setDepth(1000);
      pillar.fillStyle(0xffee66, 0.5);
      pillar.fillRect(sx - 3, sy - 30, 6, 30);
      pillar.fillStyle(0xffffff, 0.3);
      pillar.fillRect(sx - 1, sy - 28, 2, 26);
      scene.tweens.add({ targets: pillar, y: pillar.y - 20, alpha: 0, duration: 500, onComplete: () => pillar.destroy() });
      // Sparkle
      const spark = scene.add.circle(sx, sy, 4, 0xffffaa, 0.9).setDepth(1001);
      scene.tweens.add({ targets: spark, y: spark.y - 25, alpha: 0, scale: 0.2, duration: 500, onComplete: () => spark.destroy() });
    });
  }
  // Concentric holy rings
  for (let w = 0; w < 3; w++) {
    scene.time.delayedCall(w * 500, () => {
      const ring = scene.add.circle(x, y, 30, 0xffee66, 0).setStrokeStyle(3, 0xffdd44, 0.6).setDepth(999);
      scene.tweens.add({ targets: ring, scale: radius / 30, alpha: 0, duration: 1000, onComplete: () => ring.destroy() });
    });
  }
}

// ===== CRUSADER SKILLS =====

function spawnHolyCross(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.006, 120);
  screenFlash(scene, 0xffdd44, 80);
  // Large golden cross with white core
  const cross = scene.add.graphics().setDepth(1000);
  cross.lineStyle(10, 0xffdd44, 0.8);
  cross.lineBetween(x, y - 55, x, y + 55);
  cross.lineBetween(x - 45, y, x + 45, y);
  cross.lineStyle(4, 0xffffff, 0.9);
  cross.lineBetween(x, y - 50, x, y + 50);
  cross.lineBetween(x - 40, y, x + 40, y);
  scene.tweens.add({ targets: cross, alpha: 0, scale: 1.8, duration: 450, onComplete: () => cross.destroy() });
  // Holy burst
  const flash = scene.add.circle(x, y, 25, 0xffffff, 0.9).setDepth(1002);
  scene.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
  const burst = scene.add.circle(x, y, 30, 0xffee66, 0.6).setDepth(1000);
  scene.tweens.add({ targets: burst, scale: 3.5, alpha: 0, duration: 400, onComplete: () => burst.destroy() });
  // Golden sparks at cross ends
  const ends = [[x, y - 55], [x, y + 55], [x - 45, y], [x + 45, y]];
  for (const [ex, ey] of ends) {
    for (let i = 0; i < 3; i++) {
      const s = scene.add.circle(ex, ey, 3, 0xffffaa, 0.8).setDepth(1001);
      scene.tweens.add({ targets: s, x: ex + (Math.random() - 0.5) * 30, y: ey + (Math.random() - 0.5) * 30, alpha: 0, duration: 300, delay: i * 40, onComplete: () => s.destroy() });
    }
  }
}

function spawnGrandCross(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.015, 300);
  screenFlash(scene, 0xffee66, 150);
  // Massive golden cross with white-hot center
  const cross = scene.add.graphics().setDepth(1000);
  cross.fillStyle(0xffdd44, 0.5);
  cross.fillRect(x - 18, y - 170, 36, 340);
  cross.fillRect(x - 140, y - 18, 280, 36);
  cross.fillStyle(0xffffff, 0.3);
  cross.fillRect(x - 8, y - 160, 16, 320);
  cross.fillRect(x - 130, y - 8, 260, 16);
  scene.tweens.add({ targets: cross, alpha: 0, scale: 1.4, duration: 700, onComplete: () => cross.destroy() });
  // Center explosion
  const coreFlash = scene.add.circle(x, y, 40, 0xffffff, 1).setDepth(1002);
  scene.tweens.add({ targets: coreFlash, scale: 3, alpha: 0, duration: 250, onComplete: () => coreFlash.destroy() });
  // Expanding rings
  for (let wave = 0; wave < 4; wave++) {
    const ring = scene.add.circle(x, y, 30, 0xffee66, 0).setStrokeStyle(4, 0xffdd44, 0.7).setDepth(1000);
    scene.tweens.add({ targets: ring, scale: 4 + wave * 1.5, alpha: 0, duration: 600, delay: wave * 100, onComplete: () => ring.destroy() });
  }
  // 20 holy sparks radiating
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const spark = scene.add.circle(x + Math.cos(angle) * 40, y + Math.sin(angle) * 40, 5, 0xffffaa, 0.9).setDepth(1001);
    scene.tweens.add({ targets: spark, x: x + Math.cos(angle) * 170, y: y + Math.sin(angle) * 170, alpha: 0, scale: 0.3, duration: 600, delay: i * 20, onComplete: () => spark.destroy() });
  }
  const burst = scene.add.circle(x, y, 50, 0xffee66, 0.6).setDepth(999);
  scene.tweens.add({ targets: burst, scale: 4, alpha: 0, duration: 700, onComplete: () => burst.destroy() });
}

function spawnDevotionEffect(scene: Phaser.Scene, x: number, y: number): void {
  // Blue devotion beam from sky
  const beam = scene.add.graphics().setDepth(999);
  beam.fillStyle(0x4488ff, 0.2);
  beam.fillRect(x - 15, y - 120, 30, 140);
  beam.fillStyle(0x88ccff, 0.15);
  beam.fillRect(x - 25, y - 120, 50, 140);
  scene.tweens.add({ targets: beam, alpha: 0, duration: 1000, onComplete: () => beam.destroy() });
  // Shield rings
  for (let wave = 0; wave < 3; wave++) {
    const shield = scene.add.circle(x, y, 25, 0x4488ff, 0).setStrokeStyle(4, 0x66aaff, 0.8).setDepth(1000);
    scene.tweens.add({ targets: shield, scale: 2 + wave * 0.5, alpha: 0, duration: 800, delay: wave * 120, onComplete: () => shield.destroy() });
  }
  // Blue particles rising
  for (let i = 0; i < 12; i++) {
    const light = scene.add.circle(x + (Math.random() - 0.5) * 30, y + 10, 4, 0x88ccff, 0.8).setDepth(1001);
    scene.tweens.add({ targets: light, y: y - 50 - Math.random() * 30, alpha: 0, duration: 700, delay: i * 60, onComplete: () => light.destroy() });
  }
}

function spawnShieldBoomerang(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number): void {
  // Large spinning shield with energy trail
  const shield = scene.add.graphics().setDepth(1000);
  shield.fillStyle(0x3b82f6, 0.9); shield.fillCircle(0, 0, 16);
  shield.fillStyle(0x60a5fa, 0.8); shield.fillCircle(0, 0, 11);
  shield.fillStyle(0xffffff, 0.5); shield.fillCircle(0, 0, 5);
  shield.setPosition(fromX, fromY);
  const shieldGlow = scene.add.circle(fromX, fromY, 25, 0x3b82f6, 0.3).setDepth(999);
  const trailTimer = scene.time.addEvent({
    delay: 25, callback: () => {
      const t = scene.add.circle(shield.x, shield.y, 6, 0x60a5fa, 0.5).setDepth(999);
      scene.tweens.add({ targets: t, scale: 0.1, alpha: 0, duration: 200, onComplete: () => t.destroy() });
    }, loop: true,
  });
  scene.tweens.add({
    targets: [shield, shieldGlow], x: toX, y: toY, duration: 300,
    onUpdate: () => { shield.rotation += 0.3; },
    onComplete: () => {
      shake(scene, 0.005, 80);
      const impact = scene.add.circle(toX, toY, 18, 0x3b82f6, 0.8).setDepth(1000);
      scene.tweens.add({ targets: impact, scale: 3, alpha: 0, duration: 300, onComplete: () => impact.destroy() });
      const flash = scene.add.circle(toX, toY, 12, 0xffffff, 0.7).setDepth(1001);
      scene.tweens.add({ targets: flash, scale: 2.5, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
      // Return
      scene.tweens.add({
        targets: [shield, shieldGlow], x: fromX, y: fromY, duration: 300,
        onUpdate: () => { shield.rotation += 0.3; },
        onComplete: () => { trailTimer.destroy(); shield.destroy(); shieldGlow.destroy(); },
      });
    },
  });
}

// ===== ROGUE SKILLS =====

function spawnBackstab(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.008, 120);
  screenFlash(scene, 0xff6600, 60);
  // 4 rapid diagonal slashes
  for (let i = 0; i < 4; i++) {
    const slash = scene.add.graphics().setDepth(1000);
    const angle = -75 + i * 50;
    const rad = (angle * Math.PI) / 180;
    const len = 45;
    slash.lineStyle(6, 0xffffff, 0.9);
    slash.lineBetween(x - Math.cos(rad) * len, y - Math.sin(rad) * len, x + Math.cos(rad) * len, y + Math.sin(rad) * len);
    slash.lineStyle(3, 0xff8844, 0.8);
    slash.lineBetween(x - Math.cos(rad) * len, y - Math.sin(rad) * len, x + Math.cos(rad) * len, y + Math.sin(rad) * len);
    scene.tweens.add({ targets: slash, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 250, delay: i * 50, onComplete: () => slash.destroy() });
  }
  // Blood splatter
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const drop = scene.add.circle(x, y, 2 + Math.random() * 3, 0xff4422, 0.8).setDepth(1001);
    scene.tweens.add({ targets: drop, x: x + Math.cos(angle) * (20 + Math.random() * 30), y: y + Math.sin(angle) * (20 + Math.random() * 30), alpha: 0, duration: 350, onComplete: () => drop.destroy() });
  }
  const flash = scene.add.circle(x, y, 20, 0xff6600, 0.7).setDepth(999);
  scene.tweens.add({ targets: flash, scale: 2.5, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
}

function spawnStripArmor(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.005, 100);
  // Armor-shattering cracks radiating outward
  const crack = scene.add.graphics().setDepth(1000);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
    const len = 25 + Math.random() * 25;
    crack.lineStyle(4, 0xffffff, 0.8);
    crack.lineBetween(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    crack.lineStyle(2, 0xccaa44, 0.9);
    crack.lineBetween(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
  }
  scene.tweens.add({ targets: crack, alpha: 0, scale: 1.3, duration: 500, onComplete: () => crack.destroy() });
  // Large debris flying out
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const debris = scene.add.rectangle(x, y, 5 + Math.random() * 4, 5 + Math.random() * 4, 0x888866, 0.9).setDepth(1001);
    debris.setRotation(Math.random() * Math.PI);
    scene.tweens.add({ targets: debris, y: y + 25 + Math.random() * 25, x: x + Math.cos(angle) * (25 + Math.random() * 30), rotation: debris.rotation + Math.PI * 2, alpha: 0, duration: 500 + Math.random() * 300, onComplete: () => debris.destroy() });
  }
  // Shatter flash
  const flash = scene.add.circle(x, y, 20, 0xddbb44, 0.6).setDepth(999);
  scene.tweens.add({ targets: flash, scale: 2.5, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
}

function spawnIntimidate(scene: Phaser.Scene, x: number, y: number, casterX?: number, casterY?: number): void {
  shake(scene, 0.006, 100);
  // Dash trail with afterimages
  if (casterX !== undefined && casterY !== undefined) {
    for (let t = 0; t < 4; t++) {
      const frac = t / 4;
      const tx = casterX + (x - casterX) * frac;
      const ty = casterY + (y - casterY) * frac;
      const img = scene.add.circle(tx, ty, 10, 0xff6644, 0.4 - t * 0.08).setDepth(999);
      scene.tweens.add({ targets: img, scale: 1.5, alpha: 0, duration: 250, delay: t * 25, onComplete: () => img.destroy() });
    }
    const trail = scene.add.graphics().setDepth(999);
    trail.lineStyle(8, 0xff6644, 0.4);
    trail.lineBetween(casterX, casterY, x, y);
    trail.lineStyle(3, 0xff4444, 0.7);
    trail.lineBetween(casterX, casterY, x, y);
    scene.tweens.add({ targets: trail, alpha: 0, duration: 300, onComplete: () => trail.destroy() });
  }
  // Big diagonal slash
  const slash = scene.add.graphics().setDepth(1000);
  slash.lineStyle(8, 0xffffff, 0.8);
  slash.lineBetween(x - 40, y - 40, x + 40, y + 40);
  slash.lineStyle(4, 0xff4444, 0.9);
  slash.lineBetween(x - 40, y - 40, x + 40, y + 40);
  scene.tweens.add({ targets: slash, alpha: 0, scale: 1.6, duration: 350, onComplete: () => slash.destroy() });
  const flash = scene.add.circle(x, y, 18, 0xff4444, 0.7).setDepth(1001);
  scene.tweens.add({ targets: flash, scale: 2.5, alpha: 0, duration: 250, onComplete: () => flash.destroy() });
}

function spawnCloseConfine(scene: Phaser.Scene, x: number, y: number): void {
  // Multiple chain rings closing in
  for (let wave = 0; wave < 4; wave++) {
    const ring = scene.add.circle(x, y, 50, 0xccaa44, 0).setStrokeStyle(4, 0xddbb55, 0.8).setDepth(1000);
    scene.tweens.add({ targets: ring, scale: { from: 2, to: 0.2 }, alpha: 0, duration: 600, delay: wave * 120, onComplete: () => ring.destroy() });
  }
  // 8 chain links converging
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const chain = scene.add.rectangle(x + Math.cos(angle) * 50, y + Math.sin(angle) * 50, 8, 8, 0xccaa44, 0.9).setDepth(1001);
    chain.setRotation(angle);
    scene.tweens.add({ targets: chain, x: x, y: y, rotation: angle + Math.PI * 2, alpha: 0, duration: 500, delay: i * 30, onComplete: () => chain.destroy() });
  }
  // Lock/trap flash at center
  const lock = scene.add.circle(x, y, 15, 0xddbb55, 0.7).setDepth(1002);
  scene.tweens.add({ targets: lock, scale: 0.3, alpha: 0, duration: 400, delay: 300, onComplete: () => lock.destroy() });
}

// ===== SAGE SKILLS =====

function spawnFireWall(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.004, 200);
  // Larger blazing zone
  const zone = scene.add.circle(x, y, 110, 0xff4400, 0.15).setStrokeStyle(3, 0xff6600, 0.6).setDepth(998);
  scene.tweens.add({ targets: zone, alpha: { from: 0.15, to: 0.02 }, duration: 4000, onComplete: () => zone.destroy() });
  // Intense flame pillars
  for (let i = 0; i < 18; i++) {
    scene.time.delayedCall(i * 200, () => {
      const fx = x + (Math.random() - 0.5) * 180;
      const fy = y + (Math.random() - 0.5) * 180;
      const flame = scene.add.graphics().setDepth(1000);
      flame.fillStyle(0xff2200, 0.9); flame.fillCircle(0, 0, 10);
      flame.fillStyle(0xff6600, 0.8); flame.fillCircle(0, -4, 7);
      flame.fillStyle(0xffaa00, 0.6); flame.fillCircle(0, -7, 5);
      flame.fillStyle(0xffee44, 0.4); flame.fillCircle(0, -9, 3);
      flame.setPosition(fx, fy);
      scene.tweens.add({ targets: flame, y: fy - 40, alpha: 0, scale: 1.5, duration: 500, onComplete: () => flame.destroy() });
    });
  }
  // Initial burst
  const burst = scene.add.circle(x, y, 30, 0xff4400, 0.5).setDepth(999);
  scene.tweens.add({ targets: burst, scale: 3.5, alpha: 0, duration: 400, onComplete: () => burst.destroy() });
}

function spawnDispell(scene: Phaser.Scene, x: number, y: number): void {
  // Magic shatter effect
  screenFlash(scene, 0xaa88ff, 80);
  // Expanding dispel rings
  for (let wave = 0; wave < 3; wave++) {
    const ring = scene.add.circle(x, y, 20, 0xaa88ff, 0).setStrokeStyle(4, 0xccaaff, 0.8).setDepth(1000);
    scene.tweens.add({ targets: ring, scale: 3 + wave, alpha: 0, duration: 500, delay: wave * 100, onComplete: () => ring.destroy() });
  }
  // 16 sparks spiraling outward
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const spark = scene.add.circle(x, y, 4, 0xddbbff, 0.9).setDepth(1001);
    scene.tweens.add({ targets: spark, x: x + Math.cos(angle) * 60, y: y + Math.sin(angle) * 60, alpha: 0, scale: 0.2, duration: 500, delay: i * 20, onComplete: () => spark.destroy() });
  }
  // Magic rune fragments
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const frag = scene.add.rectangle(x, y, 6, 3, 0xccaaff, 0.7).setDepth(1001);
    frag.setRotation(Math.random() * Math.PI);
    scene.tweens.add({ targets: frag, x: x + Math.cos(angle) * 40, y: y + Math.sin(angle) * 40 - 15, rotation: frag.rotation + Math.PI * 3, alpha: 0, duration: 500, onComplete: () => frag.destroy() });
  }
}

function spawnVolcanoBuff(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.005, 150);
  // Volcanic ground eruption
  const glow = scene.add.circle(x, y, 35, 0xff4400, 0.4).setDepth(999);
  scene.tweens.add({ targets: glow, scale: 2.5, alpha: 0, duration: 700, onComplete: () => glow.destroy() });
  // Fire column
  for (let i = 0; i < 15; i++) {
    const spark = scene.add.circle(x + (Math.random() - 0.5) * 35, y + 10, 5 + Math.random() * 4, 0xff6600, 0.9).setDepth(1001);
    scene.tweens.add({ targets: spark, y: y - 50 - Math.random() * 40, alpha: 0, scale: { from: 1, to: 0.2 }, duration: 600, delay: i * 40, onComplete: () => spark.destroy() });
  }
  // Expanding fire ring
  const ring = scene.add.circle(x, y, 20, 0xff4400, 0).setStrokeStyle(3, 0xff6600, 0.7).setDepth(1000);
  scene.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
  // Lava bubbles
  for (let i = 0; i < 6; i++) {
    const bub = scene.add.circle(x + (Math.random() - 0.5) * 25, y + 5, 3 + Math.random() * 4, 0xffaa00, 0.7).setDepth(1001);
    scene.tweens.add({ targets: bub, y: bub.y - 20, scale: 1.5, alpha: 0, duration: 400, delay: 100 + i * 50, onComplete: () => bub.destroy() });
  }
}

function spawnEarthSpike(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.008, 150);
  // 10 dramatic earth spikes
  for (let i = 0; i < 10; i++) {
    const spike = scene.add.graphics().setDepth(1000);
    spike.fillStyle(0x8B6914, 0.9);
    const h = 30 + Math.random() * 25;
    spike.fillPoints([new Phaser.Geom.Point(-6, 0), new Phaser.Geom.Point(0, -h), new Phaser.Geom.Point(6, 0)], true);
    spike.fillStyle(0xAA8833, 0.5);
    spike.fillPoints([new Phaser.Geom.Point(-2, 0), new Phaser.Geom.Point(0, -h + 5), new Phaser.Geom.Point(2, 0)], true);
    spike.setPosition(x + (Math.random() - 0.5) * 60, y + 5);
    spike.setScale(0, 0);
    scene.tweens.add({
      targets: spike, scaleX: 1, scaleY: 1, duration: 150, delay: i * 40, ease: "Back.easeOut",
      onComplete: () => {
        scene.tweens.add({ targets: spike, alpha: 0, scaleY: 0.5, duration: 300, delay: 300, onComplete: () => spike.destroy() });
      },
    });
  }
  // Dust cloud
  const dust = scene.add.circle(x, y, 40, 0xAA8844, 0.4).setDepth(999);
  scene.tweens.add({ targets: dust, scale: 2.5, alpha: 0, duration: 500, onComplete: () => dust.destroy() });
  // Rocks flying out
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rock = scene.add.circle(x, y, 3 + Math.random() * 3, 0x886633, 0.8).setDepth(1001);
    scene.tweens.add({ targets: rock, x: x + Math.cos(angle) * (30 + Math.random() * 30), y: y + Math.sin(angle) * (30 + Math.random() * 30) - 10, alpha: 0, duration: 400, onComplete: () => rock.destroy() });
  }
}

// ===== MONK SKILLS =====

function spawnOccultImpaction(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.008, 120);
  screenFlash(scene, 0x44aaff, 80);
  // Large spirit energy palm
  const palm = scene.add.graphics().setDepth(1000);
  palm.fillStyle(0x44aaff, 0.8); palm.fillCircle(0, 0, 25);
  palm.fillStyle(0x88ccff, 0.6); palm.fillCircle(0, 0, 18);
  palm.fillStyle(0xffffff, 0.4); palm.fillCircle(0, 0, 8);
  palm.setPosition(x, y);
  scene.tweens.add({ targets: palm, scale: 3, alpha: 0, duration: 350, onComplete: () => palm.destroy() });
  // Multiple spirit rings
  for (let wave = 0; wave < 3; wave++) {
    const ring = scene.add.circle(x, y, 20, 0x44aaff, 0).setStrokeStyle(4, 0x66ccff, 0.8).setDepth(1000);
    scene.tweens.add({ targets: ring, scale: 4 + wave, alpha: 0, duration: 450, delay: wave * 80, onComplete: () => ring.destroy() });
  }
  // Spirit sparks
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spark = scene.add.circle(x, y, 3, 0x88ddff, 0.9).setDepth(1001);
    scene.tweens.add({ targets: spark, x: x + Math.cos(angle) * (30 + Math.random() * 30), y: y + Math.sin(angle) * (30 + Math.random() * 30), alpha: 0, duration: 350, onComplete: () => spark.destroy() });
  }
}

function spawnInvestigate(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.006, 100);
  // Concentrated golden fist impact
  const fist = scene.add.circle(x, y, 18, 0xffdd44, 0.9).setDepth(1000);
  scene.tweens.add({ targets: fist, scale: 3, alpha: 0, duration: 300, onComplete: () => fist.destroy() });
  const coreFlash = scene.add.circle(x, y, 12, 0xffffff, 0.8).setDepth(1002);
  scene.tweens.add({ targets: coreFlash, scale: 2, alpha: 0, duration: 150, onComplete: () => coreFlash.destroy() });
  // 8 radiating energy lines
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const line = scene.add.graphics().setDepth(1000);
    line.lineStyle(4, 0xffffff, 0.8);
    line.lineBetween(x, y, x + Math.cos(angle) * 40, y + Math.sin(angle) * 40);
    line.lineStyle(2, 0xffcc22, 0.9);
    line.lineBetween(x, y, x + Math.cos(angle) * 40, y + Math.sin(angle) * 40);
    scene.tweens.add({ targets: line, alpha: 0, scale: 1.3, duration: 350, delay: 30, onComplete: () => line.destroy() });
  }
}

function spawnZen(scene: Phaser.Scene, x: number, y: number): void {
  // Meditation aura with blue energy column
  const column = scene.add.graphics().setDepth(999);
  column.fillStyle(0x44bbff, 0.1);
  column.fillRect(x - 20, y - 70, 40, 90);
  scene.tweens.add({ targets: column, alpha: 0, duration: 1200, onComplete: () => column.destroy() });
  // 5 concentric rings
  for (let wave = 0; wave < 5; wave++) {
    const ring = scene.add.circle(x, y, 15, 0x44bbff, 0).setStrokeStyle(3, 0x66ddff, 0.7).setDepth(1000);
    scene.tweens.add({ targets: ring, scale: { from: 0.5, to: 3 + wave }, alpha: 0, duration: 900, delay: wave * 150, onComplete: () => ring.destroy() });
  }
  // 12 rising spirit orbs
  for (let i = 0; i < 12; i++) {
    const orb = scene.add.circle(x + (Math.random() - 0.5) * 30, y + 10, 4, 0x88ddff, 0.8).setDepth(1001);
    const orbGlow = scene.add.circle(orb.x, orb.y, 8, 0x44bbff, 0.2).setDepth(1000);
    scene.tweens.add({ targets: [orb, orbGlow], y: y - 50 - Math.random() * 30, alpha: 0, duration: 800, delay: i * 60, onComplete: () => { orb.destroy(); orbGlow.destroy(); } });
  }
}

function spawnAsuraStrike(scene: Phaser.Scene, x: number, y: number): void {
  // THE ULTIMATE ATTACK - maximum dramatic effect
  shake(scene, 0.03, 500);
  screenFlash(scene, 0xffffff, 250);
  // Massive white-hot core flash
  const coreFlash = scene.add.circle(x, y, 50, 0xffffff, 1).setDepth(1003);
  scene.tweens.add({ targets: coreFlash, scale: 6, alpha: 0, duration: 300, onComplete: () => coreFlash.destroy() });
  // Golden explosion layer
  const burst1 = scene.add.circle(x, y, 40, 0xffdd44, 0.9).setDepth(1002);
  scene.tweens.add({ targets: burst1, scale: 8, alpha: 0, duration: 600, onComplete: () => burst1.destroy() });
  // Orange explosion layer
  const burst2 = scene.add.circle(x, y, 50, 0xff8800, 0.6).setDepth(1001);
  scene.tweens.add({ targets: burst2, scale: 10, alpha: 0, duration: 700, onComplete: () => burst2.destroy() });
  // 24 radiating energy lines
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const line = scene.add.graphics().setDepth(1001);
    line.lineStyle(5, 0xffffff, 0.9);
    line.lineBetween(x, y, x + Math.cos(angle) * 120, y + Math.sin(angle) * 120);
    line.lineStyle(3, 0xffee66, 0.8);
    line.lineBetween(x, y, x + Math.cos(angle) * 120, y + Math.sin(angle) * 120);
    scene.tweens.add({ targets: line, alpha: 0, scale: 1.5, duration: 500, delay: 50, onComplete: () => line.destroy() });
  }
  // 6 massive shockwave rings
  for (let wave = 0; wave < 6; wave++) {
    const ring = scene.add.circle(x, y, 25, 0xffcc00, 0).setStrokeStyle(5, 0xffee44, 0.9).setDepth(1000);
    scene.tweens.add({ targets: ring, scale: { from: 1, to: 7 + wave * 2 }, alpha: 0, duration: 600, delay: wave * 70, onComplete: () => ring.destroy() });
  }
  // Energy debris flying everywhere
  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 80;
    const spark = scene.add.circle(x, y, 3 + Math.random() * 4, 0xffee66, 0.9).setDepth(1002);
    scene.tweens.add({ targets: spark, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist, alpha: 0, duration: 500 + Math.random() * 300, onComplete: () => spark.destroy() });
  }
  // "ASURA STRIKE" text
  const txt = scene.add.text(x, y - 60, "ASURA STRIKE", { fontSize: "22px", fontStyle: "bold", color: "#ffee44", stroke: "#000", strokeThickness: 4 }).setOrigin(0.5).setDepth(1003);
  scene.tweens.add({ targets: txt, y: y - 100, alpha: 0, scale: { from: 0.5, to: 2 }, duration: 1000, onComplete: () => txt.destroy() });
}

// ===== HUNTER SKILLS =====

function spawnDoubleStrafe(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number): void {
  // Two glowing arrows
  for (let i = 0; i < 2; i++) {
    const arrow = scene.add.graphics().setDepth(1000);
    arrow.fillStyle(0x22cc55, 0.9);
    arrow.fillPoints([new Phaser.Geom.Point(0, -10), new Phaser.Geom.Point(4, 0), new Phaser.Geom.Point(0, 10), new Phaser.Geom.Point(-4, 0)], true);
    arrow.fillStyle(0xffffff, 0.5);
    arrow.fillPoints([new Phaser.Geom.Point(0, -5), new Phaser.Geom.Point(2, 0), new Phaser.Geom.Point(0, 5), new Phaser.Geom.Point(-2, 0)], true);
    arrow.setPosition(fromX + (i === 0 ? -8 : 8), fromY);
    const arrowGlow = scene.add.circle(arrow.x, arrow.y, 10, 0x22cc55, 0.3).setDepth(999);
    const trailTimer = scene.time.addEvent({
      delay: 25, callback: () => {
        const t = scene.add.circle(arrow.x, arrow.y, 3, 0x22cc55, 0.5).setDepth(999);
        scene.tweens.add({ targets: t, scale: 0.1, alpha: 0, duration: 150, onComplete: () => t.destroy() });
      }, loop: true,
    });
    scene.tweens.add({
      targets: [arrow, arrowGlow], x: toX + (i === 0 ? -5 : 5), y: toY, duration: 180, delay: i * 70,
      onComplete: () => {
        trailTimer.destroy(); arrow.destroy(); arrowGlow.destroy();
        shake(scene, 0.003, 60);
        const hit = scene.add.circle(toX, toY, 14, 0x22cc55, 0.8).setDepth(1000);
        scene.tweens.add({ targets: hit, scale: 2.5, alpha: 0, duration: 250, onComplete: () => hit.destroy() });
        const flash = scene.add.circle(toX, toY, 8, 0xffffff, 0.7).setDepth(1001);
        scene.tweens.add({ targets: flash, scale: 2, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
      },
    });
  }
}

function spawnArrowShower(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.006, 300);
  // Larger AoE zone
  const zone = scene.add.circle(x, y, 130, 0x22cc55, 0.12).setStrokeStyle(2, 0x22cc55, 0.4).setDepth(998);
  scene.tweens.add({ targets: zone, alpha: 0, duration: 1200, onComplete: () => zone.destroy() });
  // 18 arrows raining down
  for (let i = 0; i < 18; i++) {
    const ax = x + (Math.random() - 0.5) * 240;
    const ay = y + (Math.random() - 0.5) * 240;
    const arrow = scene.add.graphics().setDepth(1001);
    arrow.lineStyle(3, 0x22cc55, 0.9);
    arrow.lineBetween(0, -10, 0, 10);
    arrow.fillStyle(0x44ff66, 0.9);
    arrow.fillTriangle(-4, -10, 4, -10, 0, -18);
    arrow.setPosition(ax, ay - 200);
    scene.tweens.add({
      targets: arrow, y: ay, duration: 220, delay: i * 40,
      onComplete: () => {
        arrow.destroy();
        const hit = scene.add.circle(ax, ay, 6, 0x22cc55, 0.7).setDepth(1000);
        scene.tweens.add({ targets: hit, scale: 2, alpha: 0, duration: 300, onComplete: () => hit.destroy() });
      },
    });
  }
}

function spawnAnkleSnare(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.004, 100);
  // Larger net trap
  const net = scene.add.graphics().setDepth(1000);
  net.lineStyle(3, 0xccaa44, 0.8);
  for (let i = -3; i <= 3; i++) {
    net.lineBetween(x + i * 10, y - 30, x + i * 10, y + 30);
    net.lineBetween(x - 30, y + i * 10, x + 30, y + i * 10);
  }
  net.setScale(2.5);
  scene.tweens.add({ targets: net, scaleX: 1, scaleY: 1, duration: 250, ease: "Back.easeOut", onComplete: () => {
    scene.tweens.add({ targets: net, alpha: 0, duration: 600, delay: 600, onComplete: () => net.destroy() });
  }});
  // Snap flash
  const snapFlash = scene.add.circle(x, y, 25, 0xddbb44, 0.6).setDepth(999);
  scene.tweens.add({ targets: snapFlash, scale: 2.5, alpha: 0, duration: 400, onComplete: () => snapFlash.destroy() });
  // Chain sparks at corners
  const corners = [[-30, -30], [30, -30], [-30, 30], [30, 30]];
  for (const [cx, cy] of corners) {
    const spark = scene.add.circle(x + cx, y + cy, 4, 0xffdd44, 0.8).setDepth(1001);
    scene.tweens.add({ targets: spark, scale: 2, alpha: 0, duration: 300, onComplete: () => spark.destroy() });
  }
}

function spawnBlitzBeat(scene: Phaser.Scene, x: number, y: number): void {
  // Large falcon dive from above
  const falcon = scene.add.graphics().setDepth(1001);
  falcon.fillStyle(0xddaa44, 0.9);
  falcon.fillTriangle(-18, 8, 18, 8, 0, -14);
  falcon.fillTriangle(-30, 4, -10, 4, -16, 12);
  falcon.fillTriangle(10, 4, 30, 4, 16, 12);
  falcon.fillStyle(0xffffff, 0.4);
  falcon.fillTriangle(-8, 6, 8, 6, 0, -8);
  falcon.setPosition(x, y - 250);
  // Speed lines
  const speedLines = scene.add.graphics().setDepth(1000);
  speedLines.lineStyle(2, 0xddaa44, 0.4);
  for (let i = 0; i < 4; i++) {
    const lx = x + (Math.random() - 0.5) * 30;
    speedLines.lineBetween(lx, y - 250, lx, y - 150);
  }
  scene.tweens.add({ targets: speedLines, alpha: 0, duration: 300, onComplete: () => speedLines.destroy() });
  scene.tweens.add({
    targets: falcon, y: y, duration: 250,
    onComplete: () => {
      falcon.destroy();
      shake(scene, 0.008, 120);
      const flash = scene.add.circle(x, y, 15, 0xffffff, 0.8).setDepth(1002);
      scene.tweens.add({ targets: flash, scale: 2.5, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
      const impact = scene.add.circle(x, y, 20, 0xddaa44, 0.8).setDepth(1000);
      scene.tweens.add({ targets: impact, scale: 4, alpha: 0, duration: 450, onComplete: () => impact.destroy() });
      // Feathers scatter widely
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const feather = scene.add.circle(x, y, 3 + Math.random() * 3, 0xeebb55, 0.8).setDepth(1001);
        scene.tweens.add({ targets: feather, x: x + Math.cos(angle) * (25 + Math.random() * 35), y: y + Math.sin(angle) * (25 + Math.random() * 35), alpha: 0, duration: 600, onComplete: () => feather.destroy() });
      }
    },
  });
}

// ===== BARD SKILLS =====

function spawnMelodyStrike(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number): void {
  // Large musical note projectile with trailing notes
  const note = scene.add.text(fromX, fromY, "\u266A", {
    fontSize: "32px", color: "#06b6d4", stroke: "#000000", strokeThickness: 3,
  }).setOrigin(0.5).setDepth(1000);
  const noteGlow = scene.add.circle(fromX, fromY, 16, 0x06b6d4, 0.3).setDepth(999);
  const trailTimer = scene.time.addEvent({
    delay: 40, callback: () => {
      const t = scene.add.text(note.x, note.y, "\u266B", { fontSize: "14px", color: "#22d3ee" }).setOrigin(0.5).setDepth(999);
      scene.tweens.add({ targets: t, scale: 0.2, alpha: 0, y: t.y - 10, duration: 200, onComplete: () => t.destroy() });
    }, loop: true,
  });
  scene.tweens.add({
    targets: [note, noteGlow], x: toX, y: toY, duration: 250,
    onUpdate: () => { note.rotation += 0.1; },
    onComplete: () => {
      trailTimer.destroy(); note.destroy(); noteGlow.destroy();
      shake(scene, 0.004, 80);
      const hit = scene.add.circle(toX, toY, 18, 0x06b6d4, 0.8).setDepth(1000);
      scene.tweens.add({ targets: hit, scale: 3, alpha: 0, duration: 350, onComplete: () => hit.destroy() });
      // Note burst
      const notes = ["\u266A", "\u266B", "\u266C"];
      for (let i = 0; i < 5; i++) {
        const n = scene.add.text(toX, toY, notes[i % 3], { fontSize: "16px", color: "#22d3ee" }).setOrigin(0.5).setDepth(1001);
        const a = Math.random() * Math.PI * 2;
        scene.tweens.add({ targets: n, x: toX + Math.cos(a) * 30, y: toY + Math.sin(a) * 30, alpha: 0, duration: 400, onComplete: () => n.destroy() });
      }
    },
  });
}

function spawnFrostJoker(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.005, 200);
  screenFlash(scene, 0x88ccff, 80);
  // Multiple expanding ice waves
  for (let w = 0; w < 3; w++) {
    const wave = scene.add.circle(x, y, 20, 0x88ccff, 0).setStrokeStyle(4, 0x44aaff, 0.8).setDepth(1000);
    scene.tweens.add({ targets: wave, scale: 7 + w, alpha: 0, duration: 700, delay: w * 100, onComplete: () => wave.destroy() });
  }
  // 16 snowflakes spiraling outward
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const snowflake = scene.add.text(x + Math.cos(angle) * 25, y + Math.sin(angle) * 25, "\u2744", {
      fontSize: "18px", color: "#aaddff",
    }).setOrigin(0.5).setDepth(1001);
    scene.tweens.add({ targets: snowflake, x: x + Math.cos(angle) * 150, y: y + Math.sin(angle) * 150, alpha: 0, rotation: Math.PI * 3, scale: 1.5, duration: 900, delay: i * 30, onComplete: () => snowflake.destroy() });
  }
  // Ice sparkles
  for (let i = 0; i < 10; i++) {
    const spark = scene.add.circle(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 80, 3, 0xaaddff, 0.8).setDepth(1001);
    scene.tweens.add({ targets: spark, y: spark.y - 20, alpha: 0, duration: 500, delay: i * 40, onComplete: () => spark.destroy() });
  }
}

function spawnDrumBattle(scene: Phaser.Scene, x: number, y: number): void {
  // Powerful buff aura with 5 expanding rings
  for (let wave = 0; wave < 5; wave++) {
    const ring = scene.add.circle(x, y, 15, 0xf59e0b, 0).setStrokeStyle(3, 0xfbbf24, 0.8).setDepth(1000);
    scene.tweens.add({ targets: ring, scale: { from: 0.5, to: 3 + wave }, alpha: 0, duration: 700, delay: wave * 120, onComplete: () => ring.destroy() });
  }
  // Orange energy column
  const column = scene.add.graphics().setDepth(999);
  column.fillStyle(0xf59e0b, 0.1);
  column.fillRect(x - 18, y - 60, 36, 80);
  scene.tweens.add({ targets: column, alpha: 0, duration: 800, onComplete: () => column.destroy() });
  // 8 musical notes spiraling up
  const notes = ["\u266A", "\u266B", "\u266C"];
  for (let i = 0; i < 8; i++) {
    const note = scene.add.text(x + (Math.random() - 0.5) * 35, y, notes[i % notes.length], {
      fontSize: "20px", color: "#fbbf24",
    }).setOrigin(0.5).setDepth(1001);
    scene.tweens.add({ targets: note, y: y - 50 - Math.random() * 30, x: note.x + (Math.random() - 0.5) * 20, alpha: 0, scale: { from: 0.5, to: 1.3 }, duration: 700, delay: i * 60, onComplete: () => note.destroy() });
  }
}

function spawnLokisVeil(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.006, 300);
  // Large dark silence zone
  const zone = scene.add.circle(x, y, 160, 0x4422aa, 0.25).setStrokeStyle(3, 0x6644cc, 0.5).setDepth(998);
  scene.tweens.add({ targets: zone, alpha: 0, duration: 2500, onComplete: () => zone.destroy() });
  // 20 dark orbs spiraling inward
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const orb = scene.add.circle(x + Math.cos(angle) * 160, y + Math.sin(angle) * 160, 6, 0x6644cc, 0.8).setDepth(1000);
    const orbGlow = scene.add.circle(orb.x, orb.y, 12, 0x4422aa, 0.2).setDepth(999);
    scene.tweens.add({ targets: [orb, orbGlow], x: x, y: y, alpha: 0, duration: 900, delay: i * 40, onComplete: () => { orb.destroy(); orbGlow.destroy(); } });
  }
  // Dark explosion at center
  const flash = scene.add.circle(x, y, 35, 0x4422aa, 0.7).setDepth(999);
  scene.tweens.add({ targets: flash, scale: 5, alpha: 0, duration: 900, onComplete: () => flash.destroy() });
  // Dark rune cross
  const rune = scene.add.graphics().setDepth(999);
  rune.lineStyle(4, 0x6644cc, 0.4);
  rune.lineBetween(x - 100, y, x + 100, y);
  rune.lineBetween(x, y - 100, x, y + 100);
  scene.tweens.add({ targets: rune, alpha: 0, duration: 2000, onComplete: () => rune.destroy() });
}

// ===== DANCER SKILLS =====

function spawnSlingingArrow(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number): void {
  // Glowing pink arrow with heart trail
  const arrow = scene.add.graphics().setDepth(1000);
  arrow.fillStyle(0xec4899, 0.9);
  arrow.fillPoints([new Phaser.Geom.Point(0, -12), new Phaser.Geom.Point(5, 0), new Phaser.Geom.Point(0, 12), new Phaser.Geom.Point(-5, 0)], true);
  arrow.fillStyle(0xffffff, 0.5);
  arrow.fillPoints([new Phaser.Geom.Point(0, -6), new Phaser.Geom.Point(2, 0), new Phaser.Geom.Point(0, 6), new Phaser.Geom.Point(-2, 0)], true);
  arrow.setPosition(fromX, fromY);
  const arrowGlow = scene.add.circle(fromX, fromY, 14, 0xec4899, 0.3).setDepth(999);
  const trailTimer = scene.time.addEvent({
    delay: 30, callback: () => {
      const t = scene.add.text(arrow.x, arrow.y, "\u2665", { fontSize: "10px", color: "#f472b6" }).setOrigin(0.5).setDepth(999);
      scene.tweens.add({ targets: t, scale: 0.1, alpha: 0, duration: 200, onComplete: () => t.destroy() });
    }, loop: true,
  });
  scene.tweens.add({
    targets: [arrow, arrowGlow], x: toX, y: toY, duration: 220,
    onComplete: () => {
      trailTimer.destroy(); arrow.destroy(); arrowGlow.destroy();
      shake(scene, 0.003, 60);
      const hit = scene.add.circle(toX, toY, 16, 0xec4899, 0.8).setDepth(1000);
      scene.tweens.add({ targets: hit, scale: 2.5, alpha: 0, duration: 300, onComplete: () => hit.destroy() });
      const flash = scene.add.circle(toX, toY, 10, 0xffffff, 0.6).setDepth(1001);
      scene.tweens.add({ targets: flash, scale: 2, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
    },
  });
}

function spawnScream(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.008, 200);
  screenFlash(scene, 0xec4899, 80);
  // 5 massive sonic waves
  for (let wave = 0; wave < 5; wave++) {
    const ring = scene.add.circle(x, y, 20, 0xec4899, 0).setStrokeStyle(4, 0xf472b6, 0.8).setDepth(1000);
    scene.tweens.add({ targets: ring, scale: { from: 0.5, to: 7 + wave }, alpha: 0, duration: 600, delay: wave * 100, onComplete: () => ring.destroy() });
  }
  // Big exclamation
  const text = scene.add.text(x, y - 35, "!!", {
    fontSize: "36px", fontStyle: "bold", color: "#ec4899", stroke: "#000000", strokeThickness: 4,
  }).setOrigin(0.5).setDepth(1001);
  scene.tweens.add({ targets: text, y: y - 70, alpha: 0, scale: { from: 0.5, to: 1.5 }, duration: 700, onComplete: () => text.destroy() });
  // Pink energy particles
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const p = scene.add.circle(x, y, 3, 0xf472b6, 0.8).setDepth(1001);
    scene.tweens.add({ targets: p, x: x + Math.cos(angle) * (40 + Math.random() * 40), y: y + Math.sin(angle) * (40 + Math.random() * 40), alpha: 0, duration: 500, onComplete: () => p.destroy() });
  }
}

function spawnHumming(scene: Phaser.Scene, x: number, y: number): void {
  // Speed buff with wind and music
  // Green speed aura
  const glow = scene.add.circle(x, y, 30, 0x22cc55, 0.4).setDepth(999);
  scene.tweens.add({ targets: glow, scale: 2.5, alpha: 0, duration: 600, onComplete: () => glow.destroy() });
  // Speed rings
  for (let w = 0; w < 3; w++) {
    const ring = scene.add.circle(x, y, 15, 0x22cc55, 0).setStrokeStyle(2, 0x44ff66, 0.6).setDepth(1000);
    scene.tweens.add({ targets: ring, scale: 2 + w, alpha: 0, duration: 500, delay: w * 100, onComplete: () => ring.destroy() });
  }
  // 10 musical notes
  const notes = ["\u266A", "\u266B"];
  for (let i = 0; i < 10; i++) {
    const note = scene.add.text(x + (Math.random() - 0.5) * 35, y, notes[i % notes.length], {
      fontSize: "16px", color: "#f472b6",
    }).setOrigin(0.5).setDepth(1001);
    scene.tweens.add({ targets: note, y: y - 40 - Math.random() * 25, x: note.x + (Math.random() - 0.5) * 20, alpha: 0, scale: { from: 0.5, to: 1.2 }, duration: 600, delay: i * 50, onComplete: () => note.destroy() });
  }
  // Wind lines
  for (let i = 0; i < 4; i++) {
    const wind = scene.add.graphics().setDepth(1000);
    wind.lineStyle(2, 0x88ffaa, 0.5);
    const wy = y + (Math.random() - 0.5) * 30;
    wind.lineBetween(x - 20, wy, x + 30, wy - 5);
    scene.tweens.add({ targets: wind, x: 30, alpha: 0, duration: 400, delay: i * 60, onComplete: () => wind.destroy() });
  }
}

function spawnCharmEffect(scene: Phaser.Scene, x: number, y: number): void {
  // Enchanting charm with lots of hearts
  const glow = scene.add.circle(x, y, 25, 0xec4899, 0.5).setDepth(999);
  scene.tweens.add({ targets: glow, scale: 3, alpha: 0, duration: 600, onComplete: () => glow.destroy() });
  // 12 hearts rising and floating
  for (let i = 0; i < 12; i++) {
    const heart = scene.add.text(x + (Math.random() - 0.5) * 40, y, "\u2665", {
      fontSize: `${16 + Math.random() * 12}px`, color: i % 2 === 0 ? "#ec4899" : "#f472b6",
    }).setOrigin(0.5).setDepth(1001);
    scene.tweens.add({ targets: heart, y: y - 50 - Math.random() * 30, x: heart.x + (Math.random() - 0.5) * 30, alpha: 0, scale: { from: 0.3, to: 1.5 }, duration: 700 + Math.random() * 400, delay: i * 60, onComplete: () => heart.destroy() });
  }
  // Pink sparkle ring
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const sparkle = scene.add.circle(x + Math.cos(angle) * 25, y + Math.sin(angle) * 25, 3, 0xffffff, 0.8).setDepth(1001);
    scene.tweens.add({ targets: sparkle, x: x + Math.cos(angle) * 50, y: y + Math.sin(angle) * 50 - 15, alpha: 0, duration: 500, delay: i * 40, onComplete: () => sparkle.destroy() });
  }
}

// ===== ALCHEMIST SKILLS =====

function spawnAcidTerror(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.005, 100);
  // Acid explosion splash
  const splash = scene.add.circle(x, y, 25, 0x44dd22, 0.6).setDepth(999);
  scene.tweens.add({ targets: splash, scale: 3, alpha: 0, duration: 500, onComplete: () => splash.destroy() });
  // 16 acid drops flying outward
  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    const drop = scene.add.circle(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, 4 + Math.random() * 6, 0x66ff44, 0.8).setDepth(1000);
    scene.tweens.add({ targets: drop, x: x + Math.cos(angle) * (30 + Math.random() * 30), y: y + Math.sin(angle) * (30 + Math.random() * 30) + 10, alpha: 0, scale: { from: 1, to: 0.2 }, duration: 500 + Math.random() * 300, delay: i * 25, onComplete: () => drop.destroy() });
  }
  // Toxic fume rising
  for (let i = 0; i < 6; i++) {
    const fume = scene.add.circle(x + (Math.random() - 0.5) * 20, y, 8 + Math.random() * 6, 0x44cc44, 0.3).setDepth(1000);
    scene.tweens.add({ targets: fume, y: fume.y - 30, scale: 2, alpha: 0, duration: 600, delay: 100 + i * 60, onComplete: () => fume.destroy() });
  }
}

function spawnDemonstration(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.01, 200);
  screenFlash(scene, 0xff4400, 100);
  // Large fire bomb AoE zone
  const zone = scene.add.circle(x, y, 130, 0xff6600, 0.15).setStrokeStyle(3, 0xff4400, 0.5).setDepth(998);
  scene.tweens.add({ targets: zone, alpha: { from: 0.15, to: 0.02 }, duration: 5000, onComplete: () => zone.destroy() });
  // Big initial explosion
  const coreFlash = scene.add.circle(x, y, 20, 0xffffff, 0.8).setDepth(1002);
  scene.tweens.add({ targets: coreFlash, scale: 3, alpha: 0, duration: 200, onComplete: () => coreFlash.destroy() });
  const burst = scene.add.circle(x, y, 35, 0xff4400, 0.8).setDepth(1000);
  scene.tweens.add({ targets: burst, scale: 5, alpha: 0, duration: 600, onComplete: () => burst.destroy() });
  // Shrapnel
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const shard = scene.add.rectangle(x, y, 4, 4, 0xff8800, 0.8).setDepth(1001);
    scene.tweens.add({ targets: shard, x: x + Math.cos(angle) * (40 + Math.random() * 50), y: y + Math.sin(angle) * (40 + Math.random() * 50), rotation: Math.PI * 4, alpha: 0, duration: 500, onComplete: () => shard.destroy() });
  }
  // Recurring flames
  for (let i = 0; i < 15; i++) {
    scene.time.delayedCall(i * 300, () => {
      const fx = x + (Math.random() - 0.5) * 220;
      const fy = y + (Math.random() - 0.5) * 220;
      const flame = scene.add.graphics().setDepth(1000);
      flame.fillStyle(0xff4400, 0.8); flame.fillCircle(0, 0, 8);
      flame.fillStyle(0xffaa00, 0.6); flame.fillCircle(0, -3, 5);
      flame.fillStyle(0xffee44, 0.4); flame.fillCircle(0, -5, 3);
      flame.setPosition(fx, fy);
      scene.tweens.add({ targets: flame, y: fy - 25, alpha: 0, scale: 1.5, duration: 400, onComplete: () => flame.destroy() });
    });
  }
}

function spawnPotionPitcher(scene: Phaser.Scene, x: number, y: number): void {
  // Potion bottle arc and splash
  const bottle = scene.add.graphics().setDepth(1000);
  bottle.fillStyle(0xff4466, 0.9);
  bottle.fillRoundedRect(-8, -12, 16, 20, 3);
  bottle.fillStyle(0xdddddd, 0.7);
  bottle.fillRect(-4, -16, 8, 6);
  bottle.fillStyle(0xffffff, 0.3);
  bottle.fillRect(-3, -8, 3, 12);
  bottle.setPosition(x, y - 40);
  scene.tweens.add({
    targets: bottle, y: y, rotation: Math.PI * 2, duration: 250,
    onComplete: () => {
      bottle.destroy();
      // Healing splash burst
      const splash = scene.add.circle(x, y, 25, 0xff4466, 0.5).setDepth(999);
      scene.tweens.add({ targets: splash, scale: 2.5, alpha: 0, duration: 500, onComplete: () => splash.destroy() });
      // 12 healing sparkles
      for (let i = 0; i < 12; i++) {
        const spark = scene.add.circle(x + (Math.random() - 0.5) * 30, y, 4 + Math.random() * 3, 0xff6688, 0.8).setDepth(1001);
        scene.tweens.add({ targets: spark, y: y - 40 - Math.random() * 25, alpha: 0, duration: 600, delay: i * 40, onComplete: () => spark.destroy() });
      }
      // Plus signs (healing)
      for (let i = 0; i < 4; i++) {
        const plus = scene.add.text(x + (Math.random() - 0.5) * 20, y, "+", { fontSize: "18px", fontStyle: "bold", color: "#ff6688", stroke: "#000", strokeThickness: 2 }).setOrigin(0.5).setDepth(1001);
        scene.tweens.add({ targets: plus, y: y - 35, alpha: 0, duration: 500, delay: i * 60, onComplete: () => plus.destroy() });
      }
    },
  });
}

function spawnBioCannibalize(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.006, 200);
  // Large plant AoE zone
  const zone = scene.add.circle(x, y, 110, 0x44aa22, 0.2).setStrokeStyle(2, 0x33aa22, 0.4).setDepth(998);
  scene.tweens.add({ targets: zone, alpha: 0, duration: 1000, onComplete: () => zone.destroy() });
  // 14 plants erupting
  for (let i = 0; i < 14; i++) {
    const px = x + (Math.random() - 0.5) * 200;
    const py = y + (Math.random() - 0.5) * 200;
    const plant = scene.add.graphics().setDepth(1000);
    const h = 20 + Math.random() * 15;
    plant.fillStyle(0x33aa22, 0.9);
    plant.fillPoints([new Phaser.Geom.Point(-4, 0), new Phaser.Geom.Point(0, -h), new Phaser.Geom.Point(4, 0)], true);
    plant.fillStyle(0x55cc33, 0.5);
    plant.fillPoints([new Phaser.Geom.Point(-1, 0), new Phaser.Geom.Point(0, -h + 3), new Phaser.Geom.Point(1, 0)], true);
    plant.setPosition(px, py);
    plant.setScale(0, 0);
    scene.tweens.add({
      targets: plant, scaleX: 1, scaleY: 1, duration: 180, delay: i * 50, ease: "Back.easeOut",
      onComplete: () => {
        scene.tweens.add({ targets: plant, alpha: 0, scaleY: 0.5, duration: 400, delay: 300, onComplete: () => plant.destroy() });
      },
    });
  }
  // Green burst
  const burst = scene.add.circle(x, y, 40, 0x44cc22, 0.6).setDepth(999);
  scene.tweens.add({ targets: burst, scale: 3.5, alpha: 0, duration: 600, onComplete: () => burst.destroy() });
  // Spores flying
  for (let i = 0; i < 10; i++) {
    const spore = scene.add.circle(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 80, 2, 0x88ff44, 0.7).setDepth(1001);
    scene.tweens.add({ targets: spore, y: spore.y - 25, alpha: 0, duration: 500, delay: 200 + i * 40, onComplete: () => spore.destroy() });
  }
}

// ===== GENERIC =====

function spawnGenericEffect(scene: Phaser.Scene, x: number, y: number): void {
  shake(scene, 0.003, 80);
  const flash = scene.add.circle(x, y, 20, 0xffffff, 0.8).setDepth(1000);
  scene.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
  const ring = scene.add.circle(x, y, 15, 0xffffff, 0).setStrokeStyle(3, 0xffffff, 0.6).setDepth(1000);
  scene.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const p = scene.add.circle(x, y, 2, 0xffffff, 0.7).setDepth(1001);
    scene.tweens.add({ targets: p, x: x + Math.cos(angle) * 30, y: y + Math.sin(angle) * 30, alpha: 0, duration: 300, onComplete: () => p.destroy() });
  }
}
