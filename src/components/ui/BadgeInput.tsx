import { useState, type KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

interface BadgeInputProps {
  placeholder?: string;
  badges: string[];
  onChange: (badges: string[]) => void;
}

export function BadgeInput({ placeholder, badges, onChange }: BadgeInputProps) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed && !badges.includes(trimmed)) {
        onChange([...badges, trimmed]);
      }
      setInput("");
    } else if (e.key === "Backspace" && !input && badges.length > 0) {
      onChange(badges.slice(0, -1));
    }
  };

  const removeBadge = (indexToRemove: number) => {
    onChange(badges.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div
      className="w-full min-h-[56px] glass-input rounded-2xl flex flex-wrap items-center gap-2 p-3 transition-all duration-200
      border border-transparent 
      focus-within:border-accent 
      focus-within:shadow-[0_0_15px_rgb(var(--accent-rgb)/0.2)]
      focus-within:bg-[var(--glass-bg)]"
    >
      {badges.map((badge, i) => (
        <span
          key={i}
          className="bg-accent text-text-inverted px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-[rgb(var(--accent-rgb)/0.2)] flex items-center gap-2 animate-in zoom-in-50 duration-200"
        >
          {badge}
          <button
            type="button"
            onClick={() => removeBadge(i)}
            className="hover:text-text-inverted/60 transition-colors"
          >
            <X className="w-3 h-3" strokeWidth={3} />
          </button>
        </span>
      ))}
      <div className="flex-1 flex items-center min-w-[100px]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={badges.length === 0 ? placeholder : "Add..."}
          className="bg-transparent border-none outline-none ring-0 w-full h-full text-text-main placeholder:text-text-muted/50 font-medium text-sm ml-1 p-0 focus:ring-0 focus:outline-none focus:border-none shadow-none"
          style={{ boxShadow: "none" }}
        />
        {input.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (input.trim()) {
                onChange([...badges, input.trim()]);
                setInput("");
              }
            }}
            className="text-accent hover:text-text-main transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
