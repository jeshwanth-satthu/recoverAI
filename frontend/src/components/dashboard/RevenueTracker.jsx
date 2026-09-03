import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ShieldAlert,
  Zap,
  Clock,
  ArrowUpRight,
  PieChart,
  CheckCircle2,
} from "lucide-react";

import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";
import { FAILURE_BREAKDOWN, REVENUE_TIMELINE } from "../../lib/mockData";

export default function RevenueTracker({ metrics = {} }) {
  const [activeRange, setActiveRange] = useState("today");

  const atRisk = Number(metrics.revenue_at_risk || 648500);
  const recovered = Number(metrics.revenue_recovered || 2840200);
  const totalProtected = atRisk + recovered;
  const recoveryPct = totalProtected > 0 ? ((recovered / totalProtected) * 100).toFixed(1) : 78.6;

  return (
    <div className="space-y-6">
      {/* ===================================================
          1. DUAL HOLOGRAPHIC REVENUE GAUGES (Hero Grid)
          =================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* RECOVERED REVENUE CARD (Left Hero - 7 cols) */}
        <GlassCard variant="recovered" className="lg:col-span-7 relative overflow-hidden bg-white/95 border-emerald-200/80 shadow-sm">
          {/* Subtle background glow circle */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-emerald-700 font-bold">
                  Autonomous AI Success
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Recovered Revenue
                </h3>
              </div>
            </div>

            <Badge
              label={`+${recoveryPct}% Conversion Rate`}
              variant="recovered"
              pulsing={true}
            />
          </div>

          <div className="flex flex-wrap items-baseline gap-4 mb-4">
            <span className="font-mono-nums text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              ₹{recovered.toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold">
              <ArrowUpRight size={14} />
              <span>₹1.42L saved this hour</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 font-sans leading-relaxed mb-6">
            Autonomous agent swarm intercepted and recovered failed checkouts across UPI, Net Banking, and Card gateways without manual operator intervention.
          </p>

          {/* PROGRESS RATIO BAR */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-600">
              <span>Overall Protection Efficiency</span>
              <span className="text-emerald-700 font-bold">{recoveryPct}% Salvaged</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${recoveryPct}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 rounded-full shadow-xs"
              />
            </div>
          </div>
        </GlassCard>

        {/* AT-RISK REVENUE CARD (Right Hero - 5 cols) */}
        <GlassCard variant="risk" className="lg:col-span-5 relative overflow-hidden bg-white/95 border-rose-200/80 shadow-sm">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                <ShieldAlert size={20} />
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-rose-700 font-bold">
                  Active Threat Stream
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Revenue At Risk
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
              LIVE DISPATCH
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono-nums text-4xl sm:text-5xl font-extrabold text-rose-600 tracking-tight">
              ₹{atRisk.toLocaleString("en-IN")}
            </span>
          </div>

          <p className="text-xs text-slate-600 font-sans leading-relaxed mb-6">
            Failed checkouts undergoing Gemini diagnosis and safety guardrails. High-risk items await operator clearance in the Review Panel.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px]">AVG RECOVERY TIME</span>
              <span className="font-bold text-slate-800 text-sm">3.8 Seconds</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px]">GUARDRAIL SHIELD</span>
              <span className="font-bold text-sky-700 text-sm">100% Zero-Loss</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ===================================================
          2. SECONDARY TELEMETRY METRICS
          =================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 bg-white/90 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-semibold">AUTONOMOUS SHARE</span>
            <Zap size={14} className="text-violet-600" />
          </div>
          <div className="font-mono-nums text-2xl font-extrabold text-slate-900 mb-1">
            86.4%
          </div>
          <span className="text-[11px] text-slate-500">Zero human intervention</span>
        </GlassCard>

        <GlassCard className="p-4 bg-white/90 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-semibold">RECOVERED TXNS</span>
            <CheckCircle2 size={14} className="text-emerald-600" />
          </div>
          <div className="font-mono-nums text-2xl font-extrabold text-slate-900 mb-1">
            {metrics.successful_recoveries || 412}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">99.4% settlement verified</span>
        </GlassCard>

        <GlassCard className="p-4 bg-white/90 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-semibold">AVG LATENCY</span>
            <Clock size={14} className="text-sky-600" />
          </div>
          <div className="font-mono-nums text-2xl font-extrabold text-slate-900 mb-1">
            4.2s
          </div>
          <span className="text-[11px] text-sky-700 font-semibold">Sub-second Gemini inference</span>
        </GlassCard>

        <GlassCard className="p-4 bg-white/90 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-semibold">AUDIT TRAIL</span>
            <ShieldAlert size={14} className="text-amber-600" />
          </div>
          <div className="font-mono-nums text-2xl font-extrabold text-slate-900 mb-1">
            {metrics.audit_events || 1842}
          </div>
          <span className="text-[11px] text-slate-500">Immutable ledger events</span>
        </GlassCard>
      </div>

      {/* ===================================================
          3. ROOT CAUSE BREAKDOWN & TIMELINE
          =================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* REVENUE TIMELINE SPARK CHART (7 cols) */}
        <GlassCard className="lg:col-span-7 bg-white/90 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="font-display font-bold text-slate-900 text-base">
                Intraday Salvage Velocity
              </h4>
              <p className="text-xs text-slate-500 font-mono">
                Recovered volume (emerald) vs incoming at-risk spikes (rose)
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono">
              <button
                onClick={() => setActiveRange("today")}
                className={`px-2 py-1 rounded cursor-pointer transition-colors ${activeRange === "today" ? "bg-white text-violet-700 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                Today
              </button>
              <button
                onClick={() => setActiveRange("7d")}
                className={`px-2 py-1 rounded cursor-pointer transition-colors ${activeRange === "7d" ? "bg-white text-violet-700 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                7 Days
              </button>
            </div>
          </div>

          {/* TIMELINE VISUALIZER BARS */}
          <div className="h-44 flex items-end gap-3 pt-6 pb-2 px-1">
            {REVENUE_TIMELINE.map((item, idx) => {
              const maxVal = 900000;
              const recoveredH = Math.max(12, (item.recovered / maxVal) * 100);
              const atRiskH = Math.max(8, (item.at_risk / maxVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* At risk bar */}
                    <div
                      style={{ height: `${atRiskH}%` }}
                      className="w-2 rounded-t bg-rose-400 group-hover:bg-rose-500 transition-all shadow-xs"
                      title={`At Risk: ₹${item.at_risk.toLocaleString()}`}
                    />
                    {/* Recovered bar */}
                    <div
                      style={{ height: `${recoveredH}%` }}
                      className="w-2.5 rounded-t bg-gradient-to-t from-emerald-600 to-teal-500 shadow-xs group-hover:shadow-md transition-all"
                      title={`Recovered: ₹${item.recovered.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-900 font-medium">
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* FAILURE ROOT CAUSES (5 cols) */}
        <GlassCard className="lg:col-span-5 bg-white/90 border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-display font-bold text-slate-900 text-base">
                Failure Vector Diagnostics
              </h4>
              <p className="text-xs text-slate-500 font-mono">
                Real-time classification by AI diagnosis agent
              </p>
            </div>
            <PieChart size={16} className="text-violet-600" />
          </div>

          <div className="space-y-3.5">
            {FAILURE_BREAKDOWN.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-700 font-medium flex items-center gap-2 truncate max-w-[200px]">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.reason}
                  </span>
                  <span className="font-bold text-slate-900">
                    {item.share}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.share}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>{item.count} occurrences</span>
                  <span>₹{item.amount.toLocaleString("en-IN")} impact</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
