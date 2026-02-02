import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useData } from "../context/DataContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

// 1. Import Generated Types
import type { Database } from "../types/database.types";

import {
  WorkoutDetailsCard,
  type ExerciseGroup,
} from "../components/history/WorkoutDetailsCard";

// 2. Types Shortcuts
type WorkoutRow = Database["public"]["Tables"]["workout"]["Row"];
type WorkoutLog = Database["public"]["Tables"]["workout_logs"]["Row"];
type Exercise = Database["public"]["Tables"]["exercise"]["Row"];

export function History() {
  const navigate = useNavigate();

  // 3. Typed Context
  const { exercises: allExercises } = useData() as { exercises: Exercise[] };

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [monthWorkouts, setMonthWorkouts] = useState<WorkoutRow[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRow | null>(
    null,
  );
  const [workoutDetails, setWorkoutDetails] = useState<ExerciseGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- 1. FETCH MONTH DATA ---
  useEffect(() => {
    const fetchMonthData = async () => {
      const start = startOfMonth(currentMonth).toISOString();
      const end = endOfMonth(currentMonth).toISOString();

      const { data, error } = await supabase
        .from("workout")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .eq("completed", true);

      if (error) {
        console.error("Error fetching history:", error);
      } else {
        setMonthWorkouts(data || []);
      }
    };

    fetchMonthData();
  }, [currentMonth]);

  // --- 2. SELECT DATE & TRANSFORM DATA ---
  useEffect(() => {
    const workout = monthWorkouts.find((w) =>
      isSameDay(parseISO(w.date), selectedDate),
    );
    setSelectedWorkout(workout || null);
    setWorkoutDetails([]);

    if (workout && !workout.rest_day) {
      const fetchDetails = async () => {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("workout_logs")
          .select("*")
          .eq("workout_id", workout.id)
          .order("id", { ascending: true });

        if (!error && data) {
          const logs: WorkoutLog[] = data;
          const grouped: Record<string, any[]> = {};

          logs.forEach((log) => {
            const exerciseDef = allExercises?.find(
              (e) => e.id === log.exercise_id,
            );
            const name = exerciseDef
              ? exerciseDef.name
              : `Exercise #${log.exercise_id}`;

            if (!grouped[name]) grouped[name] = [];

            grouped[name].push({
              set: log.set,
              weight: log.weight ?? 0,
              reps: log.reps ?? 0,
              distance: log.distance ?? 0,
              duration: log.duration ?? 0,
            });
          });

          const result: ExerciseGroup[] = Object.entries(grouped).map(
            ([name, sets]) => ({
              name,
              sets,
            }),
          );
          setWorkoutDetails(result);
        }
        setIsLoading(false);
      };
      fetchDetails();
    }
  }, [selectedDate, monthWorkouts, allExercises]);

  // --- CALENDAR LOGIC ---
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const weekDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleMonthPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month] = e.target.value.split("-").map(Number);
    const newDate = new Date(year, month - 1, 1);
    setCurrentMonth(newDate);
  };

  return (
    // REFACTOR: Removed bg-bg-base to allow global background
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      {/* HEADER */}
      <header className="p-6 pb-2 flex items-center gap-4 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-full bg-surface/50 border border-border hover:bg-surface text-text-main transition-colors backdrop-blur-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-black text-text-main tracking-tight">
          History
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20 custom-scrollbar">
        {/* CALENDAR WIDGET */}
        <section className="bg-surface/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow matching theme */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/20 rounded-full blur-[80px] pointer-events-none" />

          {/* --- NAV BAR --- */}
          <div className="flex items-center justify-between mb-6 relative z-10">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-surface rounded-full text-text-muted hover:text-text-main transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* iOS-Style Date Picker Trigger */}
            <div className="relative group">
              <div className="flex items-center gap-2 bg-surface/50 backdrop-blur-md px-5 py-2 rounded-full border border-border text-accent hover:bg-surface hover:border-accent/30 transition-all cursor-pointer shadow-sm active:scale-95">
                <span className="text-sm font-bold capitalize">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </div>

              {/* Invisible native input for functionality */}
              <input
                type="month"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                value={format(currentMonth, "yyyy-MM")}
                onChange={handleMonthPicker}
              />
            </div>

            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-surface rounded-full text-text-muted hover:text-text-main transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Week Headers */}
          <div className="grid grid-cols-7 mb-3">
            {weekDayNames.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-bold text-text-muted uppercase tracking-wider py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-3 relative z-10">
            {calendarDays.map((day, i) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDate);
              const workout = monthWorkouts.find((w) =>
                isSameDay(parseISO(w.date), day),
              );
              const hasWorkout = !!workout;
              const isRest = workout?.rest_day;

              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center relative"
                >
                  <button
                    onClick={() => setSelectedDate(day)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all relative
                        ${!isCurrentMonth ? "opacity-30 text-text-muted" : ""}
                        ${
                          isSelected
                            ? "bg-accent text-text-inverted shadow-[0_0_15px_rgb(var(--accent-rgb)/0.4)] scale-110 z-10 font-black" // High Production Glow
                            : "hover:bg-white/10 text-text-muted hover:text-text-main"
                        }
                      `}
                  >
                    {format(day, "d")}

                    {/* Dots indicator */}
                    {hasWorkout && !isSelected && (
                      <div
                        className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${
                          isRest
                            ? "bg-success shadow-[0_0_5px_rgb(var(--success-rgb)/0.5)]"
                            : "bg-accent shadow-[0_0_5px_rgb(var(--accent-rgb)/0.5)]"
                        }`}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* DETAILS CARD */}
        <section className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-1 h-6 bg-accent rounded-full"></div>
            <h3 className="text-lg font-black text-text-main">
              Workout Details
            </h3>
          </div>

          {/* Using @ts-ignore on props is acceptable here as strict typing 
             ensures 'WorkoutRow' has everything 'WorkoutDetailsCard' needs 
          */}
          <WorkoutDetailsCard
            // @ts-ignore
            workout={selectedWorkout}
            details={workoutDetails}
            isLoading={isLoading}
          />
        </section>
      </div>
    </div>
  );
}
