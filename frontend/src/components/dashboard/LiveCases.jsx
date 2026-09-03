import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  CheckCircle2,
  Zap,
  Search,
  Sparkles,
} from "lucide-react";

import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { playClickSound } from "../../lib/soundFX";

export default function LiveCases({
  cases = [],
  onSelectCase,
  onTriggerRecovery,
  recoveringId = null,
  maxItems,
  onViewAll,
  searchQuery = "",
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const uniqueCases = useMemo(() => {
    const grouped = new Map();

    for (const item of cases) {
      const key = item?.transaction_id || item?.case_id;

      if (!key) continue;

      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, item);
        continue;
      }

      const existingRecovered =
        existing?.status === "recovered" ||
        existing?.verification?.recovered === true;

      const currentRecovered =
        item?.status === "recovered" ||
        item?.verification?.recovered === true;

      // Recovered is always the authoritative display state.
      if (currentRecovered && !existingRecovered) {
        grouped.set(key, item);
        continue;
      }

      if (existingRecovered && !currentRecovered) {
        continue;
      }

      // Otherwise prefer the newest case.
      const existingTime = new Date(
        existing?.created_at || 0
      ).getTime();

      const currentTime = new Date(
        item?.created_at || 0
      ).getTime();

      if (currentTime > existingTime) {
        grouped.set(key, item);
      }
    }

    return Array.from(grouped.values());
  }, [cases]);

  const filteredCases = useMemo(() => {
    return uniqueCases.filter((item) => {
      const isRecovered =
        item?.status === "recovered" ||
        item?.verification?.recovered === true;

      const isHuman =
        !isRecovered &&
        (
          item?.status === "human_approval" ||
          item?.guardrail?.requires_human_approval === true
        );

      if (filter === "human_approval" && !isHuman) return false;
      if (filter === "recovered" && !isRecovered) return false;
      if (filter === "autonomous" && (isHuman || !isRecovered)) return false;

      const query = searchQuery || search;

      if (query.trim()) {
        const q = query.toLowerCase();
        const searchable = [
          item?.case_id,
          item?.transaction_id,
          item?.customer,
          item?.failure_reason,
          item?.diagnosis?.diagnosis,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchable.includes(q);
      }

      return true;
    });
  }, [uniqueCases, filter, search, searchQuery]);

  const visibleCases = maxItems
    ? filteredCases.slice(0, maxItems)
    : filteredCases;

  const pendingApprovalCount = useMemo(() => {
    return uniqueCases.filter((c) => {
      const recovered =
        c?.status === "recovered" ||
        c?.verification?.recovered === true;

      return (
        !recovered &&
        (
          c?.status === "human_approval" ||
          c?.guardrail?.requires_human_approval === true
        )
      );
    }).length;
  }, [uniqueCases]);

  return (
    <div className="space-y-5">
      {/* ===================================================
          1. HEADER & FILTER CONTROLS
          =================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-xl font-bold text-slate-900 tracking-wide">
              {maxItems ? "Priority Recovery Queue" : "Live Recovery Stream"}
            </h3>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              {maxItems && filteredCases.length > maxItems
                ? `${visibleCases.length} of ${filteredCases.length}`
                : `${filteredCases.length}`} Transactions
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            {maxItems
              ? "Most recent unique transactions needing attention"
              : "Autonomous ingestion pipeline with deterministic safety guardrail intercepts"}
          </p>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-semibold text-violet-700 hover:bg-violet-50 hover:border-violet-200 transition-colors"
            >
              View full queue
            </button>
          )}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by customer or ID..."
              className="w-48 sm:w-56 pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
            />
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono">
            <button
              onClick={() => {
                playClickSound();
                setFilter("all");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-white text-violet-700 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Cases
            </button>

            <button
              onClick={() => {
                playClickSound();
                setFilter("human_approval");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === "human_approval"
                  ? "bg-rose-600 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>High Risk</span>
              {pendingApprovalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-800 text-[10px] font-bold">
                  {pendingApprovalCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                playClickSound();
                setFilter("recovered");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === "recovered"
                  ? "bg-emerald-600 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Recovered
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================
          2. CASE STREAM LIST
          =================================================== */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visibleCases.map((item) => {
            const isRecovered =
              item?.status === "recovered" ||
              item?.verification?.recovered === true;

            const isHuman =
              !isRecovered &&
              (
                item?.status === "human_approval" ||
                item?.guardrail?.requires_human_approval === true
              );
            const amount = Number(item?.amount || 0);

            return (
              <motion.div
                key={item.case_id || item.transaction_id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard
                  variant={isHuman ? "risk" : isRecovered ? "recovered" : "default"}
                  className="p-4 bg-white/95 border-slate-200/80 hover:border-slate-300 transition-all shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* LEFT SECTION: CUSTOMER & CASE INTEL */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {item.case_id || "CASE-LIVE"}
                        </span>
                        <span className="font-mono text-xs text-slate-500">
                          {item.transaction_id}
                        </span>

                        {isHuman ? (
                          <Badge
                            label="Requires Human Review"
                            variant="risk"
                            pulsing={true}
                            size="sm"
                          />
                        ) : isRecovered ? (
                          <Badge
                            label="Auto-Recovered"
                            variant="recovered"
                            size="sm"
                          />
                        ) : (
                          <Badge
                            label="In Pipeline"
                            variant="ai"
                            pulsing={true}
                            size="sm"
                          />
                        )}

                        <span className="text-[11px] font-mono text-slate-400">
                          {item.created_at || "Just now"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-[10px] font-mono font-bold text-violet-700">
                            {(item.customer || "U")[0]}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 text-sm block">
                              {item.customer || "Customer"}
                            </span>
                          </div>
                        </div>

                        {item.customer_tier && (
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {item.customer_tier}
                          </span>
                        )}

                        <div className="text-xs font-mono text-slate-500">
                          Failure Vector:{" "}
                          <span className="text-amber-700 uppercase font-bold">
                            {String(item.failure_reason || "unknown").replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      {/* GEMINI DIAGNOSIS SNIPPET */}
                      {item.diagnosis && (
                        <div className="flex items-start gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-700 font-sans">
                          <Sparkles size={14} className="text-violet-600 shrink-0 mt-0.5" />
                          <p className="line-clamp-1">
                            <strong className="text-violet-700 font-mono text-[11px] mr-1.5">
                              Gemini Diagnosis:
                            </strong>
                            {item.diagnosis.diagnosis}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* RIGHT SECTION: VALUE & ACTION TRIGGER */}
                    <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="text-left lg:text-right font-mono-nums">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono font-medium">
                          {isRecovered ? "Salvaged Amount" : "Revenue At Risk"}
                        </span>
                        <span
                          className={`text-xl sm:text-2xl font-extrabold ${
                            isRecovered ? "text-emerald-700" : isHuman ? "text-rose-600" : "text-slate-900"
                          }`}
                        >
                          ₹{amount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* ACTION BUTTON */}
                      {isHuman ? (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={ShieldAlert}
                          onClick={() => onSelectCase(item)}
                        >
                          Review Case
                        </Button>
                      ) : isRecovered ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold">
                          <CheckCircle2 size={14} />
                          <span>Protected</span>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Zap}
                          loading={recoveringId === item.transaction_id}
                          onClick={() => onTriggerRecovery(item.transaction_id)}
                        >
                          Trigger AI
                        </Button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredCases.length === 0 && (
          <GlassCard className="text-center py-12 bg-white border-slate-200">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-3 opacity-80" />
            <h4 className="font-display font-semibold text-slate-800 text-base">
              No Cases Match Criteria
            </h4>
            <p className="text-xs text-slate-500 font-mono mt-1">
              All payment failures in this view are resolved or safe.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
