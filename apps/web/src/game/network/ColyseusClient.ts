import { Client, Room } from "colyseus.js";

// In production, connect to same host (unified server). In dev, use separate port.
const GAME_SERVER_URL =
  process.env.NEXT_PUBLIC_GAME_SERVER_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
    : "ws://localhost:2567");

let client: Client | null = null;
let room: Room | null = null;

export function getClient(): Client {
  if (!client) {
    client = new Client(GAME_SERVER_URL);
  }
  return client;
}

export async function joinArena(token: string, className: string, gender: string = "m"): Promise<Room> {
  // Leave any existing room first to prevent duplicates
  if (room) {
    try { room.leave(); } catch { /* ignore */ }
    room = null;
  }

  const c = getClient();
  room = await c.joinOrCreate("arena", { token, className, gender });
  return room;
}

export function getRoom(): Room | null {
  return room;
}

export function leaveRoom(): void {
  if (room) {
    try { room.leave(); } catch { /* ignore */ }
    room = null;
  }
}
