import React from "react";

export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden transition-colors duration-500 bg-background text-text-main">
      {/* --- LAYER 1: BASE BACKGROUND COLOR --- */}
      <div
        className="fixed inset-0 z-[-3]"
        style={{ backgroundColor: "var(--color-bg-base)" }}
      />

      {/* --- LAYER 2: THEME COLOR WASH (The "Glow") --- */}
      <div
        className="fixed inset-0 z-[-2] opacity-100 transition-opacity duration-500"
        style={{
          background: `
            radial-gradient(
              circle at 50% 0%, 
              rgb(var(--accent-rgb) / var(--bg-tint-opacity)) 0%, 
              transparent 75%
            ),
            radial-gradient(
              circle at 100% 100%, 
              rgb(var(--accent-rgb) / calc(var(--bg-tint-opacity) * 0.5)) 0%, 
              transparent 60%
            )
          `,
        }}
      />

      {/* --- LAYER 3: SUBTLE COLOR MESH --- */}
      <div
        className="fixed inset-0 z-[-2] opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgb(var(--accent-rgb) / 0.2) 0%, transparent 100%)",
        }}
      />

      {/* --- LAYER 4: NOISE TEXTURE --- */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.35] mix-blend-overlay">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <filter id="noiseFilter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.6"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* --- CONTENT --- */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
