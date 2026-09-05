import { useState, useEffect } from "react";
import { Users, Shield, TrendingUp, Sparkles, DollarSign } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";
import { getRecoveryCases } from "../../services/api";

export default function CustomerIntel() {
  const [customerProfiles, setCustomerProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getRecoveryCases();
        const cases = Array.isArray(res)
          ? res
          : res?.cases || res?.data || [];

        // Aggregate by customer
        const customerMap = new Map();
        for (const item of cases) {
          const name = item.customer || item.customer_name;
          if (!name) continue;

          if (!customerMap.has(name)) {
            customerMap.set(name, {
              name,
              email: item.email || item.customer_email || `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
              tier: item.customer_tier || "Standard Tier",
              clv: item.customer_clv ? `₹${Number(item.customer_clv).toLocaleString("en-IN")}` : `₹${Number(item.amount * 5 || 50000).toLocaleString("en-IN")}`,
              churnRisk: item.diagnosis?.customer_churn_risk || (item.risk_level === "HIGH" ? "HIGH (75%)" : "LOW (15%)"),
              riskVariant: item.risk_level === "HIGH" || item.guardrail?.requires_human_approval ? "risk" : item.status === "recovered" ? "recovered" : "ai",
              history: `${item.status === "recovered" ? "1 Recovery" : "1 Active Case"} • ${item.failure_reason ? String(item.failure_reason).replaceAll("_", " ") : "Gateway Telemetry"}`,
              recommendedAction: item.decision?.action || item.diagnosis?.recommended_action || "Standard Payment Retry Protocol",
            });
          }
        }

        setCustomerProfiles(Array.from(customerMap.values()));
      } catch (err) {
        console.error("Failed to load customer profiles:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-slate-400 uppercase tracking-wider">
          Compiling customer risk dossiers...
        </div>
      ) : customerProfiles.length === 0 ? (
        <GlassCard className="p-8 text-center bg-white/95 border-slate-200/80">
          <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">
            No customer risk profiles found in active telemetry.
          </span>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customerProfiles.map((cust, idx) => (
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
      )}
    </div>
  );
}
