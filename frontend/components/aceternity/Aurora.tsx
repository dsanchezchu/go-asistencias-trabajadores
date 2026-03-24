"use client";
import React, { useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { useAuroraAnimation } from "@/hooks/useAuroraAnimation";

interface AuroraProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Aurora Component
 * Renders a high-performance animated background using Canvas 2D.
 * Follows SRP by delegating animation logic to useAuroraAnimation hook.
 */
export const Aurora = memo(({ className, children }: AuroraProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Optimized animation settings
  useAuroraAnimation(canvasRef, {
    circleCount: 25, // Slightly reduced for better performance
    scale: 0.15,     // Lower resolution for better performance on mobile/low-end
    baseSpeed: 0.04,
  });

  return (
    <div 
      className={cn(
        "fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none bg-slate-950", 
        className
      )}
      aria-hidden="true"
    >
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full" 
      />
      {children && <div className="relative z-10 w-full h-full">{children}</div>}
    </div>
  );
});

Aurora.displayName = "Aurora";


