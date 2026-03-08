import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Try to load real RO sprite sheets (extracted from GRF)
    // If they exist in public/assets/sprites/, they'll be used
    this.load.on("loaderror", () => {
      // Silently ignore - we'll fall back to procedural sprites
    });

    // Try loading real sprites (spritesheet format: rows of animation frames, 150x150 each)
    // Cache bust to ensure fresh assets after re-extraction
    const v = "v7";
    const classGenders = [
      "knight_m", "knight_f", "crusader_m", "crusader_f",
      "assassin_m", "assassin_f", "rogue_m", "rogue_f",
      "wizard_m", "wizard_f", "sage_m", "sage_f",
      "priest_m", "priest_f", "monk_m", "monk_f",
      "hunter_m", "hunter_f", "bard_m", "dancer_f",
      "alchemist_m", "alchemist_f",
    ];
    for (const cg of classGenders) {
      this.load.spritesheet(`${cg}_real`, `/assets/sprites/${cg}.png?${v}`, {
        frameWidth: 150, frameHeight: 150,
      });
      this.load.json(`${cg}_meta`, `/assets/sprites/${cg}.json?${v}`);
    }

    // Load monster sprites
    const monsters = ["poring", "drops", "marin"];
    for (const mon of monsters) {
      this.load.spritesheet(`${mon}_real`, `/assets/monsters/${mon}.png?${v}`, {
        frameWidth: 105, frameHeight: 105,
      });
      this.load.json(`${mon}_meta`, `/assets/monsters/${mon}.json?${v}`);
    }

    // Try loading map backgrounds (static pre-rendered from map designer)
    this.load.image("map_bg", `/assets/map_bg.png?${v}`);
    this.load.image("map_minimap", "/assets/map/prontera_minimap.png");

    // Load real RO tile textures
    const tv = "v2";
    // Prontera floor tiles
    this.load.image("prt_stone1", `/assets/tiles/prt_city_bot01.png?${tv}`);
    this.load.image("prt_stone2", `/assets/tiles/prt_city_bot02.png?${tv}`);
    this.load.image("prt_stone3", `/assets/tiles/prt_city_bot03.png?${tv}`);
    this.load.image("prt_emblem", `/assets/tiles/prt_city_bot04.png?${tv}`);
    this.load.image("prt_dark", `/assets/tiles/prt_pr_bottom01.png?${tv}`);
    // Beach sand tiles
    this.load.image("sand1", `/assets/tiles/sand_floor_1.png?${tv}`);
    this.load.image("sand2", `/assets/tiles/sand_floor_2.png?${tv}`);
    this.load.image("sand3", `/assets/tiles/sand_floor_3.png?${tv}`);
    // Beach transitions
    this.load.image("beach_grass1", `/assets/tiles/beach_0.png?${tv}`);
    this.load.image("beach_grass2", `/assets/tiles/beach_1.png?${tv}`);
    this.load.image("beach_grass3", `/assets/tiles/beach_4.png?${tv}`);
    this.load.image("grass_path", `/assets/tiles/grass_floor_1.png?${tv}`);
    // Shallow water
    this.load.image("shallow1", `/assets/tiles/water_floor_1.png?${tv}`);
    // RO water animation frames (18 frames)
    for (let i = 0; i <= 17; i++) {
      this.load.image(`water_frame_${i}`, `/assets/tiles/water${String(i).padStart(3, "0")}.jpg?${tv}`);
    }

    // Always generate procedural fallback textures
    this.createKnightSprite();
    this.createAssassinSprite();
    this.createWizardSprite();
    this.createPriestSprite();
    this.createMapTiles();
  }

  create(): void {
    // Check which real sprites loaded successfully
    const realSprites: Record<string, boolean> = {};
    const classGenderKeys = [
      "knight_m", "knight_f", "crusader_m", "crusader_f",
      "assassin_m", "assassin_f", "rogue_m", "rogue_f",
      "wizard_m", "wizard_f", "sage_m", "sage_f",
      "priest_m", "priest_f", "monk_m", "monk_f",
      "hunter_m", "hunter_f", "bard_m", "dancer_f",
      "alchemist_m", "alchemist_f",
    ];
    for (const cg of classGenderKeys) {
      realSprites[cg] = this.textures.exists(`${cg}_real`);
    }
    this.registry.set("realSprites", realSprites);
    this.registry.set("hasMapBg", this.textures.exists("map_bg"));

    // Check monster sprites
    const monsterSprites: Record<string, boolean> = {};
    for (const mon of ["poring", "drops", "marin"]) {
      monsterSprites[mon] = this.textures.exists(`${mon}_real`);
    }
    this.registry.set("monsterSprites", monsterSprites);

    // Check real tile textures
    this.registry.set("hasRealTiles", this.textures.exists("prt_stone1"));
    this.registry.set("hasRealWater", this.textures.exists("water_frame_0"));
    this.registry.set("hasRealSand", this.textures.exists("sand1"));

    const realCount = Object.values(realSprites).filter(Boolean).length;
    console.log(`Loaded ${realCount}/${classGenderKeys.length} real RO sprites`);

    this.scene.start("ArenaScene");
  }

  // --- CHARACTER SPRITES (32x48 pixel art humanoids) ---

  private createKnightSprite(): void {
    const g = this.add.graphics();
    // Armor body (blue steel)
    g.fillStyle(0x2563eb); g.fillRect(8, 16, 16, 18); // torso
    g.fillStyle(0x1d4ed8); g.fillRect(8, 16, 16, 4);  // shoulder plate
    g.fillStyle(0x3b82f6); g.fillRect(10, 20, 12, 12); // chest
    // Belt
    g.fillStyle(0x92400e); g.fillRect(8, 32, 16, 3);
    // Legs (armored)
    g.fillStyle(0x1e40af); g.fillRect(8, 35, 7, 10); g.fillRect(17, 35, 7, 10);
    // Boots
    g.fillStyle(0x78350f); g.fillRect(7, 43, 8, 5); g.fillRect(17, 43, 8, 5);
    // Head (skin)
    g.fillStyle(0xfcd9b6); g.fillRect(10, 4, 12, 12);
    // Hair (brown)
    g.fillStyle(0x78350f); g.fillRect(9, 2, 14, 5); g.fillRect(9, 2, 3, 10);
    // Eyes
    g.fillStyle(0x1e293b); g.fillRect(13, 9, 2, 2); g.fillRect(18, 9, 2, 2);
    // Helmet crest
    g.fillStyle(0xfbbf24); g.fillRect(13, 0, 6, 3);
    // Shield (left arm)
    g.fillStyle(0x64748b); g.fillRect(1, 18, 7, 12);
    g.fillStyle(0x94a3b8); g.fillRect(2, 19, 5, 10);
    g.fillStyle(0xfbbf24); g.fillRect(3, 22, 3, 4); // emblem
    // Sword (right arm)
    g.fillStyle(0xd1d5db); g.fillRect(26, 10, 3, 20); // blade
    g.fillStyle(0x9ca3af); g.fillRect(27, 10, 1, 20);
    g.fillStyle(0x78350f); g.fillRect(25, 28, 5, 3);  // handle
    g.fillStyle(0xfbbf24); g.fillRect(25, 27, 5, 2);  // crossguard
    g.generateTexture("knight_sprite", 32, 48);
    g.destroy();
  }

  private createAssassinSprite(): void {
    const g = this.add.graphics();
    // Dark body (leather armor)
    g.fillStyle(0x3f3f46); g.fillRect(9, 16, 14, 18); // torso
    g.fillStyle(0x52525b); g.fillRect(10, 18, 12, 8);  // chest detail
    // Red scarf
    g.fillStyle(0xdc2626); g.fillRect(8, 14, 16, 3);
    g.fillStyle(0xb91c1c); g.fillRect(22, 15, 4, 8); // scarf tail
    // Belt with pouches
    g.fillStyle(0x78350f); g.fillRect(9, 32, 14, 2);
    g.fillStyle(0x92400e); g.fillRect(19, 30, 4, 4); // pouch
    // Legs (dark)
    g.fillStyle(0x27272a); g.fillRect(9, 34, 6, 10); g.fillRect(17, 34, 6, 10);
    // Boots (ninja style)
    g.fillStyle(0x18181b); g.fillRect(8, 42, 7, 6); g.fillRect(17, 42, 7, 6);
    // Head (skin, partially masked)
    g.fillStyle(0xfcd9b6); g.fillRect(10, 4, 12, 12);
    // Mask (lower face)
    g.fillStyle(0x3f3f46); g.fillRect(10, 10, 12, 6);
    // Hair (dark spiky)
    g.fillStyle(0x18181b); g.fillRect(9, 1, 14, 5);
    g.fillRect(8, 3, 2, 4); g.fillRect(22, 3, 2, 4);
    g.fillRect(11, 0, 3, 2); g.fillRect(18, 0, 3, 2); // spikes
    // Eyes (red/fierce)
    g.fillStyle(0xef4444); g.fillRect(13, 7, 2, 2); g.fillRect(18, 7, 2, 2);
    // Daggers
    g.fillStyle(0xd1d5db); g.fillRect(1, 22, 2, 14); // left dagger
    g.fillStyle(0xd1d5db); g.fillRect(29, 22, 2, 14); // right dagger
    g.fillStyle(0x78350f); g.fillRect(0, 20, 4, 3); g.fillRect(28, 20, 4, 3); // handles
    g.generateTexture("assassin_sprite", 32, 48);
    g.destroy();
  }

  private createWizardSprite(): void {
    const g = this.add.graphics();
    // Robe body (purple)
    g.fillStyle(0x7c3aed); g.fillRect(7, 14, 18, 24); // main robe
    g.fillStyle(0x6d28d9); g.fillRect(8, 16, 16, 6);   // upper robe
    g.fillStyle(0x8b5cf6); g.fillRect(9, 22, 14, 8);   // mid section
    // Robe bottom (flared)
    g.fillStyle(0x7c3aed); g.fillRect(5, 36, 22, 8);
    g.fillStyle(0x6d28d9); g.fillRect(4, 42, 24, 6);
    // Gold trim
    g.fillStyle(0xfbbf24); g.fillRect(7, 14, 18, 2);  // collar
    g.fillStyle(0xfbbf24); g.fillRect(14, 16, 4, 22);  // center stripe
    g.fillStyle(0xfbbf24); g.fillRect(4, 42, 24, 1);  // hem
    // Head (skin)
    g.fillStyle(0xfcd9b6); g.fillRect(10, 4, 12, 11);
    // Wizard hat
    g.fillStyle(0x4c1d95); g.fillRect(6, 2, 20, 4);   // hat brim
    g.fillStyle(0x5b21b6); g.fillRect(10, -4, 12, 7);  // hat cone
    g.fillStyle(0x6d28d9); g.fillRect(12, -8, 8, 5);   // hat tip
    g.fillStyle(0xfbbf24); g.fillRect(11, 1, 10, 2);   // hat band
    // Eyes (wise, blue glow)
    g.fillStyle(0x60a5fa); g.fillRect(13, 8, 2, 2); g.fillRect(18, 8, 2, 2);
    // Mouth
    g.fillStyle(0xc2856e); g.fillRect(14, 12, 4, 1);
    // Staff (right side)
    g.fillStyle(0x78350f); g.fillRect(27, 0, 3, 44); // wood shaft
    g.fillStyle(0x8b5cf6); g.fillRect(25, -2, 7, 5); // crystal holder
    g.fillStyle(0xc084fc); g.fillRect(26, -4, 5, 4); // crystal
    g.fillStyle(0xe9d5ff); g.fillRect(27, -3, 3, 2); // crystal glow
    // Sleeves
    g.fillStyle(0x6d28d9); g.fillRect(3, 18, 5, 10); g.fillRect(24, 18, 5, 10);
    g.generateTexture("wizard_sprite", 32, 48);
    g.destroy();
  }

  private createPriestSprite(): void {
    const g = this.add.graphics();
    // White robe
    g.fillStyle(0xe5e7eb); g.fillRect(7, 14, 18, 24); // main robe
    g.fillStyle(0xf3f4f6); g.fillRect(8, 16, 16, 10); // upper
    g.fillStyle(0xd1d5db); g.fillRect(8, 26, 16, 10); // lower
    // Robe bottom
    g.fillStyle(0xe5e7eb); g.fillRect(5, 36, 22, 8);
    g.fillStyle(0xd1d5db); g.fillRect(4, 42, 24, 6);
    // Blue trim/sash
    g.fillStyle(0x3b82f6); g.fillRect(7, 14, 18, 2);  // collar
    g.fillStyle(0x2563eb); g.fillRect(13, 16, 6, 20);  // center cross vertical
    g.fillStyle(0x2563eb); g.fillRect(8, 22, 16, 4);   // center cross horizontal
    // Gold cross emblem
    g.fillStyle(0xfbbf24); g.fillRect(14, 18, 4, 8);
    g.fillStyle(0xfbbf24); g.fillRect(11, 20, 10, 4);
    // Head (skin)
    g.fillStyle(0xfcd9b6); g.fillRect(10, 4, 12, 12);
    // Hair (light blonde)
    g.fillStyle(0xfde68a); g.fillRect(9, 2, 14, 5);
    g.fillRect(9, 2, 3, 10); g.fillRect(20, 2, 3, 10); // side hair
    // Blue headband
    g.fillStyle(0x3b82f6); g.fillRect(9, 5, 14, 2);
    // Eyes (gentle green)
    g.fillStyle(0x22c55e); g.fillRect(13, 9, 2, 2); g.fillRect(18, 9, 2, 2);
    // Smile
    g.fillStyle(0xc2856e); g.fillRect(14, 13, 4, 1);
    // Staff (holy)
    g.fillStyle(0xd4a017); g.fillRect(27, 2, 3, 42); // gold shaft
    g.fillStyle(0xfbbf24); g.fillRect(25, 0, 7, 4);   // cross top bar
    g.fillStyle(0xfbbf24); g.fillRect(27, -3, 3, 4);   // cross top
    // Sleeves (puffy white)
    g.fillStyle(0xf3f4f6); g.fillRect(3, 18, 5, 10); g.fillRect(24, 18, 5, 10);
    // Hands
    g.fillStyle(0xfcd9b6); g.fillRect(3, 26, 4, 3); g.fillRect(25, 26, 4, 3);
    g.generateTexture("priest_sprite", 32, 48);
    g.destroy();
  }

  // --- MAP TILES (Prontera-inspired) ---

  private createMapTiles(): void {
    this.createStoneTile();
    this.createGrassTile();
    this.createWallTile();
    this.createWaterTile();
    this.createShallowWaterTile();
    this.createPathTile();
    this.createSandTile();
    this.createFountainBase();
    this.createTreeSprite();
    this.createBushSprite();
    this.createLampSprite();
    this.createBannerSprite();
    this.createPalmTreeSprite();
  }

  private createStoneTile(): void {
    const g = this.add.graphics();
    // Warm stone floor like Prontera
    g.fillStyle(0xc4a882); g.fillRect(0, 0, 64, 64);
    // Stone brick pattern
    g.lineStyle(1, 0xb09070, 0.4);
    g.strokeRect(2, 2, 28, 14);
    g.strokeRect(34, 2, 28, 14);
    g.strokeRect(0, 18, 20, 14);
    g.strokeRect(22, 18, 28, 14);
    g.strokeRect(52, 18, 12, 14);
    g.strokeRect(2, 34, 28, 14);
    g.strokeRect(34, 34, 28, 14);
    g.strokeRect(0, 50, 20, 14);
    g.strokeRect(22, 50, 28, 14);
    g.strokeRect(52, 50, 12, 14);
    // Subtle variation spots
    g.fillStyle(0xd4b892, 0.3); g.fillRect(10, 6, 8, 4);
    g.fillStyle(0xb89870, 0.3); g.fillRect(40, 22, 10, 6);
    g.fillStyle(0xd4b892, 0.3); g.fillRect(8, 40, 12, 4);
    g.generateTexture("stone_tile", 64, 64);
    g.destroy();
  }

  private createGrassTile(): void {
    const g = this.add.graphics();
    // Base green
    g.fillStyle(0x4a8c3f); g.fillRect(0, 0, 64, 64);
    // Grass variation patches
    g.fillStyle(0x5a9c4f, 0.6); g.fillRect(5, 5, 12, 8);
    g.fillStyle(0x3a7c2f, 0.5); g.fillRect(30, 15, 15, 10);
    g.fillStyle(0x5a9c4f, 0.4); g.fillRect(10, 35, 20, 8);
    g.fillStyle(0x3a7c2f, 0.6); g.fillRect(40, 45, 14, 10);
    g.fillStyle(0x6aac5f, 0.3); g.fillRect(45, 5, 10, 12);
    // Little grass blades
    g.fillStyle(0x6aac5f, 0.7);
    g.fillRect(8, 10, 1, 3); g.fillRect(20, 25, 1, 3);
    g.fillRect(45, 30, 1, 3); g.fillRect(35, 50, 1, 3);
    g.fillRect(55, 15, 1, 3); g.fillRect(15, 48, 1, 3);
    // Tiny flowers
    g.fillStyle(0xfde68a, 0.8); g.fillRect(12, 20, 2, 2);
    g.fillStyle(0xfca5a5, 0.7); g.fillRect(50, 40, 2, 2);
    g.fillStyle(0xc4b5fd, 0.6); g.fillRect(28, 8, 2, 2);
    g.generateTexture("grass_tile", 64, 64);
    g.destroy();
  }

  private createWallTile(): void {
    const g = this.add.graphics();
    // Castle wall (warm grey stone)
    g.fillStyle(0x9c8c7c); g.fillRect(0, 0, 64, 64);
    // Large stone blocks
    g.lineStyle(2, 0x7c6c5c, 0.6);
    g.strokeRect(1, 1, 30, 20);
    g.strokeRect(33, 1, 30, 20);
    g.strokeRect(1, 23, 20, 20);
    g.strokeRect(23, 23, 20, 20);
    g.strokeRect(45, 23, 18, 20);
    g.strokeRect(1, 45, 30, 18);
    g.strokeRect(33, 45, 30, 18);
    // Mortar highlights
    g.fillStyle(0xac9c8c, 0.5);
    g.fillRect(8, 5, 14, 10);
    g.fillRect(40, 28, 12, 10);
    // Top battlement detail
    g.fillStyle(0x8c7c6c); g.fillRect(0, 0, 64, 4);
    g.fillStyle(0xac9c8c); g.fillRect(5, 0, 10, 4);
    g.fillStyle(0xac9c8c); g.fillRect(25, 0, 10, 4);
    g.fillStyle(0xac9c8c); g.fillRect(45, 0, 10, 4);
    g.generateTexture("wall_tile", 64, 64);
    g.destroy();
  }

  private createWaterTile(): void {
    const g = this.add.graphics();
    // Deep ocean blue like cmd_fild02
    g.fillStyle(0x1a4d8c); g.fillRect(0, 0, 64, 64);
    g.fillStyle(0x1e5aa0, 0.6); g.fillRect(3, 8, 24, 4);
    g.fillStyle(0x2266b0, 0.4); g.fillRect(28, 20, 30, 3);
    g.fillStyle(0x1e5aa0, 0.5); g.fillRect(8, 36, 20, 4);
    g.fillStyle(0x2266b0, 0.4); g.fillRect(32, 48, 26, 3);
    g.fillStyle(0x163d70, 0.3); g.fillRect(0, 0, 64, 64);
    g.generateTexture("water_tile", 64, 64);
    g.destroy();
  }

  private createShallowWaterTile(): void {
    const g = this.add.graphics();
    // Lighter water near shore - turquoise like cmd_fild02
    g.fillStyle(0x2d8ab8); g.fillRect(0, 0, 64, 64);
    g.fillStyle(0x3aa0d0, 0.5); g.fillRect(5, 12, 22, 3);
    g.fillStyle(0x4ab8e0, 0.3); g.fillRect(30, 28, 24, 2);
    g.fillStyle(0x3aa0d0, 0.4); g.fillRect(10, 44, 18, 3);
    g.fillStyle(0x4ab8e0, 0.3); g.fillRect(34, 52, 22, 2);
    // Sandy bottom showing through
    g.fillStyle(0xc4a060, 0.15); g.fillRect(0, 0, 64, 64);
    g.generateTexture("shallow_water_tile", 64, 64);
    g.destroy();
  }

  private createSandTile(): void {
    const g = this.add.graphics();
    // Warm sand like cmd_fild02 beach
    g.fillStyle(0xd4b882); g.fillRect(0, 0, 64, 64);
    // Sand grain variation
    g.fillStyle(0xe0c898, 0.5); g.fillRect(4, 6, 14, 8);
    g.fillStyle(0xc8a870, 0.4); g.fillRect(28, 18, 18, 10);
    g.fillStyle(0xe0c898, 0.3); g.fillRect(10, 34, 22, 8);
    g.fillStyle(0xc8a870, 0.5); g.fillRect(38, 44, 16, 12);
    g.fillStyle(0xdcc090, 0.3); g.fillRect(44, 8, 12, 14);
    // Tiny pebbles
    g.fillStyle(0xb09060, 0.6);
    g.fillRect(12, 14, 2, 2); g.fillRect(40, 30, 2, 2);
    g.fillRect(22, 50, 2, 2); g.fillRect(52, 18, 2, 2);
    // Shell-like specs
    g.fillStyle(0xf0e0c0, 0.5); g.fillRect(30, 8, 2, 1);
    g.fillStyle(0xf0e0c0, 0.4); g.fillRect(8, 42, 2, 1);
    g.generateTexture("sand_tile", 64, 64);
    g.destroy();
  }

  private createPalmTreeSprite(): void {
    const g = this.add.graphics();
    // Curved trunk
    g.fillStyle(0x8b6f47);
    g.fillRect(12, 24, 6, 28); // main trunk
    g.fillRect(10, 30, 3, 18); // slight curve
    g.fillStyle(0xa0804e);
    g.fillRect(13, 26, 4, 24); // highlight
    // Trunk texture lines
    g.fillStyle(0x735c3a, 0.5);
    g.fillRect(11, 28, 7, 1); g.fillRect(11, 33, 7, 1);
    g.fillRect(11, 38, 7, 1); g.fillRect(11, 43, 7, 1);
    // Palm fronds (fan-shaped leaves)
    g.fillStyle(0x3a8a2a);
    // Left fronds
    g.fillTriangle(15, 20, -4, 12, 8, 8);
    g.fillTriangle(15, 20, -2, 22, 4, 14);
    // Right fronds
    g.fillTriangle(15, 20, 34, 12, 22, 8);
    g.fillTriangle(15, 20, 32, 22, 26, 14);
    // Top fronds
    g.fillTriangle(15, 20, 8, 2, 22, 2);
    g.fillTriangle(15, 20, 4, 6, 12, 0);
    g.fillTriangle(15, 20, 18, 0, 26, 6);
    // Lighter leaf highlights
    g.fillStyle(0x4aa03a, 0.5);
    g.fillTriangle(15, 20, 0, 16, 10, 10);
    g.fillTriangle(15, 20, 30, 16, 20, 10);
    // Coconuts
    g.fillStyle(0x6b4e2a);
    g.fillCircle(13, 22, 3);
    g.fillCircle(18, 21, 3);
    g.generateTexture("palm_tree", 36, 56);
    g.destroy();
  }

  private createPathTile(): void {
    const g = this.add.graphics();
    // Lighter stone path
    g.fillStyle(0xd4c4a8); g.fillRect(0, 0, 64, 64);
    // Path stones
    g.lineStyle(1, 0xc4b498, 0.5);
    g.strokeRect(2, 2, 18, 18);
    g.strokeRect(22, 2, 18, 18);
    g.strokeRect(42, 2, 20, 18);
    g.strokeRect(2, 22, 28, 18);
    g.strokeRect(32, 22, 30, 18);
    g.strokeRect(2, 42, 18, 20);
    g.strokeRect(22, 42, 18, 20);
    g.strokeRect(42, 42, 20, 20);
    // Subtle worn spots
    g.fillStyle(0xe4d4b8, 0.3); g.fillRect(12, 8, 8, 6);
    g.fillStyle(0xc4b498, 0.3); g.fillRect(36, 28, 10, 6);
    g.generateTexture("path_tile", 64, 64);
    g.destroy();
  }

  private createFountainBase(): void {
    const g = this.add.graphics();
    // Circular stone fountain base
    g.fillStyle(0x9c8c7c);
    g.fillCircle(64, 64, 60);
    g.fillStyle(0xac9c8c);
    g.fillCircle(64, 64, 50);
    // Water pool
    g.fillStyle(0x3b82f6);
    g.fillCircle(64, 64, 40);
    g.fillStyle(0x60a5fa, 0.5);
    g.fillCircle(64, 60, 30);
    // Center pillar
    g.fillStyle(0xd4c4a8);
    g.fillCircle(64, 64, 12);
    g.fillStyle(0xe4d4b8);
    g.fillCircle(64, 64, 8);
    // Water spray effect dots
    g.fillStyle(0x93c5fd, 0.7);
    g.fillCircle(64, 48, 3);
    g.fillCircle(52, 56, 2);
    g.fillCircle(76, 56, 2);
    g.fillCircle(58, 44, 2);
    g.fillCircle(70, 44, 2);
    g.generateTexture("fountain", 128, 128);
    g.destroy();
  }

  private createTreeSprite(): void {
    const g = this.add.graphics();
    // Trunk (thicker, with bark detail)
    g.fillStyle(0x5C3D1E); g.fillRect(14, 30, 12, 26);
    g.fillStyle(0x6B4A28); g.fillRect(16, 32, 8, 22);
    g.fillStyle(0x7A5830, 0.4); g.fillRect(14, 34, 4, 18); // highlight
    // Root flare
    g.fillStyle(0x5C3D1E); g.fillRect(12, 52, 16, 4);
    // Canopy - multiple layered clusters (RO deciduous tree style)
    g.fillStyle(0x1E5A1E); g.fillCircle(20, 18, 18); // base shadow cluster
    g.fillStyle(0x2A6E2A); g.fillCircle(12, 16, 14); // left cluster
    g.fillStyle(0x2A6E2A); g.fillCircle(28, 17, 13); // right cluster
    g.fillStyle(0x2E7A2E); g.fillCircle(20, 12, 15); // top cluster
    g.fillStyle(0x338833); g.fillCircle(16, 10, 11); // upper left
    g.fillStyle(0x338833); g.fillCircle(24, 11, 10); // upper right
    g.fillStyle(0x3A9A3A, 0.6); g.fillCircle(18, 8, 8);  // highlight top
    g.fillStyle(0x4AAA4A, 0.4); g.fillCircle(14, 13, 5); // light dapple
    g.fillStyle(0x4AAA4A, 0.3); g.fillCircle(24, 15, 4); // light dapple
    // Dark shadow underneath
    g.fillStyle(0x1A4A1A, 0.4); g.fillCircle(20, 24, 10);
    g.generateTexture("tree", 40, 56);
    g.destroy();
  }

  private createBushSprite(): void {
    const g = this.add.graphics();
    g.fillStyle(0x3a7c2f); g.fillCircle(12, 12, 12);
    g.fillStyle(0x4a8c3f); g.fillCircle(8, 10, 8);
    g.fillStyle(0x4a8c3f); g.fillCircle(16, 10, 8);
    g.fillStyle(0x5a9c4f, 0.5); g.fillCircle(12, 8, 6);
    // Tiny flowers on bush
    g.fillStyle(0xfde68a, 0.8); g.fillRect(6, 6, 2, 2);
    g.fillStyle(0xfca5a5, 0.7); g.fillRect(16, 8, 2, 2);
    g.generateTexture("bush", 24, 24);
    g.destroy();
  }

  private createLampSprite(): void {
    const g = this.add.graphics();
    // Pole
    g.fillStyle(0x78350f); g.fillRect(6, 10, 4, 30);
    // Lamp top
    g.fillStyle(0xd4a017); g.fillRect(2, 4, 12, 8);
    g.fillStyle(0xfbbf24); g.fillRect(4, 6, 8, 4);
    // Flame glow
    g.fillStyle(0xfef08a, 0.6); g.fillCircle(8, 8, 6);
    g.fillStyle(0xfbbf24, 0.8); g.fillCircle(8, 7, 3);
    g.generateTexture("lamp", 16, 40);
    g.destroy();
  }

  private createBannerSprite(): void {
    const g = this.add.graphics();
    // Pole
    g.fillStyle(0xd4a017); g.fillRect(2, 0, 3, 48);
    // Banner flag
    g.fillStyle(0xdc2626); g.fillRect(5, 4, 18, 24);
    g.fillStyle(0xb91c1c); g.fillRect(7, 6, 14, 20);
    // Emblem (simple cross/shield)
    g.fillStyle(0xfbbf24); g.fillRect(12, 10, 4, 12);
    g.fillStyle(0xfbbf24); g.fillRect(8, 14, 12, 4);
    // Banner bottom fringe
    g.fillStyle(0xdc2626);
    g.fillTriangle(5, 28, 14, 34, 23, 28);
    // Pole top
    g.fillStyle(0xfbbf24); g.fillCircle(3, 2, 3);
    g.generateTexture("banner", 26, 48);
    g.destroy();
  }
}
