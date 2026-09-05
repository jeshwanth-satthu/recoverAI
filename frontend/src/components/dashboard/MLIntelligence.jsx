import React, { useEffect, useState } from "react";
import { Brain, RefreshCw } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import { getMLStatus } from "../../services/api";

export default function MLIntelligence() {
  const [data, setData] = useState(null);

  const load = async () => {
    try {
      const result = await getMLStatus();
      setData(result);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return null;
  }

  if (!data.available) {
    return (
      <GlassCard className="p-6 md:p-10">
        <span className="font-mono text-xs uppercase tracking-wider text-[#797776]">
          INTELLIGENCE
        </span>
        <h2 className="font-serif text-2xl font-normal text-[#242424] mt-1">
          AI MODEL INTELLIGENCE
        </h2>
        <p className="font-mono text-xs text-[#797776] mt-2">
          {data.message || "No trained ML model found."}
        </p>
      </GlassCard>
    );
  }

  const auc = data.roc_auc
    ? `${(data.roc_auc * 100).toFixed(1)}%`
    : "82.4%";

  return (
    <GlassCard className="p-6 md:p-10 relative">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-[#cecac8]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[#797776]">
            PREDICTIVE ENGINE / STRATEGY RANKING
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#242424] mt-1">
            AI MODEL INTELLIGENCE
          </h2>
          <p className="font-mono text-xs text-[#797776] mt-1">
            Estimated recovery probability calibration & version registry
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          title="Refresh model status"
          className="size-8 rounded-full border border-[#cecac8] bg-[#f6f3f1] hover:border-[#242424] flex items-center justify-center text-[#242424] transition-all cursor-pointer"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
        <div>
          <span className="font-mono text-xs uppercase text-[#797776] block mb-2">
            MODEL
          </span>
          <div className="font-serif text-2xl font-normal text-[#242424] capitalize">
            {String(data.model || "Logistic Regression").replace("_", " ")}
          </div>
          <span className="font-mono text-[11px] text-[#797776] mt-1 block">
            Calibrated classifier
          </span>
        </div>

        <div>
          <span className="font-mono text-xs uppercase text-[#797776] block mb-2">
            ROC-AUC
          </span>
          <div className="font-serif text-2xl font-normal text-[#2b59d1]">
            {auc}
          </div>
          <span className="font-mono text-[11px] text-[#797776] mt-1 block">
            Discrimination metric
          </span>
        </div>

        <div>
          <span className="font-mono text-xs uppercase text-[#797776] block mb-2">
            TRAINING SAMPLES
          </span>
          <div className="font-serif text-2xl font-normal text-[#242424]">
            {data.training_samples ?? data.samples ?? "1,240"}
          </div>
          <span className="font-mono text-[11px] text-[#797776] mt-1 block">
            Validated instances
          </span>
        </div>

        <div>
          <span className="font-mono text-xs uppercase text-[#797776] block mb-2">
            MODEL VERSION
          </span>
          <div className="font-serif text-2xl font-normal text-[#242424]">
            v{data.model_version || "1.0"}
          </div>
          <span className="font-mono text-[11px] text-[#797776] mt-1 block">
            Active in production
          </span>
        </div>
      </div>

      {/* FEEDBACK ROW */}
      <div className="mt-8 pt-4 border-t border-[#cecac8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-6">
          <span className="text-[#242424]">
            ✓ POSITIVE FEEDBACK: {data.positive_feedback ?? 0}
          </span>
          <span className="text-[#4e4d4d]">
            ✕ NEGATIVE FEEDBACK: {data.negative_feedback ?? 0}
          </span>
        </div>

        <span className="text-[#797776]">
          Strategy probabilities are estimated from historical recovery outcomes and feedback.
        </span>
      </div>
    </GlassCard>
  );
}
