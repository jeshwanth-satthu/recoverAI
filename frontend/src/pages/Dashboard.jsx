import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

import Hero from "../components/dashboard/Hero";
import RevenueTracker from "../components/dashboard/RevenueTracker";
import ScrollPipelineExperience from "../components/scroll-experience/ScrollPipelineExperience";
import SystemStatusPill from "../components/dashboard/SystemStatusPill";
import CaseJourneyModal from "../components/dashboard/CaseJourneyModal";
import RecoveryPipelineDiagram from "../components/dashboard/RecoveryPipelineDiagram";
import RecoveryQueue from "../components/dashboard/RecoveryQueue";
import CircuitBreakerStatus from "../components/dashboard/CircuitBreakerStatus";
import MLIntelligence from "../components/dashboard/MLIntelligence";
import RecoveryEventStream from "../components/dashboard/RecoveryEventStream";
import RecoveryFeedback from "../components/dashboard/RecoveryFeedback";
import LiveCases from "../components/dashboard/LiveCases";
import HighRiskReviewPanel from "../components/dashboard/HighRiskReviewPanel";
import GlassCard from "../components/ui/GlassCard";

import {
  getDashboard,
  getRecoveryCases,
  recoverTransaction,
  approveRecovery,
  createRazorpayOrder,
  verifyRazorpayPayment,
  resetDemoData,
} from "../services/api";

import { playSuccessSound, playClickSound } from "../lib/soundFX";

export default function Dashboard({
  onSelectReviewCase,
  selectedReviewCase,
  setSelectedReviewCase,
  cases = [],
  setCases,
  metrics = {},
  setMetrics,
  isLive = true,
  onViewAllCases,
  searchQuery,
}) {
  const [recoveringId, setRecoveringId] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [razorpayLoadingId, setRazorpayLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedJourneyCase, setSelectedJourneyCase] = useState(null);
  const [pulseRecovery, setPulseRecovery] = useState(false);

  const triggerRecoveryPulse = () => {
    setPulseRecovery(true);
    setTimeout(() => {
      setPulseRecovery(false);
    }, 3200);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // ============================================================
  // LIVE BACKEND SYNC (Every 3s)
  // ============================================================

  const refreshLiveData = async () => {
    try {
      const [dashboardResponse, casesResponse] = await Promise.all([
        getDashboard(),
        getRecoveryCases(),
      ]);

      const dashboard =
        dashboardResponse?.data ??
        dashboardResponse ??
        {};

      const nextMetrics =
        dashboard?.metrics ??
        dashboard?.data ??
        dashboard ??
        {};

      const nextCases = Array.isArray(casesResponse)
        ? casesResponse
        : casesResponse?.cases ??
          casesResponse?.data ??
          [];

      if (nextMetrics && typeof nextMetrics === "object") {
        setMetrics((prev) => ({
          ...prev,
          ...nextMetrics,
        }));
      }

      if (Array.isArray(nextCases)) {
        setCases(nextCases);
      }
    } catch (error) {
      console.warn("Live dashboard refresh failed:", error);
    }
  };

  useEffect(() => {
    refreshLiveData();
    const intervalId = window.setInterval(refreshLiveData, 3000);
    return () => window.clearInterval(intervalId);
  }, []);

  // ============================================================
  // AUTONOMOUS RECOVERY DISPATCH
  // ============================================================

  const handleTriggerRecovery = async (txnId) => {
    setRecoveringId(txnId);
    playClickSound();

    try {
      setCases((prev) =>
        prev.map((c) =>
          c.transaction_id === txnId
            ? {
                ...c,
                status: "recovering",
                pipeline_stage: "processing",
              }
            : c
        )
      );

      const result = await recoverTransaction(txnId);

      if (!result?.success) {
        throw new Error(result?.error || "Recovery request failed.");
      }

      await refreshLiveData();

      const recovered =
        result?.verification?.recovered === true ||
        result?.verification?.verified === true ||
        result?.status === "recovered";

      if (recovered) {
        playSuccessSound();
        showToast(
          `Transaction ${txnId} successfully recovered via AI Pipeline!`
        );
      } else {
        showToast(
          result?.verification?.status === "pending"
            ? `Recovery for ${txnId} is pending.`
            : `Recovery for ${txnId} completed without recovery.`
        );
      }
    } catch (error) {
      console.error("Recovery failed:", error);
      await refreshLiveData();
      showToast(error?.message || "Recovery failed.");
    } finally {
      setRecoveringId(null);
    }
  };

  // ============================================================
  // RAZORPAY LIVE PAYMENT TEST
  // ============================================================

  const handleRazorpayPayment = async (txnId = "pay_1005") => {
    if (razorpayLoadingId) return;

    setRazorpayLoadingId(txnId);
    playClickSound();

    try {
      const response = await createRazorpayOrder(txnId);

      if (!response?.success) {
        throw new Error("Unable to create Razorpay order.");
      }

      const order = response.order;

      if (!order?.id) {
        throw new Error("Razorpay did not return an order ID.");
      }

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay Checkout failed to load. Please check index.html."
        );
      }

      const transaction = cases.find(
        (c) => c.transaction_id === txnId || c.id === txnId
      );

      const customerName =
        transaction?.customer || transaction?.customer_name || "Priya Reddy";
      const customerEmail =
        transaction?.email || transaction?.customer_email || "priya@example.com";

      const options = {
        key: response.razorpay_key_id,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "RecoverAI",
        description: "RecoverAI Revenue Recovery Payment",
        order_id: order.id,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: (() => {
            const phone = String(
              transaction?.phone || transaction?.mobile || "9000090000"
            ).trim();
            const digits = phone.replace(/\D/g, "");
            return digits.startsWith("91") ? `+${digits}` : `+91${digits}`;
          })(),
        },
        notes: {
          recoverai_transaction_id: txnId,
        },
        theme: {
          color: "#2b59d1",
        },
        handler: async function (paymentResponse) {
          console.log("Razorpay payment captured:", paymentResponse);
          showToast("Verifying payment with Razorpay cryptographic signature...");
          try {
            const verifyRes = await verifyRazorpayPayment({
              transaction_id: txnId,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });
            playSuccessSound();
            triggerRecoveryPulse();
            showToast(
              `Payment verified by Razorpay! ₹${(
                verifyRes?.amount_recovered || order.amount / 100
              ).toLocaleString("en-IN")} marked RECOVERED.`
            );
            await refreshLiveData();
          } catch (verifyErr) {
            console.error("Razorpay verification failed:", verifyErr);
            showToast("Verification failed: " + (verifyErr.message || "Cryptographic check failed"));
            await refreshLiveData();
          }
        },
        modal: {
          ondismiss: function () {
            setRazorpayLoadingId(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (failResponse) {
        console.log("Razorpay payment failed:", failResponse?.error);
        showToast("Payment failed. RecoverAI webhook initiating autonomous pipeline.");
        refreshLiveData();
        window.setTimeout(refreshLiveData, 1500);
        window.setTimeout(refreshLiveData, 3500);
        window.setTimeout(refreshLiveData, 6000);
      });

      razorpay.open();
      setRazorpayLoadingId(null);
    } catch (error) {
      console.error("Razorpay payment error:", error);
      setRazorpayLoadingId(null);
      showToast(error?.message || "Unable to open Razorpay Checkout.");
    }
  };

  // ============================================================
  // HUMAN APPROVAL & REJECTION
  // ============================================================

  const handleApproveCase = async (txnOrCaseId, notes) => {
    setIsApproving(true);
    try {
      const result = await approveRecovery(txnOrCaseId);
      if (!result?.success) {
        throw new Error(result?.error || "Approval request failed.");
      }

      await refreshLiveData();

      const recoveredAmount = Number(
        result?.verification?.amount_recovered ??
        result?.amount_recovered ??
        result?.amount ??
        0
      );

      const recovered =
        result?.verification?.recovered === true ||
        result?.verification?.verified === true ||
        result?.status === "recovered";

      if (recovered) {
        playSuccessSound();
        showToast(
          `High-Risk Case Approved! ₹${recoveredAmount.toLocaleString(
            "en-IN"
          )} cleared.`
        );
      } else {
        showToast(`Case ${txnOrCaseId} processed.`);
      }

      setSelectedReviewCase(null);
    } catch (error) {
      console.error("Approval failed:", error);
      await refreshLiveData();
      showToast(error?.message || "Approval failed.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectCase = (txnOrCaseId) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.transaction_id === txnOrCaseId || c.case_id === txnOrCaseId) {
          return {
            ...c,
            status: "failed",
            guardrail: {
              ...c.guardrail,
              reason: "Rejected by Human Operator",
            },
          };
        }
        return c;
      })
    );

    showToast(`Case ${txnOrCaseId} rejected and archived to Audit Trail.`);
    setSelectedReviewCase(null);
    refreshLiveData();
  };

  // Find an actionable transaction for the hero "RUN RECOVERY →" CTA
  const handleHeroRunRecovery = () => {
    const candidate = cases.find(
      (c) =>
        c.status !== "recovered" &&
        c?.verification?.recovered !== true &&
        !c?.guardrail?.requires_human_approval
    );

    const targetId = candidate?.transaction_id || candidate?.id || "pay_1002";
    handleTriggerRecovery(targetId);
  };

  const handleHeroViewCases = () => {
    const el = document.getElementById("cases-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else if (onViewAllCases) {
      onViewAllCases();
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* =====================================================
          1. INFRASTRUCTURE HEALTH STATUS
          ===================================================== */}
      <SystemStatusPill isDbConnected={isLive} />

      {/* =====================================================
          2. HERO / COMMAND CENTER HEADER
          ===================================================== */}
      <Hero
        metrics={metrics}
        pulseRecovery={pulseRecovery}
        onViewPipeline={() => {
          const el =
            document.getElementById("recovery-pipeline-section") ||
            document.getElementById("pipeline-diagram");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
        onExploreCases={handleHeroViewCases}
      />

      {/* =====================================================
          3. CORE REVENUE METRICS
          ===================================================== */}
      <RevenueTracker metrics={metrics} pulseRecovery={pulseRecovery} />

      {/* =====================================================
          4. 3D CLOSED-LOOP RECOVERY PIPELINE & GUARDRAIL
          ===================================================== */}
      <ScrollPipelineExperience
        activeCase={selectedReviewCase || cases?.[0]}
        onApproveRecovery={handleApproveCase}
        pulseRecovery={pulseRecovery}
      />

      {/* =====================================================
          RAZORPAY LIVE PAYMENT TEST
          ===================================================== */}
      <GlassCard className="p-6 md:p-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-wider text-[#797776]">
              GATEWAY INTEGRATION / SIMULATED DISPATCH
            </span>
            <h3 className="font-serif text-2xl font-normal text-[#242424]">
              LIVE PAYMENT TEST
            </h3>
            <p className="font-mono text-xs text-[#4e4d4d]">
              Test the Razorpay → RecoverAI recovery loop.
            </p>
          </div>

          <button
            type="button"
            disabled={razorpayLoadingId !== null}
            onClick={() => handleRazorpayPayment("pay_1005")}
            className="px-8 py-3 rounded-[100px] bg-[#242424] hover:bg-[#4e4d4d] text-[#f6f3f1] font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            {razorpayLoadingId === "pay_1005" ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>OPENING CHECKOUT...</span>
              </>
            ) : (
              <>
                <CreditCard size={14} />
                <span>TEST ₹1,999 PAYMENT →</span>
              </>
            )}
          </button>
        </div>
      </GlassCard>

      {/* =====================================================
          5. PRIORITY RECOVERY QUEUE
          ===================================================== */}
      <RecoveryQueue onSelectCase={(item) => setSelectedJourneyCase(item)} />

      {/* =====================================================
          6. RECOVERY SAFETY / CIRCUIT BREAKER
          ===================================================== */}
      <CircuitBreakerStatus />

      {/* =====================================================
          7. AI MODEL INTELLIGENCE
          ===================================================== */}
      <MLIntelligence />

      {/* =====================================================
          8. LIVE RECOVERY EVENT STREAM
          ===================================================== */}
      <RecoveryEventStream />

      {/* =====================================================
          10. RECOVERY FEEDBACK / LEARNING
          ===================================================== */}
      <RecoveryFeedback
        transactionId={
          selectedReviewCase?.transaction_id ||
          selectedReviewCase?.id ||
          cases?.[0]?.transaction_id ||
          cases?.[0]?.id ||
          "pay_1002"
        }
        action={
          selectedReviewCase?.decision?.action ||
          selectedReviewCase?.action ||
          cases?.[0]?.decision?.action ||
          cases?.[0]?.action ||
          "send_payment_reminder"
        }
      />

      {/* =====================================================
          ACTIVE CASES / INGESTION LEDGER
          ===================================================== */}
      <LiveCases
        cases={cases}
        onSelectCase={(item) => setSelectedReviewCase(item)}
        onSelectJourneyCase={(item) => setSelectedJourneyCase(item)}
        onTriggerRecovery={handleTriggerRecovery}
        onRazorpayPayment={handleRazorpayPayment}
        recoveringId={recoveringId}
        razorpayLoadingId={razorpayLoadingId}
        maxItems={5}
        onViewAll={onViewAllCases}
        searchQuery={searchQuery}
      />

      {/* =====================================================
          9. HUMAN REVIEW MODAL (Awaiting Authorization)
          ===================================================== */}
      {selectedReviewCase && (
        <HighRiskReviewPanel
          caseItem={selectedReviewCase}
          onClose={() => setSelectedReviewCase(null)}
          onApprove={handleApproveCase}
          onReject={handleRejectCase}
          isApproving={isApproving}
        />
      )}

      {/* =====================================================
          CASE JOURNEY MODAL (7-Stage Path Inspection)
          ===================================================== */}
      {selectedJourneyCase && (
        <CaseJourneyModal
          caseItem={selectedJourneyCase}
          onClose={() => setSelectedJourneyCase(null)}
          onTriggerRecovery={handleTriggerRecovery}
          onRazorpayPayment={handleRazorpayPayment}
          razorpayLoadingId={razorpayLoadingId}
        />
      )}

      {/* =====================================================
          TOAST NOTIFICATION (Monad Pill)
          ===================================================== */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full bg-[#242424] text-[#f6f3f1] border border-[#cecac8] text-xs font-mono flex items-center gap-3 shadow-md"
        >
          <CheckCircle2 size={15} className="text-[#a7fccd]" />
          <span>{toastMessage}</span>
        </motion.div>
      )}
    </div>
  );
}