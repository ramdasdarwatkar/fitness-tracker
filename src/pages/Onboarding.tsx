import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Activity,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { VerticalHeightRuler } from "../components/onboarding/VerticalHeightRuler";
import { HorizontalWeightScale } from "../components/onboarding/HorizontalWeightScale";

const maleSvg = "/male.svg";

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

export function Onboarding() {
  const { user } = useAuth();
  const { refreshProfile } = useData();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Alert State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [birthDate, setBirthDate] = useState("");
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75.0);
  const [targetWeight, setTargetWeight] = useState(70.0);
  const [daysPerWeek, setDaysPerWeek] = useState(4);

  const progress = ((step + 1) / 5) * 100;

  const handleNext = () => step < 4 && setStep(step + 1);
  const handleBack = () => step > 0 && setStep(step - 1);

  const bmiData = useMemo(() => {
    if (!height || height <= 0 || !weight || weight <= 0) return null;
    const h = height / 100;
    const val = weight / (h * h);

    let status = "",
      color = "";
    if (val < 18.5) {
      status = "Underweight";
      color = "text-blue-400";
    } else if (val < 24.9) {
      status = "Normal";
      color = "text-emerald-500";
    } else if (val < 29.9) {
      status = "Overweight";
      color = "text-yellow-500";
    } else {
      status = "Obese";
      color = "text-red-500";
    }

    return { value: val.toFixed(1), status, color };
  }, [height, weight]);

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase.from("user_profile").insert({
        user_id: user.id,
        name,
        birth_date: birthDate,
        height,
        target_weight: targetWeight,
        target_days_week: daysPerWeek,
        level_points: 0,
        // No 'weight' here
      } as any);

      await supabase.from("profile_metrics").insert({
        user_id: user.id,
        log_date: new Date().toISOString().split("T")[0],
        weight,
        // 'weight' is here
      } as any);

      await refreshProfile();
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        isOpen: true,
        title: "Setup Failed",
        message: err.message || "Could not save profile. Please try again.",
      });
      setLoading(false);
    }
  };

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    set: (v: number) => void,
  ) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) set(v);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden font-sans text-text-main transition-colors duration-300 relative">
      {/* HEADER */}
      <div className="flex-none px-6 pt-6 pb-2 flex items-center justify-between z-10">
        {step > 0 ? (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 hover:bg-surface/50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-text-muted hover:text-text-main" />
          </button>
        ) : (
          <div className="w-6" />
        )}
        <div className="flex-1 max-w-xs mx-4 h-1.5 bg-surface/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="w-8 text-right font-bold text-accent text-sm">
          {step + 1}/5
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 min-h-0 w-full relative p-4 lg:p-0 overflow-y-auto no-scrollbar flex flex-col items-center justify-center">
        {/* STEP 0: ABOUT YOU */}
        {step === 0 && (
          <div className="w-full max-w-sm animate-in zoom-in-95 duration-300 my-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-accent/10 rounded-full text-accent shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)]">
                <User className="w-10 h-10" />
              </div>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black mb-2 text-center text-text-main">
              About You
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase ml-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full p-4 glass-input rounded-2xl font-bold text-lg placeholder:font-normal text-text-main bg-surface/50 border-border focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGender("male")}
                  className={`p-4 rounded-2xl border-2 font-bold transition-all ${
                    gender === "male"
                      ? "border-accent bg-accent/10 text-accent shadow-[0_0_15px_rgb(var(--accent-rgb)/0.2)]"
                      : "border-transparent glass-input text-text-muted hover:text-text-main hover:border-border bg-surface/50"
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setGender("female")}
                  className={`p-4 rounded-2xl border-2 font-bold transition-all ${
                    gender === "female"
                      ? "border-accent bg-accent/10 text-accent shadow-[0_0_15px_rgb(var(--accent-rgb)/0.2)]"
                      : "border-transparent glass-input text-text-muted hover:text-text-main hover:border-border bg-surface/50"
                  }`}
                >
                  Female
                </button>
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase ml-1">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-4 glass-input rounded-2xl font-bold text-lg [color-scheme:dark] accent-accent text-text-main bg-surface/50 border-border focus:border-accent"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: HEIGHT */}
        {step === 1 && (
          <div className="w-full max-w-lg flex flex-col items-center animate-in slide-in-from-right duration-300 my-auto">
            <h2 className="text-2xl font-black mb-6 text-text-main">
              Select Height
            </h2>
            <div className="relative w-full h-[300px] max-h-[60vh] bg-surface/50 rounded-3xl border border-border overflow-hidden flex backdrop-blur-md">
              <div className="flex-1 flex items-end justify-center h-full pt-12 relative z-0">
                <img
                  src={maleSvg}
                  alt="Man"
                  className="h-full object-cover object-top opacity-80 mix-blend-overlay"
                />
              </div>

              <div className="absolute -top-7 left-0 right-32 z-20 pointer-events-none flex flex-col justify-end">
                <div className="flex items-baseline gap-1 pl-12 mb-1">
                  <input
                    type="number"
                    step="1"
                    value={height}
                    onChange={(e) => handleInput(e, setHeight)}
                    className="w-40 bg-transparent text-6xl font-black text-accent outline-none border-none p-0 drop-shadow-md pointer-events-auto text-right"
                  />
                  <span className="text-xl font-bold text-text-muted drop-shadow-md ml-2">
                    cm
                  </span>
                </div>
                <div className="w-full h-[2px] bg-accent shadow-[0_0_10px_rgb(var(--accent-rgb)/0.8)]"></div>
              </div>

              <div className="w-32 h-full bg-surface/80 backdrop-blur-xl border-l border-border relative z-20">
                <VerticalHeightRuler value={height} onChange={setHeight} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 & 3: WEIGHT */}
        {(step === 2 || step === 3) && (
          <div className="w-full max-w-md flex flex-col items-center animate-in slide-in-from-right duration-300 gap-2 my-auto">
            <div className="flex p-1 bg-surface/50 rounded-2xl w-64 shadow-inner shrink-0 mb-2 border border-border backdrop-blur-md">
              <button
                onClick={() => setStep(2)}
                className={`flex-1 py-2 rounded-xl font-bold transition-all text-sm ${
                  step === 2
                    ? "bg-accent text-text-inverted shadow-md"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                Current
              </button>
              <button
                onClick={() => setStep(3)}
                className={`flex-1 py-2 rounded-xl font-bold transition-all text-sm ${
                  step === 3
                    ? "bg-accent text-text-inverted shadow-md"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                Target
              </button>
            </div>

            <div className="text-center space-y-1 shrink-0">
              <h2 className="text-xl font-bold text-text-muted uppercase tracking-wider">
                {step === 2 ? "Current Weight" : "Target Weight"}
              </h2>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-7xl font-black text-text-main">
                  {(step === 2 ? weight : targetWeight).toFixed(1)}
                </span>
                <span className="text-2xl font-bold text-accent uppercase">
                  KG
                </span>
              </div>
              {step === 2 && bmiData && (
                <div className="animate-in fade-in slide-in-from-top-2 px-4 py-1 bg-surface/50 rounded-full inline-flex items-center gap-2 border border-border backdrop-blur-sm">
                  <span className="text-sm font-bold text-text-muted">
                    BMI:
                  </span>
                  <span className={`text-base font-black ${bmiData.color}`}>
                    {bmiData.value}
                  </span>
                  <span
                    className={`text-xs font-bold uppercase ${bmiData.color} opacity-80`}
                  >
                    ({bmiData.status})
                  </span>
                </div>
              )}
            </div>

            <div className="relative w-full h-24 mt-4 shrink-0">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[4px] h-12 bg-accent z-10 rounded-b-full shadow-[0_0_10px_rgb(var(--accent-rgb)/0.6)] pointer-events-none"></div>
              <HorizontalWeightScale
                value={step === 2 ? weight : targetWeight}
                onChange={step === 2 ? setWeight : setTargetWeight}
                min={20}
                max={250}
              />
            </div>

            {step === 3 && (
              <div className="mt-2 px-6 py-4 bg-surface/50 rounded-2xl border border-border w-full text-center animate-in zoom-in-95 shrink-0 backdrop-blur-md">
                <p className="font-bold text-text-main text-lg">
                  {targetWeight < weight
                    ? `Lose ${(weight - targetWeight).toFixed(1)} kg`
                    : targetWeight > weight
                      ? `Gain ${(targetWeight - weight).toFixed(1)} kg`
                      : "Maintain Weight"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: COMMITMENT */}
        {step === 4 && (
          <div className="w-full max-w-sm flex flex-col items-center animate-in slide-in-from-right duration-300 my-auto pb-4">
            <div className="mb-6 p-4 bg-accent/10 rounded-full text-accent shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)]">
              <Activity className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black mb-6 text-center text-text-main">
              Weekly Commitment
            </h2>
            <div className="w-full space-y-3">
              {[3, 4, 5, 6].map((day) => (
                <button
                  key={day}
                  onClick={() => setDaysPerWeek(day)}
                  className={`w-full p-2 rounded-xl border-2 font-bold flex justify-between items-center transition-all ${
                    daysPerWeek === day
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-surface/50 bg-surface/30 text-text-muted hover:border-border"
                  }`}
                >
                  <span>{day} Days / Week</span>
                  {daysPerWeek === day && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex-none p-6 bg-surface/50 z-20 border-t border-border backdrop-blur-md">
        <button
          onClick={step === 4 ? handleFinish : handleNext}
          disabled={loading || (step === 0 && (!name || !birthDate))}
          className="w-full h-14 bg-accent text-text-inverted font-black rounded-2xl shadow-lg shadow-[rgb(var(--accent-rgb)/0.2)] flex items-center justify-center gap-2 text-lg disabled:opacity-50 transition-all active:scale-[0.98] hover:brightness-110"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : step === 4 ? (
            "FINISH SETUP"
          ) : (
            "CONTINUE"
          )}
          {!loading && <ArrowRight strokeWidth={3} className="w-5 h-5" />}
        </button>
      </div>

      {/* ERROR ALERT */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
}
