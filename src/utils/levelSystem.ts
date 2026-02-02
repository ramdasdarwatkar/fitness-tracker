import { supabase } from "../lib/supabase";
import { addDays, format, differenceInCalendarDays, parseISO } from "date-fns";

export type Tier =
  | "Beginner"
  | "Novice"
  | "Intermediate"
  | "Advanced"
  | "Elite";

export interface LevelStats {
  level: number;
  tier: Tier;
  currentPoints: number;
  nextLevelPoints: number;
  progressPercent: number;
}

// --- CONFIGURATION ---
export const getPenalty = (tier: Tier): number => {
  switch (tier) {
    case "Beginner":
      return 0.25;
    case "Novice":
      return 0.5;
    case "Intermediate":
      return 1.0;
    case "Advanced":
      return 1.5;
    case "Elite":
      return 2.0;
    default:
      return 0.25;
  }
};

// --- CORE CALCULATOR (User Provided Logic) ---
export function calculateLevel(totalPointsRaw: number): LevelStats {
  const points = Math.max(0, Math.round(totalPointsRaw)); // Ensure positive integer

  // Helper to structure the return data
  const formatStats = (lvl: number, tier: Tier, curr: number, max: number) => {
    // Calculate percentage (0-100)
    const progressPercent = Math.min(100, Math.max(0, (curr / max) * 100));
    return {
      level: lvl,
      tier,
      currentPoints: Math.round(curr * 100) / 100,
      nextLevelPoints: max,
      progressPercent,
    };
  };

  // Tier 1: Beginner (0 - 210) | 21 pts/level
  if (points < 210) {
    const level = Math.floor(points / 21) + 1;
    const current = points % 21;
    return formatStats(level, "Beginner", current, 21);
  }

  // Tier 2: Novice (211 - 546) | 28 pts/level
  if (points < 546) {
    const relativePoints = points - 210;
    const level = 10 + Math.floor(relativePoints / 28) + 1;
    const current = relativePoints % 28;
    return formatStats(level, "Novice", current, 28);
  }

  // Tier 3: Intermediate (547 - 1071) | 35 pts/level
  if (points < 1071) {
    const relativePoints = points - 546;
    const level = 22 + Math.floor(relativePoints / 35) + 1;
    const current = relativePoints % 35;
    return formatStats(level, "Intermediate", current, 35);
  }

  // Tier 4: Advanced (1072 - 1827) | 42 pts/level
  if (points < 1827) {
    const relativePoints = points - 1071;
    const level = 37 + Math.floor(relativePoints / 42) + 1;
    const current = relativePoints % 42;
    return formatStats(level, "Advanced", current, 42);
  }

  // Tier 5: Elite (1828+) | 50 pts/level
  const relativePoints = points - 1827;
  const level = 55 + Math.floor(relativePoints / 50) + 1;
  const current = relativePoints % 50;
  return formatStats(level, "Elite", current, 50);
}

// --- SYNC LOGIC ---
export async function calculateNewLevelData(
  userId: string, // MUST BE AUTH ID (uuid)
  currentTotalPoints: number,
  lastCalcDateStr: string | null,
  targetDaysPerWeek: number,
) {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  // 1. If never calculated, assume we just start tracking from now (or keep current points)
  if (!lastCalcDateStr) {
    return { newTotalPoints: currentTotalPoints, calcDate: todayStr };
  }

  const lastCalcDate = parseISO(lastCalcDateStr);
  const startDate = addDays(lastCalcDate, 1);

  // If up to date, do nothing
  if (differenceInCalendarDays(today, startDate) < 0) {
    return { newTotalPoints: currentTotalPoints, calcDate: todayStr };
  }

  // 2. Fetch Workout Logs (Using the Auth ID passed in)
  const { data: logs, error } = await supabase
    .from("workout")
    .select("date")
    .eq("user_id", userId)
    .gte("date", format(startDate, "yyyy-MM-dd"))
    .lte("date", todayStr);

  if (error) throw error;

  const loggedDates = new Set(logs?.map((l) => l.date) || []);

  let runningPoints = currentTotalPoints;
  let iterDate = startDate;
  let currentWeekLogs = 0;

  // 3. Iterate Day by Day
  while (differenceInCalendarDays(today, iterDate) >= 0) {
    const iterDateStr = format(iterDate, "yyyy-MM-dd");

    // A. GAIN: +1 Point for activity
    if (loggedDates.has(iterDateStr)) {
      runningPoints += 1;
      currentWeekLogs++;
    }

    // B. LOSS: Check for Weekly Targets on SUNDAYS
    if (iterDate.getDay() === 0) {
      // 0 = Sunday
      const needed = targetDaysPerWeek || 3;

      if (currentWeekLogs < needed) {
        const missed = needed - currentWeekLogs;

        // Dynamic Penalty: Calculate Tier based on CURRENT running points
        const tempStats = calculateLevel(runningPoints);
        const penaltyPerDay = getPenalty(tempStats.tier);

        runningPoints -= missed * penaltyPerDay;

        if (runningPoints < 0) runningPoints = 0;
      }

      // Reset for next week
      currentWeekLogs = 0;
    }

    // Next Day
    iterDate = addDays(iterDate, 1);
  }

  return {
    newTotalPoints: parseFloat(runningPoints.toFixed(2)),
    calcDate: todayStr,
  };
}
