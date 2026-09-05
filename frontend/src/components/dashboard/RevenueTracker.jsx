import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  Zap,
  CheckCircle2,
} from "lucide-react";
import GlassCard from "../ui/GlassCard";
import { FAILURE_BREAKDOWN, REVENUE_TIMELINE } from "../../lib/mockData";

const formatMetricValue = (val) => {
  const num = Number(val || 0);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
};

export default function RevenueTracker({ metrics = {}, pulseRecovery = false }) {
  const [activeRange, setActiveRange] = useState("today");

  const atRisk = Number(metrics.revenue_at_risk ?? 0);
  const recovered = Number(metrics.revenue_recovered ?? 0);
  const totalProtected = atRisk + recovered;

  const recoveryRate =
    metrics.recovery_rate !== undefined && metrics.recovery_rate !== null
      ? Number(metrics.recovery_rate).toFixed(1)
      : totalProtected > 0
      ? ((recovered / totalProtected) * 100).toFixed(1)
      : "0.0";

  // Expected recovery: from metrics or derived deterministically
  const expectedRecovery = Number(
    metrics.expected_recovery ??
    metrics.expected_recoverable_revenue ??
    Math.round(atRisk * 0.734)
  );

  const metricBlocks = [
    {
      id: "at-risk",
      label: "REVENUE AT RISK",
      value: formatMetricValue(atRisk),
      fullValue: `₹${atRisk.toLocaleString("en-IN")}`,
      subtext: "Failed transactions currently in recovery pipeline",
      color: "text-[#242424]",
    },
    {
      id: "expected",
      label: "EXPECTED RECOVERY",
      value: formatMetricValue(expectedRecovery),
      fullValue: `₹${expectedRecovery.toLocaleString("en-IN")}`,
      subtext: "ML estimated value across active queues",
      color: "text-[#242424]",
    },
    {
      id: "recovered",
      label: "RECOVERED REVENUE",
      value: formatMetricValue(recovered),
      fullValue: `₹${recovered.toLocaleString("en-IN")}`,
      subtext: "Verified settlements via autonomous interventions",
      color: "text-[#242424]",
    },
    {
      id: "rate",
      label: "RECOVERY RATE",
      value: `${recoveryRate}%`,
      fullValue: `${recoveryRate}% conversion`,
      subtext: "Protection efficiency vs baseline drop-off",
      color: "text-[#2b59d1]",
    },
  ];

  return (
    <div className="space-y-8">
      {/* ===================================================
          1. CORE REVENUE METRICS (4 Editorial Metric Blocks)
          =================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {metricBlocks.map((block) => {
          const isRecoveredPulse = block.id === "recovered" && pulseRecovery;
          return (
            <GlassCard
              key={block.id}
              className={`p-6 md:p-8 flex flex-col justify-between transition-all duration-500 ${
                isRecoveredPulse
                  ? "border-[#059669] bg-[#a7fccd]/20 shadow-md ring-2 ring-[#a7fccd]/50"
                  : "hover:border-[#4e4d4d]"
              }`}
            >
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[#797776] block mb-3">
                {block.label}
              </span>
              <div
                className={`font-serif text-3xl sm:text-4xl lg:text-[40px] leading-tight font-normal ${block.color} tracking-tight`}
              >
                {block.value}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#cecac8] flex items-center justify-between text-[11px] font-mono text-[#797776]">
              <span className="truncate">{block.subtext}</span>
              <span className="font-medium text-[#242424] ml-2 shrink-0">
                {block.fullValue}
              </span>
            </div>
          </GlassCard>
          );
        })}
      </div>

      {/* ===================================================
          2. SECONDARY TELEMETRY & DIAGNOSTICS
          =================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INTRADAY SALVAGE VELOCITY (7 cols) */}
        <GlassCard className="lg:col-span-7 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#cecac8]">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[#797776]">
                TELEMETRY / HOURLY VELOCITY
              </span>
              <h3 className="font-serif text-xl md:text-2xl font-normal text-[#242424] mt-0.5">
                Intraday Salvage Velocity
              </h3>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-full border border-[#cecac8] bg-[#f6f3f1] text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setActiveRange("today")}
                className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                  activeRange === "today"
                    ? "bg-[#242424] text-[#f6f3f1]"
                    : "text-[#797776] hover:text-[#242424]"
                }`}
              >
                TODAY
              </button>
              <button
                type="button"
                onClick={() => setActiveRange("7d")}
                className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                  activeRange === "7d"
                    ? "bg-[#242424] text-[#f6f3f1]"
                    : "text-[#797776] hover:text-[#242424]"
                }`}
              >
                7 DAYS
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
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                >
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* At risk bar */}
                    <div
                      style={{ height: `${atRiskH}%` }}
                      className="w-2 rounded-full bg-[#cecac8] group-hover:bg-[#ff9473] transition-colors"
                      title={`At Risk: ₹${item.at_risk.toLocaleString()}`}
                    />
                    {/* Recovered bar */}
                    <div
                      style={{ height: `${recoveredH}%` }}
                      className="w-2.5 rounded-full bg-[#242424] group-hover:bg-[#2b59d1] transition-colors"
                      title={`Recovered: ₹${item.recovered.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#797776] group-hover:text-[#242424]">
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#cecac8] flex items-center justify-between text-xs font-mono text-[#797776]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#242424]" />
                RECOVERED
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#cecac8]" />
                AT RISK
              </span>
            </div>
            <span>Average latency: 4.2s</span>
          </div>
        </GlassCard>

        {/* FAILURE ROOT CAUSES (5 cols) */}
        <GlassCard className="lg:col-span-5 p-6 md:p-8">
          <div className="mb-6 pb-4 border-b border-[#cecac8]">
            <span className="font-mono text-xs uppercase tracking-wider text-[#797776]">
              CLASSIFICATION / ROOT CAUSE
            </span>
            <h3 className="font-serif text-xl md:text-2xl font-normal text-[#242424] mt-0.5">
              Failure Vector Diagnostics
            </h3>
          </div>

          <div className="space-y-4">
            {FAILURE_BREAKDOWN.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#242424] flex items-center gap-2 truncate max-w-[200px]">
                    <span className="size-1.5 rounded-full bg-[#242424] shrink-0" />
                    {item.reason}
                  </span>
                  <span className="font-medium text-[#242424]">
                    {item.share}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#cecac8]/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#242424] transition-all duration-500"
                    style={{ width: `${item.share}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#797776]">
                  <span>{item.count} events</span>
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
