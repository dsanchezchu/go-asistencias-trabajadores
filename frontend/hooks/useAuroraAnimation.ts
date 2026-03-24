"use client";
import { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";

interface AuroraOptions {
  circleCount?: number;
  baseSpeed?: number;
  rangeSpeed?: number;
  baseTTL?: number;
  rangeTTL?: number;
  baseRadius?: number;
  rangeRadius?: number;
  rangeHue?: number;
  scale?: number;
}

export const useAuroraAnimation = (canvasRef: React.RefObject<HTMLCanvasElement | null>, options: AuroraOptions = {}) => {
  const {
    circleCount = 30,
    baseSpeed = 0.05,
    rangeSpeed = 0.2,
    baseTTL = 300,
    rangeTTL = 500,
    baseRadius = 250,
    rangeRadius = 450,
    rangeHue = 120,
    scale = 0.2,
  } = options;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const offscreenCanvas = document.createElement("canvas");
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (!offscreenCtx) return;

    const noise3D = createNoise3D();
    const circlePropCount = 8;
    const circlePropsLength = circleCount * circlePropCount;
    
    let animationFrameId: number;
    let circleProps = new Float32Array(circlePropsLength);
    let baseHue = Math.random() * 360;
    const TAU = Math.PI * 2;

    const rand = (n: number) => n * Math.random();
    const fadeInOut = (t: number, m: number) => {
      let hm = 0.5 * m;
      return Math.abs(((t + hm) % m) - hm) / hm;
    };

    const initCircle = (i: number) => {
      const t = rand(TAU);
      const speed = baseSpeed + rand(rangeSpeed);
      circleProps.set([
        rand(window.innerWidth),   
        rand(window.innerHeight),  
        speed * Math.cos(t),           
        speed * Math.sin(t),           
        0,                             
        baseTTL + rand(rangeTTL),      
        baseRadius + rand(rangeRadius),
        (baseHue + rand(rangeHue)) % 360 
      ], i);
    };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      
      offscreenCanvas.width = w * scale;
      offscreenCanvas.height = h * scale;
      offscreenCtx.setTransform(scale, 0, 0, scale, 0, 0);
    };

    const draw = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      baseHue += 0.1; 
      
      const isDark = document.documentElement.getAttribute("data-theme") === "dark" || true;
      const backgroundColor = "#020617"; // Fondo oscuro fijo para el login

      // Limpiar el canvas principal
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Limpiar el offscreen canvas
      offscreenCtx.clearRect(0, 0, offscreenCanvas.width / scale, offscreenCanvas.height / scale);

      for (let i = 0; i < circlePropsLength; i += circlePropCount) {
        const x = circleProps[i];
        const y = circleProps[i + 1];
        const vx = circleProps[i + 2];
        const vy = circleProps[i + 3];
        let life = circleProps[i + 4];
        const ttl = circleProps[i + 5];
        const radius = circleProps[i + 6];
        const hue = circleProps[i + 7];

        const weight = fadeInOut(life, ttl);
        if (weight > 0) {
          const alpha = weight * 0.5; // Más opacidad
          
          const grad = offscreenCtx.createRadialGradient(x, y, 0, x, y, radius);
          grad.addColorStop(0, `hsla(${hue}, 80%, 60%, ${alpha})`);
          grad.addColorStop(0.5, `hsla(${hue}, 80%, 60%, ${alpha * 0.3})`);
          grad.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);

          offscreenCtx.fillStyle = grad;
          offscreenCtx.beginPath();
          offscreenCtx.arc(x, y, radius, 0, TAU);
          offscreenCtx.fill();
        }

        const n = noise3D(x * 0.002, y * 0.002, life * 0.005);
        const nx = Math.cos(n * TAU) * 0.5;
        const ny = Math.sin(n * TAU) * 0.5;

        circleProps[i] = x + vx + nx;
        circleProps[i + 1] = y + vy + ny;
        circleProps[i + 4] = life + 1;

        if (life > ttl) initCircle(i);
      }

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    for (let i = 0; i < circlePropsLength; i += circlePropCount) initCircle(i);
    draw();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [circleCount, baseSpeed, rangeSpeed, baseTTL, rangeTTL, baseRadius, rangeRadius, rangeHue, scale]);
};
