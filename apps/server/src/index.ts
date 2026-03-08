import "dotenv/config";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import express from "express";
import { ArenaRoom } from "./rooms/ArenaRoom";
import { initDb } from "./db";

const app = express();
const port = Number(process.env.PORT) || 2567;

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Colyseus monitor (admin panel)
app.use("/colyseus", monitor());

// Initialize database
initDb();

// Create Colyseus server
const gameServer = new Server({
  transport: new WebSocketTransport({ server: app.listen(port) }),
});

// Register game room
gameServer.define("arena", ArenaRoom);

console.log(`Game server listening on port ${port}`);
