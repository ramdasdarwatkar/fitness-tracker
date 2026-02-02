import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full relative">
      {/* DESKTOP SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      {/* lg:pl-80 -> Adds padding on desktop so content isn't hidden behind sidebar 
         pb-32 -> Adds padding on bottom so mobile content isn't hidden behind nav
      */}
      <main className="flex-1 w-full min-h-screen lg:pl-80 p-6 pb-32 lg:p-10 transition-all duration-300">
        {/* We wrap the content in a max-width container for better readability on huge screens */}
        <div className="max-w-7xl mx-auto h-full">
          {/* This is where your Dashboard, Workouts, etc. will render */}
          <Outlet />
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <BottomNav />
    </div>
  );
}
