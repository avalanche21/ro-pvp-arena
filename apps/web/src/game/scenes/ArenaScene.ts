import Phaser from "phaser";
import { Room } from "colyseus.js";
import { joinArena, leaveRoom } from "../network/ColyseusClient";
import { PlayerSprite } from "../entities/PlayerSprite";
import { MonsterSprite } from "../entities/MonsterSprite";
import { spawnSkillEffect } from "../entities/SkillEffect";
import { InputManager } from "../input/InputManager";
import {
  MAP_WIDTH, MAP_HEIGHT, ALL_CLASSES, PlayerClass,
  TILE_SIZE, TileType, generateMapLayout,
} from "@ro-pvp/shared";

const TILE = TILE_SIZE;

export class ArenaScene extends Phaser.Scene {
  private room: Room | null = null;
  private playerSprites = new Map<string, PlayerSprite>();
  private monsterSprites = new Map<string, MonsterSprite>();
  private inputManager = new InputManager();
  private localSessionId = "";
  private currentTargetId = "";
  private currentMonsterTargetId = "";
  private moveIndicator: Phaser.GameObjects.Graphics | null = null;
  private frozenOverlay: Phaser.GameObjects.Container | null = null;
  private waterTiles: Phaser.GameObjects.Image[] = [];
  private shallowWaterTiles: Phaser.GameObjects.Image[] = [];
  private waterTime = 0;

  constructor() {
    super({ key: "ArenaScene" });
  }

  async create(): Promise<void> {
    // Clean up any previous state (in case scene restarts)
    this.playerSprites.forEach((s) => s.destroy());
    this.playerSprites.clear();
    this.monsterSprites.forEach((s) => s.destroy());
    this.monsterSprites.clear();
    this.room = null;
    this.localSessionId = "";
    this.currentTargetId = "";
    this.currentMonsterTargetId = "";
    this.waterTiles = [];
    this.shallowWaterTiles = [];
    this.waterTime = 0;

    // Always build procedural map (supports the new expanded layout with beach/water)
    this.buildMap();

    // Set up camera with proper bounds
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Move indicator (click destination marker)
    this.moveIndicator = this.add.graphics();
    this.moveIndicator.setDepth(1);

    // Connect to game server
    const token = this.registry.get("token") as string;
    const className = this.registry.get("className") as string;
    const gender = (this.registry.get("gender") as string) || "m";

    try {
      this.room = await joinArena(token, className, gender);
      this.localSessionId = this.room.sessionId;

      this.setupStateListeners();
      this.setupMessageListeners();

      // Initialize input
      const classDef = ALL_CLASSES[className as PlayerClass];
      const skillIds = classDef ? classDef.skills.map(s => s.id) : [];
      this.inputManager.init(this, this.room, skillIds);

      // Start UI scene
      this.scene.launch("UIScene", { room: this.room, className });

    } catch (err: any) {
      console.error("Failed to join arena:", err);
      // If token is invalid, clear it and redirect to login
      if (err?.message?.includes("Invalid token") || err?.code === 4000) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        window.location.href = "/login";
        return;
      }
      this.add.text(640, 360, "Failed to connect to server.\nClick to return to login.", {
        fontSize: "24px",
        color: "#ef4444",
        align: "center",
      }).setOrigin(0.5).setScrollFactor(0).setInteractive().on("pointerdown", () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      });
    }

    // Click to target OR click to move (RO style)
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.room) return;
      if (pointer.rightButtonDown()) return; // handled separately
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      // Check if clicking on a player (target selection)
      let closestDist = 40;
      let closestId = "";
      let isMonster = false;

      this.playerSprites.forEach((sprite, id) => {
        if (id === this.localSessionId) return;
        const dist = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, sprite.x, sprite.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
          isMonster = false;
        }
      });

      // Also check monsters
      this.monsterSprites.forEach((sprite, id) => {
        const dist = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, sprite.x, sprite.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
          isMonster = true;
        }
      });

      if (closestId && isMonster) {
        this.setMonsterTarget(closestId);
      } else if (closestId) {
        this.setTarget(closestId);
        this.clearMonsterTarget();
      } else {
        // Clicked on ground - move there (RO style)
        this.room.send("move_to", { x: worldPoint.x, y: worldPoint.y });
        this.showMoveIndicator(worldPoint.x, worldPoint.y);
      }
    });

    // Right-click to target
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() && this.room) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        let closestDist = 60;
        let closestId = "";
        this.playerSprites.forEach((sprite, id) => {
          if (id === this.localSessionId) return;
          const dist = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, sprite.x, sprite.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = id;
          }
        });
        if (closestId) this.setTarget(closestId);
      }
    });

    // Disable right-click context menu
    this.input.mouse?.disableContextMenu();
  }

  private showMoveIndicator(x: number, y: number): void {
    if (!this.moveIndicator) return;
    this.moveIndicator.clear();
    this.moveIndicator.lineStyle(2, 0x22c55e, 0.8);
    this.moveIndicator.strokeCircle(x, y, 8);
    this.moveIndicator.fillStyle(0x22c55e, 0.3);
    this.moveIndicator.fillCircle(x, y, 6);

    // Fade out
    this.tweens.add({
      targets: this.moveIndicator,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        if (this.moveIndicator) {
          this.moveIndicator.alpha = 1;
          this.moveIndicator.clear();
        }
      },
    });
  }

  private waterFrameIndex = 0;
  private waterFrameTimer = 0;
  private readonly WATER_FRAME_COUNT = 18;
  private readonly WATER_FRAME_MS = 120; // ms per water frame

  private buildMap(): void {
    const layout = generateMapLayout();
    const rows = layout.length;
    const cols = layout[0].length;

    this.waterTiles = [];
    this.shallowWaterTiles = [];

    const hasMapBg = this.registry.get("hasMapBg");
    const hasRealWater = this.registry.get("hasRealWater");

    // === If we have a pre-rendered map background, use it (fast path) ===
    if (hasMapBg) {
      const bg = this.add.image(0, 0, "map_bg");
      bg.setOrigin(0, 0);
      bg.setDepth(0);

      // Still place animated water tiles on top of the static background
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const t = layout[row][col];
          if (t !== TileType.Water && t !== TileType.ShallowWater) continue;
          const x = col * TILE + TILE / 2;
          const y = row * TILE + TILE / 2;
          if (t === TileType.Water && hasRealWater) {
            const img = this.add.image(x, y, "water_frame_0");
            img.setDisplaySize(TILE, TILE);
            img.setData("baseY", y);
            img.setDepth(0.01);
            this.waterTiles.push(img);
          }
        }
      }

      // Fountain (animated, so stays as live objects)
      const prCenterX = 25 * TILE + TILE / 2;
      const prCenterY = 11 * TILE + TILE / 2;
      this.buildFountain(prCenterX, prCenterY);
      this.placeDecorations(layout);
      return;
    }

    // === Fallback: procedural rendering (baked to RenderTexture) ===
    const hasRealTiles = this.registry.get("hasRealTiles");
    const hasRealSand = this.registry.get("hasRealSand");

    // --- Layer 1: Water background ---
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * TILE + TILE / 2;
        const y = row * TILE + TILE / 2;
        const t = layout[row][col];
        if (t === TileType.Water || t === TileType.ShallowWater) {
          let img: Phaser.GameObjects.Image;
          if (t === TileType.Water) {
            img = this.add.image(x, y, hasRealWater ? "water_frame_0" : "water_tile");
            img.setDisplaySize(TILE, TILE);
            img.setData("baseY", y);
            this.waterTiles.push(img);
          } else {
            img = this.add.image(x, y, hasRealSand ? "shallow1" : "shallow_water_tile");
            img.setDisplaySize(TILE, TILE);
            img.setData("baseY", y);
            this.shallowWaterTiles.push(img);
          }
        }
      }
    }

    // --- Layer 2: Land mass (baked to RenderTexture for performance) ---
    // All smooth regions, textures, and boundary blending are drawn to a
    // temporary scene, then stamped into a single static texture.
    const tempObjects: Phaser.GameObjects.GameObject[] = [];

    // Draw smooth sand region
    const sandGfx = this.add.graphics();
    sandGfx.setDepth(0.1);
    sandGfx.fillStyle(0xd4b882);
    this.drawSmoothRegion(sandGfx, layout, rows, cols, (t) =>
      t === TileType.Sand || t === TileType.Grass || t === TileType.Stone || t === TileType.Path
    );
    tempObjects.push(sandGfx);

    // Overlay sand textures using tiled images at 2x2 blocks
    const REAL_SCALE = TILE * 2;
    const sandTexKeys = hasRealSand ? ["sand1", "sand2", "sand3"] : [];
    const stoneTexKeys = hasRealTiles ? ["prt_stone1", "prt_stone2", "prt_stone3"] : [];
    const placed = new Set<string>();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const t = layout[row][col];
        const blockR = Math.floor(row / 2);
        const blockC = Math.floor(col / 2);
        const bk = `${blockR}_${blockC}`;
        const hash = ((row * 7 + col * 13 + row * col) % 97);

        if (t === TileType.Sand && sandTexKeys.length > 0 && !placed.has("d" + bk)) {
          placed.add("d" + bk);
          const bx = blockC * 2 * TILE + TILE;
          const by = blockR * 2 * TILE + TILE;
          const key = hash % 10 === 0 ? sandTexKeys[1] : sandTexKeys[0];
          const img = this.add.image(bx, by, key);
          img.setDisplaySize(REAL_SCALE, REAL_SCALE);
          img.setDepth(0.2);
          tempObjects.push(img);
        }
      }
    }

    // Draw smooth grass border around prontera
    const grassGfx = this.add.graphics();
    grassGfx.setDepth(0.3);
    grassGfx.fillStyle(0x5a8c4a);
    this.drawSmoothRegion(grassGfx, layout, rows, cols, (t) =>
      t === TileType.Grass || t === TileType.Stone || t === TileType.Path
    );
    tempObjects.push(grassGfx);

    // Overlay grass textures
    if (hasRealSand) {
      const grassTexKeys = ["beach_grass3", "grass_path"];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (layout[row][col] !== TileType.Grass) continue;
          const bk = `g${Math.floor(row / 2)}_${Math.floor(col / 2)}`;
          if (placed.has(bk)) continue;
          placed.add(bk);
          const bx = Math.floor(col / 2) * 2 * TILE + TILE;
          const by = Math.floor(row / 2) * 2 * TILE + TILE;
          const hash = ((row * 7 + col * 13) % 97);
          const img = this.add.image(bx, by, grassTexKeys[hash % grassTexKeys.length]);
          img.setDisplaySize(REAL_SCALE, REAL_SCALE);
          img.setDepth(0.35);
          tempObjects.push(img);
        }
      }
    }

    // Draw smooth stone prontera area
    const stoneGfx = this.add.graphics();
    stoneGfx.setDepth(0.4);
    stoneGfx.fillStyle(0xc4a882);
    this.drawSmoothRegion(stoneGfx, layout, rows, cols, (t) =>
      t === TileType.Stone || t === TileType.Path
    );
    tempObjects.push(stoneGfx);

    // Overlay stone textures
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const t = layout[row][col];
        if (t !== TileType.Stone && t !== TileType.Path) continue;
        const bk = `s${Math.floor(row / 2)}_${Math.floor(col / 2)}`;
        if (placed.has(bk)) continue;
        placed.add(bk);
        const bx = Math.floor(col / 2) * 2 * TILE + TILE;
        const by = Math.floor(row / 2) * 2 * TILE + TILE;
        const hash = ((row * 7 + col * 13 + row * col) % 97);
        if (t === TileType.Path && hasRealTiles) {
          const img = this.add.image(bx, by, "prt_dark");
          img.setDisplaySize(REAL_SCALE, REAL_SCALE);
          img.setDepth(0.5);
          tempObjects.push(img);
        } else if (stoneTexKeys.length > 0) {
          const img = this.add.image(bx, by, stoneTexKeys[hash % stoneTexKeys.length]);
          img.setDisplaySize(REAL_SCALE, REAL_SCALE);
          img.setDepth(0.5);
          tempObjects.push(img);
        }
      }
    }

    // Boundary smoothing layers
    const boundaryGfxList = this.createBoundarySmoothing(layout, rows, cols);
    tempObjects.push(...boundaryGfxList);

    // Prontera emblem
    if (hasRealTiles) {
      const prCX = 25 * TILE + TILE / 2;
      const prCY = 11 * TILE + TILE / 2;
      const emblem = this.add.image(prCX, prCY, "prt_emblem");
      emblem.setDisplaySize(TILE * 3, TILE * 3);
      emblem.setDepth(0.6);
      tempObjects.push(emblem);
    }

    // === BAKE all land objects to a single static RenderTexture ===
    // Sort by depth so they composite in the right order
    tempObjects.sort((a, b) => ((a as any).depth || 0) - ((b as any).depth || 0));

    const landRT = this.add.renderTexture(0, 0, MAP_WIDTH, MAP_HEIGHT);
    landRT.setOrigin(0, 0);
    landRT.setDepth(0.5);
    for (const obj of tempObjects) {
      landRT.draw(obj);
      obj.destroy();
    }

    // Prontera fountain (has animations, stays as live objects)
    const prCenterX = 25 * TILE + TILE / 2;
    const prCenterY = 11 * TILE + TILE / 2;
    this.buildFountain(prCenterX, prCenterY);

    this.placeDecorations(layout);
  }

  /** Draw a filled smooth region for all tiles matching the filter */
  private drawSmoothRegion(
    gfx: Phaser.GameObjects.Graphics,
    layout: number[][],
    rows: number,
    cols: number,
    filter: (t: number) => boolean,
  ): void {
    const isMatch = (r: number, c: number) =>
      r >= 0 && r < rows && c >= 0 && c < cols && filter(layout[r][c]);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!filter(layout[row][col])) continue;
        const cx = col * TILE + TILE / 2;
        const cy = row * TILE + TILE / 2;

        // Count matching neighbors
        let allMatch = true;
        for (let dr = -1; dr <= 1 && allMatch; dr++) {
          for (let dc = -1; dc <= 1 && allMatch; dc++) {
            if (dr === 0 && dc === 0) continue;
            if (!isMatch(row + dr, col + dc)) allMatch = false;
          }
        }

        if (allMatch) {
          // Interior tile: solid square fill (clean, no gaps)
          gfx.fillRect(col * TILE, row * TILE, TILE, TILE);
        } else {
          // Boundary tile: noise-modulated circle for organic coastline
          const seed = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453;
          const noise = (seed - Math.floor(seed)) * 0.12;
          gfx.fillCircle(cx, cy, TILE * (0.57 + noise));

          const up = isMatch(row - 1, col), down = isMatch(row + 1, col);
          const left = isMatch(row, col - 1), right = isMatch(row, col + 1);

          // Wide bands connecting to cardinal neighbors
          if (right) gfx.fillRect(cx, cy - TILE * 0.47, TILE, TILE * 0.94);
          if (down) gfx.fillRect(cx - TILE * 0.47, cy, TILE * 0.94, TILE);
          if (left) gfx.fillRect(col * TILE, cy - TILE * 0.47, TILE * 0.54, TILE * 0.94);
          if (up) gfx.fillRect(cx - TILE * 0.47, row * TILE, TILE * 0.94, TILE * 0.54);

          // Fill concave corners (L-shaped neighbor groups)
          if (right && down && isMatch(row + 1, col + 1))
            gfx.fillRect(cx, cy, TILE / 2 + 2, TILE / 2 + 2);
          if (right && up && isMatch(row - 1, col + 1))
            gfx.fillRect(cx, row * TILE - 2, TILE / 2 + 2, TILE / 2 + 2);
          if (left && down && isMatch(row + 1, col - 1))
            gfx.fillRect(col * TILE - 2, cy, TILE / 2 + 2, TILE / 2 + 2);
          if (left && up && isMatch(row - 1, col - 1))
            gfx.fillRect(col * TILE - 2, row * TILE - 2, TILE / 2 + 2, TILE / 2 + 2);

          // Soft protrusions toward non-matching neighbors for wavy edge
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              if (isMatch(row + dr, col + dc)) continue;
              const ns = Math.sin((row + dr) * 45.17 + (col + dc) * 97.31) * 43758.5453;
              const nv = ns - Math.floor(ns);
              gfx.fillCircle(
                cx + dc * TILE * (0.1 + nv * 0.12),
                cy + dr * TILE * (0.1 + nv * 0.12),
                TILE * (0.32 + nv * 0.1),
              );
            }
          }
        }
      }
    }
  }

  /** Create multi-layer gradient smoothing at ALL zone boundaries (returns Graphics for baking) */
  private createBoundarySmoothing(layout: number[][], rows: number, cols: number): Phaser.GameObjects.Graphics[] {
    // Define zone transition layers (from, to, blend color, depths/alphas)
    const transitions: {
      from: TileType[];
      to: TileType[];
      color: number;
      layers: { alpha: number; radius: number; depth: number }[];
    }[] = [
      {
        // Sand → ShallowWater: warm sand bleed into water
        from: [TileType.ShallowWater],
        to: [TileType.Sand, TileType.Grass],
        color: 0xd4b882,
        layers: [
          { alpha: 0.15, radius: TILE * 1.6, depth: 0.11 },
          { alpha: 0.22, radius: TILE * 1.1, depth: 0.13 },
          { alpha: 0.30, radius: TILE * 0.7, depth: 0.15 },
        ],
      },
      {
        // ShallowWater → Water: turquoise bleed into deep
        from: [TileType.Water],
        to: [TileType.ShallowWater],
        color: 0x2d8ab8,
        layers: [
          { alpha: 0.15, radius: TILE * 1.4, depth: 0.04 },
          { alpha: 0.20, radius: TILE * 0.9, depth: 0.05 },
        ],
      },
      {
        // Grass → Sand: green bleed into sand
        from: [TileType.Sand],
        to: [TileType.Grass],
        color: 0x5a8c4a,
        layers: [
          { alpha: 0.12, radius: TILE * 1.3, depth: 0.22 },
          { alpha: 0.18, radius: TILE * 0.85, depth: 0.24 },
        ],
      },
      {
        // Stone → Grass: stone bleed into grass
        from: [TileType.Grass],
        to: [TileType.Stone, TileType.Path],
        color: 0xb8a888,
        layers: [
          { alpha: 0.14, radius: TILE * 1.2, depth: 0.32 },
          { alpha: 0.20, radius: TILE * 0.75, depth: 0.34 },
        ],
      },
    ];

    // Create one Graphics per unique depth to batch draws
    const gfxByDepth = new Map<number, Phaser.GameObjects.Graphics>();
    const getGfx = (depth: number) => {
      if (!gfxByDepth.has(depth)) {
        const g = this.add.graphics();
        g.setDepth(depth);
        gfxByDepth.set(depth, g);
      }
      return gfxByDepth.get(depth)!;
    };

    for (const tr of transitions) {
      const fromSet = new Set(tr.from);
      const toSet = new Set(tr.to);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (!fromSet.has(layout[row][col])) continue;
          const cx = col * TILE + TILE / 2;
          const cy = row * TILE + TILE / 2;

          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = row + dr, nc = col + dc;
              if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
              if (!toSet.has(layout[nr][nc])) continue;

              const nx = nc * TILE + TILE / 2;
              const ny = nr * TILE + TILE / 2;
              const mx = (cx + nx) / 2;
              const my = (cy + ny) / 2;

              // Noise-based offset for organic blending
              const seed = Math.sin(row * 31.7 + col * 47.3 + dr * 13.1) * 43758.5453;
              const nv = (seed - Math.floor(seed)) * 0.3;

              for (const layer of tr.layers) {
                const gfx = getGfx(layer.depth);
                gfx.fillStyle(tr.color, layer.alpha);
                const r = layer.radius * (0.85 + nv);
                gfx.fillCircle(mx, my, r);
                // Extra circle offset slightly for more organic shape
                gfx.fillCircle(
                  mx + dc * TILE * 0.15 * nv,
                  my + dr * TILE * 0.15 * nv,
                  r * 0.7,
                );
              }
            }
          }
        }
      }
    }

    return [...gfxByDepth.values()];
  }

  private buildFountain(cx: number, cy: number): void {
    const container = this.add.container(cx, cy);
    container.setDepth(cy + 5);

    const g = this.add.graphics();

    // === Ground shadow ===
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(0, 22, 190, 65);

    // === Outer stone base (wide octagonal platform) ===
    // Stepped base for 3D depth
    g.fillStyle(0x6a5d4e);
    g.fillEllipse(0, 18, 172, 62);
    g.fillStyle(0x7d6f5e);
    g.fillEllipse(0, 15, 168, 59);
    g.fillStyle(0x9e8e7a);
    g.fillEllipse(0, 12, 162, 56);
    // Top surface with subtle highlight
    g.fillStyle(0xb8a894);
    g.fillEllipse(0, 10, 154, 52);
    // Carved rim detail
    g.lineStyle(1.5, 0x8a7a66, 0.6);
    g.strokeEllipse(0, 10, 156, 53);
    g.lineStyle(1, 0xc8b8a0, 0.4);
    g.strokeEllipse(0, 9, 150, 50);

    // === Lower water pool ===
    // Dark water base
    g.fillStyle(0x164878, 0.95);
    g.fillEllipse(0, 10, 134, 46);
    // Main water surface
    g.fillStyle(0x1e6ca0, 0.9);
    g.fillEllipse(0, 9, 130, 44);
    // Reflection highlights
    g.fillStyle(0x3a8cd0, 0.5);
    g.fillEllipse(-20, 5, 55, 18);
    g.fillStyle(0x5aace0, 0.35);
    g.fillEllipse(22, 12, 42, 14);
    g.fillStyle(0x8ccef8, 0.2);
    g.fillEllipse(-10, 3, 30, 10);

    // === Middle pedestal (column visible in isometric) ===
    // Front face of pedestal
    g.fillStyle(0x8a7a66);
    g.fillRect(-20, -26, 40, 38);
    // Left shadow
    g.fillStyle(0x7a6a56, 0.7);
    g.fillRect(-20, -26, 12, 38);
    // Right highlight
    g.fillStyle(0xa89a86, 0.5);
    g.fillRect(8, -26, 12, 38);
    // Decorative molding rings
    g.fillStyle(0xb0a090);
    g.fillEllipse(0, -24, 46, 16);
    g.fillStyle(0x9a8a76);
    g.fillEllipse(0, -22, 42, 14);
    g.fillStyle(0xb0a090);
    g.fillEllipse(0, 10, 46, 16);

    // === Upper basin ===
    g.fillStyle(0x7d6f5e);
    g.fillEllipse(0, -28, 70, 26);
    g.fillStyle(0x9e8e7a);
    g.fillEllipse(0, -30, 64, 22);
    g.fillStyle(0xb8a894);
    g.fillEllipse(0, -32, 58, 19);
    // Rim detail
    g.lineStyle(1, 0x8a7a66, 0.5);
    g.strokeEllipse(0, -31, 60, 20);
    // Upper water
    g.fillStyle(0x1a5c9e, 0.85);
    g.fillEllipse(0, -33, 48, 15);
    g.fillStyle(0x3a8cd0, 0.5);
    g.fillEllipse(-6, -35, 22, 8);
    g.fillStyle(0x6ab8e8, 0.3);
    g.fillEllipse(4, -34, 16, 6);

    // === Central spire/spout ===
    // Column
    g.fillStyle(0x9a8a76);
    g.fillRect(-5, -62, 10, 32);
    // Light side
    g.fillStyle(0xb8a894, 0.6);
    g.fillRect(-5, -62, 4, 32);
    // Dark side
    g.fillStyle(0x7a6a56, 0.4);
    g.fillRect(2, -62, 3, 32);
    // Top ornament (finial ball)
    g.fillStyle(0xb0a090);
    g.fillCircle(0, -64, 7);
    g.fillStyle(0xc8b8a0);
    g.fillCircle(-1, -65, 5);
    g.fillStyle(0xddd0c0, 0.6);
    g.fillCircle(-2, -67, 3);

    // === Water streams (4 arcing parabolic streams) ===
    for (let s = 0; s < 4; s++) {
      const dir = s < 2 ? -1 : 1;
      const spread = s % 2 === 0 ? 1.0 : 0.65;
      g.lineStyle(1.5, 0x6ab8e8, 0.55);
      g.beginPath();
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const sx = dir * spread * 35 * t;
        const sy = -60 + t * 55 - Math.sin(t * Math.PI) * 22;
        if (i === 0) g.moveTo(sx, sy); else g.lineTo(sx, sy);
      }
      g.strokePath();
      // Thinner white highlight on stream
      g.lineStyle(0.8, 0xaaddf8, 0.3);
      g.beginPath();
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const sx = dir * spread * 35 * t - 0.5;
        const sy = -60 + t * 55 - Math.sin(t * Math.PI) * 22 - 1;
        if (i === 0) g.moveTo(sx, sy); else g.lineTo(sx, sy);
      }
      g.strokePath();
    }

    container.add(g);

    // === Animated water droplets (spray) ===
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const dist = 5 + Math.random() * 10;
      const startX = Math.cos(angle) * dist * 0.3;
      const startY = -62 + Math.sin(angle) * dist * 0.15;
      const endX = Math.cos(angle) * (30 + Math.random() * 20);
      const endY = 8 + Math.abs(Math.sin(angle)) * 8;

      const drop = this.add.circle(startX, startY, 1 + Math.random() * 1.2, 0x8ccef8, 0.65);
      container.add(drop);
      this.tweens.add({
        targets: drop,
        x: endX,
        y: endY,
        alpha: 0,
        duration: 900 + Math.random() * 700,
        delay: i * 65 + Math.random() * 200,
        repeat: -1,
        ease: "Quad.easeIn",
        onRepeat: () => {
          drop.x = startX + (Math.random() - 0.5) * 3;
          drop.y = startY;
          drop.alpha = 0.65;
        },
      });
    }

    // === Pool surface sparkles ===
    for (let i = 0; i < 8; i++) {
      const sx = (Math.random() - 0.5) * 100;
      const sy = 8 + (Math.random() - 0.5) * 20;
      const sparkle = this.add.circle(sx, sy, 1.5, 0xffffff, 0.5);
      container.add(sparkle);
      this.tweens.add({
        targets: sparkle,
        alpha: 0,
        scale: 2.5,
        duration: 500 + Math.random() * 500,
        delay: Math.random() * 1200,
        repeat: -1,
        onRepeat: () => {
          sparkle.x = (Math.random() - 0.5) * 100;
          sparkle.y = 8 + (Math.random() - 0.5) * 20;
          sparkle.alpha = 0.5;
          sparkle.setScale(1);
        },
      });
    }

    // === Ripple rings on pool surface ===
    for (let i = 0; i < 3; i++) {
      const ripple = this.add.ellipse(
        (Math.random() - 0.5) * 40, 10 + (Math.random() - 0.5) * 10,
        10, 4, 0x8ccef8, 0,
      );
      ripple.setStrokeStyle(1, 0x8ccef8, 0.3);
      container.add(ripple);
      this.tweens.add({
        targets: ripple,
        scaleX: 4,
        scaleY: 3,
        alpha: 0,
        duration: 2000 + Math.random() * 1000,
        delay: i * 800,
        repeat: -1,
        onRepeat: () => {
          ripple.x = (Math.random() - 0.5) * 40;
          ripple.setScale(1);
          ripple.alpha = 1;
        },
      });
    }
  }

  private placeDecorations(layout: number[][]): void {
    const rows = layout.length;
    const cols = layout[0].length;

    // Trees along the grass border of prontera
    const treeSpots = [
      [5, 14], [5, 18], [5, 22], [5, 28], [5, 32], [5, 36],
      [17, 14], [17, 18], [17, 22], [17, 28], [17, 32], [17, 36],
      [7, 13], [10, 13], [13, 13], [7, 37], [10, 37], [13, 37],
    ];
    for (const [r, c] of treeSpots) {
      if (r < rows && c < cols) {
        const x = c * TILE + TILE / 2;
        const y = r * TILE + TILE / 2;
        this.add.image(x, y - 10, "tree").setDepth(y + 10);
      }
    }

    // Lamps along the prontera paths
    const lampSpots = [
      [8, 25], [14, 25], [11, 20], [11, 30],
      [8, 20], [8, 30], [14, 20], [14, 30],
    ];
    for (const [r, c] of lampSpots) {
      if (r < rows && c < cols) {
        const x = c * TILE + TILE / 2;
        const y = r * TILE + TILE / 2;
        this.add.image(x, y - 8, "lamp").setDepth(y + 10);
      }
    }

    // Banners at prontera entrances
    const bannerSpots = [
      [5, 24], [5, 26], [17, 24], [17, 26],
    ];
    for (const [r, c] of bannerSpots) {
      if (r < rows && c < cols) {
        const x = c * TILE + TILE / 2;
        const y = r * TILE + TILE / 2;
        this.add.image(x, y - 12, "banner").setDepth(y + 10);
      }
    }

    // Realistic palm trees on sand near water
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (layout[r][c] !== TileType.Sand) continue;
        let nearWater = false;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if (layout[nr][nc] === TileType.ShallowWater || layout[nr][nc] === TileType.Water) {
                nearWater = true;
              }
            }
          }
        }
        if (nearWater) {
          const hash = (r * 7 + c * 13) % 23;
          if (hash < 2) {
            const x = c * TILE + TILE / 2;
            const y = r * TILE + TILE / 2;
            this.buildPalmTree(x, y, hash);
          }
        }
      }
    }

    // Bushes scattered on grass tiles
    const bushSpots = [
      [4, 15], [4, 21], [4, 29], [4, 35],
      [18, 15], [18, 21], [18, 29], [18, 35],
      [6, 12], [12, 12], [6, 38], [12, 38],
    ];
    for (const [r, c] of bushSpots) {
      if (r < rows && c < cols && layout[r][c] === TileType.Grass) {
        const x = c * TILE + TILE / 2;
        const y = r * TILE + TILE / 2;
        this.add.image(x, y, "bush").setDepth(y + 10);
      }
    }
  }

  private buildPalmTree(x: number, y: number, variant: number): void {
    const container = this.add.container(x, y);
    container.setDepth(y + 10);
    const lean = variant % 2 === 0 ? 1 : -1;
    const scale = 0.9 + (variant % 3) * 0.12;

    const g = this.add.graphics();

    // === Ground shadow ===
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(lean * 20, 14, 55 * scale, 16);

    // === TRUNK (RO-style: thick, columnar, gentle curve, bark rings) ===
    const trunkSegs = 14;
    const trunkH = 105 * scale;
    const baseW = 11 * scale;
    const topW = 5 * scale;

    const trunkPts: { x: number; y: number; w: number }[] = [];
    for (let i = 0; i <= trunkSegs; i++) {
      const t = i / trunkSegs;
      // Gentle S-curve (more natural than power curve)
      const curveX = lean * (Math.sin(t * Math.PI * 0.8) * 14 + t * 8) * scale;
      const curveY = -t * trunkH;
      // Width tapers but stays relatively thick (RO palms are chunky)
      const w = baseW + (topW - baseW) * t;
      trunkPts.push({ x: curveX, y: curveY, w });
    }

    // Draw trunk segments with bark texture
    for (let i = 0; i < trunkPts.length - 1; i++) {
      const a = trunkPts[i], b = trunkPts[i + 1];
      // Alternating warm-cool brown for ring segments
      const colors = [0x8B7355, 0x7D6548, 0x917B5A, 0x7A6340];
      g.fillStyle(colors[i % colors.length]);
      g.fillTriangle(a.x - a.w, a.y, a.x + a.w, a.y, b.x + b.w, b.y);
      g.fillTriangle(a.x - a.w, a.y, b.x - b.w, b.y, b.x + b.w, b.y);

      // Left highlight (light source from left)
      g.fillStyle(0xA89878, 0.35);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      g.fillTriangle(a.x - a.w, a.y, b.x - b.w, b.y, midX - (a.w + b.w) * 0.2, midY);

      // Right shadow
      g.fillStyle(0x5A4A38, 0.25);
      g.fillTriangle(a.x + a.w, a.y, b.x + b.w, b.y, midX + (a.w + b.w) * 0.2, midY);
    }

    // Bark ring lines (horizontal marks)
    g.lineStyle(0.8, 0x5A4A38, 0.45);
    for (let i = 1; i < trunkPts.length; i++) {
      const p = trunkPts[i];
      g.lineBetween(p.x - p.w * 0.85, p.y, p.x + p.w * 0.85, p.y);
    }

    const top = trunkPts[trunkPts.length - 1];

    // === CROWN BASE (bulgy green area where fronds emerge) ===
    g.fillStyle(0x4A6A28);
    g.fillCircle(top.x, top.y + 2, 8 * scale);
    g.fillStyle(0x5A7A30);
    g.fillCircle(top.x - 1, top.y, 7 * scale);

    // === COCONUTS ===
    const coconutCount = 3 + (variant % 2);
    for (let i = 0; i < coconutCount; i++) {
      const a = (i / coconutCount) * Math.PI * 1.4 + 0.6;
      const cr = 8 * scale;
      const ccx = top.x + Math.cos(a) * cr;
      const ccy = top.y + 3 + Math.sin(a) * cr * 0.35;
      // Brown coconut
      g.fillStyle(0x6B4E2A);
      g.fillCircle(ccx, ccy, 3.8 * scale);
      // Highlight
      g.fillStyle(0x8B6E4A, 0.5);
      g.fillCircle(ccx - 1, ccy - 1, 2.2 * scale);
    }

    // === FRONDS (RO-style: broad, gracefully arching, drooping tips) ===
    // RO palms have broad filled leaves, not individual leaflets
    const frondDefs = [
      { angle: -2.8, len: 52 }, { angle: -2.1, len: 56 },
      { angle: -1.4, len: 48 }, { angle: -0.6, len: 54 },
      { angle: 0.3, len: 50 },  { angle: 1.0, len: 55 },
      { angle: 1.7, len: 48 },  { angle: 2.4, len: 52 },
    ];

    for (const fd of frondDefs) {
      const angle = fd.angle + lean * 0.25;
      const frondLen = fd.len * scale;

      // Build the frond spine (curved path: arc out then droop)
      const spineSteps = 20;
      const spine: { x: number; y: number }[] = [];
      for (let i = 0; i <= spineSteps; i++) {
        const t = i / spineSteps;
        const outX = Math.cos(angle) * frondLen * t;
        const outY = Math.sin(angle) * frondLen * t * 0.45;
        // Progressive droop (stronger at tip, like real gravity)
        const droop = t * t * t * frondLen * 0.55;
        spine.push({
          x: top.x + outX,
          y: top.y - frondLen * 0.15 + outY + droop,
        });
      }

      // Draw broad filled leaf shape along the spine
      // Each frond is a filled shape: wide in the middle, narrow at both ends
      for (let i = 0; i < spine.length - 1; i++) {
        const a = spine[i], b = spine[i + 1];
        const t = i / spine.length;
        // Width peaks around 30% of length, then tapers
        const widthCurve = Math.sin(t * Math.PI) * (1 - t * 0.3);
        const width = (7 + widthCurve * 8) * scale;

        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.3) continue;
        const px = (-dy / len) * width;
        const py = (dx / len) * width;

        // Main leaf fill (darker green for depth)
        const shade = i % 2 === 0 ? 0x2E7D32 : 0x338A36;
        g.fillStyle(shade, 0.92);
        g.fillTriangle(a.x + px, a.y + py, a.x - px, a.y - py, b.x + px * 0.85, b.y + py * 0.85);
        g.fillTriangle(a.x - px, a.y - py, b.x - px * 0.85, b.y - py * 0.85, b.x + px * 0.85, b.y + py * 0.85);

        // Leaflet edges (jagged leaf detail every few segments)
        if (i > 2 && i % 3 === 0 && width > 3) {
          const leafletLen = width * 1.2;
          g.fillStyle(0x3A9A40, 0.75);
          // Left leaflet
          g.fillTriangle(
            a.x + px * 0.9, a.y + py * 0.9,
            a.x + px * 0.9 + py * 0.3 * leafletLen / width,
            a.y + py * 0.9 - px * 0.3 * leafletLen / width + leafletLen * 0.12,
            (a.x + b.x) / 2 + px * 0.5, (a.y + b.y) / 2 + py * 0.5,
          );
          // Right leaflet
          g.fillTriangle(
            a.x - px * 0.9, a.y - py * 0.9,
            a.x - px * 0.9 - py * 0.3 * leafletLen / width,
            a.y - py * 0.9 + px * 0.3 * leafletLen / width + leafletLen * 0.12,
            (a.x + b.x) / 2 - px * 0.5, (a.y + b.y) / 2 - py * 0.5,
          );
        }
      }

      // Highlight vein along spine center (lighter green)
      g.lineStyle(1.2 * scale, 0x4AAA4E, 0.5);
      g.beginPath();
      g.moveTo(spine[0].x, spine[0].y);
      for (let i = 1; i < spine.length; i++) {
        g.lineTo(spine[i].x, spine[i].y);
      }
      g.strokePath();

      // Darker midrib line
      g.lineStyle(1.8 * scale, 0x256B28, 0.6);
      g.beginPath();
      g.moveTo(spine[0].x, spine[0].y);
      for (let i = 1; i <= Math.min(spine.length - 1, 12); i++) {
        g.lineTo(spine[i].x, spine[i].y);
      }
      g.strokePath();
    }

    container.add(g);

    // Gentle sway animation
    this.tweens.add({
      targets: container,
      angle: lean * 1.5,
      duration: 3200 + variant * 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  update(_time: number, delta: number): void {
    this.inputManager.update();

    const dt = delta / 1000;
    this.playerSprites.forEach((sprite) => {
      sprite.interpolate(dt);
    });
    this.monsterSprites.forEach((sprite) => {
      sprite.interpolate(dt);
    });

    // Animate water tiles using real RO water frames
    const hasRealWater = this.registry.get("hasRealWater");
    this.waterTime += delta;
    this.waterFrameTimer += delta;

    if (hasRealWater && this.waterFrameTimer >= this.WATER_FRAME_MS) {
      this.waterFrameTimer -= this.WATER_FRAME_MS;
      this.waterFrameIndex = (this.waterFrameIndex + 1) % this.WATER_FRAME_COUNT;
      const frameKey = `water_frame_${this.waterFrameIndex}`;
      for (const tile of this.waterTiles) {
        tile.setTexture(frameKey);
        tile.setDisplaySize(TILE, TILE);
      }
    }

    // Gentle wave bob for all water tiles
    const wavePhase = this.waterTime / 1000;
    for (const tile of this.waterTiles) {
      const offset = (tile.x * 0.01 + tile.y * 0.008);
      tile.y = tile.getData("baseY") + Math.sin(wavePhase * 1.2 + offset) * 1.5;
    }
    for (const tile of this.shallowWaterTiles) {
      const offset = (tile.x * 0.012 + tile.y * 0.01);
      tile.y = tile.getData("baseY") + Math.sin(wavePhase * 1.5 + offset) * 1.0;
      tile.setAlpha(0.88 + Math.sin(wavePhase * 1.0 + offset * 2) * 0.12);
    }

    // Update frozen effect positions for all frozen players
    this.frozenEffects.forEach((container, playerId) => {
      const pSprite = this.playerSprites.get(playerId);
      if (pSprite) {
        container.setPosition(pSprite.x, pSprite.y);
        container.setDepth(pSprite.y + 1);
      }
    });

    // Camera follow local player
    const localSprite = this.playerSprites.get(this.localSessionId);
    if (localSprite) {
      this.cameras.main.centerOn(localSprite.x, localSprite.y);
    }
  }

  private setMonsterTarget(monsterId: string): void {
    this.clearMonsterTarget();
    this.setTarget(""); // clear player target
    this.currentMonsterTargetId = monsterId;
    const sprite = this.monsterSprites.get(monsterId);
    if (sprite) sprite.showTargetRing(true);

    // Auto-attack the monster
    if (this.room) {
      this.room.send("attack_monster", { monsterId });
    }
  }

  private clearMonsterTarget(): void {
    if (this.currentMonsterTargetId) {
      const old = this.monsterSprites.get(this.currentMonsterTargetId);
      if (old) old.showTargetRing(false);
      this.currentMonsterTargetId = "";
    }
  }

  private setTarget(targetId: string): void {
    if (this.currentTargetId) {
      const oldTarget = this.playerSprites.get(this.currentTargetId);
      if (oldTarget) oldTarget.showTargetRing(false);
    }

    this.currentTargetId = targetId;
    this.inputManager.setTarget(targetId);

    if (targetId) {
      const newTarget = this.playerSprites.get(targetId);
      if (newTarget) newTarget.showTargetRing(true);
    }

    this.scene.get("UIScene")?.registry.set("targetId", targetId);
  }

  private setupStateListeners(): void {
    if (!this.room) return;

    this.room.state.players.onAdd((player: any, sessionId: string) => {
      const isLocal = sessionId === this.localSessionId;
      const sprite = new PlayerSprite(
        this, sessionId, player.x, player.y,
        player.className, player.gender || "m", player.username, isLocal,
      );
      this.playerSprites.set(sessionId, sprite);

      player.onChange(() => {
        const s = this.playerSprites.get(sessionId);
        if (!s) return;
        s.setServerPosition(player.x, player.y);
        s.setDirection(player.direction);
        s.updateHP(player.hp, player.maxHp);
        s.setDead(!player.alive);
        s.setInvisible(player.invisible, isLocal);
        s.showCasting(!!player.castingSkillId);
      });
    });

    // Monster state sync
    this.room.state.monsters.onAdd((monster: any, monsterId: string) => {
      const sprite = new MonsterSprite(this, monsterId, monster.x, monster.y, monster.monsterType);
      this.monsterSprites.set(monsterId, sprite);

      monster.onChange(() => {
        const s = this.monsterSprites.get(monsterId);
        if (!s) return;
        if (monster.alive) {
          s.setServerPosition(monster.x, monster.y);
          s.updateHP(monster.hp, monster.maxHp);
        }
        if (monster.alive && s.alpha < 1) {
          s.revive();
        }
      });
    });

    this.room.state.monsters.onRemove((_monster: any, monsterId: string) => {
      const sprite = this.monsterSprites.get(monsterId);
      if (sprite) {
        sprite.destroy();
        this.monsterSprites.delete(monsterId);
      }
    });

    this.room.state.players.onRemove((_player: any, sessionId: string) => {
      const sprite = this.playerSprites.get(sessionId);
      if (sprite) {
        sprite.destroy();
        this.playerSprites.delete(sessionId);
      }
      if (sessionId === this.currentTargetId) {
        this.setTarget("");
      }
    });
  }

  shutdown(): void {
    leaveRoom();
    this.playerSprites.forEach((s) => s.destroy());
    this.playerSprites.clear();
    this.monsterSprites.forEach((s) => s.destroy());
    this.monsterSprites.clear();
    this.frozenEffects.forEach((c) => c.destroy());
    this.frozenEffects.clear();
    this.frozenOverlay = null;
    this.room = null;
  }

  private setupMessageListeners(): void {
    if (!this.room) return;

    this.room.onMessage("skill_effect", (data: any) => {
      const caster = this.playerSprites.get(data.casterId);
      // Play attack animation on the caster, aimed at the skill target position
      if (caster) {
        caster.playAttack(data.x, data.y);
      }
      spawnSkillEffect(this, data.skillId, data.x, data.y, caster?.x, caster?.y);
    });

    this.room.onMessage("basic_attack", (data: any) => {
      const attacker = this.playerSprites.get(data.attackerId);
      const target = this.playerSprites.get(data.targetId) || this.monsterSprites.get(data.targetId);

      if (attacker) {
        // Pass target position so the swing arc faces the opponent
        attacker.playAttack(target?.x, target?.y);
      }

      // Impact effect on the attacked character: sparks burst THROUGH them
      // from the attacker's direction and fly out the other side
      if (target && attacker) {
        const tx = target.x;
        const ty = target.y - 10;
        // Angle from attacker to target (the hit direction)
        const hitAngle = Math.atan2(ty - attacker.y, tx - attacker.x);

        // White impact flash on the target
        const flash = this.add.circle(tx, ty, 10, 0xffffff, 0.8).setDepth(target.depth + 5);
        this.tweens.add({ targets: flash, scale: 2.5, alpha: 0, duration: 150, onComplete: () => flash.destroy() });

        // Sparks flying THROUGH the target (continuing past in the hit direction)
        for (let i = 0; i < 6; i++) {
          // Spread sparks in a cone past the target
          const spreadAngle = hitAngle + (Math.random() - 0.5) * 1.0;
          const dist = 20 + Math.random() * 35;
          const spark = this.add.circle(tx, ty, 2 + Math.random() * 2, 0xffffcc, 0.9).setDepth(target.depth + 6);
          this.tweens.add({
            targets: spark,
            x: tx + Math.cos(spreadAngle) * dist,
            y: ty + Math.sin(spreadAngle) * dist,
            alpha: 0, scale: 0.3,
            duration: 180 + Math.random() * 120,
            onComplete: () => spark.destroy(),
          });
        }

        // A short slash line across the target perpendicular to hit direction
        const perpAngle = hitAngle + Math.PI / 2;
        const slashLen = 14;
        const hitSlash = this.add.graphics().setDepth(target.depth + 5);
        hitSlash.lineStyle(4, 0xffffff, 0.8);
        hitSlash.lineBetween(
          tx - Math.cos(perpAngle) * slashLen, ty - Math.sin(perpAngle) * slashLen,
          tx + Math.cos(perpAngle) * slashLen, ty + Math.sin(perpAngle) * slashLen,
        );
        hitSlash.lineStyle(2, 0xffffaa, 0.9);
        hitSlash.lineBetween(
          tx - Math.cos(perpAngle) * slashLen, ty - Math.sin(perpAngle) * slashLen,
          tx + Math.cos(perpAngle) * slashLen, ty + Math.sin(perpAngle) * slashLen,
        );
        this.tweens.add({
          targets: hitSlash,
          alpha: 0,
          duration: 150,
          onUpdate: (tween) => {
            const p = tween.progress;
            hitSlash.setPosition(Math.cos(hitAngle) * p * 8, Math.sin(hitAngle) * p * 8);
          },
          onComplete: () => hitSlash.destroy(),
        });
      }
    });

    this.room.onMessage("damage", (data: any) => {
      const sprite = this.playerSprites.get(data.targetId);
      if (sprite) {
        sprite.showDamageNumber(data.amount, data.blocked);
        if (!data.blocked && data.amount > 0) {
          sprite.playHurt();
        }
      }
    });

    this.room.onMessage("kill_feed", (data: any) => {
      this.events.emit("kill_feed", data);
    });

    this.room.onMessage("player_respawn", (data: any) => {
      const sprite = this.playerSprites.get(data.playerId);
      if (sprite) {
        sprite.setServerPosition(data.x, data.y);
        sprite.x = data.x;
        sprite.y = data.y;
      }
    });

    // --- Monster messages ---

    this.room.onMessage("monster_damage", (data: any) => {
      const sprite = this.monsterSprites.get(data.monsterId);
      if (sprite) {
        sprite.playHurt();
        sprite.showDamageNumber(data.amount);
      }
    });

    this.room.onMessage("monster_die", (data: any) => {
      const sprite = this.monsterSprites.get(data.monsterId);
      if (sprite) {
        sprite.playDie();
      }
      if (data.monsterId === this.currentMonsterTargetId) {
        this.clearMonsterTarget();
      }
    });

    this.room.onMessage("potion_drop", (data: any) => {
      this.showPotionPickup(data.x, data.y, data.playerId, data.healAmount);
    });

    this.room.onMessage("blue_potion_drop", (data: any) => {
      this.showBluePotionPickup(data.x, data.y, data.playerId, data.mpRecovered);
    });

    this.room.onMessage("frozen_apply", (data: any) => {
      this.showFrozenEffect(data.playerId);
    });

    this.room.onMessage("frozen_break", (data: any) => {
      this.removeFrozenEffect(data.playerId);
    });
  }

  // --- Visual effects for monsters ---

  private frozenEffects = new Map<string, Phaser.GameObjects.Container>();

  private showPotionPickup(x: number, y: number, playerId: string, healAmount: number): void {
    // Red potion icon (small red rectangle)
    const potion = this.add.container(x, y);
    const bottle = this.add.rectangle(0, 0, 10, 14, 0xdd2222);
    const cap = this.add.rectangle(0, -9, 6, 4, 0xffffff);
    potion.add([bottle, cap]);
    potion.setDepth(9999);

    const targetSprite = this.playerSprites.get(playerId);
    const targetX = targetSprite ? targetSprite.x : x;
    const targetY = targetSprite ? targetSprite.y - 20 : y - 40;

    // Animate potion flying to player
    this.tweens.add({
      targets: potion,
      x: targetX,
      y: targetY,
      scale: 0.5,
      duration: 400,
      ease: "Quad.easeIn",
      onComplete: () => {
        potion.destroy();
        // Show heal number
        if (targetSprite && healAmount > 0) {
          const healText = this.add.text(targetSprite.x, targetSprite.y - 30, `+${healAmount}`, {
            fontSize: "14px",
            fontStyle: "bold",
            color: "#22ff44",
            stroke: "#000000",
            strokeThickness: 2,
          }).setOrigin(0.5).setDepth(9999);

          this.tweens.add({
            targets: healText,
            y: healText.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => healText.destroy(),
          });
        }
      },
    });
  }

  private showBluePotionPickup(x: number, y: number, playerId: string, mpRecovered: number): void {
    // Blue potion icon
    const potion = this.add.container(x, y);
    const bottle = this.add.rectangle(0, 0, 10, 14, 0x2266dd);
    const cap = this.add.rectangle(0, -9, 6, 4, 0xffffff);
    potion.add([bottle, cap]);
    potion.setDepth(9999);

    const targetSprite = this.playerSprites.get(playerId);
    const targetX = targetSprite ? targetSprite.x : x;
    const targetY = targetSprite ? targetSprite.y - 20 : y - 40;

    this.tweens.add({
      targets: potion,
      x: targetX,
      y: targetY,
      scale: 0.5,
      duration: 400,
      ease: "Quad.easeIn",
      onComplete: () => {
        potion.destroy();
        if (targetSprite) {
          // Show MP recovery text
          const mpText = this.add.text(targetSprite.x, targetSprite.y - 30, "MP FULL", {
            fontSize: "14px",
            fontStyle: "bold",
            color: "#4488ff",
            stroke: "#000000",
            strokeThickness: 2,
          }).setOrigin(0.5).setDepth(9999);

          this.tweens.add({
            targets: mpText,
            y: mpText.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => mpText.destroy(),
          });

          // Blue sparkle effect around player
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spark = this.add.circle(targetSprite.x + Math.cos(angle) * 20, targetSprite.y + Math.sin(angle) * 20, 4, 0x4488ff, 0.8).setDepth(9999);
            this.tweens.add({
              targets: spark,
              y: spark.y - 25,
              alpha: 0,
              duration: 500,
              delay: i * 40,
              onComplete: () => spark.destroy(),
            });
          }
        }
      },
    });
  }

  private showFrozenEffect(playerId: string): void {
    const sprite = this.playerSprites.get(playerId);
    if (!sprite) return;

    // Remove existing frozen effect if any
    this.removeFrozenEffect(playerId);

    const container = this.add.container(sprite.x, sprite.y);
    const g = this.add.graphics();

    // --- Spiky transparent iceberg covering the entire character ---
    // The iceberg is drawn as a jagged polygon with transparency

    // Main ice body: a rough hexagonal shape with spiky protrusions
    const cx = 0, cy = -18; // Center of the iceberg (covers character)

    // Inner ice mass - semi-transparent blue
    g.fillStyle(0x7ec8e3, 0.25);
    g.beginPath();
    g.moveTo(cx, cy - 52);        // top spike
    g.lineTo(cx + 12, cy - 38);
    g.lineTo(cx + 24, cy - 44);   // top-right spike
    g.lineTo(cx + 20, cy - 28);
    g.lineTo(cx + 30, cy - 16);   // right upper spike
    g.lineTo(cx + 22, cy - 6);
    g.lineTo(cx + 28, cy + 8);    // right mid spike
    g.lineTo(cx + 20, cy + 18);
    g.lineTo(cx + 16, cy + 32);   // bottom-right
    g.lineTo(cx + 6, cy + 36);
    g.lineTo(cx, cy + 38);        // bottom center
    g.lineTo(cx - 6, cy + 36);
    g.lineTo(cx - 16, cy + 32);   // bottom-left
    g.lineTo(cx - 20, cy + 18);
    g.lineTo(cx - 28, cy + 8);    // left mid spike
    g.lineTo(cx - 22, cy - 6);
    g.lineTo(cx - 30, cy - 16);   // left upper spike
    g.lineTo(cx - 20, cy - 28);
    g.lineTo(cx - 24, cy - 44);   // top-left spike
    g.lineTo(cx - 12, cy - 38);
    g.closePath();
    g.fill();

    // Second layer: brighter ice core
    g.fillStyle(0xa8e0f0, 0.18);
    g.beginPath();
    g.moveTo(cx, cy - 42);
    g.lineTo(cx + 16, cy - 26);
    g.lineTo(cx + 22, cy - 8);
    g.lineTo(cx + 18, cy + 14);
    g.lineTo(cx + 10, cy + 30);
    g.lineTo(cx, cy + 34);
    g.lineTo(cx - 10, cy + 30);
    g.lineTo(cx - 18, cy + 14);
    g.lineTo(cx - 22, cy - 8);
    g.lineTo(cx - 16, cy - 26);
    g.closePath();
    g.fill();

    // Ice edge outlines (jagged crystalline edges)
    g.lineStyle(1.5, 0xc0e8ff, 0.55);
    g.beginPath();
    g.moveTo(cx, cy - 52);
    g.lineTo(cx + 12, cy - 38);
    g.lineTo(cx + 24, cy - 44);
    g.lineTo(cx + 20, cy - 28);
    g.lineTo(cx + 30, cy - 16);
    g.lineTo(cx + 22, cy - 6);
    g.lineTo(cx + 28, cy + 8);
    g.lineTo(cx + 20, cy + 18);
    g.lineTo(cx + 16, cy + 32);
    g.lineTo(cx + 6, cy + 36);
    g.lineTo(cx, cy + 38);
    g.lineTo(cx - 6, cy + 36);
    g.lineTo(cx - 16, cy + 32);
    g.lineTo(cx - 20, cy + 18);
    g.lineTo(cx - 28, cy + 8);
    g.lineTo(cx - 22, cy - 6);
    g.lineTo(cx - 30, cy - 16);
    g.lineTo(cx - 20, cy - 28);
    g.lineTo(cx - 24, cy - 44);
    g.lineTo(cx - 12, cy - 38);
    g.lineTo(cx, cy - 52);
    g.strokePath();

    // Internal crack lines (ice fracture detail)
    g.lineStyle(1, 0xd0f0ff, 0.3);
    // Vertical crack
    g.beginPath();
    g.moveTo(cx - 2, cy - 40);
    g.lineTo(cx + 4, cy - 20);
    g.lineTo(cx - 1, cy);
    g.lineTo(cx + 3, cy + 20);
    g.lineTo(cx, cy + 34);
    g.strokePath();
    // Diagonal cracks
    g.beginPath();
    g.moveTo(cx - 18, cy - 20);
    g.lineTo(cx - 4, cy - 10);
    g.lineTo(cx + 10, cy - 14);
    g.lineTo(cx + 22, cy - 8);
    g.strokePath();
    g.beginPath();
    g.moveTo(cx - 16, cy + 10);
    g.lineTo(cx - 2, cy + 6);
    g.lineTo(cx + 12, cy + 12);
    g.lineTo(cx + 20, cy + 18);
    g.strokePath();

    // Bright white highlight streaks (light reflection on ice)
    g.lineStyle(2, 0xffffff, 0.25);
    g.beginPath();
    g.moveTo(cx - 8, cy - 36);
    g.lineTo(cx - 6, cy - 22);
    g.lineTo(cx - 10, cy - 8);
    g.strokePath();
    g.lineStyle(1.5, 0xffffff, 0.2);
    g.beginPath();
    g.moveTo(cx + 8, cy - 30);
    g.lineTo(cx + 10, cy - 16);
    g.strokePath();

    container.add(g);

    // Sparkle particles that slowly drift inside the ice
    for (let i = 0; i < 8; i++) {
      const sx = (Math.random() - 0.5) * 36;
      const sy = cy + (Math.random() - 0.5) * 60;
      const sparkle = this.add.circle(sx, sy, 1.5, 0xffffff, 0.9);
      container.add(sparkle);
      this.tweens.add({
        targets: sparkle,
        alpha: 0.1,
        y: sy - 3 - Math.random() * 4,
        duration: 600 + Math.random() * 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Subtle pulsing glow around the iceberg
    const glow = this.add.graphics();
    glow.fillStyle(0x88ccff, 0.08);
    glow.fillCircle(cx, cy, 36);
    container.add(glow);
    this.tweens.add({
      targets: glow,
      alpha: 0.3,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Frost particles drifting down around the base
    for (let i = 0; i < 4; i++) {
      const frost = this.add.circle(
        (Math.random() - 0.5) * 40,
        cy + 30 + Math.random() * 10,
        1, 0xd0f0ff, 0.6
      );
      container.add(frost);
      this.tweens.add({
        targets: frost,
        x: frost.x + (Math.random() - 0.5) * 16,
        y: frost.y + 8 + Math.random() * 8,
        alpha: 0,
        duration: 1500 + Math.random() * 1000,
        repeat: -1,
        delay: Math.random() * 1500,
      });
    }

    container.setDepth(sprite.y + 1);
    this.frozenEffects.set(playerId, container);

    // Freeze flash + camera shake on apply
    this.cameras.main.shake(200, 0.003);

    // If it's the local player, also set the main frozen overlay for tracking
    if (playerId === this.localSessionId) {
      this.frozenOverlay = container;
    }
  }

  private removeFrozenEffect(playerId: string): void {
    const container = this.frozenEffects.get(playerId);
    if (!container) return;

    const shatterX = container.x;
    const shatterY = container.y - 18;

    // Big ice shatter explosion
    this.cameras.main.shake(150, 0.004);

    // Shatter into many jagged ice shards flying outward
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 10 + Math.random() * 15;
      const sx = shatterX + Math.cos(angle) * dist;
      const sy = shatterY + Math.sin(angle) * dist;

      // Each shard is a random triangle
      const size = 4 + Math.random() * 8;
      const shard = this.add.triangle(
        sx, sy,
        0, -size,
        size * 0.6, size * 0.4,
        -size * 0.6, size * 0.4,
        0xb0e0ff, 0.7
      ).setDepth(9999);
      shard.setRotation(Math.random() * Math.PI * 2);

      const flyDist = 40 + Math.random() * 50;
      this.tweens.add({
        targets: shard,
        x: sx + Math.cos(angle) * flyDist,
        y: sy + Math.sin(angle) * flyDist + 20,
        alpha: 0,
        rotation: shard.rotation + (Math.random() - 0.5) * 4,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 350 + Math.random() * 250,
        ease: "Power2",
        onComplete: () => shard.destroy(),
      });
    }

    // Ice dust cloud
    for (let i = 0; i < 10; i++) {
      const dust = this.add.circle(
        shatterX + (Math.random() - 0.5) * 30,
        shatterY + (Math.random() - 0.5) * 40,
        2 + Math.random() * 3,
        0xd0f0ff, 0.5
      ).setDepth(9998);
      this.tweens.add({
        targets: dust,
        y: dust.y - 15 - Math.random() * 20,
        x: dust.x + (Math.random() - 0.5) * 20,
        alpha: 0,
        scale: 2,
        duration: 500 + Math.random() * 300,
        onComplete: () => dust.destroy(),
      });
    }

    container.destroy();
    this.frozenEffects.delete(playerId);

    if (playerId === this.localSessionId) {
      this.frozenOverlay = null;
    }
  }
}
