import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Brain,
  TrendingUp,
  Lock,
  X,
} from "lucide-react";
import Button from "../ui/Button";
import { playClickSound, playSuccessSound } from "../../lib/soundFX";

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
  const decision = caseItem.decision || caseItem.recommended_strategy || {};
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#242424]/40 backdrop-blur-sm">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 cursor-pointer"
          onClick={onClose}
        />

        {/* MODAL SHEET */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-3xl rounded-[32px] md:rounded-[40px] bg-[#f6f3f1] border border-[#cecac8] shadow-2xl overflow-hidden z-10 my-8 text-[#242424]"
        >
          {/* TOP BAR */}
          <div className="p-6 md:p-8 pb-4 border-b border-[#cecac8] flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 font-mono text-xs uppercase tracking-wider text-[#797776]">
                <span className="px-2.5 py-0.5 rounded-full border border-[#f37a0a] text-[#f37a0a] bg-[#f6f3f1]">
                  HIGH-RISK CASES
                </span>
                <span>•</span>
                <span>REQUIRES HUMAN APPROVAL</span>
              </div>

              <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#242424]">
                AI recommends. Humans authorize.
              </h2>
              <p className="font-mono text-xs text-[#797776] mt-1">
                Dossier {caseItem.case_id || caseItem.transaction_id}
              </p>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="size-8 rounded-full border border-[#cecac8] bg-[#f6f3f1] hover:border-[#242424] flex items-center justify-center text-[#242424] transition-all cursor-pointer shrink-0"
              title="Close modal"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* ESCALATION SUMMARY */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-4 rounded-[20px] border border-[#cecac8] bg-[#f6f3f1]">
                <span className="text-[10px] text-[#797776] uppercase block">
                  AMOUNT AT RISK
                </span>
                <div className="font-serif text-2xl text-[#242424] mt-1">
                  ₹{amount.toLocaleString("en-IN")}
                </div>
                <span className="text-[10px] text-[#797776] mt-0.5 block">
                  Ceiling: ₹10,000
                </span>
              </div>

              <div className="p-4 rounded-[20px] border border-[#cecac8] bg-[#f6f3f1]">
                <span className="text-[10px] text-[#797776] uppercase block">
                  CUSTOMER
                </span>
                <div className="font-serif text-xl text-[#242424] mt-1 truncate">
                  {caseItem.customer || "Enterprise Account"}
                </div>
                <span className="text-[10px] text-[#797776] mt-0.5 block">
                  {caseItem.customer_tier || "Standard Tier"}
                </span>
              </div>

              <div className="p-4 rounded-[20px] border border-[#cecac8] bg-[#f6f3f1]">
                <span className="text-[10px] text-[#797776] uppercase block">
                  FAILURE VECTOR
                </span>
                <div className="font-serif text-lg text-[#242424] mt-1 capitalize truncate">
                  {String(caseItem.failure_reason || "Gateway Timeout").replaceAll("_", " ")}
                </div>
                <span className="text-[10px] text-[#797776] mt-0.5 block">
                  {caseItem.created_at || "Recent event"}
                </span>
              </div>
            </div>

            {/* WHY ESCALATED: GUARDRAIL POLICY VIOLATIONS */}
            <div className="p-5 rounded-[24px] border border-[#cecac8] bg-[#f6f3f1] space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#242424]">
                <Lock size={14} />
                <span>Deterministic Guardrail Boundaries Triggered</span>
              </div>
              <p className="font-mono text-xs text-[#4e4d4d] leading-relaxed">
                {guardrail.reason ||
                  "Amount exceeds automatic execution ceiling (₹10,000). System halted autonomous dispatch."}
              </p>
              <div className="space-y-1.5 pt-1">
                {rules.length > 0 ? (
                  rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="font-mono text-xs text-[#242424] px-3 py-2 rounded-full border border-[#cecac8] bg-white flex items-center gap-2"
                    >
                      <span className="size-1.5 rounded-full bg-[#f37a0a]" />
                      <span>{rule}</span>
                    </div>
                  ))
                ) : (
                  <div className="font-mono text-xs text-[#242424] px-3 py-2 rounded-full border border-[#cecac8] bg-white flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-[#f37a0a]" />
                    <span>Transaction amount ₹{amount.toLocaleString("en-IN")} &gt; ₹10,000 auto-recovery threshold</span>
                  </div>
                )}
              </div>
            </div>

            {/* GEMINI DIAGNOSIS & ML STRATEGY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-[24px] border border-[#cecac8] bg-[#f6f3f1] space-y-2">
                <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-[#797776]">
                  <span className="flex items-center gap-1.5 text-[#242424]">
                    <Brain size={13} />
                    DIAGNOSIS
                  </span>
                  <span>{Math.round((diagnosis.confidence || 0.96) * 100)}% CONFIDENCE</span>
                </div>
                <p className="font-mono text-xs text-[#4e4d4d] leading-relaxed mt-1">
                  {diagnosis.diagnosis ||
                    "Gateway connection terminated abruptly. User intent remains active."}
                </p>
              </div>

              <div className="p-5 rounded-[24px] border border-[#cecac8] bg-[#f6f3f1] space-y-2">
                <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-[#797776]">
                  <span className="flex items-center gap-1.5 text-[#242424]">
                    <TrendingUp size={13} />
                    PROPOSED STRATEGY
                  </span>
                  <span>EST. PROBABILITY: {Math.round((caseItem.recovery_probability || 0.74) * 100)}%</span>
                </div>
                <p className="font-mono text-xs text-[#242424] font-medium mt-1 uppercase">
                  {String(decision.action || "SWITCH GATEWAY ROUTE").replaceAll("_", " ")}
                </p>
                <p className="font-mono text-[11px] text-[#797776]">
                  {decision.reason || "Secondary routing clears pending settlement directly."}
                </p>
              </div>
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="p-6 md:p-8 pt-4 border-t border-[#cecac8] bg-[#f6f3f1] space-y-4">
            <label className="flex items-center gap-3 p-3 rounded-full border border-[#cecac8] bg-white cursor-pointer select-none hover:border-[#242424] transition-colors">
              <input
                type="checkbox"
                checked={overrideConfirmed}
                onChange={(e) => {
                  playClickSound();
                  setOverrideConfirmed(e.target.checked);
                }}
                className="size-4 rounded border-[#cecac8] text-[#242424] focus:ring-0 cursor-pointer accent-[#242424]"
              />
              <span className="font-mono text-xs text-[#242424]">
                I have inspected the Gemini dossier and authorize execution override for this transaction.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-[#797776]">
                Immutable cryptographic ledger will record operator approval.
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-6 py-2.5 rounded-full border border-[#242424] bg-transparent text-[#242424] font-mono text-xs uppercase tracking-wider hover:bg-[#242424] hover:text-[#f6f3f1] transition-colors cursor-pointer"
                >
                  REJECT
                </button>

                <button
                  type="button"
                  disabled={!overrideConfirmed || isApproving}
                  onClick={handleApprove}
                  className={`px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    overrideConfirmed && !isApproving
                      ? "bg-[#2b59d1] text-white hover:opacity-90"
                      : "bg-[#cecac8] text-[#797776] cursor-not-allowed"
                  }`}
                >
                  {isApproving ? "AUTHORIZING..." : "APPROVE RECOVERY →"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
