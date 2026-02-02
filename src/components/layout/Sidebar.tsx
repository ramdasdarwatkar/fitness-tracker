import { NavLink } from "react-router-dom";
import {
  Home,
  User,
  LogOut,
  ChartNoAxesCombined,
  DatabaseZap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function Sidebar() {
  const { signOut } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: DatabaseZap, label: "Library", path: "/library" },
    { icon: ChartNoAxesCombined, label: "Progress", path: "/progress" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen fixed left-0 top-0 z-50 p-6">
      {/* 1. Glass Container: Adapts to Light/Dark automatically via index.css */}
      <div className="flex-1 glass rounded-3xl flex flex-col p-6 overflow-hidden transition-colors duration-300">
        {/* LOGO */}
        <div className="flex items-center gap-3 px-2 mb-10">
          {/* Dynamic Shadow: Uses var(--accent-rgb) for the glow */}
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_15px_rgb(var(--accent-rgb)/0.4)]">
            {/* Text Inverted ensures readability on any accent color */}
            <span className="font-black text-text-inverted text-xl">T</span>
          </div>
          <div>
            <h1 className="font-black text-xl text-text-main tracking-tight">
              TRACK-FIT
            </h1>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Pro Edition
            </p>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? "bg-accent text-text-inverted shadow-[0_4px_20px_rgb(var(--accent-rgb)/0.3)] translate-x-1" // Active: Theme color + Dynamic Glow
                    : "text-text-muted hover:bg-text-main/5 hover:text-text-main hover:translate-x-1" // Inactive: Muted + Adaptive Hover
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-6 h-6 transition-transform duration-300 ${
                      isActive ? "scale-110" : "group-hover:scale-110"
                    }`}
                    // Fill Logic: Fills with the current text color (White if active, Main if hover, Muted if inactive)
                    fill={isActive ? "currentColor" : "none"}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={`font-bold text-lg ${isActive ? "tracking-wide" : ""}`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT */}
        <button
          onClick={signOut}
          className="mt-auto flex items-center gap-4 px-4 py-4 rounded-2xl text-text-muted hover:bg-error/10 hover:text-error transition-all duration-300 group cursor-pointer"
        >
          <LogOut className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-lg">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
