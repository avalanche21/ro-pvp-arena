"use client";

import { useEffect, useRef } from "react";
import { leaveRoom } from "../game/network/ColyseusClient";

interface GameCanvasProps {
  token: string;
  className: string;
  gender?: string;
}

export default function GameCanvas({ token, className, gender = "m" }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const creatingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current || creatingRef.current) return;
    creatingRef.current = true;

    // Dynamic import to avoid SSR issues with Phaser
    import("../game/PhaserGame").then(({ createGame }) => {
      // Double-check we haven't been cleaned up during the async import
      if (!containerRef.current) {
        creatingRef.current = false;
        return;
      }
      gameRef.current = createGame(containerRef.current, token, className, gender);
    });

    return () => {
      // Leave the Colyseus room first
      leaveRoom();
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      creatingRef.current = false;
    };
  }, [token, className, gender]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#1a1a1a",
      }}
    />
  );
}
