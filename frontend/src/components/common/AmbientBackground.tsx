"use client";

import React from "react";

export function AmbientBackground(){
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-background" />
      <img
        src="/blob-emerald.webp"
        alt=""
        className="absolute top-[-15%] left-[-15%] w-[55vw] h-[55vw] opacity-[0.12] blur-[80px]"
      />
      <img
        src="/blob-blue.webp"
        alt=""
        className="absolute bottom-[-15%] right-[-15%] w-[45vw] h-[45vw] opacity-[0.10] blur-[80px]"
      />
      <img
        src="/blob-voilet.webp"
        alt=""
        className="absolute top-[45%] left-[55%] w-[35vw] h-[35vw] opacity-[0.08] blur-[60px]"
      />
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
