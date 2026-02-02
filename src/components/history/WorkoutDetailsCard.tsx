import { format } from "date-fns";
import {
  Clock,
  Weight,
  Trophy,
  Coffee,
  History as HistoryIcon,
  StickyNote,
  Dumbbell,
} from "lucide-react";

// --- TYPES ---
export type WorkoutSummary = {
  id: number;
  date: string;
  completed: boolean;
  rest_day: boolean;
  total_volume: number;
  total_duration: number;
  muscles: string;
  notes: string;
  calories: number;
};

export type SetDetail = {
  set: number;
  weight: number;
  reps: number;
  distance: number;
  duration: number;
};

export type ExerciseGroup = {
  name: string;
  sets: SetDetail[];
};

interface WorkoutDetailsCardProps {
  workout: WorkoutSummary | null;
  details: ExerciseGroup[];
  isLoading: boolean;
}

export function WorkoutDetailsCard({
  workout,
  details,
  isLoading,
}: WorkoutDetailsCardProps) {
  const formatDuration = (mins: number) => {
    if (!mins) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // 1. EMPTY STATE
  if (!workout) {
    return (
      <div className="h-48 flex flex-col items-center justify-center glass rounded-3xl border border-border text-text-muted animate-in fade-in duration-500">
        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-3">
          <HistoryIcon className="w-6 h-6 opacity-30" />
        </div>
        <p className="text-sm font-bold">Select a date to view details</p>
      </div>
    );
  }

  const dateObj = new Date(workout.date);

  return (
    <div className="glass rounded-3xl overflow-hidden border border-border shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* 2. MAIN HEADER (Workout Summary) */}
      <div className="p-5 bg-surface flex items-start justify-between relative overflow-hidden border-b border-border">
        {/* Dynamic Background Tint based on status */}
        <div
          className={`absolute inset-0 opacity-10 ${
            workout.rest_day ? "bg-success" : "bg-accent"
          }`}
        />

        <div className="flex gap-4 relative z-10 w-full">
          <div className="flex-none flex flex-col items-center justify-center bg-bg-base/50 backdrop-blur-md border border-border rounded-2xl w-14 h-14 shadow-lg">
            <span className="text-[10px] font-bold text-text-muted uppercase">
              {format(dateObj, "EEE")}
            </span>
            <span className="text-xl font-black text-text-main">
              {format(dateObj, "d")}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-black text-text-main truncate">
                {workout.rest_day ? "Rest Day" : "Workout Session"}
              </h2>
              {workout.rest_day && <Coffee className="w-4 h-4 text-success" />}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-text-muted">
              {!workout.rest_day ? (
                <>
                  {/* Icons now use 'text-accent' to match the theme instead of random colors */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-accent" />{" "}
                    {formatDuration(workout.total_duration)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Weight className="w-3 h-3 text-accent" />{" "}
                    {workout.total_volume} kg
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-3 h-3 text-accent" />{" "}
                    {workout.calories} cal
                  </div>
                </>
              ) : (
                <span className="text-success">Recovery & Growth</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTENT BODY */}
      <div className="p-4 bg-bg-base/30 min-h-[200px]">
        {workout.rest_day ? (
          <div className="flex flex-col items-center justify-center py-12 text-success/50">
            <Coffee className="w-16 h-16 mb-3 opacity-50" />
            <p className="text-sm font-bold text-text-muted">
              No exercises logged.
            </p>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              // EXERCISE CARD LIST
              <div className="space-y-3">
                {details.map((exercise, idx) => (
                  // --- INDIVIDUAL EXERCISE CARD ---
                  <div
                    key={idx}
                    className="bg-surface rounded-2xl border border-border overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-bg-base/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-text-main text-sm">
                          {exercise.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        {exercise.sets.length} Sets
                      </span>
                    </div>

                    {/* Card Body (Sets) */}
                    <div className="p-2">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-2 text-[9px] font-bold text-text-muted uppercase tracking-wider mb-2 text-center opacity-60 px-2">
                        <div className="col-span-2 text-left">Set</div>
                        <div className="col-span-3">
                          {exercise.sets[0]?.distance > 0 ? "KM" : "KG"}
                        </div>
                        <div className="col-span-3">
                          {exercise.sets[0]?.distance > 0 ? "Time" : "Reps"}
                        </div>
                        <div className="col-span-4 text-right">Vol</div>
                      </div>

                      {/* Sets Rows */}
                      <div className="space-y-1">
                        {exercise.sets.map((set, sIdx) => {
                          // Calculate Volume
                          const volume =
                            set.weight > 0 && set.reps > 0
                              ? Math.round(set.weight * set.reps)
                              : 0;

                          return (
                            <div
                              key={sIdx}
                              className="grid grid-cols-12 gap-2 items-center text-sm py-1.5 px-2 rounded-lg odd:bg-bg-base/50 text-center"
                            >
                              {/* Set Number */}
                              <div className="col-span-2 text-left">
                                <span className="text-xs font-bold text-text-muted opacity-70">
                                  {set.set}
                                </span>
                              </div>

                              {/* Weight / Distance */}
                              <div className="col-span-3 font-bold text-text-main">
                                {set.distance > 0
                                  ? set.distance
                                  : set.weight > 0
                                    ? set.weight
                                    : "-"}
                              </div>

                              {/* Reps / Time */}
                              <div className="col-span-3 font-bold text-text-main">
                                {set.duration > 0
                                  ? `${set.duration}m`
                                  : set.reps > 0
                                    ? set.reps
                                    : "-"}
                              </div>

                              {/* Volume Column */}
                              <div className="col-span-4 text-right font-mono font-bold text-text-muted text-xs">
                                {volume > 0 ? `${volume} kg` : "-"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {details.length === 0 && !isLoading && (
                  <div className="py-8 text-center text-text-muted text-sm">
                    No logs found for this workout.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. FOOTER NOTES */}
      {workout.notes && (
        <div className="p-5 bg-surface border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <StickyNote className="w-3 h-3 text-text-muted" />
            <p className="text-xs font-bold text-text-muted uppercase">Notes</p>
          </div>
          <p className="text-sm text-text-muted italic leading-relaxed">
            "{workout.notes}"
          </p>
        </div>
      )}
    </div>
  );
}
