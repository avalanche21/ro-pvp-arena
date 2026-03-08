"use client";

import { useEffect, useRef, useState } from "react";

interface CharacterPreviewProps {
  className: string;
  gender: "m" | "f";
  size?: number;
}

// Each sprite sheet is 150px frames. Row 0 = idle_dir0 (facing south).
// The sheet is 8 frames wide (1200px / 150px).
const FRAME_SIZE = 150;
const SHEET_COLS = 8;

// Idle animation: row 0, frames 0-2 (3 frames for most classes)
const IDLE_FRAMES = 3;
const ANIM_SPEED = 400; // ms per frame

export default function CharacterPreview({ className, gender, size = 120 }: CharacterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);

  const classKey = `${className.toLowerCase()}_${gender}`;
  const spriteUrl = `/assets/sprites/${classKey}.png?v5`;

  useEffect(() => {
    const img = new Image();
    img.src = spriteUrl;
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
    };
    img.onerror = () => setLoaded(false);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [spriteUrl]);

  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;

    const draw = () => {
      if (cancelled || !imgRef.current) return;

      ctx.clearRect(0, 0, FRAME_SIZE, FRAME_SIZE);

      // Row 0 = idle_dir0, each frame is FRAME_SIZE x FRAME_SIZE
      const frame = frameRef.current % IDLE_FRAMES;
      const sx = frame * FRAME_SIZE;
      const sy = 0; // row 0

      ctx.drawImage(imgRef.current, sx, sy, FRAME_SIZE, FRAME_SIZE, 0, 0, FRAME_SIZE, FRAME_SIZE);

      frameRef.current++;
      animRef.current = window.setTimeout(draw, ANIM_SPEED);
    };

    draw();

    return () => {
      cancelled = true;
      clearTimeout(animRef.current);
    };
  }, [loaded]);

  if (!loaded) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center"
      >
        <div className="w-8 h-12 rounded bg-gray-700 animate-pulse" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={FRAME_SIZE}
      height={FRAME_SIZE}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
      }}
    />
  );
}
