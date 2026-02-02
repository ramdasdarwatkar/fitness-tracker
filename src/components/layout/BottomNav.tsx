import { NavLink } from "react-router-dom";
import { Home, ChartNoAxesCombined, User, DatabaseZap } from "lucide-react";

export function BottomNav() {
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: DatabaseZap, label: "Library", path: "/library" },
    { icon: ChartNoAxesCombined, label: "Progress", path: "/progress" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* REFACTOR NOTES:
         - Removed: bg-[#0f172a]/90 (Hardcoded Dark Mode)
         - Removed: backdrop-blur-md (Already in .glass)
         - Added: bg-surface/80 (Ensures readability if glass fails or acts as fallback)
         - Updated: border-border (Theme adaptable border)
      */}
      <nav className="glass rounded-t-3xl h-24 flex items-center justify-around px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.15)] border-t border-border">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-20 h-full transition-all duration-300 group ${
                isActive
                  ? "text-accent" // Active: Uses Theme Color (Coral, Blue, etc.)
                  : "text-text-muted hover:text-text-main" // Inactive: Muted -> Main on hover
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-7 h-7 mb-1.5 transition-all duration-300 ${
                    isActive ? "-translate-y-1 scale-110" : "scale-100"
                  }`}
                  fill="none"
                  strokeWidth={isActive ? 2.5 : 2}
                />

                <span
                  className={`text-[13px] font-bold tracking-wide transition-all duration-300 ${
                    isActive
                      ? "opacity-100 font-extrabold"
                      : "opacity-70 font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
