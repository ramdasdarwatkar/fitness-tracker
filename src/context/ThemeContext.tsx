import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

// --- CONFIGURATION ---
// You can add as many presets here as you want.
export const ACCENT_COLORS = [
  { id: "coral", hex: "#FF7F50" }, // Default
  { id: "orange", hex: "#f97316" },
  { id: "blue", hex: "#3b82f6" },
  { id: "emerald", hex: "#10b981" },
  { id: "purple", hex: "#a855f7" },
  { id: "rose", hex: "#f43f5e" },
  { id: "cyan", hex: "#06b6d4" },
  { id: "yellow", hex: "#eab308" },
  { id: "white", hex: "#ffffff" },
  { id: "wine", hex: "#800f2f" },
];

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  accentColor: string; // Stores ID (e.g. 'blue') OR Hex (e.g. '#123456')
  setAccentColor: (color: string) => void;
  activeColorObj: { hex: string };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper: Converts Hex to RGB for Tailwind opacity support.
// Returns NULL if invalid, letting CSS defaults take over.
const hexToRgb = (hex: string): string | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : null;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 1. Theme Mode State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("app-theme") as ThemeMode) || "dark";
    }
    return "dark";
  });

  // 2. Accent Color State
  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem("app-accent") || "coral";
  });

  // Effect: Apply Light/Dark Class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  // Effect: Apply Dynamic RGB Variables
  useEffect(() => {
    localStorage.setItem("app-accent", accentColor);

    // Resolve Hex Code (Is it a preset ID or a raw Hex?)
    let hexCode = accentColor;
    const preset = ACCENT_COLORS.find((c) => c.id === accentColor);
    if (preset) {
      hexCode = preset.hex;
    }

    // Calculate RGB
    const rgbValue = hexToRgb(hexCode);
    const root = document.documentElement;

    // Inject into CSS Variable
    if (rgbValue) {
      root.style.setProperty("--accent-rgb", rgbValue);

      // Dynamic Text Contrast (Black text for bright backgrounds)
      if (
        hexCode.toLowerCase() === "#ffffff" ||
        hexCode.toLowerCase() === "#fff"
      ) {
        root.style.setProperty("--color-accent-contrast", "#000000");
      } else {
        root.style.setProperty("--color-accent-contrast", "#ffffff");
      }
    }
    // If rgbValue is null, we do nothing, letting index.css defaults (Coral) persist.
  }, [accentColor]);

  // Helper for UI components to get the active hex easily
  const activeColorObj = ACCENT_COLORS.find((c) => c.id === accentColor) || {
    hex: accentColor,
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, accentColor, setAccentColor, activeColorObj }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
