import { useState } from "react";
import { motion } from "framer-motion";
import AuthVisual from "../components/auth/AuthVisual";
import LoginForm from "../components/auth/LoginForm";
import RecoverAiMark from "../components/auth/RecoverAiMark";

export default function Login({ onAuthSuccess }) {
  const [activeField, setActiveField] = useState(null);
  const [authStatus, setAuthStatus] = useState("idle");

  return (
    <div
      className="min-h-screen w-full text-slate-200 font-mono font-normal flex flex-col justify-between relative overflow-hidden select-none"
      style={{
        backgroundColor: "#06051d",
        backgroundImage: `
          radial-gradient(circle at 35% 42%, rgba(43, 89, 209, 0.14) 0%, rgba(6, 20, 52, 0.08) 50%, transparent 75%),
          radial-gradient(circle at 85% 20%, rgba(56, 189, 248, 0.05) 0%, transparent 60%),
          linear-gradient(180deg, #061434 0%, #06051d 65%, #040318 100%)
        `,
      }}
    >
      {/* PROCEDURAL FAINT BACKGROUND GRID / CROSSHAIR TICKS */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* TOP STATUS BAR */}
      <header className="relative z-20 w-full px-6 py-4 sm:px-10 lg:px-12 border-b border-slate-800/60 flex items-center justify-between">
        {/* Left: Brand + Truthful System Definition */}
        <div className="flex items-center gap-3">
          <RecoverAiMark className="size-5 shrink-0" color="#38bdf8" />
          <div className="flex items-baseline gap-2.5">
            <span className="text-sm font-mono tracking-widest text-slate-100 font-normal">
              RECOVERAI
            </span>
            <span className="hidden sm:inline text-xs text-slate-500 font-mono font-normal">
              /
            </span>
            <span className="hidden sm:inline text-[11px] font-mono tracking-wider text-slate-400 font-normal uppercase">
              AUTONOMOUS RECOVERY ENGINE
            </span>
          </div>
        </div>

        {/* Right: Truthful Environment Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-300">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wider uppercase text-[10px] sm:text-[11px]">
            RECOVERAI ACCESS
          </span>
        </div>
      </header>

      {/* MAIN VIEWPORT: RECOVERY CORE (LEFT) + LOGIN CONTROL MODULE (RIGHT) */}
      <main className="relative z-10 flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        
        {/* LEFT COLUMN: PROCEDURAL RECOVERY CORE HERO + FLOW (COMPACT BRAND VISUAL ON MOBILE, 7 COLS ON DESKTOP) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="lg:col-span-7 h-[280px] sm:h-[380px] lg:h-[620px] w-full flex flex-col justify-center order-1 lg:order-1"
        >
          <AuthVisual activeField={activeField} authStatus={authStatus} />
        </motion.div>

        {/* RIGHT COLUMN: ELEVATED CONTROL MODULE LOGIN PANEL (5 COLS ON DESKTOP) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="lg:col-span-5 w-full flex items-center justify-center order-2 lg:order-2 pb-6 lg:pb-0"
        >
          <LoginForm
            onSuccess={onAuthSuccess}
            onFieldFocus={(field) => setActiveField(field)}
            onFieldBlur={() => setActiveField(null)}
            onAuthStatusChange={(status) => setAuthStatus(status)}
          />
        </motion.div>
      </main>

      {/* BOTTOM FOOTER BAR: TECHNICAL FLOW LABELS */}
      <footer className="relative z-20 w-full px-6 py-3 sm:px-10 lg:px-12 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="tracking-widest uppercase text-slate-400">
            TRANSACTION · DIAGNOSIS · STRATEGY · GUARDRAIL · RECOVERY
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <span>DETERMINISTIC GUARDRAILS ACTIVE</span>
          <span>·</span>
          <span>INGRESS PORT 8000</span>
        </div>
      </footer>
    </div>
  );
}
