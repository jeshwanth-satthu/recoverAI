import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  ShieldCheck,
  Zap,
  CheckCircle2,
  UserRound,
  Activity,
} from "lucide-react";
import GlassCard from "../ui/GlassCard";
import { getRecoveryCases } from "../../services/api";

function getIcon(stage) {
  switch (stage) {
    case "DIAGNOSIS":
      return Brain;
    case "STRATEGY":
      return TrendingUp;
    case "GUARDRAIL":
      return ShieldCheck;
    case "EXECUTION":
      return Zap;
    case "VERIFICATION":
      return CheckCircle2;
    case "HUMAN REVIEW":
      return UserRound;
    default:
      return Activity;
  }
}

function getStage(caseItem) {
  if (
    caseItem?.verification?.verified ||
    caseItem?.verification?.recovered ||
    caseItem?.status === "recovered"
  ) {
    return "VERIFICATION";
  }

  if (
    caseItem?.execution?.status === "success" ||
    caseItem?.status === "recovering"
  ) {
    return "EXECUTION";
  }

  if (
    caseItem?.guardrail?.requires_human_approval ||
    caseItem?.status === "human_approval"
  ) {
    return "HUMAN REVIEW";
  }

  if (caseItem?.guardrail) {
    return "GUARDRAIL";
  }

  if (caseItem?.recommended_strategy || caseItem?.decision) {
    return "STRATEGY";
  }

  if (caseItem?.diagnosis) {
    return "DIAGNOSIS";
  }

  return "DIAGNOSIS";
}

function getMessage(caseItem, stage) {
  switch (stage) {
    case "DIAGNOSIS":
      return (
        caseItem?.diagnosis?.diagnosis ||
        "Gemini analyzed failure root cause and network latency."
      );
    case "STRATEGY":
      return (
        caseItem?.recommended_strategy?.reason ||
        caseItem?.decision?.action ||
        "Optimized strategy selected for expected recovery yield."
      );
    case "GUARDRAIL":
      return (
        caseItem?.guardrail?.reason ||
        "Deterministic policy verified automation ceiling (₹10,000)."
      );
    case "EXECUTION":
      return (
        caseItem?.execution?.message ||
        "Autonomous retry dispatched via secondary gateway routing."
      );
    case "VERIFICATION":
      return caseItem?.verification?.recovered || caseItem?.status === "recovered"
        ? `₹${Number(
            caseItem?.verification?.amount_recovered || caseItem?.amount || 0
          ).toLocaleString("en-IN")} settled and verified via bank webhook.`
        : "Webhook confirmation received and ledger synchronized.";
    case "HUMAN REVIEW":
      return (
        caseItem?.guardrail?.reason ||
        "Execution ceiling exceeded. Operator clearance required."
      );
    default:
      return "Autonomous recovery pipeline state updated.";
  }
}

function getStatusBadge(caseItem, stage) {
  if (stage === "VERIFICATION") return "RESOLVED";
  if (stage === "HUMAN REVIEW") return "HOLD";
  if (stage === "EXECUTION") return "DISPATCHED";
  return "ANALYZED";
}

export default function RecoveryEventStream() {
  const [cases, setCases] = useState([]);

  const loadEvents = async () => {
    try {
      const result = await getRecoveryCases();
      const nextCases = Array.isArray(result)
        ? result
        : result?.cases || result?.data || [];
      setCases(nextCases.slice(0, 7));
    } catch (error) {
      console.error("Recovery event stream failed:", error);
    }
  };

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard className="p-6 md:p-10 relative">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-6 border-b border-[#cecac8]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[#797776]">
            AUDIT STREAM / REAL-TIME LEDGER
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#242424] mt-1">
            LIVE RECOVERY STREAM
          </h2>
          <p className="font-mono text-xs text-[#797776] mt-1">
            Autonomous recovery pipeline events
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-[#4e4d4d] uppercase tracking-wider">
          <span className="size-1.5 rounded-full bg-[#059669] animate-pulse" />
          <span>Stream Active</span>
        </div>
      </div>

      {/* VERTICAL TIMELINE */}
      <div className="mt-8 pt-2">
        {cases.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-[#797776] uppercase tracking-wider">
            Waiting for recovery pipeline events...
          </div>
        ) : (
          <div className="relative border-l border-[#cecac8] ml-4 md:ml-6 pl-6 md:pl-8 space-y-6">
            {cases.map((item, index) => {
              const stage = getStage(item);
              const Icon = getIcon(stage);
              const message = getMessage(item, stage);
              const status = getStatusBadge(item, stage);
              const txnId = item.transaction_id || item.id || `TXN-${index + 1}`;
              const time = item.created_at || "Recent";

              return (
                <motion.div
                  key={item.case_id || txnId || index}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="relative group py-1"
                >
                  {/* Timeline Dot with Icon */}
                  <div className="absolute -left-[35px] md:-left-[43px] top-0 size-6 md:size-7 rounded-full border border-[#cecac8] bg-[#f6f3f1] flex items-center justify-center text-[#242424] group-hover:border-[#242424] transition-colors">
                    <Icon size={12} />
                  </div>

                  {/* Event Content */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-medium tracking-wider uppercase text-[#242424]">
                          {stage}
                        </span>
                        <span className="font-mono text-[11px] text-[#797776]">
                          {txnId}
                        </span>
                        {item.customer && (
                          <span className="font-mono text-[11px] text-[#4e4d4d] hidden sm:inline">
                            • {item.customer}
                          </span>
                        )}
                      </div>

                      <p className="font-mono text-xs text-[#4e4d4d] leading-relaxed max-w-2xl">
                        {message}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] shrink-0 self-start sm:self-auto">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] uppercase tracking-wider ${
                        status === "RESOLVED"
                          ? "border-[#a7fccd] bg-[#a7fccd]/20 text-[#059669]"
                          : status === "HOLD"
                          ? "border-[#ff9473] bg-[#ff9473]/20 text-[#f37a0a]"
                          : "border-[#cecac8] text-[#242424]"
                      }`}>
                        {status}
                      </span>
                      <span className="text-[#797776]">{time}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-[#cecac8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#797776]">
          <span>Pipeline stages: DIAGNOSIS → STRATEGY → GUARDRAIL → EXECUTION → VERIFICATION</span>
          <span className="text-[#242424]">CONTINUOUS POLLING (3S)</span>
        </div>
      </div>
    </GlassCard>
  );
}
