import { Vector2 } from "./types";

export const TICK_RATE = 20; // ticks per second
export const TICK_MS = 1000 / TICK_RATE; // 50ms per tick

export const MAP_WIDTH = 3200;
export const MAP_HEIGHT = 2400;

export const RESPAWN_TIME_MS = 3000;
export const MAX_PLAYERS = 20;

export const MP_REGEN_PER_SECOND = 2;

export const MIN_DAMAGE = 1;

export const TILE_SIZE = 64;

// Tile types for the map grid
export enum TileType {
  Water = 0,
  Stone = 1,
  Path = 2,
  Sand = 3,
  Grass = 4,
  ShallowWater = 5,
}

// Walkable tile types
export const WALKABLE_TILES = new Set([
  TileType.Stone,
  TileType.Path,
  TileType.Sand,
  TileType.Grass,
]);

// Simple deterministic noise for organic beach curves
function noise2d(x: number, y: number): number {
  // Hash-based pseudo-random that's smooth when interpolated
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  // Smoothstep
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = noise2d(ix, iy);
  const n10 = noise2d(ix + 1, iy);
  const n01 = noise2d(ix, iy + 1);
  const n11 = noise2d(ix + 1, iy + 1);
  return n00 * (1 - sx) * (1 - sy) + n10 * sx * (1 - sy) + n01 * (1 - sx) * sy + n11 * sx * sy;
}

function fbmNoise(x: number, y: number): number {
  // 2-octave fractal noise for natural curves
  return smoothNoise(x, y) * 0.6 + smoothNoise(x * 2.1, y * 2.1) * 0.4;
}

// Generate the map layout grid (shared between client and server)
export function generateMapLayout(): number[][] {
  const cols = MAP_WIDTH / TILE_SIZE;  // 50
  const rows = MAP_HEIGHT / TILE_SIZE; // ~37.5 -> 38
  const grid: number[][] = [];

  const centerC = Math.floor(cols / 2);  // 25
  const centerR = Math.floor(rows / 2);  // 19

  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = TileType.Water;

      // --- Prontera zone: center-top area ---
      const inPronteraC = c >= 12 && c <= 38;
      const inPronteraR = r >= 4 && r <= 18;

      if (inPronteraC && inPronteraR) {
        if (c === 12 || c === 38 || r === 4 || r === 18) {
          grid[r][c] = TileType.Grass;
        } else if (c === 13 || c === 37 || r === 5 || r === 17) {
          grid[r][c] = TileType.Grass;
        } else {
          grid[r][c] = TileType.Stone;
        }

        const prCenterR = 11;
        const prCenterC = centerC;
        if (Math.abs(r - prCenterR) <= 1 || Math.abs(c - prCenterC) <= 1) {
          if (c > 13 && c < 37 && r > 5 && r < 17) {
            grid[r][c] = TileType.Path;
          }
        }
        continue;
      }

      // --- Sand/beach zone with smooth curvy edges ---
      // Use noise-modulated distance for organic coastline
      const dx = (c - centerC) / 23;
      const dy = (r - centerR) / 17;

      // Base island shape: ellipse with noise-warped edges
      const noiseVal = fbmNoise(c * 0.15, r * 0.15) * 0.35;
      const dist = Math.sqrt(dx * dx + dy * dy) - noiseVal;

      // The island has 3 zones: sand (close), sand (medium), water (far)
      if (dist < 0.72) {
        grid[r][c] = TileType.Sand;
      }

      // Connect prontera to beach smoothly
      if (r >= 17 && r <= 22 && c >= 14 && c <= 36) {
        grid[r][c] = TileType.Sand;
      }

      // Southern beach bulge with curvy edge
      if (r >= 15 && r <= 32) {
        const southDx = (c - centerC) / 20;
        const southDy = (r - 23) / 12;
        const southNoise = fbmNoise(c * 0.12 + 5, r * 0.12 + 3) * 0.3;
        const southDist = Math.sqrt(southDx * southDx + southDy * southDy) - southNoise;
        if (southDist < 0.75) {
          grid[r][c] = TileType.Sand;
        }
      }

      // Small cove indentation on the east side
      const coveNoise = fbmNoise(c * 0.2 + 10, r * 0.2) * 0.2;
      const coveDx = (c - (centerC + 12)) / 6;
      const coveDy = (r - centerR) / 8;
      if (Math.sqrt(coveDx * coveDx + coveDy * coveDy) + coveNoise < 0.8) {
        grid[r][c] = TileType.Sand;
      }
    }
  }

  // Second pass: add shallow water transition (2 tiles wide)
  for (let pass = 0; pass < 2; pass++) {
    const snap = grid.map(row => [...row]);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (snap[r][c] !== TileType.Water) continue;
        let nearLand = false;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const n = snap[nr][nc];
              if (pass === 0 && (n === TileType.Sand || n === TileType.Grass || n === TileType.Stone || n === TileType.Path)) {
                nearLand = true;
              }
              if (pass === 1 && n === TileType.ShallowWater) {
                nearLand = true;
              }
            }
          }
        }
        if (nearLand) grid[r][c] = TileType.ShallowWater;
      }
    }
  }

  return grid;
}

// Check if a world position is walkable
export function isWalkable(x: number, y: number, layout: number[][]): boolean {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  const rows = layout.length;
  const cols = layout[0]?.length || 0;
  if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
  return WALKABLE_TILES.has(layout[row][col]);
}

// 8 spawn points on sand/stone areas
export const SPAWN_POINTS: Vector2[] = [
  { x: 1200, y: 500 },
  { x: 1600, y: 400 },
  { x: 2000, y: 500 },
  { x: 2200, y: 900 },
  { x: 2000, y: 1400 },
  { x: 1600, y: 1600 },
  { x: 1200, y: 1400 },
  { x: 1000, y: 900 },
];

export function getRandomSpawnPoint(): Vector2 {
  return SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
}
