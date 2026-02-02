import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Modal } from "../components/ui/Modal";
import { BadgeInput } from "../components/ui/BadgeInput";
import { Loader2, Check, AlertCircle } from "lucide-react";

// --- HELPER ---
const ErrorMessage = ({ msg }: { msg: string | null }) => {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-bold animate-in slide-in-from-top-2">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  );
};

// --- TYPES ---
type CategoryForm = { name: string; sub_muscle: string[] };

type ExerciseForm = {
  name: string;
  muscle_group_id: number | null;
  tags: string[];
  // Tracking boolean flags
  reps: boolean;
  weight: boolean;
  duration: boolean;
  distance: boolean;
};

type RoutineForm = { name: string; exercise_ids: number[] };

// ==========================================
// 1. CATEGORY MODAL
// ==========================================
export function CategoryModal({
  isOpen,
  onClose,
  editingItem,
  onCacheUpdate,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  onCacheUpdate: (item: any, type: "add" | "edit") => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>({ name: "", sub_muscle: [] });

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name,
        sub_muscle:
          editingItem.sub_muscle && typeof editingItem.sub_muscle === "string"
            ? editingItem.sub_muscle.split(",").map((s: string) => s.trim())
            : [],
      });
    } else {
      setForm({ name: "", sub_muscle: [] });
    }
    setError(null);
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const dbPayload = {
      name: form.name,
      sub_muscle: form.sub_muscle.join(", "),
    };

    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from("muscle_group")
          .update(dbPayload)
          .eq("id", editingItem.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("muscle_group")
          .insert(dbPayload)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onCacheUpdate(result.data, editingItem ? "edit" : "add");
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? "Edit Category" : "New Category"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ErrorMessage msg={error} />
        <div>
          <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">
            Category Name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-4 glass-input rounded-2xl font-bold bg-surface text-text-main border-border focus:border-accent transition-all"
            placeholder="e.g. Chest"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">
            Sub-Muscles
          </label>
          <BadgeInput
            badges={form.sub_muscle}
            onChange={(badges) => setForm({ ...form, sub_muscle: badges })}
            placeholder="Type & Enter (e.g. Upper Chest)"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-accent text-text-inverted font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[rgb(var(--accent-rgb)/0.2)] active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : "SAVE CATEGORY"}
        </button>
      </form>
    </Modal>
  );
}

// ==========================================
// 2. EXERCISE MODAL
// ==========================================
export function ExerciseModal({
  isOpen,
  onClose,
  editingItem,
  onCacheUpdate,
  categories,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  onCacheUpdate: (item: any, type: "add" | "edit") => void;
  categories: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ExerciseForm>({
    name: "",
    muscle_group_id: null,
    tags: [],
    reps: false,
    weight: false,
    duration: false,
    distance: false,
  });

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name,
        muscle_group_id: editingItem.muscle_group_id,
        tags:
          editingItem.tags && typeof editingItem.tags === "string"
            ? editingItem.tags.split(",").map((s: string) => s.trim())
            : [],
        reps: editingItem.reps || false,
        weight: editingItem.weight || false,
        duration: editingItem.duration || false,
        distance: editingItem.distance || false,
      });
    } else {
      setForm({
        name: "",
        muscle_group_id: categories.length > 0 ? categories[0].id : null,
        tags: [],
        reps: false,
        weight: false,
        duration: false,
        distance: false,
      });
    }
    setError(null);
  }, [editingItem, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const dbPayload = {
      name: form.name,
      muscle_group_id: form.muscle_group_id,
      tags: form.tags.join(", "),
      reps: form.reps,
      weight: form.weight,
      duration: form.duration,
      distance: form.distance,
    };

    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from("exercise")
          .update(dbPayload)
          .eq("id", editingItem.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("exercise")
          .insert(dbPayload)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onCacheUpdate(result.data, editingItem ? "edit" : "add");
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save exercise");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? "Edit Exercise" : "New Exercise"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorMessage msg={error} />
        <div>
          <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">
            Name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-4 glass-input rounded-2xl font-bold bg-surface text-text-main border-border focus:border-accent transition-all"
            placeholder="e.g. Bench Press"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">
            Category
          </label>
          <div className="relative">
            <select
              value={form.muscle_group_id || ""}
              onChange={(e) =>
                setForm({ ...form, muscle_group_id: Number(e.target.value) })
              }
              className="w-full p-4 glass-input rounded-2xl font-bold appearance-none bg-surface text-text-main border-border focus:border-accent transition-all"
            >
              {categories.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                  className="text-text-main bg-bg-base"
                >
                  {c.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-text-muted">
              ▼
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">
            Tracking
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { key: "reps", label: "Reps" },
                { key: "weight", label: "Weight" },
                { key: "duration", label: "Time" },
                { key: "distance", label: "Dist" },
              ] as {
                key: "reps" | "weight" | "duration" | "distance";
                label: string;
              }[]
            ).map((t) => (
              <div
                key={t.key}
                onClick={() =>
                  setForm({
                    ...form,
                    [t.key]: !form[t.key],
                  })
                }
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  form[t.key]
                    ? "bg-accent/20 border-accent text-accent shadow-md shadow-[rgb(var(--accent-rgb)/0.1)]"
                    : "bg-surface border-border hover:brightness-110 text-text-muted"
                }`}
              >
                <span className="font-bold text-sm">{t.label}</span>
                {form[t.key] && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">
            Tags
          </label>
          <BadgeInput
            badges={form.tags}
            onChange={(badges) => setForm({ ...form, tags: badges })}
            placeholder="e.g. Barbell"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-accent text-text-inverted font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[rgb(var(--accent-rgb)/0.2)] active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : "SAVE EXERCISE"}
        </button>
      </form>
    </Modal>
  );
}

// ==========================================
// 3. ROUTINE MODAL (Fixed Categories)
// ==========================================
export function RoutineModal({
  isOpen,
  onClose,
  editingItem,
  onCacheUpdate,
  exercises,
  categories,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  onCacheUpdate: (item: any, type: "add" | "edit") => void;
  exercises: any[];
  categories: any[];
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RoutineForm>({ name: "", exercise_ids: [] });
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | "all">("all");

  useEffect(() => {
    if (editingItem) {
      const ids = editingItem.routine_exercises
        ? editingItem.routine_exercises.map((re: any) => re.exercise_id)
        : [];
      setForm({ name: editingItem.name, exercise_ids: ids });
    } else {
      setForm({ name: "", exercise_ids: [] });
    }
    setError(null);
    setSearch("");
    setSelectedCat("all");
  }, [editingItem, isOpen]);

  const toggleExercise = (id: number) => {
    if (form.exercise_ids.includes(id)) {
      setForm({
        ...form,
        exercise_ids: form.exercise_ids.filter((eid) => eid !== id),
      });
    } else {
      setForm({ ...form, exercise_ids: [...form.exercise_ids, id] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      let routineId = editingItem?.id;

      if (editingItem) {
        const { error: rError } = await supabase
          .from("routine")
          .update({ name: form.name })
          .eq("id", routineId);
        if (rError) throw rError;
        const { error: delError } = await supabase
          .from("routine_exercises")
          .delete()
          .eq("routine_id", routineId);
        if (delError) throw delError;
      } else {
        const { data, error: rError } = await supabase
          .from("routine")
          .insert({ name: form.name, user_id: user.id })
          .select()
          .single();
        if (rError) throw rError;
        routineId = data.id;
      }

      if (form.exercise_ids.length > 0 && routineId) {
        const relations = form.exercise_ids.map((eid) => ({
          routine_id: routineId,
          exercise_id: eid,
        }));
        const { error: relError } = await supabase
          .from("routine_exercises")
          .insert(relations);
        if (relError) throw relError;
      }

      const fakeExercises = form.exercise_ids.map((id) => ({
        exercise_id: id,
      }));
      const finalItem = {
        id: routineId,
        name: form.name,
        routine_exercises: fakeExercises,
      };

      onCacheUpdate(finalItem, editingItem ? "edit" : "add");
      onClose();
    } catch (err: any) {
      console.error("Routine save error:", err);
      setError(err.message || "Failed to save routine");
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCat === "all" || ex.muscle_group_id === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? "Edit Routine" : "New Routine"}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 h-[70vh] flex flex-col"
      >
        <ErrorMessage msg={error} />

        <div className="flex-none">
          <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">
            Name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-4 glass-input rounded-2xl font-bold bg-surface text-text-main border-border focus:border-accent transition-all"
            placeholder="e.g. Push Day A"
          />
        </div>

        <div className="flex-1 flex flex-col min-h-0 gap-3">
          <div className="flex-none">
            <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-2 block">
              Exercises ({form.exercise_ids.length})
            </label>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="w-full p-3 glass-input rounded-xl text-sm mb-2 bg-surface text-text-main placeholder:text-text-muted border-border focus:border-accent transition-all"
            />

            {/* --- HORIZONTAL SCROLL FOR CATEGORIES --- */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCat("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0 ${
                  selectedCat === "all"
                    ? "bg-accent text-text-inverted border-accent"
                    : "bg-surface border-border hover:brightness-110 text-text-muted"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0 ${
                    selectedCat === cat.id
                      ? "bg-accent text-text-inverted border-accent"
                      : "bg-surface border-border hover:brightness-110 text-text-muted"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-2 custom-scrollbar border border-border rounded-xl p-2 bg-bg-base/30">
            {filteredExercises.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-sm font-medium">
                No exercises found
              </div>
            ) : (
              filteredExercises.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => toggleExercise(ex.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    form.exercise_ids.includes(ex.id)
                      ? "bg-accent/20 border-accent text-accent"
                      : "bg-surface border-border hover:brightness-110 text-text-main"
                  }`}
                >
                  <span className="font-bold text-sm">{ex.name}</span>
                  {form.exercise_ids.includes(ex.id) && (
                    <Check className="w-5 h-5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-none pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-accent text-text-inverted font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[rgb(var(--accent-rgb)/0.2)] active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : "SAVE ROUTINE"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
