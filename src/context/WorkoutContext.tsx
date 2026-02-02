import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useData } from "./DataContext";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import type { Database } from "../types/database.types";

// --- STRICT TYPES ---
type ExerciseRow = Database["public"]["Tables"]["exercise"]["Row"];
type WorkoutInsert = Database["public"]["Tables"]["workout"]["Insert"];
type WorkoutLogInsert = Database["public"]["Tables"]["workout_logs"]["Insert"];

export type WorkoutSet = {
  id: string;
  kg: string;
  reps: string;
  distance: string;
  time: string;
  completed: boolean;
};

export type TrackingConfig = {
  weight: boolean;
  reps: boolean;
  distance: boolean;
  time: boolean;
};

export type ActiveExercise = {
  instanceId: string;
  exerciseId: string;
  name: string;
  bodyPart: string;
  tags: string[];
  tracking: TrackingConfig;
  sets: WorkoutSet[];
};

export type WorkoutMode = "live" | "manual";

interface WorkoutContextType {
  isWorkoutActive: boolean;
  workoutMode: WorkoutMode;
  activeExercises: ActiveExercise[];
  startTime: number | null;
  workoutDbId: number | null;
  startWorkout: (
    mode?: WorkoutMode,
    initialData?: any[],
    customStartTime?: number,
  ) => Promise<void>;
  cancelWorkout: () => Promise<void>;
  finishWorkout: (notes: string, manualEndTime?: Date) => Promise<void>;
  markRestDay: (dateStr?: string) => Promise<void>;
  addExercise: (exerciseId: string | number) => void;
  removeExercise: (instanceId: string) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  updateSet: (
    exerciseIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    value: string,
  ) => void;
  toggleSetComplete: (exerciseIndex: number, setIndex: number) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { exercises: allExercises, refreshWorkouts } = useData();

  // --- STATE ---
  const [isWorkoutActive, setIsWorkoutActive] = useState(() => {
    try {
      return localStorage.getItem("workout_active") === "true";
    } catch {
      return false;
    }
  });
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>(() => {
    return (localStorage.getItem("workout_mode") as WorkoutMode) || "live";
  });
  const [startTime, setStartTime] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem("workout_startTime");
      return stored ? parseInt(stored) : null;
    } catch {
      return null;
    }
  });
  const [workoutDbId, setWorkoutDbId] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem("workout_db_id");
      return stored ? parseInt(stored) : null;
    } catch {
      return null;
    }
  });
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>(
    () => {
      try {
        const stored = localStorage.getItem("workout_exercises");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
  );

  useEffect(() => {
    if (!isWorkoutActive) return;
    if (startTime) {
      localStorage.setItem("workout_active", "true");
      localStorage.setItem("workout_mode", workoutMode);
      localStorage.setItem("workout_startTime", String(startTime));
      if (workoutDbId)
        localStorage.setItem("workout_db_id", String(workoutDbId));
      localStorage.setItem(
        "workout_exercises",
        JSON.stringify(activeExercises),
      );
    }
  }, [isWorkoutActive, startTime, activeExercises, workoutMode, workoutDbId]);

  // --- HELPERS ---
  const findExercise = (id: string | number) =>
    allExercises?.find((e: any) => String(e.id) === String(id));

  const getTrackingConfig = (dbEx: ExerciseRow): TrackingConfig => ({
    weight: dbEx.weight ?? true,
    reps: dbEx.reps ?? true,
    distance: dbEx.distance ?? false,
    time: dbEx.duration ?? false,
  });

  const getTagsArray = (dbEx: ExerciseRow): string[] => {
    if (!dbEx.tags) return [];
    if (Array.isArray(dbEx.tags)) return dbEx.tags;
    if (typeof dbEx.tags === "string")
      return (dbEx.tags as string).split(",").map((t: string) => t.trim());
    return [];
  };

  // --- ACTIONS ---

  const startWorkout = async (
    mode: WorkoutMode = "live",
    initialData?: any[],
    customStartTime?: number,
  ) => {
    if (isWorkoutActive || !user) return;
    const startTimestamp = customStartTime || Date.now();
    const startDateObj = new Date(startTimestamp);

    try {
      const newWorkout: WorkoutInsert = {
        user_id: user.id,
        date: startDateObj.toISOString().split("T")[0],
        start_time: startDateObj.toTimeString().slice(0, 5),
        completed: false,
        rest_day: false,
        notes: null,
        total_volume: 0,
        total_distance: 0,
        calories: 0,
        total_duration: 0,
      };

      const { data, error } = await supabase
        .from("workout")
        .insert(newWorkout)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Failed to create workout session");

      setWorkoutDbId(data.id);
      setStartTime(startTimestamp);
      setWorkoutMode(mode);
      setIsWorkoutActive(true);

      if (initialData && initialData.length > 0 && allExercises?.length > 0) {
        const mapped = initialData
          .map((item: any) => {
            const targetId =
              typeof item === "object" ? item.exercise_id || item.id : item;
            const dbEx = findExercise(targetId);
            if (!dbEx) return null;
            return {
              instanceId: crypto.randomUUID(),
              exerciseId: String(dbEx.id),
              name: dbEx.name,
              bodyPart: dbEx.muscle_group_id ? "Targeted" : "General",
              tags: getTagsArray(dbEx),
              tracking: getTrackingConfig(dbEx),
              sets: [
                {
                  id: crypto.randomUUID(),
                  kg: "",
                  reps: "",
                  distance: "",
                  time: "",
                  completed: false,
                },
              ],
            };
          })
          .filter(Boolean) as ActiveExercise[];
        setActiveExercises(mapped);
      } else {
        setActiveExercises([]);
      }
    } catch (err: any) {
      console.error("Start Error:", err);
      throw err;
    }
  };

  const cancelWorkout = async () => {
    if (workoutDbId)
      await supabase.from("workout").delete().eq("id", workoutDbId);

    localStorage.removeItem("workout_active");
    localStorage.removeItem("workout_mode");
    localStorage.removeItem("workout_startTime");
    localStorage.removeItem("workout_db_id");
    localStorage.removeItem("workout_exercises");

    setIsWorkoutActive(false);
    setStartTime(null);
    setWorkoutDbId(null);
    setActiveExercises([]);
  };

  const markRestDay = async (dateStr?: string) => {
    if (!user) return;
    const dateToLog = dateStr || new Date().toISOString().split("T")[0];

    const restWorkout: WorkoutInsert = {
      user_id: user.id,
      date: dateToLog,
      completed: true,
      rest_day: true,
      notes: "Rest Day",
      total_volume: 0,
      total_distance: 0,
      calories: 0,
      total_duration: 0,
    };

    const { error } = await supabase.from("workout").insert(restWorkout);
    if (error) throw error;
    await refreshWorkouts();
  };

  const finishWorkout = async (notes: string, manualEndTime?: Date) => {
    if (!user || !startTime || !workoutDbId) return;

    // 1. Time Calc
    const startObj = new Date(startTime);
    const endObj = manualEndTime || new Date();
    let durationSeconds = Math.floor(
      (endObj.getTime() - startObj.getTime()) / 1000,
    );
    if (durationSeconds < 0) durationSeconds = 0;
    const durationMinutes = Math.round(durationSeconds / 60);

    // 2. Metrics Accumulation
    let totalVolume = 0;
    let totalDistanceMeters = 0;
    let totalSetsCompleted = 0;
    const tagsSet = new Set<string>();
    const logsToInsert: WorkoutLogInsert[] = [];

    activeExercises.forEach((ex) => {
      if (ex.tags) ex.tags.forEach((tag) => tagsSet.add(tag));
      const exTagsLower = ex.tags.map((t) => t.toLowerCase());
      const isDistance =
        ex.tracking.distance ||
        exTagsLower.includes("steps") ||
        exTagsLower.includes("cardio");

      ex.sets.forEach((set, index) => {
        if (!set.completed) return;
        totalSetsCompleted++;
        const kg = parseFloat(set.kg) || 0;
        const reps = parseFloat(set.reps) || 0;
        const dist = parseFloat(set.distance) || 0;
        const timeVal = parseFloat(set.time) || 0;

        if (isDistance) totalDistanceMeters += dist * 1000;
        else if (ex.tracking.weight && ex.tracking.reps)
          totalVolume += kg * reps;

        logsToInsert.push({
          workout_id: workoutDbId,
          exercise_id: parseInt(ex.exerciseId),
          set: index + 1,
          reps: reps,
          weight: kg,
          distance: dist,
          duration: timeVal,
        });
      });
    });

    // 3. FIX: Fetch Latest Weight for Calorie Calc
    let userWeight = 70; // Default fallback
    try {
      const { data: metricData } = await supabase
        .from("profile_metrics")
        .select("weight")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (metricData?.weight) {
        userWeight = metricData.weight;
      }
    } catch (err) {
      console.warn(
        "Could not fetch latest weight for calorie calc, using default.",
      );
    }

    // 4. Calculate Calories
    let calories = 0;
    if (totalDistanceMeters > 0)
      calories += (totalDistanceMeters / 1000) * userWeight * 1.036;
    if (totalSetsCompleted > 0)
      calories += ((4.0 * 3.5 * userWeight) / 200) * (totalSetsCompleted * 4);

    try {
      // 5. Update DB
      const { error: updateError } = await supabase
        .from("workout")
        .update({
          finish_time: endObj.toTimeString().slice(0, 5),
          total_duration: durationMinutes,
          completed: true,
          notes: notes,
          muscles: Array.from(tagsSet).join(", "),
          total_volume: Math.round(totalVolume),
          total_distance: Math.round(totalDistanceMeters),
          calories: Math.round(calories),
        })
        .eq("id", workoutDbId);

      if (updateError) throw updateError;

      if (logsToInsert.length > 0) {
        const { error: logsError } = await supabase
          .from("workout_logs")
          .insert(logsToInsert);
        if (logsError) throw logsError;
      }

      await refreshWorkouts();

      // 6. Cleanup
      localStorage.removeItem("workout_active");
      localStorage.removeItem("workout_mode");
      localStorage.removeItem("workout_startTime");
      localStorage.removeItem("workout_db_id");
      localStorage.removeItem("workout_exercises");

      setIsWorkoutActive(false);
      setStartTime(null);
      setWorkoutDbId(null);
      setActiveExercises([]);
    } catch (err: any) {
      console.error("Finish failed:", err);
      throw err;
    }
  };

  // --- LOCAL ACTIONS ---
  const addExercise = (exerciseId: string | number) => {
    const dbEx = findExercise(exerciseId);
    if (!dbEx) return;
    const newEx: ActiveExercise = {
      instanceId: crypto.randomUUID(),
      exerciseId: String(dbEx.id),
      name: dbEx.name,
      bodyPart: dbEx.muscle_group_id ? "Targeted" : "General",
      tags: getTagsArray(dbEx),
      tracking: getTrackingConfig(dbEx),
      sets: [
        {
          id: crypto.randomUUID(),
          kg: "",
          reps: "",
          distance: "",
          time: "",
          completed: false,
        },
      ],
    };
    setActiveExercises((prev) => [...prev, newEx]);
  };

  const removeExercise = (instanceId: string) =>
    setActiveExercises((prev) =>
      prev.filter((e) => e.instanceId !== instanceId),
    );

  const addSet = (exIdx: number) => {
    setActiveExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: crypto.randomUUID(),
              kg: lastSet ? lastSet.kg : "",
              reps: lastSet ? lastSet.reps : "",
              distance: lastSet ? lastSet.distance : "",
              time: lastSet ? lastSet.time : "",
              completed: false,
            },
          ],
        };
      }),
    );
  };

  const removeSet = (exIdx: number, sIdx: number) => {
    setActiveExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return { ...ex, sets: ex.sets.filter((_, j) => j !== sIdx) };
      }),
    );
  };

  const updateSet = (
    exIdx: number,
    sIdx: number,
    field: keyof WorkoutSet,
    value: string,
  ) => {
    setActiveExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set, j) =>
            j === sIdx ? { ...set, [field]: value } : set,
          ),
        };
      }),
    );
  };

  const toggleSetComplete = (exIdx: number, sIdx: number) => {
    setActiveExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set, j) =>
            j === sIdx ? { ...set, completed: !set.completed } : set,
          ),
        };
      }),
    );
  };

  return (
    <WorkoutContext.Provider
      value={{
        isWorkoutActive,
        workoutMode,
        activeExercises,
        startTime,
        workoutDbId,
        startWorkout,
        cancelWorkout,
        finishWorkout,
        markRestDay,
        addExercise,
        removeExercise,
        addSet,
        removeSet,
        updateSet,
        toggleSetComplete,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context)
    throw new Error("useWorkout must be used within WorkoutProvider");
  return context;
};
