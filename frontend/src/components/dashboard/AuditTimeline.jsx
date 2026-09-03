import { motion } from "framer-motion";
import { ScrollText, ShieldCheck, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";

export default function AuditTimeline({ logs = [] }) {
  const defaultLogs = [
    {
      id: "LOG-1",
      timestamp: "Just now",
      event: "Gemini Autonomous Recovery Dispatched",
      case_id: "CASE-9401",
      customer: "Arjun Mehta",
      action: "1-Click WhatsApp QuickPay with Pre-filled Cart",
      status: "recovered",
      amount: "₹3,499",
    },
    {
      id: "LOG-2",
      timestamp: "3 mins ago",
      event: "High-Risk Guardrail Intercept Activated",
      case_id: "CASE-9402",
      customer: "Devika Enterprises Ltd",
      action: "Mandate reroute halted: Value exceeds ₹50,000 ceiling",
      status: "human_approval",
      amount: "₹84,500",
    },
    {
      id: "LOG-3",
      timestamp: "8 mins ago",
      event: "BNPL Direct Fallback Settled",
      case_id: "CASE-9399",
      customer: "Pooja Sharma",
      action: "Google Pay UPI Instant Switch",
      status: "recovered",
      amount: "₹1,899",
    },
    {
      id: "LOG-4",
      timestamp: "15 mins ago",
      event: "Operator Override Approved",
      case_id: "CASE-9395",
      customer: "Alpha Logistics Pvt",
      action: "Priority RTGS settlement authorized by Operator #04",
      status: "recovered",
      amount: "₹2,10,000",
    },
  ];

  const items = logs.length > 0 ? logs : defaultLogs;

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

      <div className="space-y-3">
        {items.map((item, idx) => {
          const isRecovered = item.status === "recovered";
          const isHuman = item.status === "human_approval";

          return (
            <GlassCard
              key={item.id || idx}
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
                      {item.event || item.action}
                    </span>
                    <span className="font-mono text-xs text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 font-semibold">
                      {item.case_id || item.transaction_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-sans">
                    Customer: <strong className="text-slate-800">{item.customer}</strong> •{" "}
                    {item.action}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 font-mono text-xs">
                <span className="font-bold text-slate-900">{item.amount}</span>
                <span className="text-slate-400 text-[11px]">{item.timestamp}</span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
