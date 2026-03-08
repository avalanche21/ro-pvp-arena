/**
 * Unified production server: serves both Colyseus (WebSocket) and Next.js (HTTP)
 * on a single port for Railway deployment.
 */
import "dotenv/config";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import express from "express";
import next from "next";
import { ArenaRoom } from "../apps/server/src/rooms/ArenaRoom";
import { initDb } from "../apps/server/src/db";

const port = Number(process.env.PORT) || 3000;
const dev = process.env.NODE_ENV !== "production";

async function main() {
  // Initialize database (optional)
  initDb();

  // Create Express app
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Colyseus monitor
  app.use("/colyseus", monitor());

  // Prepare Next.js
  const nextApp = next({ dev, dir: "./apps/web" });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  // Let Next.js handle all other routes
  app.all("*", (req: any, res: any) => {
    return handle(req, res);
  });

  // Start HTTP server
  const httpServer = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  // Attach Colyseus WebSocket to the same server
  const gameServer = new Server({
    transport: new WebSocketTransport({ server: httpServer }),
  });

  gameServer.define("arena", ArenaRoom);
  console.log("Colyseus game server attached");
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
