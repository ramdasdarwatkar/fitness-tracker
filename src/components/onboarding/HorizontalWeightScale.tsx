import { useRef, useEffect } from "react";

interface Props {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export function HorizontalWeightScale({
  value,
  onChange,
  min = 0,
  max = 300,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 100px = 1kg.
  const PIXELS_PER_KG = 100;
  const STEP = 0.1;
  const ITEM_WIDTH = PIXELS_PER_KG * STEP;

  useEffect(() => {
    if (containerRef.current) {
      const targetScroll = (value - min) * PIXELS_PER_KG;
      if (Math.abs(containerRef.current.scrollLeft - targetScroll) > 10) {
        containerRef.current.scrollLeft = targetScroll;
      }
    }
  }, [value, min]);

  const totalTicks = Math.round((max - min) / STEP);

  return (
    // REDUCED HEIGHT: h-32 -> h-20
    <div className="relative w-full h-20 group">
      <div
        ref={containerRef}
        className="w-full h-full overflow-x-auto flex items-start px-[50%] hide-scrollbar mask-gradient-x cursor-grab active:cursor-grabbing overscroll-x-contain"
        onScroll={(e) => {
          const target = e.currentTarget;
          const rawVal = min + target.scrollLeft / PIXELS_PER_KG;
          const rounded = Math.round(rawVal * 10) / 10;

          if (rounded !== value && rounded >= min && rounded <= max) {
            onChange(rounded);
          }
        }}
      >
        <div
          className="flex h-full relative top-4"
          style={{ width: `${(max - min) * PIXELS_PER_KG}px` }}
        >
          {Array.from({ length: totalTicks + 1 }).map((_, i) => {
            const val = min + i * STEP;

            // SHOW ONLY MAIN LINES (Integers)
            const isInteger = Math.abs(val % 1) < 0.01;

            if (!isInteger) {
              // Render invisible spacer to keep scroll logic working, but draw nothing
              return (
                <div
                  key={i}
                  style={{ width: `${ITEM_WIDTH}px` }}
                  className="shrink-0"
                />
              );
            }

            return (
              <div
                key={i}
                className="flex shrink-0 flex-col items-center relative"
                style={{ width: `${ITEM_WIDTH}px` }}
              >
                {/* TICK MARK (Only Main Line) */}
                {/* REFACTORED: Uses 'bg-text-main' to contrast correctly in both themes */}
                <div className="bg-text-main h-8 w-[2px] rounded-full" />

                {/* NUMBER LABEL */}
                <span
                  className={`absolute top-10 text-sm font-bold select-none transition-all duration-200 ${
                    Math.abs(val - value) < 0.5
                      ? "text-accent scale-125" // Active: Theme Color
                      : "text-text-muted opacity-70" // Inactive: Muted Text
                  }`}
                >
                  {Math.round(val)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .mask-gradient-x {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </div>
  );
}
