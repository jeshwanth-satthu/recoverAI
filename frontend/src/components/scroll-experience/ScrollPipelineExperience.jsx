import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Brain,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Unlock,
  ArrowRight,
  RefreshCw,
  Play,
  Pause,
} from "lucide-react";
import RecoveryCoreScene, { STAGES_3D } from "./RecoveryCoreScene";
import GlassCard from "../ui/GlassCard";
import { playClickSound, playSuccessSound } from "../../lib/soundFX";

const STAGE_DETAILS = [
  {
    index: 0,
    id: "01",
    label: "TRANSACTION",
    title: "Failed Payment Ingestion & Atomic Lock",
    icon: CreditCard,
    accent: "#ff9473",
    description:
      "When a card expires, 3DS authentication fails, or gateway timeouts occur, the payment webhook is atomically claimed with idempotency locking to prevent duplicate billing.",
    metrics: [
      { label: "INGESTION LATENCY", value: "14ms" },
      { label: "GATEWAY LOCK", value: "ATOMIC" },
      { label: "IDEMPOTENCY", value: "VERIFIED" },
    ],
  },
  {
    index: 1,
    id: "02",
    label: "DIAGNOSIS",
    title: "Gemini AI Root-Cause Diagnostic Agent",
    icon: Brain,
    accent: "#a0b5eb",
    description:
      "The diagnostic agent evaluates real-time gateway error codes, historical customer settlement trends, and velocity to diagnose whether failure is technical, balance-related, or credential expiration.",
    metrics: [
      { label: "DIAGNOSIS CONFIDENCE", value: "97.4%" },
      { label: "INFERENCE TIME", value: "320ms" },
      { label: "CHURN RISK EVAL", value: "ACTIVE" },
    ],
  },
  {
    index: 2,
    id: "03",
    label: "ML STRATEGY",
    title: "Dynamic Recovery Policy Optimizer",
    icon: TrendingUp,
    accent: "#cfdaf5",
    description:
      "Selects bounded, customer-specific recovery actions: optimal retry backoff timing, multi-channel payment method update links, or intelligent gateway rerouting to preserve checkout SLA.",
    metrics: [
      { label: "STRATEGY SELECTION", value: "PAYLINK DISPATCH" },
      { label: "OPTIMAL CHANNEL", value: "WHATSAPP + SMS" },
      { label: "EST. RECOVERY PROB", value: "84.6%" },
    ],
  },
  {
    index: 3,
    id: "04",
    label: "GUARDRAIL",
    title: "Deterministic Safety Gate & Human Clearance",
    icon: ShieldAlert,
    accent: "#f37a0a",
    description:
      "Deterministic safety policies inspect transaction ceiling, customer lifetime value, and discount limits. If high risk or >₹10,000, autonomous execution instantly freezes for human authorization.",
    metrics: [
      { label: "AUTONOMOUS CAP", value: "₹10,000" },
      { label: "CIRCUIT BREAKER", value: "SECURE" },
      { label: "AUDIT LEDGER", value: "TAMPER-PROOF" },
    ],
  },
  {
    index: 4,
    id: "05",
    label: "EXECUTION",
    title: "Autonomous Recovery Action Dispatch",
    icon: Zap,
    accent: "#2b59d1",
    description:
      "Authorized actions are dispatched with cryptographic tokens and direct carrier/gateway APIs. Customers receive interactive payment links or seamless card re-routing.",
    metrics: [
      { label: "DISPATCH CONDUIT", value: "HIGH-PRIORITY" },
      { label: "TOKEN VALIDITY", value: "24 HOURS" },
      { label: "DELIVERY SLA", value: "< 2.0s" },
    ],
  },
  {
    index: 5,
    id: "06",
    label: "VERIFICATION",
    title: "Real-Time Settlement & Ledger Audit",
    icon: CheckCircle2,
    accent: "#797776",
    description:
      "Monitors gateway settlement webhooks, verifies bank payment capture with cryptographic signatures, closes the recovery case, and attributes saved revenue.",
    metrics: [
      { label: "CAPTURE STATUS", value: "CONFIRMED" },
      { label: "WEBHOOK AUDIT", value: "MATCHED" },
      { label: "ATTRIBUTION", value: "AUTONOMOUS" },
    ],
  },
  {
    index: 6,
    id: "07",
    label: "RECOVERY",
    title: "Revenue Restored to Enterprise Ledger",
    icon: CheckCircle2,
    accent: "#059669",
    description:
      "Transaction is fully settled. Merchant metrics, recovery queues, and feedback machine learning models update immediately to improve future autonomous diagnosis.",
    metrics: [
      { label: "TOTAL ATTRIBUTED", value: "100%" },
      { label: "RETENTION IMPACT", value: "+3.1x" },
      { label: "LEDGER STATE", value: "FINALIZED" },
    ],
  },
];

export default function ScrollPipelineExperience({
  activeCase = null,
  onApproveRecovery,
  pulseRecovery = false,
}) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [guardrailApproved, setGuardrailApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const containerRef = useRef(null);

  // Check if activeCase requires human approval and has not been approved yet
  const isHighRiskCase = Boolean(
    activeCase?.guardrail?.requires_human_approval ||
      activeCase?.status === "human_approval"
  );
  const isBlockedAtGuardrail =
    isHighRiskCase && !guardrailApproved && activeStageIndex === 3;

  // Normalized progress from 0 to 1 based on active stage
  const progress = activeStageIndex / 6;

  // Autoplay through stages unless blocked at Guardrail
  useEffect(() => {
    if (!isAutoPlaying) return;
    if (isBlockedAtGuardrail) return;

    const interval = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % 7);
    }, 4200);

    return () => clearInterval(interval);
  }, [isAutoPlaying, isBlockedAtGuardrail]);

  // Handle stage selection from scrubber
  const handleSelectStage = (idx) => {
    playClickSound();
    setIsAutoPlaying(false);
    setActiveStageIndex(idx);
  };

  // Handle Guardrail Approval
  const handleApproveGuardrail = async () => {
    setIsApproving(true);
    playClickSound();

    try {
      if (onApproveRecovery && activeCase) {
        await onApproveRecovery(
          activeCase.transaction_id || activeCase.case_id,
          "Approved in 3D Guardrail Clearance"
        );
      }
      playSuccessSound();
      setGuardrailApproved(true);

      // Auto-advance through Execution -> Verification -> Recovery
      setTimeout(() => setActiveStageIndex(4), 600);
      setTimeout(() => setActiveStageIndex(5), 1800);
      setTimeout(() => setActiveStageIndex(6), 3000);
    } catch (err) {
      console.error("Guardrail approval failed:", err);
    } finally {
      setIsApproving(false);
    }
  };

  const currentStage = STAGE_DETAILS[activeStageIndex];

  return (
    <div
      id="recovery-pipeline-section"
      ref={containerRef}
      className="space-y-6 pt-6"
    >
      {/* =====================================================
          1. HEADER & INTERACTIVE PIPELINE SCRUBBER
          ===================================================== */}
      <GlassCard className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4 pb-6 border-b border-[#cecac8]">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#797776]">
              <span className="size-2 rounded-full bg-[#2b59d1] animate-pulse" />
              <span>CLOSED-LOOP RECOVERY ENGINE / 7-STAGE PIPELINE</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-[#242424] mt-1 tracking-tight">
              The Autonomous Recovery Core
            </h2>
            <p className="font-mono text-xs text-[#4e4d4d] max-w-2xl mt-1">
              Watch failed transactions progress deterministically from ingestion
              to verified settlement.
            </p>
          </div>

          {/* Autoplay / Manual Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#cecac8] bg-[#f6f3f1] hover:border-[#242424] font-mono text-xs uppercase tracking-wider text-[#242424] transition-colors cursor-pointer"
            >
              {isAutoPlaying ? (
                <>
                  <Pause size={12} />
                  <span>PAUSE STREAM</span>
                </>
              ) : (
                <>
                  <Play size={12} />
                  <span>PLAY STREAM</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 7-STAGE PROGRESS SCRUBBER PILLS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-6">
          {STAGE_DETAILS.map((stage, idx) => {
            const isActive = activeStageIndex === idx;
            const isPast = activeStageIndex > idx;
            const isGuardrailStage = idx === 3;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleSelectStage(idx)}
                className={`flex flex-col items-start p-3 rounded-2xl border transition-all text-left cursor-pointer group relative overflow-hidden ${
                  isActive
                    ? "border-[#242424] bg-[#f6f3f1] shadow-sm"
                    : isPast
                    ? "border-[#cecac8] bg-[#f6f3f1]/60 hover:border-[#797776]"
                    : "border-[#cecac8]/60 bg-transparent hover:border-[#cecac8]"
                }`}
              >
                {/* Top Number & Pulse Indicator */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`font-mono text-[10px] tracking-wider uppercase ${
                      isActive ? "text-[#242424] font-medium" : "text-[#797776]"
                    }`}
                  >
                    STAGE {stage.id}
                  </span>
                  <span
                    className={`size-1.5 rounded-full ${
                      isActive
                        ? isBlockedAtGuardrail
                          ? "bg-[#f37a0a] animate-ping"
                          : "bg-[#2b59d1] animate-pulse"
                        : isPast
                        ? "bg-[#059669]"
                        : "bg-[#cecac8]"
                    }`}
                  />
                </div>

                {/* Stage Label */}
                <span
                  className={`font-mono text-xs font-medium tracking-wide uppercase mt-1.5 ${
                    isActive ? "text-[#242424]" : "text-[#4e4d4d]"
                  }`}
                >
                  {stage.label}
                </span>

                {/* Active Indicator Bar */}
                {isActive && (
                  <motion.div
                    layoutId="active-stage-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#242424]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* =====================================================
            2. PROCEDURAL 3D RECOVERY CORE SCENE
            ===================================================== */}
        <div className="mt-6 border border-[#cecac8] rounded-[32px] overflow-hidden bg-[#f6f3f1] relative">
          <RecoveryCoreScene
            progress={progress}
            activeStageIndex={activeStageIndex}
            isBlocked={isBlockedAtGuardrail}
            pulseRecovery={pulseRecovery}
            onSelectStage={handleSelectStage}
          />

          {/* =====================================================
              3. HACKATHON WOW MOMENT: GUARDRAIL APPROVAL INTERCEPT
              ===================================================== */}
          <AnimatePresence>
            {isBlockedAtGuardrail && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-x-4 bottom-4 md:inset-x-8 md:bottom-6 z-20"
              >
                <div className="rounded-3xl bg-[#f6f3f1]/95 backdrop-blur-xl border border-[#f37a0a] p-5 md:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-2xl bg-[#ff9473]/20 border border-[#ff9473] flex items-center justify-center text-[#f37a0a] shrink-0 mt-0.5">
                      <Lock size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#f37a0a]">
                        <span className="size-2 rounded-full bg-[#f37a0a] animate-ping" />
                        <span>DETERMINISTIC SAFETY GUARDRAIL TRIGGERED</span>
                      </div>
                      <h4 className="font-serif text-xl md:text-2xl font-normal text-[#242424] mt-0.5">
                        Human Authorization Required
                      </h4>
                      <p className="font-mono text-xs text-[#4e4d4d] mt-1 max-w-xl">
                        {activeCase?.guardrail?.reason ||
                          "High-Value Settlement: Amount exceeds autonomous ceiling (₹10,000). Autonomous execution halted."}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      disabled={isApproving}
                      onClick={handleApproveGuardrail}
                      className="px-6 py-3 rounded-[100px] bg-[#242424] hover:bg-[#3a3939] text-[#f6f3f1] font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isApproving ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>AUTHORIZING...</span>
                        </>
                      ) : (
                        <>
                          <Unlock size={14} />
                          <span>APPROVE RECOVERY →</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* =====================================================
            4. CURRENT STAGE NARRATIVE & TELEMETRY CARD
            ===================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 pt-6 border-t border-[#cecac8]">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#797776]">
              <span>STAGE 0{activeStageIndex + 1} RATIONALE</span>
              <span>/</span>
              <span className="text-[#2b59d1] font-medium">
                {currentStage.label}
              </span>
            </div>
            <h3 className="font-serif text-2xl font-normal text-[#242424]">
              {currentStage.title}
            </h3>
            <p className="font-mono text-xs sm:text-[13px] text-[#4e4d4d] leading-relaxed">
              {currentStage.description}
            </p>
          </div>

          {/* Real Telemetry Badges */}
          <div className="lg:col-span-4 flex flex-col justify-center gap-2.5">
            {currentStage.metrics.map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#cecac8] bg-[#f6f3f1] font-mono text-xs"
              >
                <span className="text-[10px] tracking-wider text-[#797776] uppercase">
                  {m.label}
                </span>
                <span className="text-[#242424] font-medium">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
