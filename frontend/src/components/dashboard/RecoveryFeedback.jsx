import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import { submitRecoveryFeedback } from "../../services/api";

export default function RecoveryFeedback({
  transactionId,
  action,
}) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitFeedback = async (feedback) => {
    if (loading || submitted) return;
    setLoading(true);

    try {
      await submitRecoveryFeedback(transactionId, {
        action,
        feedback,
      });

      setSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-6 md:p-10 relative">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-[#cecac8]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[#797776]">
            REINFORCEMENT LOOP / OPERATOR SUPERVISION
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#242424] mt-1">
            RECOVERY LEARNING
          </h2>
          <p className="font-mono text-xs text-[#797776] mt-1">
            Human feedback improves future recovery strategies.
          </p>
        </div>

        {(transactionId || action) && (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            {transactionId && (
              <span className="px-3 py-1 rounded-full border border-[#cecac8] bg-[#f6f3f1] text-[#242424]">
                {transactionId}
              </span>
            )}
            {action && (
              <span className="px-3 py-1 rounded-full border border-[#cecac8] bg-[#f6f3f1] text-[#4e4d4d] uppercase">
                {String(action).replaceAll("_", " ")}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <span className="font-mono text-xs text-[#4e4d4d]">
          Evaluate the AI-chosen recovery tactic to calibrate subsequent retraining cycles.
        </span>

        {!submitted ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => submitFeedback("positive")}
              disabled={loading}
              className="px-5 py-2 rounded-full border border-[#cecac8] bg-[#f6f3f1] hover:border-[#242424] text-[#242424] font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <ThumbsUp size={13} />
              <span>GOOD STRATEGY</span>
            </button>

            <button
              type="button"
              onClick={() => submitFeedback("negative")}
              disabled={loading}
              className="px-5 py-2 rounded-full border border-[#cecac8] bg-[#f6f3f1] hover:border-[#242424] text-[#4e4d4d] font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <ThumbsDown size={13} />
              <span>POOR STRATEGY</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 font-mono text-xs text-[#059669] px-4 py-2 rounded-full border border-[#cecac8] bg-white">
            <Check size={14} />
            <span>FEEDBACK RECORDED ✓</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
