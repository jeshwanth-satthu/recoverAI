import React, { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import { getRecoveryAnomaly } from "../../services/api";

export default function CircuitBreakerStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const result = await getRecoveryAnomaly();
      setData(result);
    } catch (error) {
      console.error("Circuit breaker fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <GlassCard className="p-6 md:p-10">
        <div className="font-mono text-xs text-[#797776] uppercase tracking-wider">
          Inspecting recovery safety parameters...
        </div>
      </GlassCard>
    );
  }

  const tripped = data?.circuit_breaker === true;
  const anomaly = data?.anomaly_detected === true;

  const statusLabel = tripped
    ? "CIRCUIT BREAKER"
    : anomaly
    ? "ANOMALY DETECTED"
    : "SYSTEM NORMAL";

  return (
    <GlassCard className="p-6 md:p-10 relative">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-6 border-b border-[#cecac8]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[#797776]">
            GATEWAY MONITOR / CIRCUIT RELIABILITY
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#242424] mt-1">
            RECOVERY SAFETY
          </h2>
          <p className="font-mono text-xs text-[#797776] mt-1">
            Autonomous recovery protection
          </p>
        </div>

        {/* STATUS PILL */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border font-mono text-xs uppercase tracking-wider ${
            tripped
              ? "border-[#f37a0a] bg-[#f6f3f1] text-[#f37a0a]"
              : anomaly
              ? "border-[#ff9473] bg-[#f6f3f1] text-[#ff9473]"
              : "border-[#cecac8] bg-[#f6f3f1] text-[#242424]"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              tripped
                ? "bg-[#f37a0a] animate-pulse"
                : anomaly
                ? "bg-[#ff9473] animate-pulse"
                : "bg-[#059669]"
            }`}
          />
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
        <div>
          <span className="font-mono text-xs uppercase text-[#797776] block mb-2">
            CURRENT FAILURE RATE
          </span>
          <div className="font-serif text-3xl font-normal text-[#242424]">
            {((data?.current_failure_rate || 0) * 100).toFixed(1)}%
          </div>
          <span className="font-mono text-[11px] text-[#797776] mt-1 block">
            Observed across rolling window
          </span>
        </div>

        <div>
          <span className="font-mono text-xs uppercase text-[#797776] block mb-2">
            BASELINE
          </span>
          <div className="font-serif text-3xl font-normal text-[#242424]">
            {((data?.baseline_failure_rate || 0) * 100).toFixed(1)}%
          </div>
          <span className="font-mono text-[11px] text-[#797776] mt-1 block">
            Historical benchmark rate
          </span>
        </div>

        <div>
          <span className="font-mono text-xs uppercase text-[#797776] block mb-2">
            FAILURE RATIO
          </span>
          <div className="font-serif text-3xl font-normal text-[#242424]">
            {data?.failure_rate_ratio ?? "1.00"}×
          </div>
          <span className="font-mono text-[11px] text-[#797776] mt-1 block">
            Trip threshold: 2.0×
          </span>
        </div>
      </div>

      {/* REASON & NOTE */}
      <div className="mt-8 pt-4 border-t border-[#cecac8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#797776]">
        <span>{data?.reason || "Autonomous execution safe. No anomalous surge detected."}</span>
        <span className="text-[#242424]">CIRCUIT BREAKER: {tripped ? "TRIPPED (HALTED)" : "DISARMED (SAFE)"}</span>
      </div>
    </GlassCard>
  );
}
