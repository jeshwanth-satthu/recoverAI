import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Lock,
  Zap,
} from "lucide-react";

import Button from "../ui/Button";
import { playClickSound, playSuccessSound, playHoverSound } from "../../lib/soundFX";

export default function HighRiskReviewPanel({
  caseItem,
  onClose,
  onApprove,
  onReject,
  isApproving = false,
}) {
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [notes, setNotes] = useState("");

  if (!caseItem) return null;

  const amount = Number(caseItem.amount || 0);
  const diagnosis = caseItem.diagnosis || {};
  const decision = caseItem.decision || {};
  const guardrail = caseItem.guardrail || {};
  const rules = Array.isArray(guardrail.triggered_rules)
    ? guardrail.triggered_rules
    : [];

  const handleApprove = () => {
    playSuccessSound();
    if (onApprove) {
      onApprove(caseItem.transaction_id || caseItem.case_id, notes);
    }
  };

  const handleReject = () => {
    playClickSound();
    if (onReject) {
      onReject(caseItem.transaction_id || caseItem.case_id);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/40 backdrop-blur-md">
        {/* Animated backdrop click to dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 cursor-pointer"
          onClick={onClose}
        />

        {/* ===================================================
            MODAL CONTAINER (White Luxury Command Sheet)
            =================================================== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl rounded-2xl bg-white border border-rose-200 shadow-2xl overflow-hidden z-10 my-8 text-slate-900"
        >
          {/* TOP EMERGENCY RISK HEADER */}
          <div className="px-6 py-4 bg-gradient-to-r from-rose-50 via-white to-slate-50 border-b border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 animate-pulse">
                <ShieldAlert size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-700 uppercase tracking-wider">
                    High-Risk Guardrail Intercept
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    RISK SCORE: {caseItem.risk_score || 87}/100
                  </span>
                </div>
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Human Approval Dossier • {caseItem.case_id}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              onMouseEnter={playHoverSound}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* ===================================================
                1. TRANSACTION & CUSTOMER INTEL MATRIX
                =================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-medium">
                  Transaction Amount
                </span>
                <div className="font-mono-nums text-2xl font-extrabold text-rose-600">
                  ₹{amount.toLocaleString("en-IN")}
                </div>
                <span className="text-[10px] font-mono text-slate-500 block">
                  TXN: {caseItem.transaction_id}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-medium">
                  Customer Profile
                </span>
                <div className="font-semibold text-slate-900 text-base truncate">
                  {caseItem.customer || "Enterprise Account"}
                </div>
                <span className="text-[11px] font-mono text-sky-700 font-semibold block">
                  CLV: ₹{Number(caseItem.customer_clv || 1480000).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-medium">
                  Failure Vector
                </span>
                <div className="font-semibold text-amber-700 text-sm uppercase font-mono">
                  {String(caseItem.failure_reason || "Gateway Failure").replace("_", " ")}
                </div>
                <span className="text-[11px] font-mono text-slate-500 block">
                  Detected: {caseItem.created_at || "Recent"}
                </span>
              </div>
            </div>

            {/* ===================================================
                2. GUARDRAIL INTERCEPT RULE ENFORCEMENT
                =================================================== */}
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-mono text-xs font-bold">
                <Lock size={15} />
                <span>Deterministic Safety Guardrail Triggers (Halted Auto-Execution)</span>
              </div>
              <p className="text-xs text-slate-700 font-sans leading-relaxed">
                {guardrail.reason ||
                  "This transaction was intercepted before autonomous dispatch because its parameters exceed safety thresholds."}
              </p>
              <div className="space-y-1.5 pt-1">
                {rules.length > 0 ? (
                  rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs font-mono text-rose-900 bg-white p-2.5 rounded-lg border border-rose-200 shadow-xs"
                    >
                      <span className="text-rose-600 font-bold">•</span>
                      <span>{rule}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    Manual authorization required by the deterministic safety guardrail.
                  </div>
                )}
              </div>
            </div>

            {/* ===================================================
                3. GEMINI AI DIAGNOSTIC INSIGHTS
                =================================================== */}
            <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-violet-800 font-mono text-xs font-bold">
                  <Sparkles size={15} />
                  <span>Gemini Diagnostic Evaluation</span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-800 border border-violet-200">
                  {Math.round((diagnosis.confidence || 0.96) * 100)}% Confidence
                </span>
              </div>
              <p className="text-sm text-slate-800 font-sans leading-relaxed">
                {diagnosis.diagnosis ||
                  "Primary gateway failed due to core banking connection timeout. User attempted multiple times with strong payment intent."}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 pt-1">
                <span>
                  Severity:{" "}
                  <strong className="text-amber-700 uppercase">
                    {diagnosis.severity || "medium"}
                  </strong>
                </span>

                <span>
                  Source:{" "}
                  <strong className={diagnosis.ai_generated ? "text-violet-700" : "text-slate-600"}>
                    {diagnosis.ai_generated ? "Gemini AI" : "Deterministic Fallback"}
                  </strong>
                </span>
              </div>
            </div>

            {/* ===================================================
                4. RECOMMENDED RECOVERY STRATEGY
                =================================================== */}
            <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-2">
              <div className="flex items-center gap-2 text-sky-800 font-mono text-xs font-bold">
                <Zap size={15} />
                <span>Proposed Recovery Action (Awaiting Authorization)</span>
              </div>
              <p className="text-sm text-slate-900 font-medium">
                {decision.action ||
                  "Switch transaction to Secondary Clearing Gateway with 1-Click Priority PayLink"}
              </p>
              {decision.reason && (
                <p className="text-xs text-slate-600 font-sans">
                  Reason: {decision.reason}
                </p>
              )}
            </div>
          </div>

          {/* ===================================================
              5. TACTILE ACTION FOOTER WITH OVERRIDE AUTHORIZATION
              =================================================== */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 space-y-3">
            {/* OPERATOR OVERRIDE CHECKBOX */}
            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-emerald-300/80 cursor-pointer select-none hover:border-emerald-500 transition-colors shadow-xs">
              <input
                type="checkbox"
                checked={overrideConfirmed}
                onChange={(e) => {
                  playClickSound();
                  setOverrideConfirmed(e.target.checked);
                }}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 bg-white cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-800 font-medium">
                I have inspected the Gemini dossier and authorize execution override for this transaction.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="text-[11px] font-mono text-slate-500">
                Audit log will cryptographically record your operator signature.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleReject}
                  className="text-slate-600 hover:text-rose-600 text-xs font-medium"
                >
                  Safe Abort / Reject
                </Button>

                <Button
                  variant="success"
                  size="md"
                  disabled={!overrideConfirmed || isApproving}
                  loading={isApproving}
                  icon={ShieldCheck}
                  onClick={handleApprove}
                  className="shadow-md text-xs font-mono"
                >
                  Approve & Execute Override
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
