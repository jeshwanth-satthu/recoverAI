import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  CheckCircle2,
  Zap,
  Search,
  Brain,
  ArrowRight,
  CreditCard,
} from "lucide-react";

import GlassCard from "../ui/GlassCard";
import { playClickSound } from "../../lib/soundFX";

export default function LiveCases({
  cases = [],
  onSelectCase,
  onSelectJourneyCase,
  onTriggerRecovery,
  onRazorpayPayment,
  recoveringId = null,
  razorpayLoadingId = null,
  maxItems,
  onViewAll,
  searchQuery = "",
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const uniqueCases = useMemo(() => {
    if (!Array.isArray(cases)) return [];
    const grouped = new Map();

    for (const item of cases) {
      if (!item) continue;
      const key = item.transaction_id || item.case_id || item.id;
      if (!key) continue;

      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, item);
        continue;
      }

      // If one is real (persisted) and one is virtual, prefer the real persisted case
      const existingVirtual = existing.is_virtual === true || String(existing.is_virtual) === "true";
      const currentVirtual = item.is_virtual === true || String(item.is_virtual) === "true";

      if (existingVirtual && !currentVirtual) {
        grouped.set(key, item);
        continue;
      }
      if (!existingVirtual && currentVirtual) {
        continue;
      }

      const existingRecovered =
        existing?.status === "recovered" ||
        existing?.verification?.recovered === true;

      const currentRecovered =
        item?.status === "recovered" ||
        item?.verification?.recovered === true;

      if (currentRecovered && !existingRecovered) {
        grouped.set(key, item);
        continue;
      }

      if (existingRecovered && !currentRecovered) {
        continue;
      }

      const existingTime = new Date(existing?.created_at || 0).getTime();
      const currentTime = new Date(item?.created_at || 0).getTime();

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
        (item?.status === "human_approval" ||
          item?.guardrail?.requires_human_approval === true ||
          String(item?.risk_level).toUpperCase() === "HIGH");

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
          item?.customer_name,
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
        c?.status === "recovered" || c?.verification?.recovered === true;
      return (
        !recovered &&
        (c?.status === "human_approval" ||
          c?.guardrail?.requires_human_approval === true ||
          String(c?.risk_level).toUpperCase() === "HIGH")
      );
    }).length;
  }, [uniqueCases]);

  return (
    <div id="cases-section" className="space-y-6">
      {/* ===================================================
          1. HEADER & FILTER CONTROLS
          =================================================== */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 pb-4 border-b border-[#cecac8]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[#797776]">
            INGESTION LEDGER / CASE AUDIT
          </span>
          <h3 className="font-serif text-2xl md:text-3xl font-normal text-[#242424] mt-1">
            Active Recovery Cases
          </h3>
          <p className="font-mono text-xs text-[#797776] mt-0.5">
            {uniqueCases.length} transactions in recovery workload
          </p>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="px-4 py-1.5 rounded-full border border-[#cecac8] bg-[#f6f3f1] hover:border-[#242424] text-xs font-mono text-[#242424] uppercase tracking-wider transition-colors cursor-pointer"
            >
              VIEW FULL QUEUE
            </button>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#797776] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or ID..."
              className="w-48 sm:w-56 pl-9 pr-4 py-1.5 rounded-full border border-[#cecac8] bg-[#f6f3f1] text-xs font-mono text-[#242424] placeholder-[#797776] focus:outline-none focus:border-[#242424]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-full border border-[#cecac8] bg-[#f6f3f1] text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setFilter("all");
              }}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-[#242424] text-[#f6f3f1]"
                  : "text-[#797776] hover:text-[#242424]"
              }`}
            >
              ALL
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setFilter("human_approval");
              }}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === "human_approval"
                  ? "bg-[#242424] text-[#f6f3f1]"
                  : "text-[#797776] hover:text-[#242424]"
              }`}
            >
              <span>HIGH RISK</span>
              {pendingApprovalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#f37a0a] text-white text-[10px]">
                  {pendingApprovalCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setFilter("recovered");
              }}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                filter === "recovered"
                  ? "bg-[#242424] text-[#f6f3f1]"
                  : "text-[#797776] hover:text-[#242424]"
              }`}
            >
              RECOVERED
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================
          2. CASE STREAM LIST
          =================================================== */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {visibleCases.map((item) => {
            const isVirtual = item?.is_virtual === true || String(item?.is_virtual) === "true";
            const isRecovered =
              item?.status === "recovered" ||
              item?.verification?.recovered === true;

            const isHuman =
              !isRecovered &&
              (item?.status === "human_approval" ||
                item?.guardrail?.requires_human_approval === true ||
                String(item?.risk_level).toUpperCase() === "HIGH");

            const amount = Number(item?.amount || 0);

            const displayDiagnosis =
              item?.diagnosis?.diagnosis ||
              (isVirtual ? "Awaiting recovery analysis" : "Root cause analyzed.");

            return (
              <motion.div
                key={item.case_id || item.transaction_id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard className="p-6 hover:border-[#4e4d4d] transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* LEFT SECTION: CUSTOMER & CASE INTEL */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => onSelectJourneyCase?.(item)}
                          title="Inspect 7-Stage Autonomous Journey"
                          className="px-2.5 py-0.5 rounded-full border border-[#cecac8] bg-white text-[#242424] hover:border-[#242424] transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{item.case_id || item.transaction_id || "CASE-LIVE"}</span>
                          <span className="text-[10px] text-[#2b59d1] font-semibold">JOURNEY ↗</span>
                        </button>

                        {isHuman ? (
                          <span className="px-2.5 py-0.5 rounded-full border border-[#f37a0a] text-[#f37a0a] uppercase tracking-wider text-[11px]">
                            REQUIRES HUMAN APPROVAL
                          </span>
                        ) : isRecovered ? (
                          <span className="px-2.5 py-0.5 rounded-full border border-[#059669] text-[#059669] uppercase tracking-wider text-[11px]">
                            AUTO-RECOVERED ✓
                          </span>
                        ) : isVirtual || item?.status === "pending" ? (
                          <span className="px-2.5 py-0.5 rounded-full border border-[#797776] text-[#797776] uppercase tracking-wider text-[11px]">
                            PENDING
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full border border-[#2b59d1] text-[#2b59d1] uppercase tracking-wider text-[11px]">
                            IN PIPELINE
                          </span>
                        )}

                        <span className="text-[#797776]">
                          {item.created_at || "Recent"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-4">
                        <span className="font-serif text-xl font-normal text-[#242424]">
                          {item.customer || item.customer_name || "Enterprise Account"}
                        </span>

                        <span className="font-mono text-xs text-[#797776]">
                          FAILURE:{" "}
                          <span className="text-[#242424] uppercase">
                            {String(item.failure_reason || "GATEWAY_TIMEOUT").replaceAll("_", " ")}
                          </span>
                        </span>
                      </div>

                      {/* GEMINI DIAGNOSIS */}
                      <p className="font-mono text-xs text-[#4e4d4d] line-clamp-1">
                        <strong className="text-[#242424] mr-1.5">
                          GEMINI DIAGNOSIS:
                        </strong>
                        {displayDiagnosis}
                      </p>
                    </div>

                    {/* RIGHT SECTION: VALUE & ACTION TRIGGER */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#cecac8]">
                      <div className="text-left lg:text-right font-mono">
                        <span className="text-[10px] text-[#797776] block uppercase tracking-wider">
                          {isRecovered ? "SETTLED AMOUNT" : "REVENUE AT RISK"}
                        </span>
                        <span
                          className={`font-serif text-2xl font-normal ${
                            isRecovered
                              ? "text-[#059669]"
                              : isHuman
                              ? "text-[#f37a0a]"
                              : "text-[#242424]"
                          }`}
                        >
                          ₹{amount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* ACTION BUTTON */}
                      {isHuman ? (
                        <button
                          type="button"
                          onClick={() => onSelectCase(item)}
                          className="px-6 py-2 rounded-full border border-[#242424] bg-[#242424] hover:bg-[#4e4d4d] text-[#f6f3f1] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          REVIEW CASE →
                        </button>
                      ) : isRecovered ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#cecac8] bg-white text-[#059669] text-xs font-mono uppercase tracking-wider">
                            <CheckCircle2 size={13} />
                            <span>PROTECTED</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onSelectJourneyCase?.(item)}
                            className="p-1.5 rounded-full border border-[#cecac8] hover:border-[#242424] text-[#797776] hover:text-[#242424] transition-colors cursor-pointer text-[10px]"
                            title="View Audit Ledger"
                          >
                            ↗
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {onRazorpayPayment && (
                            <button
                              type="button"
                              disabled={razorpayLoadingId === item.transaction_id}
                              onClick={() => onRazorpayPayment(item.transaction_id)}
                              className="px-5 py-2 rounded-full border border-[#2b59d1] bg-[#2b59d1] text-white hover:opacity-90 font-mono text-xs uppercase tracking-wider transition-opacity cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <CreditCard size={13} />
                              <span>
                                {razorpayLoadingId === item.transaction_id
                                  ? "CHECKOUT..."
                                  : "TEST CHECKOUT →"}
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={recoveringId === item.transaction_id}
                            onClick={() => onTriggerRecovery(item.transaction_id)}
                            className="px-6 py-2 rounded-full border border-[#242424] bg-[#242424] text-white hover:bg-[#4e4d4d] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {recoveringId === item.transaction_id
                              ? "PROCESSING..."
                              : "TRIGGER AI →"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredCases.length === 0 && (
          <GlassCard className="text-center py-16">
            <span className="font-mono text-xs text-[#797776] uppercase tracking-wider">
              No transactions match the selected filter criteria.
            </span>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
