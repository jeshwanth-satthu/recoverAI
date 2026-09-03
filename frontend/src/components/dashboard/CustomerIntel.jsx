import { Users, Shield, TrendingUp, Sparkles, DollarSign } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";

export default function CustomerIntel() {
  const customerTiers = [
    {
      name: "Devika Enterprises Ltd",
      email: "finance@devika-enterprises.com",
      tier: "Enterprise Tier 1",
      clv: "₹14,80,000",
      churnRisk: "CRITICAL (92%)",
      riskVariant: "risk",
      history: "4 Recoveries • 98.2% LTV Protected",
      recommendedAction: "VIP Dedicated Account Manager Escalation",
    },
    {
      name: "Zenith Retail Corp",
      email: "payments@zenithretail.in",
      tier: "Enterprise Tier 2",
      clv: "₹6,20,000",
      churnRisk: "ELEVATED (76%)",
      riskVariant: "warning",
      history: "2 Recoveries • Zero Disputes",
      recommendedAction: "Automatic Failover to Pre-authorized Virtual Terminal",
    },
    {
      name: "Kunal Singhania",
      email: "kunal@singhania-holdings.co",
      tier: "Enterprise Tier 1",
      clv: "₹9,50,000",
      churnRisk: "HIGH (81%)",
      riskVariant: "risk",
      history: "3 Recoveries • High Basket Size",
      recommendedAction: "Direct Corporate Clearing Pipe Switch",
    },
    {
      name: "Arjun Mehta",
      email: "arjun.m@gmail.com",
      tier: "Retail Pro",
      clv: "₹42,000",
      churnRisk: "LOW (14%)",
      riskVariant: "recovered",
      history: "1 Recovery • Instant WhatsApp Pay",
      recommendedAction: "Dynamic 1-Click WhatsApp QuickPay",
    },
    {
      name: "Pooja Sharma",
      email: "pooja.sharma99@yahoo.com",
      tier: "Retail Standard",
      clv: "₹18,500",
      churnRisk: "MEDIUM (45%)",
      riskVariant: "ai",
      history: "1 Recovery • 0-Cost BNPL Option",
      recommendedAction: "Secondary Google Pay UPI Nudge",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-xl font-bold text-slate-900">
          Customer Risk & Intelligence Dossier
        </h3>
        <p className="text-xs text-slate-500 font-mono">
          Gemini-powered lifetime value modeling and predictive churn protection
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customerTiers.map((cust, idx) => (
          <GlassCard key={idx} className="p-5 flex flex-col justify-between space-y-4 bg-white/95 border-slate-200/80 shadow-xs">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-slate-900 text-base">
                    {cust.name}
                  </h4>
                  <span className="text-xs text-slate-500 font-mono block">
                    {cust.email}
                  </span>
                </div>
                <Badge label={cust.tier} variant="ai" size="sm" />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">CUSTOMER CLV</span>
                  <span className="font-bold text-slate-900 font-mono-nums">{cust.clv}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">CHURN RISK</span>
                  <span className={`font-bold ${cust.riskVariant === "risk" ? "text-rose-600" : cust.riskVariant === "warning" ? "text-amber-700" : "text-emerald-700"}`}>
                    {cust.churnRisk}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-sans">
                <strong className="text-sky-700 font-mono text-[11px] block mb-0.5 font-bold">
                  AI Strategy:
                </strong>
                {cust.recommendedAction}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-400">
              {cust.history}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
