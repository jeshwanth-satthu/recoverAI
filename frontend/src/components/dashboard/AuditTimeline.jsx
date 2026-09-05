import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ScrollText, ShieldCheck, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";
import { getAuditLogs } from "../../services/api";

export default function AuditTimeline({ logs: initialLogs = [] }) {
  const [items, setItems] = useState(initialLogs);
  const [loading, setLoading] = useState(initialLogs.length === 0);

  useEffect(() => {
    if (initialLogs.length > 0) {
      setItems(initialLogs);
      setLoading(false);
      return;
    }

    async function fetchLogs() {
      try {
        const res = await getAuditLogs();
        const apiLogs = Array.isArray(res)
          ? res
          : res?.logs || res?.data || [];
        setItems(apiLogs);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [initialLogs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-900">
            Audit Telemetry Trail
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            Cryptographically timestamped record of autonomous actions and human overrides
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
          <ScrollText size={14} />
          <span>Immutable Ledger</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-slate-400 uppercase tracking-wider">
          Loading audit telemetry ledger...
        </div>
      ) : items.length === 0 ? (
        <GlassCard className="p-8 text-center bg-white/95 border-slate-200/80">
          <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">
            No audit telemetry events recorded in ledger yet.
          </span>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const isRecovered = item.status === "recovered" || item.action_taken === "recovered";
            const isHuman = item.status === "human_approval" || item.requires_human_approval;

            return (
              <GlassCard
                key={item.id || item._id || idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 border-slate-200/80 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      isRecovered
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : isHuman
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-violet-50 text-violet-700 border border-violet-200"
                    }`}
                  >
                    {isRecovered ? (
                      <CheckCircle2 size={16} />
                    ) : isHuman ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Zap size={16} />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {item.event || item.action || item.action_taken || "Audit Event"}
                      </span>
                      <span className="font-mono text-xs text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 font-semibold">
                        {item.case_id || item.transaction_id || `LOG-${idx + 1}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-sans">
                      {item.customer && (
                        <>
                          Customer: <strong className="text-slate-800">{item.customer}</strong> •{" "}
                        </>
                      )}
                      {item.details || item.reason || item.action || "Telemetry event recorded."}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 font-mono text-xs">
                  {item.amount && (
                    <span className="font-bold text-slate-900">
                      ₹{Number(item.amount).toLocaleString("en-IN")}
                    </span>
                  )}
                  <span className="text-slate-400 text-[11px]">
                    {item.timestamp || item.created_at || "Recent"}
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
