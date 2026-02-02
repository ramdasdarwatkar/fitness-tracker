import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Clock,
  Trash2,
  Search,
  Check,
  X,
  Dumbbell,
  Calendar,
  Save,
  AlertCircle,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useWorkout } from "../context/WorkoutContext";
import { Modal } from "../components/ui/Modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";

// --- LOCAL ALERT MODAL COMPONENT ---
// (Ideally move this to components/ui/AlertModal.tsx)
const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-bg-base/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm glass bg-surface/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4 text-error">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-black text-text-main mb-2">{title}</h3>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          {message}
        </p>
        <button
          onClick={onClose}
          className="w-full h-12 bg-surface hover:bg-bg-base text-text-main font-bold rounded-xl transition-all border border-border"
        >
          Okay
        </button>
      </div>
    </div>
  );
};

export function Workout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { exercises: allCacheExercises, categories: dbCategories } =
    useData() as any;

  const {
    isWorkoutActive,
    workoutMode,
    activeExercises,
    startTime,
    startWorkout,
    finishWorkout,
    cancelWorkout,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    toggleSetComplete,
  } = useWorkout();

  // --- UI STATES ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Alert State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const [workoutNotes, setWorkoutNotes] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all",
  );
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<number[]>([]);

  const [displayDuration, setDisplayDuration] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  // --- TIMER ---
  useEffect(() => {
    if (isWorkoutActive && startTime) {
      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.floor((now - startTime) / 1000);
        setDisplayDuration(diff > 0 ? diff : 0);
      };
      updateTimer();
      timerIntervalRef.current = window.setInterval(updateTimer, 1000);
    } else {
      setDisplayDuration(0);
    }
    return () => {
      if (timerIntervalRef.current)
        window.clearInterval(timerIntervalRef.current);
    };
  }, [isWorkoutActive, startTime]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (hasInitialized.current) return;
    if (allCacheExercises && allCacheExercises.length > 0) {
      if (!isWorkoutActive) {
        if (location.state?.exercises) {
          startWorkout("live", location.state.exercises);
        } else if (location.state?.exerciseIds) {
          startWorkout("live", location.state.exerciseIds);
        }
      }
      hasInitialized.current = true;
    }
  }, [allCacheExercises, isWorkoutActive, location.state]);

  // --- FILTERING ---
  const filteredExercises = useMemo(() => {
    if (!allCacheExercises) return [];
    return allCacheExercises.filter((e: any) => {
      const matchesSearch = e.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || e.muscle_group_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allCacheExercises, searchQuery, selectedCategory]);

  const sortedCategories = useMemo(() => {
    if (!dbCategories) return [];
    return [...dbCategories].sort((a: any, b: any) =>
      a.name.localeCompare(b.name),
    );
  }, [dbCategories]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // --- HANDLERS ---
  const toggleSelection = (id: number) => {
    if (selectedExerciseIds.includes(id)) {
      setSelectedExerciseIds((prev) => prev.filter((i) => i !== id));
    } else {
      setSelectedExerciseIds((prev) => [...prev, id]);
    }
  };

  const handleBatchAdd = () => {
    selectedExerciseIds.forEach((id) => {
      addExercise(id);
    });
    setSelectedExerciseIds([]);
    setIsAddModalOpen(false);
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const onFinishClick = () => {
    setIsFinishModalOpen(true);
  };

  const confirmFinish = async () => {
    try {
      let endDate: Date | undefined = undefined;

      if (workoutMode === "manual" && manualEndTime && startTime) {
        const finishObj = new Date(startTime);
        const [hours, minutes] = manualEndTime.split(":");
        finishObj.setHours(parseInt(hours), parseInt(minutes));

        if (finishObj.getTime() < startTime) {
          finishObj.setDate(finishObj.getDate() + 1);
        }
        endDate = finishObj;
      }

      await finishWorkout(workoutNotes, endDate);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      // SHOW ALERT ON ERROR
      setAlertConfig({
        isOpen: true,
        title: "Error Saving Workout",
        message: err.message || "Something went wrong. Please try again.",
      });
    }
  };

  const handleCancelClick = () => {
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    cancelWorkout();
    navigate("/");
  };

  return (
    <div className="h-full flex flex-col relative animate-in fade-in duration-300">
      {/* HEADER */}
      <header className="flex-none px-4 py-4 flex items-center justify-between bg-surface/60 backdrop-blur-md border-b border-border z-10 sticky top-0">
        <button
          onClick={() => navigate("/")}
          className="p-2 hover:bg-surface rounded-full transition-colors text-text-muted hover:text-text-main"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-4 py-1.5 bg-surface rounded-full border border-border/50 shadow-sm">
          {workoutMode === "live" ? (
            <div className="relative">
              <div className="absolute inset-0 bg-accent rounded-full animate-ping opacity-20"></div>
              <Clock className="w-4 h-4 text-accent relative z-10" />
            </div>
          ) : (
            <Calendar className="w-4 h-4 text-blue-400" />
          )}
          <span
            className={`font-mono font-bold text-lg ${
              workoutMode === "live" ? "text-accent" : "text-blue-400"
            }`}
          >
            {workoutMode === "live" ? formatTime(displayDuration) : "LOGGING"}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCancelClick}
            className="p-2 text-text-muted hover:text-error transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={onFinishClick}
            className="bg-accent text-text-inverted px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgb(var(--accent-rgb)/0.4)] active:scale-95 transition-all hover:brightness-110"
          >
            Finish
          </button>
        </div>
      </header>

      {/* WORKOUT LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 custom-scrollbar">
        {activeExercises.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-text-muted space-y-4">
            <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center mb-2">
              <Dumbbell className="w-8 h-8 opacity-20" />
            </div>
            <p className="font-medium">Ready to lift?</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-surface border border-accent/30 text-accent font-bold rounded-xl hover:bg-accent/10 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add Exercise
            </button>
          </div>
        ) : (
          activeExercises.map((exercise, exIndex) => {
            const { tracking } = exercise;
            return (
              <div
                key={exercise.instanceId}
                className="glass rounded-3xl overflow-hidden border border-border bg-surface/30 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-500"
              >
                {/* Exercise Header */}
                <div className="p-4 flex justify-between items-start bg-surface/50 border-b border-border">
                  <div>
                    <h3 className="font-black text-lg text-text-main">
                      {exercise.name}
                    </h3>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-0.5">
                      {exercise.bodyPart}
                    </p>
                  </div>
                  <button
                    onClick={() => removeExercise(exercise.instanceId)}
                    className="p-2 text-text-muted hover:bg-error/10 hover:text-error rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sets Table */}
                <div className="p-3">
                  <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-[9px] font-bold text-text-muted uppercase tracking-wider text-center">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6 flex gap-2">
                      {tracking.weight && <div className="flex-1">Kg</div>}
                      {tracking.reps && <div className="flex-1">Reps</div>}
                      {tracking.time && <div className="flex-1">Time</div>}
                      {tracking.distance && <div className="flex-1">Dist</div>}
                    </div>
                    <div className="col-span-3">Done</div>
                    <div className="col-span-2"></div>
                  </div>

                  <div className="space-y-2">
                    {exercise.sets.map((set, setIndex) => (
                      <div
                        key={set.id}
                        className={`grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-xl transition-all ${
                          set.completed
                            ? "bg-success/10 border border-success/20 shadow-[0_0_10px_rgb(var(--success-rgb)/0.1)]"
                            : "bg-surface/40 border border-transparent hover:bg-surface/60"
                        }`}
                      >
                        <div className="col-span-1 flex justify-center">
                          <span
                            className={`text-xs font-bold ${
                              set.completed ? "text-success" : "text-text-muted"
                            }`}
                          >
                            {setIndex + 1}
                          </span>
                        </div>
                        <div className="col-span-6 flex gap-2">
                          {tracking.weight && (
                            <input
                              type="number"
                              placeholder="-"
                              value={set.kg}
                              onChange={(e) =>
                                updateSet(
                                  exIndex,
                                  setIndex,
                                  "kg",
                                  e.target.value,
                                )
                              }
                              className="w-full min-w-0 bg-transparent text-center text-sm font-black text-text-main outline-none border-b border-transparent focus:border-accent transition-colors placeholder:text-text-muted/30 p-0"
                            />
                          )}
                          {tracking.reps && (
                            <input
                              type="number"
                              placeholder="-"
                              value={set.reps}
                              onChange={(e) =>
                                updateSet(
                                  exIndex,
                                  setIndex,
                                  "reps",
                                  e.target.value,
                                )
                              }
                              className="w-full min-w-0 bg-transparent text-center text-sm font-black text-text-main outline-none border-b border-transparent focus:border-accent transition-colors placeholder:text-text-muted/30 p-0"
                            />
                          )}
                          {tracking.time && (
                            <input
                              type="number"
                              placeholder="0"
                              value={set.time}
                              onChange={(e) =>
                                updateSet(
                                  exIndex,
                                  setIndex,
                                  "time",
                                  e.target.value,
                                )
                              }
                              className="w-full min-w-0 bg-transparent text-center text-sm font-black text-text-main outline-none border-b border-transparent focus:border-accent transition-colors placeholder:text-text-muted/30 p-0"
                            />
                          )}
                          {tracking.distance && (
                            <input
                              type="number"
                              placeholder="0"
                              value={set.distance}
                              onChange={(e) =>
                                updateSet(
                                  exIndex,
                                  setIndex,
                                  "distance",
                                  e.target.value,
                                )
                              }
                              className="w-full min-w-0 bg-transparent text-center text-sm font-black text-text-main outline-none border-b border-transparent focus:border-accent transition-colors placeholder:text-text-muted/30 p-0"
                            />
                          )}
                        </div>
                        <div className="col-span-3 flex justify-center">
                          <button
                            onClick={() => toggleSetComplete(exIndex, setIndex)}
                            className={`w-full h-8 rounded-lg flex items-center justify-center transition-all ${
                              set.completed
                                ? "bg-success text-text-inverted shadow-md scale-105"
                                : "bg-bg-base/50 text-text-muted hover:bg-surface border border-border"
                            }`}
                          >
                            <Check className={`w-4 h-4 stroke-[3]`} />
                          </button>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <button
                            onClick={() => removeSet(exIndex, setIndex)}
                            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addSet(exIndex)}
                    className="w-full mt-3 py-3 flex items-center justify-center gap-2 text-[10px] font-bold text-text-muted hover:text-text-main hover:bg-surface/50 rounded-xl transition-all border border-dashed border-border"
                  >
                    <Plus className="w-3 h-3" /> ADD SET
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FLOATING ADD BUTTON */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="pointer-events-auto flex items-center gap-2 bg-text-main text-bg-base px-6 py-3 rounded-full font-black shadow-xl shadow-black/20 active:scale-95 transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          ADD EXERCISE
        </button>
      </div>

      {/* FINISH WORKOUT MODAL */}
      <Modal
        isOpen={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
        title="Finish Workout"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">
              Workout Notes
            </label>
            <textarea
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              className="w-full p-4 glass-input rounded-2xl font-medium min-h-[100px] bg-surface text-text-main border-border focus:border-accent transition-all placeholder:text-text-muted/50"
              placeholder="How did it feel? (Optional)"
            />
          </div>

          {workoutMode === "manual" && (
            <div>
              <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">
                End Time
              </label>
              <input
                type="time"
                value={manualEndTime}
                onChange={(e) => setManualEndTime(e.target.value)}
                className="w-full p-4 glass-input rounded-2xl font-bold bg-surface text-text-main border-border focus:border-accent"
              />
            </div>
          )}

          <button
            onClick={confirmFinish}
            className="w-full h-14 bg-accent text-text-inverted font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[rgb(var(--accent-rgb)/0.2)] active:scale-95 transition-transform"
          >
            <Save className="w-5 h-5" />
            SAVE & FINISH
          </button>
        </div>
      </Modal>

      {/* CANCEL CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="End Workout?"
        message="Are you sure you want to cancel? All progress for this session will be lost."
        confirmText="Discard Workout"
        isDestructive={true}
      />

      {/* ERROR ALERT MODAL */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
      />

      {/* ADD EXERCISE MODAL (Custom Full Screen Overlay) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-bg-base/80 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-md h-[85vh] sm:h-[80vh] glass bg-surface/90 border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 duration-300 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex flex-col gap-3 bg-surface/50 backdrop-blur-md z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-text-main">
                  Add Exercise
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 bg-surface hover:bg-bg-base rounded-full text-text-main border border-border"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="flex items-center gap-3 bg-bg-base rounded-xl px-4 py-3 border border-border focus-within:border-accent transition-colors">
                <Search className="w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Find exercise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent w-full outline-none text-text-main placeholder:text-text-muted font-medium"
                  autoFocus
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar w-full">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0 ${
                    selectedCategory === "all"
                      ? "bg-accent text-text-inverted border-accent"
                      : "bg-surface text-text-muted border-border hover:text-text-main"
                  }`}
                >
                  All
                </button>
                {sortedCategories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0 ${
                      selectedCategory === cat.id
                        ? "bg-accent text-text-inverted border-accent"
                        : "bg-surface text-text-muted border-border hover:text-text-main"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 pb-24 custom-scrollbar">
              {filteredExercises.length > 0 ? (
                filteredExercises.map((e: any) => {
                  const isSelected = selectedExerciseIds.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => toggleSelection(e.id)}
                      className={`w-full flex items-center justify-between p-4 hover:bg-surface/50 rounded-xl transition-all group text-left border-b border-border last:border-0 ${
                        isSelected ? "bg-accent/5 border-accent/20" : ""
                      }`}
                    >
                      <div>
                        <div
                          className={`font-bold ${
                            isSelected ? "text-accent" : "text-text-main"
                          }`}
                        >
                          {e.name}
                        </div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                          {dbCategories?.find(
                            (c: any) => c.id === e.muscle_group_id,
                          )?.name || "General"}
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-accent border-accent text-text-inverted"
                            : "border-border text-text-muted group-hover:border-text-muted"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[4]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-text-muted italic">
                  No exercises found
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            {selectedExerciseIds.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-surface/80 backdrop-blur-xl border-t border-border animate-in slide-in-from-bottom-full">
                <button
                  onClick={handleBatchAdd}
                  className="w-full h-14 bg-accent text-text-inverted font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[rgb(var(--accent-rgb)/0.2)] active:scale-95 transition-transform"
                >
                  ADD {selectedExerciseIds.length} EXERCISES
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
