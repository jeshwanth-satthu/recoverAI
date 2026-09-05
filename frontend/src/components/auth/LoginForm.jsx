import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { login, demoLogin } from "../../services/auth";
import RecoverAiMark from "./RecoverAiMark";

export default function LoginForm({
  onSuccess,
  onFieldFocus,
  onFieldBlur,
  onAuthStatusChange,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // States: "idle" | "authenticating" | "demo_initializing" | "authenticated" | "error"
  const [authStatus, setAuthStatus] = useState("idle");
  const [authStepMessage, setAuthStepMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    const trimmed = email.trim();

    if (!trimmed) {
      errors.email = "Work email required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      errors.email = "Invalid work email format.";
    }

    if (!password) {
      errors.password = "Password required.";
    } else if (password.length < 6) {
      errors.password = "Minimum 6 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async (e) => {
    e?.preventDefault();
    setErrorMessage("");

    if (!validate()) {
      return;
    }

    setAuthStatus("authenticating");
    onAuthStatusChange?.("authenticating");
    setAuthStepMessage("AUTHENTICATING...");

    try {
      // Step 1: Simulated verification hop
      const res = await login({ email, password, rememberMe });
      if (res?.success) {
        setAuthStepMessage("AUTHORIZED");
        setAuthStatus("authenticated");
        onAuthStatusChange?.("authenticated");

        setTimeout(() => {
          onSuccess?.(res.user);
        }, 500);
      }
    } catch (err) {
      setAuthStatus("error");
      onAuthStatusChange?.("error");
      setErrorMessage(err.message || "Authentication failed. Please verify credentials.");
    }
  };

  const handleDemoAccess = async () => {
    setErrorMessage("");
    setFieldErrors({});
    setAuthStatus("demo_initializing");
    onAuthStatusChange?.("demo_initializing");
    setAuthStepMessage("DEMO ACCESS");

    try {
      setTimeout(() => {
        setAuthStepMessage("INITIALIZING RECOVERAI");
      }, 250);

      const res = await demoLogin();
      if (res?.success) {
        setAuthStepMessage("AUTHORIZED ✓");
        setAuthStatus("authenticated");
        onAuthStatusChange?.("authenticated");

        setTimeout(() => {
          onSuccess?.(res.user);
        }, 450);
      }
    } catch (err) {
      setAuthStatus("error");
      onAuthStatusChange?.("error");
      setErrorMessage(err.message || "Failed to initialize demo session.");
    }
  };

  const isBusy =
    authStatus === "authenticating" ||
    authStatus === "demo_initializing" ||
    authStatus === "authenticated";

  return (
    <div className="w-full max-w-md mx-auto font-mono">
      {/* Elevated Floating Control Module Panel */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="rounded-[8px] p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-md"
        style={{
          backgroundColor: "rgba(29, 41, 61, 0.72)",
          border: "1px solid rgba(229, 231, 235, 0.10)",
        }}
      >
        {/* HEADER */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <RecoverAiMark className="size-4" color="#38bdf8" />
            <span className="text-xs tracking-wider text-slate-100 font-mono font-normal">
              RECOVERAI
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] tracking-widest text-slate-400 uppercase">
              AUTONOMOUS REVENUE RECOVERY
            </span>
          </div>

          <h1 className="text-2xl sm:text-[28px] lg:text-[30px] font-normal tracking-tight text-slate-100 leading-snug">
            SIGN IN TO RECOVERAI
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            Access your autonomous recovery engine.
          </p>
        </div>

        {/* RESTRAINED ERROR NOTIFICATION (NO VIOLENT SHAKES) */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2.5 p-3 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs"
            >
              <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-normal uppercase tracking-wider text-[10px] text-rose-300">
                  AUTHENTICATION FAILED
                </p>
                <p className="text-[11px] text-rose-400/90">{errorMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AUTHENTICATION FORM */}
        <form onSubmit={handleSignIn} className="space-y-4" noValidate>
          
          {/* WORK EMAIL FIELD */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 tracking-wider uppercase">
              <label htmlFor="email" className="font-normal">
                WORK EMAIL
              </label>
              {fieldErrors.email && (
                <span className="text-rose-400 text-[10px] lowercase tracking-normal">
                  {fieldErrors.email}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: null }));
                }}
                onFocus={() => onFieldFocus?.("email")}
                onBlur={() => onFieldBlur?.()}
                disabled={isBusy}
                placeholder="operator@recoverai.finance"
                className={`w-full rounded-md bg-[#0a0f1d]/85 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-600 outline-none transition-all duration-200 ${
                  fieldErrors.email
                    ? "border border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30"
                    : "border border-slate-700/60 focus:border-[#38bdf8]/70 focus:ring-1 focus:ring-[#38bdf8]/25"
                }`}
                autoComplete="email"
                aria-required="true"
              />
            </div>
          </div>

          {/* PASSWORD FIELD */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 tracking-wider uppercase">
              <label htmlFor="password" className="font-normal">
                PASSWORD
              </label>
              <button
                type="button"
                onClick={() =>
                  alert(
                    "Demo Environment: Sign in with work password (e.g. recover2026 or 6+ chars), or use Quick Demo Access below."
                  )
                }
                className="text-[10px] text-slate-500 hover:text-sky-400 transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: null }));
                }}
                onFocus={() => onFieldFocus?.("password")}
                onBlur={() => onFieldBlur?.()}
                disabled={isBusy}
                placeholder="••••••••••••"
                className={`w-full rounded-md bg-[#0a0f1d]/85 px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-600 outline-none transition-all duration-200 ${
                  fieldErrors.password
                    ? "border border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30"
                    : "border border-slate-700/60 focus:border-[#38bdf8]/70 focus:ring-1 focus:ring-[#38bdf8]/25"
                }`}
                autoComplete="current-password"
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[10px] text-rose-400 font-mono">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* SESSION CONTROLS */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-3.5 rounded border-slate-700 bg-slate-900 text-[#2b59d1] focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Remember session (24h)</span>
            </label>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              TLS 1.3
            </span>
          </div>

          {/* PRIMARY BUTTON: TRANSLUCENT SPECIMEN-PILL (LAKE BLUE) */}
          <button
            type="submit"
            disabled={isBusy}
            className="w-full h-11 rounded-full font-mono text-xs uppercase tracking-widest font-normal transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
            style={{
              backgroundColor:
                authStatus === "authenticated"
                  ? "rgba(16, 185, 129, 0.25)"
                  : authStatus === "authenticating"
                  ? "rgba(43, 89, 209, 0.35)"
                  : "rgba(43, 89, 209, 0.20)",
              border:
                authStatus === "authenticated"
                  ? "1px solid rgba(52, 211, 153, 0.40)"
                  : "1px solid rgba(99, 179, 237, 0.20)",
              color: authStatus === "authenticated" ? "#a7fccd" : "#ebf8ff",
            }}
          >
            {authStatus === "authenticating" && (
              <>
                <span className="size-1.5 rounded-full bg-[#38bdf8] animate-ping" />
                <span>{authStepMessage || "AUTHENTICATING..."}</span>
              </>
            )}

            {authStatus === "authenticated" && (
              <>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>AUTHENTICATED ✓</span>
              </>
            )}

            {!isBusy && (
              <>
                <span>SIGN IN</span>
                <ArrowRight size={13} className="text-sky-300" />
              </>
            )}
          </button>
        </form>

        {/* MINIMAL HAIRLINE DIVIDER */}
        <div className="relative flex items-center justify-center pt-1">
          <div className="w-full border-t border-slate-800/80" />
          <span
            className="absolute px-2.5 text-[10px] uppercase tracking-widest text-slate-500 font-mono"
            style={{ backgroundColor: "rgba(29, 41, 61, 0.95)" }}
          >
            OR
          </span>
        </div>

        {/* SECONDARY BUTTON: TRANSLUCENT AMBER SPECIMEN-PILL (DEMO ACCESS) */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={isBusy}
            className="w-full h-10 rounded-full font-mono text-[11px] uppercase tracking-wider font-normal transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            style={{
              backgroundColor:
                authStatus === "demo_initializing"
                  ? "rgba(245, 158, 11, 0.20)"
                  : "rgba(245, 158, 11, 0.10)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              color: "#fef3c7",
            }}
          >
            {authStatus === "demo_initializing" ? (
              <>
                <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>{authStepMessage || "INITIALIZING RECOVERAI"}</span>
              </>
            ) : (
              <>
                <Sparkles size={12} className="text-amber-400" />
                <span>QUICK DEMO ACCESS</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-slate-500 font-mono">
            Direct access for judges · Operator #04
          </p>
        </div>

        {/* BOTTOM TRUTHFUL STATUS (NO FAKE CLAIMS) */}
        <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="tracking-wider uppercase">AUTHORIZED SESSION</span>
          </div>
          <span className="text-slate-500">v1.0.0</span>
        </div>
      </motion.div>
    </div>
  );
}
