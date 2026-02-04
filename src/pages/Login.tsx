import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, ArrowRight, Moon, Sun } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const logoImg = "/fitness-tracker/logo.png";

export function Login() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    // 1. CHANGED: 'h-screen' ensures strictly 100vh.
    // 2. ADDED: 'overflow-hidden' ensures no scrollbars appear.
    <div className="flex flex-col lg:flex-row h-screen w-full font-sans overflow-hidden transition-colors duration-300 relative bg-bg-base/0">
      {/* THEME TOGGLE */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-3 rounded-full glass hover:scale-110 transition-transform cursor-pointer border border-border bg-surface/50 backdrop-blur-md"
      >
        {theme === "dark" ? (
          <Sun className="w-6 h-6 text-accent" />
        ) : (
          <Moon className="w-6 h-6 text-text-muted" />
        )}
      </button>

      {/* LEFT SIDE: BRANDING */}
      <div className="relative w-full h-[45vh] lg:h-full lg:w-1/2 flex items-center justify-center shrink-0 z-10 overflow-hidden">
        {/* GLOW EFFECT */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center z-0 pointer-events-none">
          <div className="absolute w-[800px] h-[800px] bg-accent/10 rounded-full blur-[120px] animate-pulse duration-[4000ms]"></div>
          <div className="absolute w-[500px] h-[500px] bg-accent/20 rounded-full blur-[80px]"></div>
          <div className="absolute w-[300px] h-[300px] bg-accent/30 rounded-full blur-[50px]"></div>
          <div className="absolute w-[200px] h-[200px] bg-white/10 rounded-full blur-[40px] -translate-y-10"></div>
        </div>

        {/* LOGO */}
        <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-1000">
          <img
            src={logoImg}
            alt="Track-Fit Logo"
            className="w-72 h-72 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] object-contain drop-shadow-2xl filter brightness-110"
          />

          <div className="hidden lg:block absolute -bottom-16 text-center">
            <h1 className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-text-main to-text-muted/50 drop-shadow-sm mb-2">
              TRACK-FIT
            </h1>
            <p className="text-lg font-bold text-text-muted tracking-[0.5em] uppercase opacity-80">
              Pro Edition
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="w-full h-[55vh] lg:h-full lg:w-1/2 flex flex-col items-center justify-center relative z-20 p-6 lg:p-0">
        {/* CARD */}
        <div className="w-full max-w-sm lg:max-w-md p-1 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent shadow-2xl animate-in slide-in-from-right-10 duration-700">
          <div className="w-full h-full glass p-8 lg:p-10 rounded-[1.9rem] bg-surface/40 backdrop-blur-xl border border-white/5">
            <div className="text-center mb-10">
              <h1 className="text-3xl lg:text-4xl font-black text-text-main tracking-tighter mb-2">
                Welcome Back
              </h1>
              <p className="text-sm text-text-muted font-medium">
                Enter your details to access your dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* EMAIL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">
                  Email
                </label>
                <div className="relative group transition-all duration-300 focus-within:scale-[1.02]">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="coach@track-fit.app"
                    className="w-full pl-12 pr-4 h-14 glass-input rounded-2xl font-bold text-text-main bg-surface/30 focus:bg-surface/50 border border-transparent focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-muted/30"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">
                  Password
                </label>
                <div className="relative group transition-all duration-300 focus-within:scale-[1.02]">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 h-14 glass-input rounded-2xl font-bold text-text-main bg-surface/30 focus:bg-surface/50 border border-transparent focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-text-muted/30"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-error/10 text-error text-xs font-bold p-4 rounded-xl text-center border border-error/20 flex items-center justify-center gap-2 animate-in fade-in zoom-in-95">
                  <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full h-14 mt-6 bg-accent text-text-inverted font-black rounded-2xl shadow-[0_10px_30px_rgb(var(--accent-rgb)/0.3)] hover:shadow-[0_20px_40px_rgb(var(--accent-rgb)/0.4)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 text-lg cursor-pointer uppercase tracking-wider relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>

                {loading ? (
                  <Loader2 className="animate-spin h-6 w-6" />
                ) : (
                  <>
                    SIGN IN
                    <ArrowRight
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      strokeWidth={3}
                    />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
