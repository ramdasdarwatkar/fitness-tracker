import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useData } from "./context/DataContext";
import { WorkoutProvider } from "./context/WorkoutContext"; // <--- 1. Import Provider

// Pages
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { Dashboard } from "./pages/Dashboard";
import { Library } from "./pages/Library";
import { Workout } from "./pages/Workout";
import { History } from "./pages/History";
import { Profile } from "./pages/Profile";

// Components
import { AppBackground } from "./components/layout/AppBackground";
import { AppLayout } from "./components/layout/AppLayout";
import { Loader2 } from "lucide-react";
import { Progress } from "./pages/Progress";

// --- PROTECTED ROUTE COMPONENT ---
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { userProfile, isLoadingData } = useData();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-accent">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (isLoadingData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-accent">
        <Loader2 className="h-10 w-10 animate-spin" />
        <span className="ml-3 font-bold text-white">Syncing...</span>
      </div>
    );
  }

  // Redirect to Onboarding if profile is missing
  if (!userProfile && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect to Home if profile exists
  if (userProfile && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <AppBackground>
      {/* 3. Wrap Routes in WorkoutProvider so state persists across pages */}
      <WorkoutProvider>
        <Routes>
          {/* PUBLIC ROUTE */}
          <Route path="/login" element={<Login />} />

          {/* ONBOARDING (Standalone) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* WORKOUT MODE (Standalone - Full Screen) */}
          {/* We place this OUTSIDE AppLayout so it hides the Bottom Nav/Sidebar */}
          <Route
            path="/workout"
            element={
              <ProtectedRoute>
                <Workout />
              </ProtectedRoute>
            }
          />

          {/* APP SHELL ROUTES (Sidebar + BottomNav + Content) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Main Pages matching your Menu items */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/library" element={<Library />} />
            <Route path="/history" element={<History />} />{" "}
            {/* Added History */}
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WorkoutProvider>
    </AppBackground>
  );
}
