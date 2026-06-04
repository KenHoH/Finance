"use client";

import React from "react";
import type { EmptyStateIllustrationProps } from "@/lib/types";

export const EmptyStateIllustration = React.memo(function EmptyStateIllustration({
  className = "w-72 h-72",
}: EmptyStateIllustrationProps){
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Floating sparkles */}
      <circle cx="40" cy="60" r="3" fill="currentColor" opacity="0.25" />
      <circle cx="200" cy="50" r="4" fill="currentColor" opacity="0.2" />
      <circle cx="180" cy="180" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="55" cy="190" r="2.5" fill="currentColor" opacity="0.15" />

      {/* Open box body */}
      <path
        d="M60 110 L120 140 L180 110 L120 80 Z"
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M60 110 L60 155 L120 185 L120 140 Z"
        fill="currentColor"
        fillOpacity="0.04"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M120 185 L180 155 L180 110 L120 140 Z"
        fill="currentColor"
        fillOpacity="0.02"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Box lid (open, angled up) */}
      <path
        d="M45 100 L120 55 L195 100 L120 135 Z"
        fill="currentColor"
        fillOpacity="0.05"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Floating document */}
      <rect
        x="145" y="55"
        width="28" height="36"
        rx="3"
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      <line x1="152" y1="68" x2="166" y2="68" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="152" y1="76" x2="166" y2="76" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="152" y1="84" x2="160" y2="84" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" strokeLinecap="round" />

      {/* Floating coin */}
      <circle
        cx="65"
        cy="75"
        r="14"
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      <text
        x="65"
        y="80"
        textAnchor="middle"
        fill="currentColor"
        fillOpacity="0.4"
        fontSize="12"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        $
      </text>

      {/* Floating chart bar */}
      <rect x="85" y="42" width="6" height="16" rx="2" fill="currentColor" fillOpacity="0.2" />
      <rect x="95" y="36" width="6" height="22" rx="2" fill="currentColor" fillOpacity="0.3" />
      <rect x="105" y="44" width="6" height="14" rx="2" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
});
