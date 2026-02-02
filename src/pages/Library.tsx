import { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { useWorkout } from "../context/WorkoutContext";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";

import {
  Plus,
  Edit2,
  Trash2,
  Dumbbell,
  Layers,
  ClipboardList,
  Play,
  Search,
  Tag,
} from "lucide-react";
import { CategoryModal, ExerciseModal, RoutineModal } from "./LibraryModals";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { useNavigate } from "react-router-dom";

// Types
type Category = Database["public"]["Tables"]["muscle_group"]["Row"];
type Exercise = Database["public"]["Tables"]["exercise"]["Row"];
type Routine = Database["public"]["Tables"]["routine"]["Row"] & {
  routine_exercises?: any[];
};

type TableName = keyof Database["public"]["Tables"];
type Tab = "categories" | "exercises" | "routines";

export function Library() {
  const {
    userProfile,
    categories: dbCategories,
    exercises: dbExercises,
    routines: dbRoutines,
  } = useData();

  const { isWorkoutActive } = useWorkout();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const [searchTerm, setSearchTerm] = useState("");

  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [localExercises, setLocalExercises] = useState<Exercise[]>([]);
  const [localRoutines, setLocalRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    if (dbCategories) setLocalCategories(dbCategories);
  }, [dbCategories]);
  useEffect(() => {
    if (dbExercises) setLocalExercises(dbExercises);
  }, [dbExercises]);
  useEffect(() => {
    if (dbRoutines) setLocalRoutines(dbRoutines);
  }, [dbRoutines]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    table: TableName;
    id: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- CACHE LOGIC ---
  const updateCache = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleCacheUpdate = (item: any, type: "add" | "edit") => {
    const updateList = (prev: any[]) => {
      return type === "edit"
        ? prev.map((i) => (i.id === item.id ? item : i))
        : [...prev, item];
    };

    if (activeTab === "categories") {
      setLocalCategories((prev) => {
        const newData = updateList(prev);
        updateCache("library-categories", newData);
        return newData;
      });
    }
    if (activeTab === "exercises") {
      setLocalExercises((prev) => {
        const newData = updateList(prev);
        updateCache("library-exercises", newData);
        return newData;
      });
    }
    if (activeTab === "routines") {
      setLocalRoutines((prev) => {
        const newData = updateList(prev);
        updateCache(`library-routines-${userProfile?.user_id}`, newData);
        return newData;
      });
    }
  };

  const handleCacheDelete = (id: number) => {
    const filterList = (prev: any[]) => prev.filter((i) => i.id !== id);

    if (activeTab === "categories") {
      setLocalCategories((prev) => {
        const newData = filterList(prev);
        updateCache("library-categories", newData);
        return newData;
      });
    }
    if (activeTab === "exercises") {
      setLocalExercises((prev) => {
        const newData = filterList(prev);
        updateCache("library-exercises", newData);
        return newData;
      });
    }
    if (activeTab === "routines") {
      setLocalRoutines((prev) => {
        const newData = filterList(prev);
        updateCache(`library-routines-${userProfile?.user_id}`, newData);
        return newData;
      });
    }
  };

  // --- ACTIONS ---
  const requestDelete = (table: TableName, id: number) => {
    setDeleteTarget({ table, id });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from(deleteTarget.table as any)
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;
      handleCacheDelete(deleteTarget.id);
      setConfirmOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleStartRoutine = (routine: Routine) => {
    if (isWorkoutActive) return;
    navigate("/workout", {
      state: { routineId: routine.id, exercises: routine.routine_exercises },
    });
  };

  // --- UI COMPONENTS ---
  const ActionButtons = ({
    item,
    table,
    showStart = false,
  }: {
    item: any;
    table: TableName;
    showStart?: boolean;
  }) => (
    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border">
      {showStart && (
        <button
          onClick={() => handleStartRoutine(item)}
          disabled={isWorkoutActive}
          className={`flex-1 h-9 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
            isWorkoutActive
              ? "bg-bg-base text-text-muted cursor-not-allowed opacity-50 border border-border"
              : "bg-accent text-text-inverted hover:brightness-110 active:scale-95"
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          START
        </button>
      )}

      <div className={`flex gap-1 ${showStart ? "" : "w-full"}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(item);
          }}
          className={`h-9 px-3 rounded-lg flex items-center justify-center transition-colors text-text-muted hover:text-text-main hover:bg-bg-base border border-transparent hover:border-border ${
            !showStart ? "flex-1 bg-surface border-border" : ""
          }`}
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
          {!showStart && <span className="ml-2 text-xs font-bold">Edit</span>}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            requestDelete(table, item.id);
          }}
          className={`h-9 px-3 rounded-lg flex items-center justify-center transition-colors text-text-muted hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 ${
            !showStart ? "flex-1 bg-surface border-border" : ""
          }`}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
          {!showStart && <span className="ml-2 text-xs font-bold">Delete</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col pb-20">
      {/* HEADER */}
      <div className="flex-none p-4 pb-0 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-text-main tracking-tight">
            Library
          </h1>
          <button
            onClick={handleAddNew}
            className="bg-accent text-text-inverted px-4 py-2 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgb(var(--accent-rgb)/0.3)] active:scale-95 transition-all flex items-center gap-2 hover:brightness-110"
          >
            <Plus className="w-5 h-5" strokeWidth={3} /> Add New
          </button>
        </div>

        {/* TABS */}
        <div className="flex p-1.5 glass rounded-2xl border border-border relative">
          {[
            { id: "categories", label: "Muscles", icon: Layers },
            { id: "exercises", label: "Exercises", icon: Dumbbell },
            { id: "routines", label: "Routines", icon: ClipboardList },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 relative z-10 ${
                activeTab === tab.id
                  ? "bg-accent text-text-inverted shadow-md"
                  : "text-text-muted hover:text-text-main hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* SEARCH BAR - FILTER BY NAME OR MUSCLE GROUP */}
        {activeTab === "exercises" && (
          <div className="relative group">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search exercises or muscles..."
              className="w-full p-3 pl-10 glass-input rounded-xl font-medium text-sm text-text-main placeholder:text-text-muted bg-surface/50 border-border focus:border-accent transition-all"
            />
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
          </div>
        )}
      </div>

      {/* CONTENT GRID */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pb-32 custom-scrollbar">
        {/* --- CATEGORIES TAB --- */}
        {activeTab === "categories" &&
          localCategories.map((cat) => (
            <div
              key={cat.id}
              className="glass p-5 rounded-3xl border border-border relative group overflow-hidden flex flex-col bg-surface hover:shadow-lg transition-all"
            >
              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-accent/10" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-base flex items-center justify-center text-text-muted border border-border group-hover:text-accent transition-colors">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-text-main leading-tight truncate">
                    {cat.name}
                  </h3>
                </div>

                <div className="bg-bg-base/50 p-3 rounded-xl border border-border mb-2 flex-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                    Sub-Muscles
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.sub_muscle && typeof cat.sub_muscle === "string" ? (
                      cat.sub_muscle.split(",").map(
                        (tag: string, i: number) =>
                          tag.trim() && (
                            <span
                              key={i}
                              className="px-2 py-1 rounded-md bg-surface text-text-main text-[10px] font-bold border border-border"
                            >
                              {tag.trim()}
                            </span>
                          ),
                      )
                    ) : (
                      <span className="text-text-muted text-xs italic opacity-50">
                        None
                      </span>
                    )}
                  </div>
                </div>

                <ActionButtons item={cat} table="muscle_group" />
              </div>
            </div>
          ))}

        {/* --- EXERCISES TAB (With Enhanced Search) --- */}
        {activeTab === "exercises" &&
          localExercises
            .filter((ex) => {
              const term = searchTerm.toLowerCase();
              const nameMatch = ex.name.toLowerCase().includes(term);
              // Filter by Muscle Group Name as well
              const categoryName =
                localCategories
                  .find((c) => c.id === ex.muscle_group_id)
                  ?.name.toLowerCase() || "";
              const categoryMatch = categoryName.includes(term);
              return nameMatch || categoryMatch;
            })
            .map((ex) => {
              const muscleName =
                localCategories.find((c) => c.id === ex.muscle_group_id)
                  ?.name || "Other";

              return (
                <div
                  key={ex.id}
                  className="glass p-5 rounded-3xl border border-border relative group overflow-hidden flex flex-col bg-surface hover:shadow-lg transition-all"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-accent/10" />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-bg-base flex items-center justify-center text-text-muted border border-border group-hover:text-accent transition-colors">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-text-main leading-tight line-clamp-2">
                          {ex.name}
                        </h3>
                      </div>
                    </div>

                    <div className="bg-bg-base/50 p-3 rounded-xl border border-border flex-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                        Target Muscle
                      </span>
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-accent" />
                        <span className="text-xs font-bold text-text-main">
                          {muscleName}
                        </span>
                      </div>
                    </div>

                    <ActionButtons item={ex} table="exercise" />
                  </div>
                </div>
              );
            })}

        {/* --- ROUTINES TAB --- */}
        {activeTab === "routines" &&
          localRoutines.map((routine) => (
            <div
              key={routine.id}
              className="glass p-5 rounded-3xl border border-border relative group overflow-hidden flex flex-col bg-surface hover:shadow-lg transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-accent/10" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-bg-base flex items-center justify-center text-text-muted border border-border group-hover:text-accent transition-colors">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-text-main leading-tight">
                    {routine.name}
                  </h3>
                </div>

                <div className="bg-bg-base/50 p-3 rounded-xl border border-border mb-2 flex-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                    Preview
                  </span>
                  {routine.routine_exercises
                    ?.slice(0, 3)
                    .map((re: any, i: number) => {
                      const exName = localExercises.find(
                        (e) => e.id === re.exercise_id,
                      )?.name;
                      return (
                        <div
                          key={i}
                          className="text-xs font-bold text-text-main flex items-center gap-2 mb-1"
                        >
                          <div className="w-1 h-1 rounded-full bg-accent"></div>
                          <span className="truncate opacity-80">
                            {exName || "Unknown"}
                          </span>
                        </div>
                      );
                    })}
                  {(routine.routine_exercises?.length || 0) > 3 && (
                    <div className="text-[10px] text-text-muted pl-3 mt-1">
                      + {(routine.routine_exercises?.length || 0) - 3} more
                    </div>
                  )}
                </div>

                <ActionButtons
                  item={routine}
                  table="routine"
                  showStart={true}
                />
              </div>
            </div>
          ))}
      </div>

      {/* --- MODALS --- */}
      <CategoryModal
        isOpen={modalOpen && activeTab === "categories"}
        onClose={() => setModalOpen(false)}
        editingItem={editingItem}
        onCacheUpdate={handleCacheUpdate}
      />

      <ExerciseModal
        isOpen={modalOpen && activeTab === "exercises"}
        onClose={() => setModalOpen(false)}
        editingItem={editingItem}
        onCacheUpdate={handleCacheUpdate}
        categories={localCategories}
      />

      <RoutineModal
        isOpen={modalOpen && activeTab === "routines"}
        onClose={() => setModalOpen(false)}
        editingItem={editingItem}
        onCacheUpdate={handleCacheUpdate}
        exercises={localExercises}
        categories={localCategories}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Item"
        message="Are you sure you want to delete this? This action cannot be undone."
        confirmText="Yes, Delete"
        isDestructive={true}
        loading={isDeleting}
      />
    </div>
  );
}
