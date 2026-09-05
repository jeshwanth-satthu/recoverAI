import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  Brain,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  Mail,
  Send,
  ExternalLink,
} from "lucide-react";
import { playClickSound } from "../../lib/soundFX";

export default function CaseJourneyModal({
  caseItem,
  onClose,
  onTriggerRecovery,
  onRazorpayPayment,
  razorpayLoadingId = null,
}) {
  if (!caseItem) return null;

  const amount = Number(caseItem.amount || 0);
  const isRecovered =
    caseItem.status === "recovered" ||
    caseItem.verification?.recovered ||
    caseItem.verification?.verified;
  const requiresApproval =
    caseItem.guardrail?.requires_human_approval ||
    caseItem.status === "human_approval";

  const txnId = caseItem.transaction_id || caseItem.case_id;
  const recoveryMsg = caseItem.execution?.recovery_message;

  const stages = [
    {
      id: "01",
      name: "TRANSACTION",
      status: "COMPLETED",
      summary: `Failed Payment: ₹${amount.toLocaleString("en-IN")}`,
      detail: `Customer: ${caseItem.customer || "Enterprise Merchant"} • Gateway: Razorpay • Risk: ${caseItem.risk_level || "MEDIUM"}`,
      icon: CreditCard,
      color: "#ff9473",
    },
    {
      id: "02",
      name: "DIAGNOSIS",
      status: "COMPLETED",
      summary: caseItem.failure_reason
        ? `Root Cause: ${caseItem.failure_reason.replace(/_/g, " ").toUpperCase()}`
        : "Root Cause Analyzed",
      detail:
        caseItem.diagnosis?.diagnosis ||
        "Gemini AI telemetry analysis evaluated gateway payload and customer retention history.",
      icon: Brain,
      color: "#a0b5eb",
    },
    {
      id: "03",
      name: "ML STRATEGY",
      status: "COMPLETED",
      summary: caseItem.decision?.action
        ? `Selected Action: ${caseItem.decision.action.replace(/_/g, " ").toUpperCase()}`
        : "Dynamic Recovery Policy Optimized",
      detail:
        caseItem.decision?.reason ||
        caseItem.decision?.rationale ||
        "Optimal recovery strategy selected based on customer segment and probability weighting.",
      icon: TrendingUp,
      color: "#cfdaf5",
    },
    {
      id: "04",
      name: "GUARDRAIL",
      status: requiresApproval ? "INTERCEPTED" : "PASSED",
      summary: requiresApproval
        ? "Human Authorization Required"
        : "Deterministic Safety Cleared",
      detail:
        caseItem.guardrail?.reason ||
        "Deterministic amount caps (₹10,000 threshold) and safety policies evaluated successfully.",
      icon: requiresApproval ? ShieldAlert : ShieldCheck,
      color: requiresApproval ? "#f37a0a" : "#059669",
    },
    {
      id: "05",
      name: "EXECUTION",
      status: isRecovered ? "COMPLETED" : requiresApproval ? "PENDING" : "DISPATCHED",
      summary: caseItem.execution?.message || "Autonomous Action Dispatched",
      detail:
        caseItem.execution?.status === "success" || caseItem.execution?.status === "pending"
          ? "Execution successful. AI tailored customer message generated."
          : "Action queued for gateway execution.",
      icon: Zap,
      color: "#2b59d1",
      customContent: recoveryMsg ? (
        <div className="mt-3 p-3.5 rounded-[18px] border border-[#cecac8] bg-white text-[#242424] space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[#797776]">
            <span className="flex items-center gap-1 text-[#2b59d1] font-medium">
              <Mail size={12} />
              AI CUSTOMER RECOVERY NOTIFICATION
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#f6f3f1] border border-[#cecac8] text-[#242424]">
              {recoveryMsg.channel?.toUpperCase() || "EMAIL"} • {recoveryMsg.tone || "EMPATHETIC"}
            </span>
          </div>

          <div className="font-serif text-sm font-medium text-[#242424]">
            {recoveryMsg.subject || recoveryMsg.headline}
          </div>

          <p className="font-mono text-[11px] text-[#4e4d4d] leading-relaxed line-clamp-3 bg-[#f6f3f1] p-2.5 rounded-[12px] border border-[#cecac8]/60">
            "{recoveryMsg.body}"
          </p>

          <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-[#797776]">
            <span>Call to action: <strong>{recoveryMsg.call_to_action || "Complete Payment"}</strong></span>
            <span className="text-[#059669]">Status: {recoveryMsg.dispatch_status || "Ready to Send"}</span>
          </div>
        </div>
      ) : null,
    },
    {
      id: "06",
      name: "VERIFICATION",
      status: isRecovered ? "COMPLETED" : "AWAITING",
      summary: isRecovered
        ? `Settlement Verified via ${caseItem.verification?.verification_method || caseItem.recovery_verification?.method || "Razorpay"}`
        : "Awaiting Razorpay Payment Settlement",
      detail: isRecovered
        ? `Payment ID: ${caseItem.razorpay_payment_id || caseItem.verification?.payment_id || "Live Confirmed"} • Cryptographic signature verified.`
        : "The source of truth is Razorpay. Payment remains pending until cryptographically verified.",
      icon: CheckCircle2,
      color: "#797776",
    },
    {
      id: "07",
      name: "RECOVERY",
      status: isRecovered ? "RECOVERED" : "PENDING SETTLEMENT",
      summary: isRecovered
        ? `✓ ₹${amount.toLocaleString("en-IN")} Restored to Ledger`
        : "Awaiting Settlement Confirmation",
      detail: isRecovered
        ? "Revenue successfully recovered and updated in MongoDB database."
        : "Autonomous recovery action active. Complete test payment below to settle.",
      icon: CheckCircle2,
      color: isRecovered ? "#059669" : "#cecac8",
    },
  ];

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

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-3xl rounded-[36px] bg-[#f6f3f1] border border-[#cecac8] shadow-2xl overflow-hidden z-10 my-8 text-[#242424]"
        >
          {/* Top Bar */}
          <div className="p-6 md:p-8 pb-4 border-b border-[#cecac8] flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#797776]">
                <span
                  className={`size-2 rounded-full ${
                    isRecovered ? "bg-[#059669]" : "bg-[#f37a0a]"
                  } animate-pulse`}
                />
                <span>AUTONOMOUS RECOVERY JOURNEY</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#242424] mt-1">
                {txnId}
              </h3>
              <p className="font-mono text-xs text-[#797776] mt-0.5">
                Amount:{" "}
                <strong className="text-[#242424] font-normal">
                  ₹{amount.toLocaleString("en-IN")}
                </strong>{" "}
                • Customer: {caseItem.customer || "Enterprise Client"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full border border-[#cecac8] text-[#797776] hover:text-[#242424] hover:border-[#242424] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* 7-Stage Interactive Path */}
          <div className="p-6 md:p-8 space-y-4 max-h-[60vh] overflow-y-auto">
            {stages.map((st, idx) => {
              const Icon = st.icon;
              const isLast = idx === stages.length - 1;

              return (
                <div key={st.id} className="relative flex items-start gap-4">
                  {/* Left Connector Line */}
                  <div className="flex flex-col items-center">
                    <div
                      className="size-9 rounded-full border border-[#cecac8] bg-[#f6f3f1] flex items-center justify-center text-[#242424] shrink-0"
                      style={{
                        borderColor:
                          st.status === "COMPLETED" || st.status === "RECOVERED"
                            ? "#059669"
                            : "#cecac8",
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    {!isLast && (
                      <div className="w-[1px] h-10 bg-[#cecac8] my-1" />
                    )}
                  </div>

                  {/* Stage Details */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#797776]">
                        STAGE {st.id} / {st.name}
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          st.status === "RECOVERED" || st.status === "COMPLETED"
                            ? "border-[#a7fccd] bg-[#a7fccd]/20 text-[#059669]"
                            : st.status === "INTERCEPTED"
                            ? "border-[#ff9473] bg-[#ff9473]/20 text-[#f37a0a]"
                            : "border-[#cecac8] bg-[#f6f3f1] text-[#797776]"
                        }`}
                      >
                        {st.status}
                      </span>
                    </div>

                    <h5 className="font-serif text-lg font-normal text-[#242424] mt-0.5">
                      {st.summary}
                    </h5>
                    <p className="font-mono text-xs text-[#4e4d4d] mt-1 leading-relaxed">
                      {st.detail}
                    </p>

                    {st.customContent}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="p-6 border-t border-[#cecac8] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f6f3f1]">
            <div className="font-mono text-xs text-[#797776]">
              Audit Ledger State:{" "}
              <span className="text-[#242424] font-medium uppercase">
                {caseItem.status || "ACTIVE"}
              </span>
              {isRecovered && (
                <span className="ml-2 text-[#059669]">✓ Razorpay Verified</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {!isRecovered && onRazorpayPayment && (
                <button
                  type="button"
                  disabled={razorpayLoadingId === txnId}
                  onClick={() => {
                    playClickSound();
                    onRazorpayPayment(txnId);
                  }}
                  className="px-5 py-2.5 rounded-[100px] border border-[#2b59d1] bg-[#2b59d1] text-white hover:opacity-90 font-mono text-xs uppercase tracking-wider cursor-pointer transition-opacity flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CreditCard size={13} />
                  <span>
                    {razorpayLoadingId === txnId
                      ? "OPENING CHECKOUT..."
                      : "TEST RAZORPAY PAYMENT →"}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-[100px] border border-[#242424] bg-[#242424] text-[#f6f3f1] hover:bg-[#3a3939] font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors"
              >
                CLOSE JOURNEY
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
