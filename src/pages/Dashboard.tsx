import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { useWorkout } from "../context/WorkoutContext";
import { calculateLevel } from "../utils/levelSystem";
import { BodyMap } from "../components/dashboard/BodyMap";
import { Modal } from "../components/ui/Modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import {
  startOfWeek,
  addDays,
  format,
  isSameDay,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";
import {
  Trophy,
  Calendar as CalIcon,
  Flame,
  Dumbbell,
  Zap,
  Play,
  CheckCircle2,
  Clock,
  Footprints,
  Weight,
  Coffee,
  Activity,
  History,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const { userProfile, weeklyWorkouts } = useData();
  const { isWorkoutActive, startWorkout, markRestDay } = useWorkout();
  const navigate = useNavigate();

  const [showStartMenu, setShowStartMenu] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [showDateStep, setShowDateStep] = useState(false);
  const [logType, setLogType] = useState<"workout" | "rest">("workout");
  const [formError, setFormError] = useState("");

  // Confirmation Modal State
  const [confirmRestOpen, setConfirmRestOpen] = useState(false);

  // --- 1. CALCULATE TOTALS ---
  const totals = useMemo(() => {
    let volume = 0;
    let duration = 0;
    let calories = 0;
    let distanceMeters = 0;
    weeklyWorkouts.forEach((w: any) => {
      duration += w.total_duration || 0;
      calories += w.calories || 0;
      if (!w.rest_day) {
        volume += w.total_volume || 0;
        distanceMeters += w.total_distance || 0;
      }
    });
    const steps = Math.round(distanceMeters * 1.31);
    return { volume, duration, calories, steps };
  }, [weeklyWorkouts]);

  // --- 2. STATS & STREAK ---
  const stats = useMemo(() => {
    const totalPoints = userProfile?.level_points || 0;
    const levelData = calculateLevel(totalPoints);
    const sortedLocalDates = [...weeklyWorkouts]
      .map((w) => format(parseISO(w.date), "yyyy-MM-dd"))
      .sort((a, b) => b.localeCompare(a));
    const uniqueDates = Array.from(new Set(sortedLocalDates));

    let localStreak = 0;
    if (uniqueDates.length > 0) {
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(addDays(new Date(), -1), "yyyy-MM-dd");
      const lastLog = uniqueDates[0];

      if (lastLog === today || lastLog === yesterday) {
        localStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const current = parseISO(uniqueDates[i]);
          const prev = parseISO(uniqueDates[i + 1]);
          const diff = differenceInCalendarDays(current, prev);
          if (diff === 1) localStreak++;
          else break;
        }
      }
    }
    return { ...levelData, streak: localStreak };
  }, [weeklyWorkouts, userProfile]);

  // --- 3. CALENDAR SETUP ---
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(start, i);
      const isToday = isSameDay(date, new Date());
      const log = weeklyWorkouts.find((w: any) =>
        isSameDay(parseISO(w.date), date),
      );
      return {
        date,
        dayName: format(date, "EEE"),
        dayNum: format(date, "d"),
        isToday,
        hasWorkout: !!log && !log.rest_day,
        isRest: !!log && log.rest_day,
      };
    });
  }, [weeklyWorkouts]);

  // --- 4. BODY MAP ---
  const activeMuscles = useMemo(() => {
    const muscles = new Set<string>();
    weeklyWorkouts.slice(0, 3).forEach((w: any) => {
      if (w.muscles)
        w.muscles.split(",").forEach((m: string) => muscles.add(m.trim()));
    });
    return Array.from(muscles);
  }, [weeklyWorkouts]);

  const formatDuration = (t: number) => {
    const h = Math.floor(t / 60);
    const m = Math.round(t % 60);
    return h > 0 ? (
      <>
        {h}
        <span className="text-sm font-medium text-text-muted">h</span> {m}
        <span className="text-sm font-medium text-text-muted">m</span>
      </>
    ) : (
      <>
        {m}
        <span className="text-sm font-medium text-text-muted">m</span>
      </>
    );
  };

  // --- HANDLERS ---
  const handleLiveStart = async () => {
    await startWorkout("live");
    setShowStartMenu(false);
    navigate("/workout");
  };

  const openDateStep = (type: "workout" | "rest") => {
    setLogType(type);
    setFormError("");
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    setManualDate(yest.toISOString().split("T")[0]);
    setManualTime("18:00");
    setShowDateStep(true);
  };

  const handleManualStart = async () => {
    const start = new Date(`${manualDate}T${manualTime}:00`);
    if (isNaN(start.getTime())) {
      setFormError("Please select a valid date and time.");
      return;
    }
    await startWorkout("manual", [], start.getTime());
    setShowStartMenu(false);
    navigate("/workout");
  };

  const initiateRestDay = () => {
    if (!manualDate) {
      setFormError("Please select a date.");
      return;
    }
    setConfirmRestOpen(true);
  };

  const executeRestDay = async () => {
    await markRestDay(manualDate);
    setConfirmRestOpen(false);
    setShowStartMenu(false);
  };

  // --- RENDER ---
  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col gap-2 pb-0">
      {/* HEADER */}
      <header className="flex items-center justify-between px-2 pt-2 flex-none">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full border-2 border-accent flex items-center justify-center bg-accent/10 shadow-[0_0_15px_rgb(var(--accent-rgb)/0.3)]">
            <Trophy className="w-6 h-6 text-accent fill-accent/20" />
            <div className="absolute -bottom-2 bg-accent text-text-inverted text-[10px] font-black px-2 py-0.5 rounded-full border border-bg-base">
              LVL {stats.level}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-black text-text-main leading-none">
              {userProfile?.name || "Athlete"}
            </h1>
            <div className="flex items-center justify-between text-[10px] font-bold text-text-muted mt-1.5 mb-1">
              <span>{stats.tier}</span>
              <span>
                {stats.currentPoints} / {stats.nextLevelPoints} pts
              </span>
            </div>
            <div className="w-32 h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-1000 ease-out"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/history")}
          className="p-3 glass rounded-xl text-text-muted hover:text-accent transition-colors"
        >
          <CalIcon className="w-5 h-5" />
        </button>
      </header>

      {/* CALENDAR CARD */}
      <section className="mt-4 glass rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden flex-none border border-border">
        {/* Glow behind calendar matches theme */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex justify-between items-start">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 relative group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {day.dayName}
              </span>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300 
                  ${
                    day.isRest
                      ? "bg-success/10 text-success border border-success/20 shadow-[0_0_10px_rgb(var(--success-rgb)/0.2)]"
                      : day.hasWorkout
                        ? "bg-accent text-text-inverted shadow-[0_0_15px_rgb(var(--accent-rgb)/0.4)] scale-110"
                        : day.isToday
                          ? "bg-surface border border-accent text-accent ring-1 ring-accent/20"
                          : "bg-surface text-text-muted/50 border border-transparent"
                  }`}
              >
                {day.isRest ? (
                  <Coffee className="w-5 h-5" />
                ) : day.hasWorkout ? (
                  <Dumbbell className="w-5 h-5 fill-white/20" />
                ) : (
                  day.dayNum
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-text-muted/20 to-transparent" />

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <Flame
                  key={i}
                  className={`w-4 h-4 transition-all duration-500 ${
                    i < stats.streak
                      ? "text-accent fill-accent drop-shadow-[0_0_8px_rgb(var(--accent-rgb)/0.6)]"
                      : "text-text-muted/20"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              {stats.streak} Day Streak
            </span>
          </div>

          {/* --- MODIFIED LOGIC: Always allow Start/Resume --- */}
          {isWorkoutActive ? (
            <button
              onClick={() => navigate("/workout")}
              className="bg-accent text-text-inverted px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg animate-pulse"
            >
              <Activity className="w-3 h-3 fill-current" /> RESUME
            </button>
          ) : (
            <button
              onClick={() => {
                setShowStartMenu(true);
                setShowDateStep(false);
              }}
              // Removed the 'Complete' state restriction.
              // This button now always renders if no workout is currently active.
              className="bg-accent text-text-inverted px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition-all"
            >
              <Play className="w-3 h-3 fill-current" /> START
            </button>
          )}
        </div>
      </section>

      {/* BODY MAP SECTION */}
      <section className="glass rounded-3xl flex-1 relative flex flex-col items-center justify-center p-4 border-t border-border shadow-[inset_0_0_40px_rgba(0,0,0,0.05)]">
        <BodyMap muscles={activeMuscles} />
      </section>

      {/* STATS GRID */}
      <section className="grid grid-cols-2 gap-2 flex-none pb-4">
        {/* Metric Card 1: Volume */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between group border border-transparent hover:border-border transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Volume
            </span>
            <Weight className="w-4 h-4 text-accent" />
          </div>
          <span className="text-2xl font-black text-text-main">
            {totals.volume > 1000
              ? (totals.volume / 1000).toFixed(1) + "k"
              : totals.volume}
            <span className="text-xs text-text-muted ml-1">kg</span>
          </span>
        </div>

        {/* Metric Card 2: Calories */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between group border border-transparent hover:border-border transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Calories
            </span>
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <span className="text-2xl font-black text-text-main">
            {totals.calories}
          </span>
        </div>

        {/* Metric Card 3: Duration */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between group border border-transparent hover:border-border transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Duration
            </span>
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <span className="text-2xl font-black text-text-main">
            {formatDuration(totals.duration)}
          </span>
        </div>

        {/* Metric Card 4: Steps */}
        <div className="glass rounded-2xl p-4 flex flex-col justify-between group border border-transparent hover:border-border transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Steps
            </span>
            <Footprints className="w-4 h-4 text-accent" />
          </div>
          <span className="text-2xl font-black text-text-main">
            {totals.steps > 0 ? (totals.steps / 1000).toFixed(1) + "k" : "--"}
          </span>
        </div>
      </section>

      {/* --- START MENU MODAL --- */}
      <Modal
        isOpen={showStartMenu}
        onClose={() => setShowStartMenu(false)}
        title={
          showDateStep
            ? logType === "workout"
              ? "Log Past Workout"
              : "Log Rest Day"
            : "Start Session"
        }
      >
        {!showDateStep ? (
          <div className="space-y-3">
            <button
              onClick={handleLiveStart}
              className="w-full p-4 glass rounded-xl flex items-center gap-4 hover:bg-accent/10 transition-colors border border-border text-left"
            >
              <div className="p-3 bg-accent/20 rounded-full text-accent">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <div>
                <div className="font-bold text-text-main">Live Workout</div>
                <div className="text-xs text-text-muted">Track now</div>
              </div>
            </button>
            <button
              onClick={() => openDateStep("workout")}
              className="w-full p-4 glass rounded-xl flex items-center gap-4 hover:bg-accent/10 transition-colors border border-border text-left"
            >
              <div className="p-3 bg-accent/20 rounded-full text-accent">
                <History className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-text-main">Log Past Workout</div>
                <div className="text-xs text-text-muted">Previous date</div>
              </div>
            </button>
            <button
              onClick={() => openDateStep("rest")}
              className="w-full p-4 glass rounded-xl flex items-center gap-4 hover:bg-success/10 transition-colors border border-border text-left"
            >
              <div className="p-3 bg-success/20 rounded-full text-success">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-text-main">Rest Day</div>
                <div className="text-xs text-text-muted">Mark recovery</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setShowDateStep(false)}
              className="text-xs font-bold text-text-muted flex items-center gap-1 mb-2 hover:text-text-main"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>

            {/* Error Message Display */}
            {formError && (
              <div className="text-error text-xs font-bold bg-error/10 p-3 rounded-lg border border-error/20">
                {formError}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">
                Date
              </label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full p-4 glass-input rounded-2xl font-bold text-text-main bg-surface focus:border-accent"
              />
            </div>
            {logType === "workout" && (
              <div>
                <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">
                  Time
                </label>
                <input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="w-full p-4 glass-input rounded-2xl font-bold text-text-main bg-surface focus:border-accent"
                />
              </div>
            )}
            {logType === "workout" ? (
              <button
                onClick={handleManualStart}
                className="w-full h-14 bg-accent text-text-inverted font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[rgb(var(--accent-rgb)/0.2)] active:scale-95 transition-transform"
              >
                START LOGGING <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={initiateRestDay}
                className="w-full h-14 bg-success text-text-inverted font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[rgb(var(--success-rgb)/0.2)] active:scale-95 transition-transform"
              >
                CONFIRM REST <CheckCircle2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* --- CONFIRMATION MODAL FOR REST DAY --- */}
      <ConfirmModal
        isOpen={confirmRestOpen}
        onClose={() => setConfirmRestOpen(false)}
        onConfirm={executeRestDay}
        title="Log Rest Day"
        message={`Are you sure you want to log ${manualDate} as a rest day? This will mark the day as complete.`}
        confirmText="Yes, Log it"
      />
    </div>
  );
}
