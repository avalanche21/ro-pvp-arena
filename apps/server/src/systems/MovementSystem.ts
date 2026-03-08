import { MapSchema } from "@colyseus/schema";
import { Player } from "../schema/Player";
import { MAP_WIDTH, MAP_HEIGHT, generateMapLayout, isWalkable } from "@ro-pvp/shared";
import { clamp, normalize } from "../utils/spatial";

const ARRIVE_THRESHOLD = 5; // pixels - stop when within this distance of target

// Cache the map layout on first use
let mapLayout: number[][] | null = null;
function getMapLayout(): number[][] {
  if (!mapLayout) mapLayout = generateMapLayout();
  return mapLayout;
}

export function updateMovement(players: MapSchema<Player>, deltaMs: number): void {
  const dt = deltaMs / 1000;
  const layout = getMapLayout();

  players.forEach((player) => {
    if (!player.alive) return;
    if (player.castingSkillId) return; // can't move while casting

    let dx = 0;
    let dy = 0;

    // Click-to-move takes priority if active and no WASD input
    if (player.moveToX >= 0 && player.moveToY >= 0 && player.inputDx === 0 && player.inputDy === 0) {
      const toX = player.moveToX - player.x;
      const toY = player.moveToY - player.y;
      const dist = Math.sqrt(toX * toX + toY * toY);

      if (dist < ARRIVE_THRESHOLD) {
        // Arrived at destination
        player.moveToX = -1;
        player.moveToY = -1;
        return;
      }

      dx = toX / dist;
      dy = toY / dist;
    } else if (player.inputDx !== 0 || player.inputDy !== 0) {
      // WASD movement cancels click-to-move
      player.moveToX = -1;
      player.moveToY = -1;
      const n = normalize(player.inputDx, player.inputDy);
      dx = n.dx;
      dy = n.dy;
    }

    if (dx === 0 && dy === 0) return;

    const speed = player.moveSpeed * player.speedMod;
    const newX = clamp(player.x + dx * speed * dt, 16, MAP_WIDTH - 16);
    const newY = clamp(player.y + dy * speed * dt, 16, MAP_HEIGHT - 16);

    // Only move if the new position is walkable
    if (isWalkable(newX, newY, layout)) {
      player.x = newX;
      player.y = newY;
    } else {
      // Try sliding along axes
      if (isWalkable(newX, player.y, layout)) {
        player.x = newX;
      } else if (isWalkable(player.x, newY, layout)) {
        player.y = newY;
      }
      // Cancel click-to-move if blocked
      player.moveToX = -1;
      player.moveToY = -1;
    }

    // Update facing direction (8-directional)
    player.direction = getDirection(dx, dy);
  });
}

function getDirection(dx: number, dy: number): number {
  // RO direction convention: 0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE
  const angle = Math.atan2(dy, dx);
  const octant = Math.round((angle / (Math.PI / 4)) + 8) % 8;
  // atan2 octants: 0=right, 1=down-right, 2=down, 3=down-left, 4=left, 5=up-left, 6=up, 7=up-right
  // Map to RO: right=6, down-right=7, down=0, down-left=1, left=2, up-left=3, up=4, up-right=5
  const mapping = [6, 7, 0, 1, 2, 3, 4, 5];
  return mapping[octant];
}
