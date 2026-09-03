import { useState, useEffect, useMemo } from "react";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import LiveCases from "./components/dashboard/LiveCases";
import HighRiskReviewPanel from "./components/dashboard/HighRiskReviewPanel";
import CustomerIntel from "./components/dashboard/CustomerIntel";
import AuditTimeline from "./components/dashboard/AuditTimeline";

import { INITIAL_METRICS, INITIAL_CASES } from "./lib/mockData";
import {
  getDashboard,
  getRecoveryCases,
  getDatabaseHealth,
} from "./services/api";
import { playClickSound, playSuccessSound } from "./lib/soundFX";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [cases, setCases] = useState(INITIAL_CASES);
  const [selectedReviewCase, setSelectedReviewCase] = useState(null);
  const [isDbConnected, setIsDbConnected] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");

  // Load live data from FastAPI backend with automatic graceful fallback
  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, casesRes, healthRes] = await Promise.allSettled([
          getDashboard(),
          getRecoveryCases(),
          getDatabaseHealth(),
        ]);

        if (dashRes.status === "fulfilled" && dashRes.value) {
          setMetrics((prev) => ({
            ...prev,
            ...dashRes.value,
          }));
        }

        if (
          casesRes.status === "fulfilled" &&
          casesRes.value?.cases &&
          Array.isArray(casesRes.value.cases) &&
          casesRes.value.cases.length > 0
        ) {
          // Merge backend cases with rich mock fields
          setCases(casesRes.value.cases);
        }

        if (healthRes.status === "fulfilled") {
          setIsDbConnected(healthRes.value?.connected === true);
        }
      } catch (err) {
        console.warn("Backend initialization fallback active:", err);
      }
    }

    loadData();
  }, []);

  const pendingReviewCount = useMemo(() => {
    return cases.filter(
      (c) => c?.status === "human_approval" || c?.guardrail?.requires_human_approval
    ).length;
  }, [cases]);

  // Simulate an incoming high-value payment failure to demonstrate the AI guardrail
  const handleTriggerDemo = () => {
    playClickSound();
    const newCase = {
      case_id: `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
      transaction_id: `TXN_${Math.floor(10000000 + Math.random() * 90000000)}`,
      customer: "Reliance Logistics Pvt",
      email: "accounts@reliancelogistics.in",
      customer_tier: "Enterprise Tier 1",
      customer_clv: 1850000,
      amount: 92400,
      currency: "INR",
      failure_reason: "bank_downtime",
      created_at: "Just now",
      status: "human_approval",
      risk_level: "HIGH",
      risk_score: 93,
      diagnosis: {
        diagnosis: "ICICI Corporate Gateway timeout during high-ticket batch checkout.",
        agent: "Gemini 1.5 Pro Diagnostic Agent",
        customer_churn_risk: "CRITICAL (94%)",
        recommended_action: "instant_virtual_pos_reroute",
        confidence: 0.97,
      },
      decision: {
        action: "Instant Reroute to Secondary Axis Bank Clearing Pipe with Priority Webhook",
        rationale: "Enterprise account with high transaction velocity. Instant bypass preserves transaction SLA.",
        suggested_discount_pct: 0,
        channel: "Direct Corporate Webhook",
      },
      guardrail: {
        passed: false,
        requires_human_approval: true,
        reason: "High Value Flag: Transaction amount ₹92,400 exceeds autonomous ceiling (₹50,000).",
        triggered_rules: [
          "Rule 4.1: Single settlement > ₹50,000 requires Senior Finance Review",
          "Rule 1.2: High-velocity enterprise account guardrail active",
        ],
      },
      pipeline_stage: "guardrail_intercepted",
    };

    setCases((prev) => [newCase, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      revenue_at_risk: (prev.revenue_at_risk || 648500) + 92400,
    }));
    setSelectedReviewCase(newCase);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <AppLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingReviewCount={pendingReviewCount}
        metrics={metrics}
        isDbConnected={isDbConnected}
        onTriggerDemo={handleTriggerDemo}
        searchQuery={globalSearch}
        setSearchQuery={(query) => {
          setGlobalSearch(query);
          if (query.trim()) setActiveTab("cases");
        }}
      >
        {activeTab === "dashboard" && (
          <Dashboard
            cases={cases}
            setCases={setCases}
            metrics={metrics}
            setMetrics={setMetrics}
            selectedReviewCase={selectedReviewCase}
            setSelectedReviewCase={setSelectedReviewCase}
            onViewAllCases={() => setActiveTab("cases")}
            searchQuery={globalSearch}
          />
        )}

        {activeTab === "cases" && (
          <div className="space-y-6">
            <LiveCases
              cases={cases}
              onSelectCase={(item) => setSelectedReviewCase(item)}
              onTriggerRecovery={(txnId) => {
                setCases((prev) =>
                  prev.map((c) =>
                    c.transaction_id === txnId
                      ? { ...c, status: "recovered", amount_recovered: c.amount }
                      : c
                  )
                );
                playSuccessSound();
              }}
              searchQuery={globalSearch}
            />
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  High-Risk Review Queue
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Cases intercepted by deterministic safety guardrails requiring human clearance
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                {pendingReviewCount} Cases Awaiting Clearance
              </span>
            </div>

            <LiveCases
              cases={cases.filter(
                (c) =>
                  c.status === "human_approval" ||
                  c.guardrail?.requires_human_approval
              )}
              onSelectCase={(item) => setSelectedReviewCase(item)}
              onTriggerRecovery={() => {}}
              searchQuery={globalSearch}
            />
          </div>
        )}

        {activeTab === "customers" && <CustomerIntel />}

        {activeTab === "audit" && <AuditTimeline />}
      </AppLayout>

      {/* GLOBAL MODAL FOR HIGH-RISK CASE REVIEW */}
      {selectedReviewCase && activeTab !== "dashboard" && (
        <HighRiskReviewPanel
          caseItem={selectedReviewCase}
          onClose={() => setSelectedReviewCase(null)}
          onApprove={(id) => {
            setCases((prev) =>
              prev.map((c) =>
                c.transaction_id === id || c.case_id === id
                  ? { ...c, status: "recovered", amount_recovered: c.amount }
                  : c
              )
            );
            setSelectedReviewCase(null);
            playSuccessSound();
          }}
          onReject={(id) => {
            setCases((prev) =>
              prev.map((c) =>
                c.transaction_id === id || c.case_id === id
                  ? { ...c, status: "failed" }
                  : c
              )
            );
            setSelectedReviewCase(null);
          }}
        />
      )}
    </div>
  );
}
