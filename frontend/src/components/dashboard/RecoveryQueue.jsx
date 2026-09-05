import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, AlertCircle } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import { getRecoveryPriority } from "../../services/api";

export default function RecoveryQueue({ onSelectCase }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadQueue = async () => {
    try {
      setError(null);

      const data = await getRecoveryPriority();

      setQueue(
        Array.isArray(data?.queue)
          ? data.queue
          : []
      );

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Recovery priority queue failed:", err);
      setError("Unable to load recovery opportunities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();

    const interval = window.setInterval(loadQueue, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <GlassCard className="p-6 md:p-10 relative">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-[#cecac8]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[#797776]">
            DYNAMIC DISPATCH / UTILITY RANKED
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#242424] mt-1">
            RECOVERY PRIORITY QUEUE
          </h2>
          <p className="font-mono text-xs text-[#797776] mt-1">
            Where autonomous recovery should act next.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="font-mono text-[11px] text-[#797776]">
              UPDATED {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <button
            type="button"
            onClick={loadQueue}
            className="size-8 rounded-full border border-[#cecac8] bg-[#f6f3f1] hover:border-[#242424] flex items-center justify-center text-[#242424] transition-all cursor-pointer"
            title="Refresh priority queue"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-2 p-3 my-4 rounded-xl border border-[#cecac8] bg-[#f6f3f1] text-[#242424] text-xs font-mono">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="py-16 text-center font-mono text-xs text-[#797776] tracking-wider uppercase">
          Calculating recovery opportunities...
        </div>
      ) : queue.length === 0 ? (
        <div className="py-16 text-center font-mono text-xs text-[#797776] tracking-wider uppercase">
          No recoverable transactions in priority queue.
        </div>
      ) : (
        <div className="divide-y divide-[#cecac8]">
          <AnimatePresence>
            {queue.slice(0, 6).map((item, index) => {
              const strategy = item.recommended_strategy || {};
              const probability = (
                Number(item.recovery_probability || 0) * 100
              ).toFixed(1);

              const formattedPriority = String(
                item.priority ?? index + 1
              ).padStart(2, "0");

              return (
                <motion.div
                  key={item.transaction_id || index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  onClick={() => onSelectCase && onSelectCase(item)}
                  className="py-5 px-3 -mx-3 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-[#cfdaf5]/20"
                >
                  {/* LEFT: PRIORITY + CUSTOMER + TRANSACTION */}
                  <div className="flex items-start md:items-center gap-4 min-w-[240px]">
                    <div className="font-mono text-2xl md:text-3xl text-[#242424] font-normal shrink-0 w-10">
                      {formattedPriority}
                    </div>

                    <div>
                      <div className="font-serif text-lg text-[#242424] font-normal leading-snug">
                        {item.customer || "Enterprise Account"}
                      </div>
                      <div className="font-mono text-xs text-[#797776] mt-0.5">
                        {item.transaction_id}
                        {item.failure_reason && (
                          <span className="ml-2 uppercase text-[#4e4d4d]">
                            • {String(item.failure_reason).replaceAll("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MIDDLE: METRICS (AMOUNT, PROBABILITY, EXPECTED) */}
                  <div className="grid grid-cols-3 gap-6 md:gap-8 font-mono text-left">
                    <div>
                      <span className="text-[10px] uppercase text-[#797776] block">
                        AMOUNT
                      </span>
                      <span className="text-sm font-medium text-[#242424]">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-[#797776] block">
                        ML PROBABILITY
                      </span>
                      <span className="text-sm font-medium text-[#242424]">
                        {probability}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-[#797776] block">
                        EXPECTED
                      </span>
                      <span className="text-sm font-medium text-[#2b59d1]">
                        {formatCurrency(item.expected_recovery_value)}
                      </span>
                    </div>
                  </div>

                  {/* RIGHT: STRATEGY & TIMING */}
                  <div className="flex items-center gap-2.5 font-mono text-xs shrink-0 self-start md:self-auto">
                    <span className="px-3 py-1 rounded-full border border-[#cecac8] bg-[#f6f3f1] text-[#242424] uppercase tracking-wider text-[11px]">
                      {String(strategy.action || "REVIEW").replaceAll("_", " ")}
                    </span>

                    <span className="px-3 py-1 rounded-full border border-[#cecac8] bg-transparent text-[#797776] uppercase tracking-wider text-[11px]">
                      {String(strategy.timing || "LATER").replaceAll("_", " ")}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* FOOTER */}
      {!loading && queue.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#cecac8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#797776]">
          <span>Ranked autonomously by expected recoverable revenue yield.</span>
          <span className="text-[#242424]">SHOWING TOP {Math.min(queue.length, 6)} OF {queue.length} OPPORTUNITIES</span>
        </div>
      )}
    </GlassCard>
  );
}