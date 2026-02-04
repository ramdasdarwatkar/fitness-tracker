import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types"; // <--- 1. Import Source of Truth
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { format, subMonths, subYears, isAfter, parseISO } from "date-fns";
import {
  Activity,
  ChevronDown,
  Filter,
  TrendingUp,
  TrendingDown,
  History,
  Dumbbell,
  MapPin,
} from "lucide-react";

// --- 2. DERIVED TYPES ---
type ProfileMetricRow = Database["public"]["Tables"]["profile_metrics"]["Row"];
// Extract valid keys from the profile_metrics table (excluding system fields like id, user_id, log_date)
type MetricKey = keyof Omit<ProfileMetricRow, "id" | "user_id" | "log_date">;

interface MetricOption {
  id: MetricKey;
  label: string;
  unit: string;
}

// --- 3. STRICT CONSTANTS ---
// TS will now yell if 'id' doesn't match a column in your DB
const METRIC_OPTIONS: MetricOption[] = [
  { id: "weight", label: "Body Weight", unit: "kg" },
  { id: "neck", label: "Neck", unit: "in" },
  { id: "shoulders", label: "Shoulders", unit: "in" },
  { id: "chest", label: "Chest", unit: "in" },
  { id: "waist", label: "Waist", unit: "in" },
  { id: "hips", label: "Hips", unit: "in" },
  { id: "left_bicep", label: "Left Bicep", unit: "in" },
  { id: "right_bicep", label: "Right Bicep", unit: "in" },
  { id: "left_forearm", label: "Left Forearm", unit: "in" },
  { id: "right_forearm", label: "Right Forearm", unit: "in" },
  { id: "left_thigh", label: "Left Thigh", unit: "in" },
  { id: "right_thigh", label: "Right Thigh", unit: "in" },
  { id: "left_calf", label: "Left Calf", unit: "in" },
  { id: "right_calf", label: "Right Calf", unit: "in" },
  { id: "belly", label: "Belly", unit: "in" },
];

type TimeRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

interface SetLog {
  weight: number | null;
  reps: number | null;
  distance: number | null;
  duration: number | null;
  set: number;
}

interface WorkoutGroup {
  date: string;
  workoutId: number;
  maxValue: number;
  maxValue2?: number;
  metricType: "weight" | "distance";
  sets: SetLog[];
}

interface ChartPoint {
  date: string;
  value: number;
  value2?: number;
}

export function Progress() {
  const { user } = useAuth();
  const { exercises } = useData();

  // --- STATE ---
  const [selectedType, setSelectedType] = useState<"metric" | "exercise">(
    "metric",
  );

  // State can hold a MetricKey OR an Exercise ID (number)
  // We keep it as string for simplicity in the UI, but cast when fetching
  const [selectedId, setSelectedId] = useState<string>("weight");

  const [timeRange, setTimeRange] = useState<TimeRange>("3M");

  const [historyData, setHistoryData] = useState<WorkoutGroup[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- HELPERS ---
  const selectedLabel = useMemo(() => {
    if (selectedType === "metric")
      return (
        METRIC_OPTIONS.find((m) => m.id === selectedId)?.label || "Unknown"
      );
    // Parse int for exercises because IDs are numbers
    return (
      exercises.find((e) => e.id === Number(selectedId))?.name ||
      "Unknown Exercise"
    );
  }, [selectedType, selectedId, exercises]);

  const selectedUnit = useMemo(() => {
    if (selectedType === "metric")
      return METRIC_OPTIONS.find((m) => m.id === selectedId)?.unit || "in";
    return "kg";
  }, [selectedType, selectedId]);

  // --- DATA FETCHING ---
  useEffect(() => {
    let mounted = true;
    if (!user?.id) return;

    const fetchHistory = async () => {
      setLoading(true);
      const now = new Date();
      let cutoffDate: Date | null = null;
      if (timeRange === "1M") cutoffDate = subMonths(now, 1);
      if (timeRange === "3M") cutoffDate = subMonths(now, 3);
      if (timeRange === "6M") cutoffDate = subMonths(now, 6);
      if (timeRange === "1Y") cutoffDate = subYears(now, 1);

      try {
        if (selectedType === "metric") {
          // --- METRIC FETCH ---
          // Using 'as MetricKey' to strictly type the query
          const metricKey = selectedId as MetricKey;

          let query = supabase
            .from("profile_metrics")
            .select(`log_date, ${metricKey}`)
            .eq("user_id", user.id)
            .order("log_date", { ascending: true });

          if (cutoffDate)
            query = query.gte("log_date", format(cutoffDate, "yyyy-MM-dd"));

          const { data, error } = await query;
          if (error) throw error;

          const mapped = (data || [])
            // @ts-ignore: Dynamic access to strictly typed key is safe here
            .filter((row) => row[metricKey] !== null)
            .map((row) => ({
              date: row.log_date,
              // @ts-ignore
              value: Number(row[metricKey]),
            }));

          if (mounted) {
            setChartData(mapped);
            setHistoryData([]);
          }
        } else {
          // --- EXERCISE FETCH ---
          const { data, error } = await supabase
            .from("workout_logs")
            .select(
              `
              weight, reps, set, distance, duration,
              workout!inner ( id, date, user_id )
            `,
            )
            .eq("exercise_id", Number(selectedId)) // Ensure ID is number
            .eq("workout.user_id", user.id);

          if (error) throw error;

          if (data && mounted) {
            const groups = new Map<string, WorkoutGroup>();

            data.forEach((row: any) => {
              const d = row.workout?.date;
              const w = Number(row.weight) || 0;
              const dist = Number(row.distance) || 0;
              const dur = Number(row.duration) || 0;

              if (d) {
                if (!cutoffDate || isAfter(parseISO(d), cutoffDate)) {
                  if (!groups.has(d)) {
                    groups.set(d, {
                      date: d,
                      workoutId: row.workout.id,
                      maxValue: 0,
                      maxValue2: 0,
                      metricType: w > 0 ? "weight" : "distance",
                      sets: [],
                    });
                  }
                  const group = groups.get(d)!;

                  group.sets.push({
                    weight: row.weight,
                    reps: row.reps,
                    set: row.set,
                    distance: row.distance,
                    duration: row.duration,
                  });

                  if (w > 0) {
                    if (w > group.maxValue) group.maxValue = w;
                  } else {
                    if (dist > group.maxValue) group.maxValue = dist;
                    if (dur > (group.maxValue2 || 0)) group.maxValue2 = dur;
                  }
                }
              }
            });

            const sortedGroups = Array.from(groups.values()).sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            );

            const chartPoints = sortedGroups.map((g) => ({
              date: g.date,
              value: g.maxValue,
              value2: g.maxValue2 && g.maxValue2 > 0 ? g.maxValue2 : undefined,
            }));

            setHistoryData(sortedGroups.reverse());
            setChartData(chartPoints);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      mounted = false;
    };
  }, [user?.id, selectedType, selectedId, timeRange]);

  const handleSelect = (type: "metric" | "exercise", id: string) => {
    setSelectedType(type);
    setSelectedId(id);
    setIsDropdownOpen(false);
    setActivePoint(null);
  };

  // --- DISPLAY HELPERS ---
  const getPrimaryUnit = () => {
    if (selectedType === "metric") return selectedUnit;
    if (historyData.length > 0)
      return historyData[0].metricType === "distance" ? "km" : "kg";
    return "kg";
  };

  const getSecondaryUnit = () => "min";

  const displayLabel = activePoint
    ? format(parseISO(activePoint.date), "MMM d, yyyy")
    : selectedType === "metric"
      ? "Current Value"
      : "Current Max";

  const primaryVal = activePoint
    ? activePoint.value
    : chartData.length > 0
      ? chartData[chartData.length - 1].value
      : 0;
  const secondaryVal = activePoint?.value2 ? activePoint.value2 : null;
  const delta =
    chartData.length > 1
      ? chartData[chartData.length - 1].value - chartData[0].value
      : 0;

  return (
    <div className="h-full flex flex-col animate-in fade-in">
      {/* HEADER & DROPDOWN */}
      <div className="pt-8 px-4 pb-4 flex-none z-20">
        <h1 className="text-3xl font-black text-text-main mb-4 tracking-tight">
          Progress
        </h1>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full glass p-4 rounded-2xl flex items-center justify-between group hover:bg-surface/50 active:scale-95 transition-all border border-border bg-surface/30 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${selectedType === "metric" ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"}`}
              >
                {selectedType === "metric" ? (
                  <Activity size={20} />
                ) : (
                  <TrendingUp size={20} />
                )}
              </div>
              <div className="text-left">
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  {selectedType === "metric" ? "Body Metric" : "Exercise"}
                </p>
                <p className="text-lg font-bold text-text-main">
                  {selectedLabel}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-text-muted transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-bg-base/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl max-h-[60vh] overflow-y-auto z-50 animate-in zoom-in-95 custom-scrollbar p-2">
              <div className="mb-2">
                <div className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wider sticky top-0 bg-bg-base/95 backdrop-blur-md">
                  Body Metrics
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {METRIC_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect("metric", opt.id)}
                      className="text-left px-3 py-2.5 rounded-lg text-sm text-text-main hover:bg-surface/50 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wider sticky top-0 bg-bg-base/95 backdrop-blur-md border-t border-border mt-2 pt-2">
                  Exercises
                </div>
                <div className="space-y-0.5">
                  {exercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleSelect("exercise", ex.id.toString())}
                      className="w-full text-left px-3 py-3 rounded-lg text-sm text-text-main hover:bg-surface/50 transition-colors flex justify-between items-center group"
                    >
                      <span>{ex.name}</span>
                      <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100">
                        {ex.muscle_group_id}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 custom-scrollbar space-y-6">
        {/* TIME SELECTOR */}
        <div className="bg-surface/30 border border-border p-1 rounded-xl flex backdrop-blur-sm">
          {(["1M", "3M", "6M", "1Y", "ALL"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                timeRange === range
                  ? "bg-accent text-text-inverted shadow-lg"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* CHART CARD */}
        <div className="glass p-5 rounded-3xl min-h-[300px] flex flex-col relative overflow-hidden border border-border bg-surface/40 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Header Info */}
          <div className="flex justify-between items-start mb-6 z-10">
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                {displayLabel}
              </span>
              <div className="flex gap-4 items-baseline">
                <div className="text-3xl font-black text-text-main flex items-baseline gap-1">
                  {primaryVal || "--"}
                  <span className="text-sm font-bold text-text-muted">
                    {getPrimaryUnit()}
                  </span>
                </div>
                {secondaryVal && (
                  <div className="text-xl font-bold text-blue-500 flex items-baseline gap-1 animate-in fade-in">
                    {secondaryVal}
                    <span className="text-xs font-bold text-blue-500/60">
                      {getSecondaryUnit()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {!activePoint && chartData.length > 1 && (
              <div
                className={`px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold ${delta >= 0 ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
              >
                {delta >= 0 ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {Math.abs(delta).toFixed(1)}
              </div>
            )}
          </div>

          <div className="flex-1 w-full relative z-10 min-h-[200px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-text-muted text-xs animate-pulse">
                Loading...
              </div>
            ) : chartData.length > 1 ? (
              <GlowLineChart
                data={chartData}
                color="var(--color-accent)"
                color2="#3b82f6"
                onHover={setActivePoint}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted opacity-50">
                <Filter size={24} className="mb-2" />
                <span className="text-xs">No chart data</span>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-accent/5 to-transparent pointer-events-none" />
        </div>

        {/* HISTORY LIST */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <History size={14} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              History Log
            </span>
          </div>

          {chartData.length === 0 && !loading && (
            <div className="text-center py-8 text-xs text-text-muted italic glass rounded-2xl border border-border">
              No logs found.
            </div>
          )}

          {selectedType === "exercise"
            ? historyData.map((group, idx) => (
                <WorkoutDetailsCard
                  key={`${group.workoutId}-${idx}`}
                  data={group}
                />
              ))
            : [...chartData].reverse().map((item, idx) => (
                <div
                  key={idx}
                  className="glass p-4 rounded-xl flex justify-between items-center border border-border bg-surface/30 group hover:border-accent/30 hover:bg-surface/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full bg-accent/50 group-hover:bg-accent transition-colors" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-main">
                        {format(parseISO(item.date), "MMM d, yyyy")}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">
                        {format(parseISO(item.date), "EEEE")}
                      </span>
                    </div>
                  </div>
                  <div className="font-black text-text-main text-xl">
                    {item.value}{" "}
                    <span className="text-xs font-bold text-text-muted">
                      {selectedUnit}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Workout Details Card ---
function WorkoutDetailsCard({ data }: { data: WorkoutGroup }) {
  const isDual =
    data.metricType === "distance" && data.maxValue2 && data.maxValue2 > 0;

  return (
    <div className="glass rounded-2xl border border-border overflow-hidden bg-surface/30 hover:bg-surface/50 transition-all">
      <div className="px-4 py-3 bg-surface/50 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg text-accent">
            {data.metricType === "distance" ? (
              <MapPin size={16} />
            ) : (
              <Dumbbell size={16} />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-main">
              {format(parseISO(data.date), "MMM d, yyyy")}
            </h4>
            <p className="text-[10px] text-text-muted font-bold uppercase">
              {format(parseISO(data.date), "EEEE")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-text-muted block uppercase">
            Best
          </span>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="text-lg font-black text-text-main">
              {data.maxValue}{" "}
              <span className="text-xs text-text-muted">
                {data.metricType === "distance" ? "km" : "kg"}
              </span>
            </span>
            {isDual && (
              <span className="text-sm font-bold text-blue-500">
                {data.maxValue2}{" "}
                <span className="text-[9px] text-blue-500/70">min</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 grid grid-cols-4 gap-2">
        {data.sets
          .sort((a, b) => a.set - b.set)
          .map((s) => (
            <div
              key={s.set}
              className="bg-surface/30 rounded-lg p-2 text-center border border-transparent hover:border-accent/30 transition-colors flex flex-col justify-center min-h-[50px]"
            >
              <span className="text-[9px] text-text-muted font-bold uppercase block mb-0.5">
                Set {s.set}
              </span>
              <div className="text-xs font-bold text-text-main">
                {s.weight && s.weight > 0 ? (
                  <>
                    {s.weight}kg <span className="text-text-muted">x</span>{" "}
                    {s.reps || 0}
                  </>
                ) : s.distance && s.distance > 0 ? (
                  <div className="flex flex-col leading-tight">
                    <span>{s.distance}km</span>
                    {s.duration && (
                      <span className="text-[9px] text-blue-400">
                        {s.duration} min
                      </span>
                    )}
                  </div>
                ) : s.duration ? (
                  <>{s.duration} min</>
                ) : (
                  "-"
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Dual Glow Line Chart ---
function GlowLineChart({
  data,
  color = "#f97316",
  color2 = "#3b82f6",
  onHover,
}: {
  data: ChartPoint[];
  color?: string;
  color2?: string;
  onHover: (d: any) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length < 2) return null;

  const values1 = data.map((d) => d.value);
  const min1 = Math.min(...values1) * 0.95;
  const max1 = Math.max(...values1) * 1.05;
  const range1 = max1 - min1 || 1;
  const points1 = values1
    .map((val, index) => {
      const x = (index / (values1.length - 1)) * 100;
      const y = 100 - ((val - min1) / range1) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const hasSecondary = data.some((d) => d.value2 !== undefined);
  const values2 = data.map((d) => d.value2 || 0);

  let points2 = "";
  if (hasSecondary) {
    const validV2 = data
      .filter((d) => d.value2 !== undefined)
      .map((d) => d.value2!);
    if (validV2.length > 0) {
      const min2 = Math.min(...validV2) * 0.95;
      const max2 = Math.max(...validV2) * 1.05;
      const range2 = max2 - min2 || 1;
      points2 = data
        .map((d, index) => {
          const val = d.value2 || min2;
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((val - min2) / range2) * 100;
          return `${x},${y}`;
        })
        .join(" ");
    }
  }

  const handleEnter = (index: number) => {
    setHoveredIndex(index);
    onHover(data[index]);
  };
  const handleLeave = () => {
    setHoveredIndex(null);
    onHover(null);
  };

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full overflow-visible"
      onMouseLeave={handleLeave}
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {[25, 50, 75].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="100"
          y2={y}
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
          className="text-text-muted"
        />
      ))}

      <polyline
        points={points1}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: "url(#glow)" }}
        opacity="0.9"
      />
      <polygon
        points={`0,100 ${points1} 100,100`}
        fill={color}
        fillOpacity="0.15"
      />

      {hasSecondary && points2 && (
        <polyline
          points={points2}
          fill="none"
          stroke={color2}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4"
          vectorEffect="non-scaling-stroke"
          opacity="0.8"
        />
      )}

      {data.map((d, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y1 = 100 - ((d.value - min1) / range1) * 100;
        const isHovered = hoveredIndex === index;

        return (
          <g key={index}>
            <circle
              cx={x}
              cy={y1}
              r="2"
              fill="var(--background)"
              stroke={color}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />

            {d.value2 && hasSecondary && (
              <circle
                cx={x}
                cy={
                  100 -
                  ((d.value2 - Math.min(...values2) * 0.95) /
                    (Math.max(...values2) * 1.05 -
                      Math.min(...values2) * 0.95 || 1)) *
                    100
                }
                r="1.5"
                fill="var(--background)"
                stroke={color2}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            )}

            <rect
              x={x - 50 / data.length}
              y="0"
              width={100 / data.length}
              height="100"
              fill="transparent"
              onMouseEnter={() => handleEnter(index)}
            />

            {isHovered && (
              <g>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.2"
                  className="text-text-main"
                />
                <circle cx={x} cy={y1} r="6" fill={color} opacity="0.3" />
                <circle
                  cx={x}
                  cy={y1}
                  r="3"
                  fill="white"
                  stroke={color}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
