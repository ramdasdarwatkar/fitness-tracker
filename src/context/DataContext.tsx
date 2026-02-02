import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { startOfWeek, endOfWeek, format } from "date-fns";
import type { Database } from "../types/database.types";

// --- CONFIGURATION ---
// 1. COST CONTROL: Cache duration set to 12 Hours
const CACHE_DURATION = 12 * 60 * 60 * 1000;

// --- TYPES ---
type UserProfile = Database["public"]["Tables"]["user_profile"]["Row"];
type Exercise = Database["public"]["Tables"]["exercise"]["Row"];
type Category = Database["public"]["Tables"]["muscle_group"]["Row"];
type Workout = Database["public"]["Tables"]["workout"]["Row"];
type RoutineRow = Database["public"]["Tables"]["routine"]["Row"];
export type Routine = RoutineRow & {
  routine_exercises: Database["public"]["Tables"]["routine_exercises"]["Row"][];
};

interface DataContextType {
  userProfile: UserProfile | null;
  exercises: Exercise[];
  categories: Category[];
  routines: Routine[];
  weeklyWorkouts: Workout[];
  isLoadingData: boolean;
  refreshProfile: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  refreshWorkouts: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper for caching structure
type CachedItem<T> = {
  data: T;
  timestamp: number;
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<Workout[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- 2. SMART CACHE PARSER ---
  const getCachedData = <T,>(key: string): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as CachedItem<T>;
      const age = Date.now() - parsed.timestamp;

      // If data is fresh enough (less than 12 hours old), return it
      if (age < CACHE_DURATION) {
        return parsed.data;
      }
      return null; // Data expired, return null to trigger fetch
    } catch {
      return null;
    }
  };

  const setCachedData = <T,>(key: string, data: T) => {
    const item: CachedItem<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(item));
  };

  // --- 3. DATA FETCHERS ---

  const fetchProfile = useCallback(
    async (force = false) => {
      if (!user) return;
      const key = `profile-${user.id}`;

      // A. Check Cache (Skip DB if fresh and not forced)
      if (!force) {
        const cached = getCachedData<UserProfile>(key);
        if (cached) {
          setUserProfile(cached);
          return; // STOP HERE (Save Cost)
        }
      }

      // B. Fetch DB
      try {
        const { data, error } = await supabase
          .from("user_profile")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setUserProfile(data);
          setCachedData(key, data);
        }
      } catch (err) {
        console.error("Profile load failed", err);
      }
    },
    [user],
  );

  const fetchLibrary = useCallback(
    async (force = false) => {
      if (!user) return;
      const keyEx = "library-exercises";
      const keyCat = "library-categories";
      const keyRot = `library-routines-${user.id}`;

      if (!force) {
        const cEx = getCachedData<Exercise[]>(keyEx);
        const cCat = getCachedData<Category[]>(keyCat);
        const cRot = getCachedData<Routine[]>(keyRot);

        // Only skip if ALL are present
        if (cEx && cCat && cRot) {
          setExercises(cEx);
          setCategories(cCat);
          setRoutines(cRot);
          return; // STOP HERE (Save Cost)
        }
      }

      try {
        const [exRes, catRes, rotRes] = await Promise.all([
          supabase.from("exercise").select("*"),
          supabase.from("muscle_group").select("*"),
          supabase.from("routine").select("*, routine_exercises(*)"),
        ]);

        if (exRes.data) {
          setExercises(exRes.data);
          setCachedData(keyEx, exRes.data);
        }
        if (catRes.data) {
          setCategories(catRes.data);
          setCachedData(keyCat, catRes.data);
        }
        if (rotRes.data) {
          // @ts-ignore
          setRoutines(rotRes.data as Routine[]);
          setCachedData(keyRot, rotRes.data);
        }
      } catch (err) {
        console.error("Library load failed", err);
      }
    },
    [user],
  );

  const fetchWorkouts = useCallback(
    async (force = false) => {
      if (!user) return;
      const now = new Date();
      // Week calculations
      const startObj = startOfWeek(now, { weekStartsOn: 1 });
      const endObj = endOfWeek(now, { weekStartsOn: 1 });
      const startDateStr = format(startObj, "yyyy-MM-dd");
      const endDateStr = format(endObj, "yyyy-MM-dd");

      const key = `workouts-${user.id}-${startDateStr}`;

      if (!force) {
        const cached = getCachedData<Workout[]>(key);
        if (cached) {
          setWeeklyWorkouts(cached);
          return; // STOP HERE (Save Cost)
        }
      }

      try {
        const { data, error } = await supabase
          .from("workout")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", startDateStr)
          .lte("date", endDateStr)
          .order("date", { ascending: true });

        if (error) throw error;
        if (data) {
          setWeeklyWorkouts(data);
          setCachedData(key, data);
        }
      } catch (err) {
        console.error("Workouts load failed", err);
      }
    },
    [user],
  );

  // --- INIT ---
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (user) {
        // Parallel load
        await Promise.all([
          fetchProfile(), // implicit force=false
          fetchLibrary(),
          fetchWorkouts(),
        ]);
        if (mounted) setIsLoadingData(false);
      } else {
        setUserProfile(null);
        setExercises([]);
        setCategories([]);
        setRoutines([]);
        setWeeklyWorkouts([]);
        if (mounted) setIsLoadingData(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [user, fetchProfile, fetchLibrary, fetchWorkouts]);

  return (
    <DataContext.Provider
      value={{
        userProfile,
        exercises,
        categories,
        routines,
        weeklyWorkouts,
        isLoadingData,
        // Manual refreshes ALWAYS force DB call
        refreshProfile: () => fetchProfile(true),
        refreshLibrary: () => fetchLibrary(true),
        refreshWorkouts: () => fetchWorkouts(true),
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};
