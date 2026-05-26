"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function Confetti({ active }: { active: boolean }) {
  useEffect(() => {
    if (active) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f59e0b', '#10b981', '#3b82f6'] // Gold, Emerald, Blue
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f59e0b', '#10b981', '#3b82f6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
    }
  }, [active]);

  return null; // Canvas confetti handles its own overlay
}
