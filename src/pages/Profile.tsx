import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useTheme, ACCENT_COLORS } from "../context/ThemeContext";
import { format } from "date-fns";
import { Modal } from "../components/ui/Modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { calculateNewLevelData, calculateLevel } from "../utils/levelSystem";
import {
  LogOut,
  Ruler,
  User,
  CheckCircle2,
  ArrowLeft,
  Target,
  Activity,
  Trophy,
  ChevronRight,
  RefreshCw,
  Calendar,
  Palette,
  Moon,
  Sun,
  Plus,
  AlertCircle,
} from "lucide-react";

// --- LOCAL ALERT MODAL ---
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

// --- INTERFACES ---
interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  onClick: () => void;
}

interface InputGroupProps {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  icon: React.ReactNode;
}

interface MetricInputProps {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  activeColor: string;
}

export function Profile() {
  const { signOut } = useAuth();
  const { userProfile, refreshProfile } = useData();
  const navigate = useNavigate();

  const { theme, setTheme, accentColor, setAccentColor, activeColorObj } =
    useTheme();

  // --- UI STATE ---
  const [activeModal, setActiveModal] = useState<
    "details" | "metrics" | "level" | "theme" | null
  >(null);

  // Modal States
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  // --- DATA STATE ---
  const [identity, setIdentity] = useState({
    name: "",
    birth_date: "",
    height: "",
    target_weight: "",
    target_days_week: "",
  });
  const [metrics, setMetrics] = useState({
    weight: "",
    neck: "",
    shoulders: "",
    chest: "",
    waist: "",
    hips: "",
    left_bicep: "",
    right_bicep: "",
    left_forearm: "",
    right_forearm: "",
    left_thigh: "",
    right_thigh: "",
    left_calf: "",
    right_calf: "",
  });

  const [loading, setLoading] = useState(false);
  // FIX: Removed unused 'fetchingMetrics' state
  const [metricsLogId, setMetricsLogId] = useState<number | null>(null);

  // --- INIT ---
  useEffect(() => {
    if (userProfile) {
      setIdentity({
        name: userProfile.name || "",
        birth_date: userProfile.birth_date || "",
        height: userProfile.height?.toString() || "",
        target_weight: userProfile.target_weight?.toString() || "",
        target_days_week: userProfile.target_days_week?.toString() || "",
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (activeModal === "metrics") loadLatestMetrics();
  }, [activeModal]);

  // --- DATA LOADING ---
  const loadLatestMetrics = async () => {
    if (!userProfile?.user_id) return;

    // FIX: Removed setFetchingMetrics(true)

    const today = format(new Date(), "yyyy-MM-dd");

    const { data: rawData } = await supabase
      .from("profile_metrics")
      .select("*")
      .eq("user_id", userProfile.user_id)
      .order("log_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const data = rawData as any;

    if (data) {
      setMetrics({
        weight: data.weight?.toString() || "",
        neck: data.neck?.toString() || "",
        shoulders: data.shoulders?.toString() || "",
        chest: data.chest?.toString() || "",
        waist: data.waist?.toString() || "",
        hips: data.hips?.toString() || "",
        left_bicep: data.left_bicep?.toString() || "",
        right_bicep: data.right_bicep?.toString() || "",
        left_forearm: data.left_forearm?.toString() || "",
        right_forearm: data.right_forearm?.toString() || "",
        left_thigh: data.left_thigh?.toString() || "",
        right_thigh: data.right_thigh?.toString() || "",
        left_calf: data.left_calf?.toString() || "",
        right_calf: data.right_calf?.toString() || "",
      });
      if (data.log_date === today) setMetricsLogId(data.id);
      else setMetricsLogId(null);
    }

    // FIX: Removed setFetchingMetrics(false)
  };

  // --- ACTIONS ---
  const handleSaveIdentity = async () => {
    if (!userProfile?.user_id) return;
    setLoading(true);
    try {
      const updates = {
        name: identity.name,
        birth_date: identity.birth_date || null,
        height: parseFloat(identity.height) || null,
        target_weight: parseFloat(identity.target_weight) || null,
        target_days_week: parseInt(identity.target_days_week) || 5,
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from("user_profile")
        .update(updates as any)
        .eq("user_id", userProfile.user_id);

      await refreshProfile();
      setActiveModal(null);
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        isOpen: true,
        title: "Save Failed",
        message: err.message || "Could not update profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMetrics = async () => {
    if (!userProfile?.user_id) return;
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");

    const payload = {
      user_id: userProfile.user_id,
      log_date: today,
      weight: parseFloat(metrics.weight) || null,
      neck: parseFloat(metrics.neck) || null,
      shoulders: parseFloat(metrics.shoulders) || null,
      chest: parseFloat(metrics.chest) || null,
      waist: parseFloat(metrics.waist) || null,
      hips: parseFloat(metrics.hips) || null,
      left_bicep: parseFloat(metrics.left_bicep) || null,
      right_bicep: parseFloat(metrics.right_bicep) || null,
      left_forearm: parseFloat(metrics.left_forearm) || null,
      right_forearm: parseFloat(metrics.right_forearm) || null,
      left_thigh: parseFloat(metrics.left_thigh) || null,
      right_thigh: parseFloat(metrics.right_thigh) || null,
      left_calf: parseFloat(metrics.left_calf) || null,
      right_calf: parseFloat(metrics.right_calf) || null,
    };

    try {
      if (metricsLogId)
        await supabase
          .from("profile_metrics")
          .update(payload as any)
          .eq("id", metricsLogId);
      else await supabase.from("profile_metrics").insert(payload as any);

      await refreshProfile();
      setActiveModal(null);
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        isOpen: true,
        title: "Log Failed",
        message: err.message || "Could not save measurements.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateLevel = async () => {
    if (!userProfile?.user_id) return;
    setLoading(true);
    try {
      const result = await calculateNewLevelData(
        userProfile.user_id,
        userProfile.level_points || 0,
        userProfile.level_calculation_date || null,
        userProfile.target_days_week || 5,
      );
      const { error } = await supabase
        .from("user_profile")
        .update({
          level: result.newTotalPoints,
          level_calculation_date: result.calcDate,
        } as any)
        .eq("user_id", userProfile.user_id);

      if (error) throw error;
      await refreshProfile();
    } catch (err: any) {
      console.error("Level sync failed", err);
      setAlertConfig({
        isOpen: true,
        title: "Sync Failed",
        message: "Could not synchronize athlete level.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSignOutClick = () => setIsSignOutModalOpen(true);

  const confirmSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const getInitials = (n: string) => (n ? n.charAt(0).toUpperCase() : "U");
  const currentTotalXP = userProfile?.level_points || 0;
  const levelStats = calculateLevel(currentTotalXP);

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex-none pt-8 pb-8 px-4 flex flex-col items-center relative z-10">
        <button
          onClick={() => navigate("/")}
          className="absolute left-4 top-8 p-2 bg-surface/50 glass rounded-full hover:bg-surface text-text-main transition-colors border border-border"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative mb-3 group">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black text-text-inverted shadow-[0_0_30px_rgb(var(--accent-rgb)/0.3)] border-4 border-surface/50 backdrop-blur-md transition-colors duration-500`}
            style={{ backgroundColor: activeColorObj.hex }}
          >
            {getInitials(identity.name)}
          </div>
          <div className="absolute bottom-0 right-0 p-2 bg-surface text-text-main rounded-full shadow-lg border-2 border-transparent">
            <Trophy className="w-4 h-4 fill-yellow-400 text-yellow-500" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-text-main tracking-tight">
          {identity.name || "Athlete"}
        </h1>
        <p className="text-xs text-text-muted font-bold uppercase tracking-wider mt-1">
          Level {levelStats.level} • {levelStats.tier}
        </p>
      </div>

      {/* MENU LIST */}
      <div className="flex-1 px-4 space-y-3 pb-8 overflow-y-auto">
        <MenuCard
          icon={<User className="w-5 h-5 text-blue-400" />}
          title="User Details"
          subtitle="Name, Age, Height, Goals"
          color="bg-blue-500/10"
          onClick={() => setActiveModal("details")}
        />
        <MenuCard
          icon={<Ruler className="w-5 h-5 text-emerald-400" />}
          title="Body Measurements"
          subtitle="Log weight & dimensions"
          color="bg-emerald-500/10"
          onClick={() => setActiveModal("metrics")}
        />
        <MenuCard
          icon={<Trophy className="w-5 h-5 text-orange-400" />}
          title="Athlete Level"
          subtitle="XP, Rank, Progress"
          color="bg-orange-500/10"
          onClick={() => setActiveModal("level")}
        />
        <MenuCard
          icon={<Palette className="w-5 h-5 text-purple-400" />}
          title="Themes & Appearance"
          subtitle="Dark mode, Accent colors"
          color="bg-purple-500/10"
          onClick={() => setActiveModal("theme")}
        />

        <button
          onClick={onSignOutClick}
          className="w-full glass p-4 rounded-2xl flex items-center justify-between border border-error/20 group hover:bg-error/10 transition-all mt-6 bg-surface/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-error/10 rounded-xl text-error">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-error text-sm">Log Out</div>
              <div className="text-[10px] text-text-muted">
                Sign out of your account
              </div>
            </div>
          </div>
        </button>

        <p className="text-center text-[10px] text-text-muted font-mono pt-4 opacity-30">
          v1.7.1 • PRO
        </p>
      </div>

      {/* --- MODALS --- */}
      <Modal
        isOpen={activeModal === "details"}
        onClose={() => setActiveModal(null)}
        title="User Details"
      >
        <div className="space-y-4">
          <InputGroup
            label="Display Name"
            value={identity.name}
            onChange={(v) => setIdentity({ ...identity, name: v })}
            icon={<User size={14} />}
          />
          <InputGroup
            label="Birth Date"
            type="date"
            value={identity.birth_date}
            onChange={(v) => setIdentity({ ...identity, birth_date: v })}
            icon={<Calendar size={14} />}
          />
          <div className="grid grid-cols-2 gap-4">
            <InputGroup
              label="Height (cm)"
              type="number"
              value={identity.height}
              onChange={(v) => setIdentity({ ...identity, height: v })}
              icon={<Ruler size={14} />}
            />
            <InputGroup
              label="Target Weight (kg)"
              type="number"
              value={identity.target_weight}
              onChange={(v) => setIdentity({ ...identity, target_weight: v })}
              icon={<Target size={14} />}
            />
          </div>
          <InputGroup
            label="Goal (Days/Week)"
            type="number"
            value={identity.target_days_week}
            onChange={(v) => setIdentity({ ...identity, target_days_week: v })}
            icon={<Activity size={14} />}
          />
          <button
            onClick={handleSaveIdentity}
            disabled={loading}
            style={{ backgroundColor: activeColorObj.hex }}
            className="w-full py-3.5 text-text-inverted rounded-xl text-xs font-black shadow-lg active:scale-95 transition-all mt-4 brightness-110 hover:brightness-125"
          >
            {loading ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "metrics"}
        onClose={() => setActiveModal(null)}
        title="Log Measurements"
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2 mb-2">
            <span className="text-[10px] uppercase font-bold text-text-muted">
              {metricsLogId ? "Editing Today" : "New Log"}
            </span>
            <span className="text-[10px] font-mono text-text-muted">
              {format(new Date(), "MMM d")}
            </span>
          </div>
          <div className="bg-surface/50 p-4 rounded-2xl text-center border border-border backdrop-blur-sm">
            <label className="text-[10px] font-bold text-text-muted uppercase">
              Current Weight (kg)
            </label>
            <input
              type="number"
              value={metrics.weight}
              onChange={(e) =>
                setMetrics({ ...metrics, weight: e.target.value })
              }
              className="w-full bg-transparent text-center text-4xl font-black text-text-main focus:outline-none placeholder:text-text-muted/20"
              placeholder="0.0"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
            <MetricInput
              label="Neck"
              value={metrics.neck}
              onChange={(v) => setMetrics({ ...metrics, neck: v })}
              activeColor={activeColorObj.hex}
            />
            <MetricInput
              label="Shoulders"
              value={metrics.shoulders}
              onChange={(v) => setMetrics({ ...metrics, shoulders: v })}
              activeColor={activeColorObj.hex}
            />
            <MetricInput
              label="Chest"
              value={metrics.chest}
              onChange={(v) => setMetrics({ ...metrics, chest: v })}
              activeColor={activeColorObj.hex}
            />
            <MetricInput
              label="Waist"
              value={metrics.waist}
              onChange={(v) => setMetrics({ ...metrics, waist: v })}
              activeColor={activeColorObj.hex}
            />
            <div className="col-span-2">
              <MetricInput
                label="Hips"
                value={metrics.hips}
                onChange={(v) => setMetrics({ ...metrics, hips: v })}
                activeColor={activeColorObj.hex}
              />
            </div>
            <div className="col-span-2 h-px bg-border my-1" />
            <MetricInput
              label="L Bicep"
              value={metrics.left_bicep}
              onChange={(v) => setMetrics({ ...metrics, left_bicep: v })}
              activeColor={activeColorObj.hex}
            />
            <MetricInput
              label="R Bicep"
              value={metrics.right_bicep}
              onChange={(v) => setMetrics({ ...metrics, right_bicep: v })}
              activeColor={activeColorObj.hex}
            />
            <MetricInput
              label="L Forearm"
              value={metrics.left_forearm}
              onChange={(v) => setMetrics({ ...metrics, left_forearm: v })}
              activeColor={activeColorObj.hex}
            />
            <MetricInput
              label="R Forearm"
              value={metrics.right_forearm}
              onChange={(v) => setMetrics({ ...metrics, right_forearm: v })}
              activeColor={activeColorObj.hex}
            />
            <div className="col-span-2 h-px bg-border my-1" />
            <MetricInput
              label="L Thigh"
              value={metrics.left_thigh}
              onChange={(v) => setMetrics({ ...metrics, left_thigh: v })}
              activeColor={activeColorObj.hex}
            />
            <MetricInput
              label="R Thigh"
              value={metrics.right_thigh}
              onChange={(v) => setMetrics({ ...metrics, right_thigh: v })}
              activeColor={activeColorObj.hex}
            />
            <MetricInput
              label="L Calf"
              value={metrics.left_calf}
              onChange={(v) => setMetrics({ ...metrics, left_calf: v })}
              activeColor={activeColorObj.hex}
            />
            <MetricInput
              label="R Calf"
              value={metrics.right_calf}
              onChange={(v) => setMetrics({ ...metrics, right_calf: v })}
              activeColor={activeColorObj.hex}
            />
          </div>
          <button
            onClick={handleSaveMetrics}
            disabled={loading}
            style={{ backgroundColor: activeColorObj.hex }}
            className="w-full py-3.5 text-text-inverted rounded-xl text-xs font-black shadow-lg active:scale-95 transition-all brightness-110 hover:brightness-125"
          >
            {loading ? "LOGGING..." : "SAVE LOG"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "level"}
        onClose={() => setActiveModal(null)}
        title="Athlete Level"
      >
        <div className="space-y-6 flex flex-col items-center text-center">
          <div className="relative">
            <Trophy
              className="w-24 h-24 fill-current opacity-20"
              style={{ color: activeColorObj.hex }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-black text-text-main">
              {levelStats.level}
            </div>
          </div>
          <div className="w-full">
            <h3 className="text-xl font-black text-text-main mb-1">
              {levelStats.tier}
            </h3>
            <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase mb-1">
              <span>Progress</span>
              <span>
                {levelStats.currentPoints} / {levelStats.nextLevelPoints} PTS
              </span>
            </div>
            <div className="h-3 w-full bg-surface rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-1000 ease-out"
                style={{
                  backgroundColor: activeColorObj.hex,
                  width: `${levelStats.progressPercent}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-text-muted mt-2">
              Total Lifetime Points: {currentTotalXP.toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleRecalculateLevel}
            disabled={loading}
            className="w-full py-3 bg-surface hover:bg-surface/80 rounded-xl text-xs font-bold text-text-main flex items-center justify-center gap-2 border border-border"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              "Synchronize Points"
            )}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "theme"}
        onClose={() => setActiveModal(null)}
        title="Appearance"
      >
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div>
            <span className="text-xs font-bold text-text-muted uppercase mb-2 block">
              Theme Mode
            </span>
            <div className="bg-surface p-1 rounded-xl flex gap-1 border border-border">
              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  theme === "dark"
                    ? "bg-bg-base text-white shadow-sm border border-white/5"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                <Moon size={14} /> Dark
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`flex-1 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  theme === "light"
                    ? "bg-white text-black shadow-sm border border-black/5"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                <Sun size={14} /> Light
              </button>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-text-muted uppercase block">
                Accent Color
              </span>
              <span className="text-[10px] font-mono text-text-muted opacity-50 uppercase">
                {activeColorObj.hex}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAccentColor(c.id)}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                    accentColor === c.id
                      ? "ring-2 ring-text-main scale-110 shadow-lg"
                      : "opacity-40 hover:opacity-100 hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {accentColor === c.id && (
                    <CheckCircle2 className="text-white w-5 h-5 drop-shadow-md" />
                  )}
                </button>
              ))}

              <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-border hover:border-accent transition-colors flex items-center justify-center group bg-surface">
                <input
                  type="color"
                  value={activeColorObj.hex}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 via-purple-500 to-orange-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                <Plus className="w-5 h-5 text-text-main relative z-0" />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* CONFIRM LOGOUT MODAL */}
      <ConfirmModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={confirmSignOut}
        title="Log Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Log Out"
        isDestructive={true}
      />

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
}

// --- SUB-COMPONENTS ---
const MenuCard = ({ icon, title, subtitle, color, onClick }: MenuCardProps) => (
  <button
    onClick={onClick}
    className="w-full glass p-4 rounded-2xl flex items-center justify-between border border-border group hover:bg-surface/50 active:scale-95 transition-all bg-surface/50 backdrop-blur-md"
  >
    <div className="flex items-center gap-4">
      <div
        className={`p-3 rounded-xl ${color} flex items-center justify-center`}
      >
        {icon}
      </div>
      <div className="text-left">
        <div className="font-bold text-text-main text-sm">{title}</div>
        <div className="text-[10px] text-text-muted">{subtitle}</div>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-main transition-colors" />
  </button>
);

const InputGroup = ({
  label,
  value,
  onChange,
  type = "text",
  icon,
}: InputGroupProps) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-text-muted uppercase ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute left-3 top-3 text-text-muted group-focus-within:text-accent transition-colors">
        {icon}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full glass-input rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-text-main focus:outline-none focus:border-accent transition-all bg-surface/50 border-border placeholder:text-text-muted/20"
      />
    </div>
  </div>
);

const MetricInput = ({
  label,
  value,
  onChange,
  activeColor,
}: MetricInputProps) => (
  <div
    className="bg-surface/50 rounded-xl p-2 border border-border focus-within:border-current transition-colors"
    style={{ color: activeColor }}
  >
    <label className="text-[9px] font-bold text-text-muted uppercase block text-center mb-1">
      {label}
    </label>
    <div className="flex items-end justify-center gap-0.5">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-center font-black text-text-main focus:outline-none text-lg p-0"
        placeholder="-"
      />
      <span className="text-[8px] text-text-muted pb-1">cm</span>
    </div>
  </div>
);
