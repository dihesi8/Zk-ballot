"use client";

import { useEffect, useRef } from "react";

// A lightweight, dependency-free 3D particle network. Points live in a
// rotating 3D cube and are perspective-projected to 2D each frame; nearby
// points get a faint connecting line, giving a subtle "constellation" feel
// without pulling in a full 3D library. Kept deliberately understated:
// low particle count, low opacity, slow rotation, muted single accent
// color, no interaction required.

const PARTICLE_COUNT = 70;
const CONNECT_DISTANCE = 130;
const ROTATION_SPEED = 0.00018;

interface Point {
  x: number;
  y: number;
  z: number;
}

export function Background3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const range = 600;
    const points: Point[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: (Math.random() - 0.5) * range,
      y: (Math.random() - 0.5) * range,
      z: (Math.random() - 0.5) * range,
    }));

    let angle = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      angle += ROTATION_SPEED;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const focal = 480;
      const cx = width / 2;
      const cy = height / 2;

      const projected = points.map((p) => {
        // Rotate around Y axis.
        const x = p.x * cos - p.z * sin;
        const z = p.x * sin + p.z * cos;
        const scale = focal / (focal + z + range / 2);
        return {
          sx: cx + x * scale,
          sy: cy + p.y * scale,
          scale,
        };
      });

      // Connections first, underneath the points.
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            const opacity = (1 - dist / CONNECT_DISTANCE) * 0.12;
            ctx.strokeStyle = `rgba(47, 169, 184, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
      }

      for (const p of projected) {
        const size = Math.max(0.6, p.scale * 1.6);
        const opacity = Math.min(0.55, p.scale * 0.4);
        ctx.fillStyle = `rgba(79, 195, 208, ${opacity})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        raf = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}
