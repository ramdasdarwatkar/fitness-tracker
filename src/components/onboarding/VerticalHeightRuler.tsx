import { useRef, useEffect } from "react";

interface Props {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export function VerticalHeightRuler({
  value,
  onChange,
  min = 120,
  max = 240,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 1 CM per tick (Integers only)
  const STEP = 1;
  const ITEM_HEIGHT = 50;

  // ALIGNMENT: 50px offset as requested
  const PADDING_TOP = 30;

  useEffect(() => {
    if (containerRef.current) {
      const targetScroll = ((max - value) / STEP) * ITEM_HEIGHT;
      if (Math.abs(containerRef.current.scrollTop - targetScroll) > 5) {
        containerRef.current.scrollTop = targetScroll;
      }
    }
  }, [value, max]);

  const totalTicks = Math.round((max - min) / STEP);

  return (
    <div className="relative h-full w-40 overflow-hidden mask-gradient-y">
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto hide-scrollbar"
        style={{
          paddingTop: `${PADDING_TOP}px`,
          paddingBottom: `300px`,
        }}
        onScroll={(e) => {
          const target = e.currentTarget;
          const scrollIndex = target.scrollTop / ITEM_HEIGHT;

          let rawVal = max - scrollIndex * STEP;

          if (rawVal > max) rawVal = max;
          if (rawVal < min) rawVal = min;

          const rounded = Math.round(rawVal);

          if (rounded !== value) {
            onChange(rounded);
          }
        }}
      >
        {Array.from({ length: totalTicks + 1 }).map((_, i) => {
          const val = max - i * STEP;
          const isActive = Math.abs(val - value) < 0.5;

          return (
            <div
              key={i}
              className="flex items-center w-full relative"
              style={{ height: `${ITEM_HEIGHT}px` }}
            >
              {/* TICK MARK */}
              <div
                className={`h-[3px] absolute left-0 transition-all duration-200 ${
                  isActive
                    ? "w-12 bg-accent shadow-[0_0_10px_rgb(var(--accent-rgb)/0.5)]" // Active: Theme color + Glow
                    : "w-8 bg-text-main opacity-20" // Inactive: Main text color (low opacity)
                }`}
              />

              {/* NUMBER LABEL */}
              <span
                className={`absolute left-16 text-3xl font-black tracking-tight transition-all duration-200 ${
                  isActive
                    ? "text-accent scale-110 opacity-100" // Active: Theme Color
                    : "text-text-muted opacity-30 scale-90" // Inactive: Muted Text
                }`}
              >
                {val}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .mask-gradient-y {
          mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
        }
      `}</style>
    </div>
  );
}
