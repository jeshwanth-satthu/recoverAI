import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  CreditCard,
} from "lucide-react";

import RevenueTracker from "../components/dashboard/RevenueTracker";
import LiveCases from "../components/dashboard/LiveCases";
import HighRiskReviewPanel from "../components/dashboard/HighRiskReviewPanel";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

import {
  getDashboard,
  getRecoveryCases,
  recoverTransaction,
  approveRecovery,
  createRazorpayOrder,
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

  const showToast = (msg) => {
    setToastMessage(msg);

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };


  // ============================================================
  // LIVE BACKEND SYNC
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

  // Keep the dashboard synchronized with MongoDB/backend state.
  // This lets Razorpay webhook updates appear without a browser refresh.
  useEffect(() => {
    refreshLiveData();

    const intervalId = window.setInterval(() => {
      refreshLiveData();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, []);

  // ============================================================
  // AUTONOMOUS RECOVERY
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

      // Backend is the source of truth.
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
  // RAZORPAY PAYMENT
  // ============================================================

  const handleRazorpayPayment = async (txnId) => {
    if (razorpayLoadingId) {
      return;
    }

    setRazorpayLoadingId(txnId);
    playClickSound();

    try {
      // --------------------------------------------------------
      // Create Razorpay order from backend
      // --------------------------------------------------------

      const response =
        await createRazorpayOrder(txnId);

      if (!response?.success) {
        throw new Error(
          "Unable to create Razorpay order."
        );
      }

      const order = response.order;

      if (!order?.id) {
        throw new Error(
          "Razorpay did not return an order ID."
        );
      }

      // --------------------------------------------------------
      // Make sure Razorpay Checkout is loaded
      // --------------------------------------------------------

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay Checkout failed to load. Please check index.html."
        );
      }

      // --------------------------------------------------------
      // Find matching RecoverAI case
      // --------------------------------------------------------

      const transaction = cases.find(
        (c) =>
          c.transaction_id === txnId ||
          c.id === txnId
      );

      // --------------------------------------------------------
      // Customer information
      // --------------------------------------------------------

      const customerName =
        transaction?.customer ||
        transaction?.customer_name ||
        "";

      const customerEmail =
        transaction?.email ||
        transaction?.customer_email ||
        "";

      // --------------------------------------------------------
      // Razorpay Checkout configuration
      // --------------------------------------------------------

      const options = {
        key: response.razorpay_key_id,

        amount: order.amount,

        currency:
          order.currency || "INR",

        name: "RecoverAI",

        description:
          "RecoverAI Revenue Recovery Payment",

        order_id: order.id,

        prefill: {
          name: customerName || "Priya Reddy",
          email: customerEmail || "priya@example.com",

          contact: (() => {
            const phone = String(
              transaction?.phone ||
              transaction?.mobile ||
              "9000090000"
            ).trim();

            const digits = phone.replace(/\D/g, "");

            return digits.startsWith("91")
              ? `+${digits}`
              : `+91${digits}`;
          })(),
        },

        notes: {
          recoverai_transaction_id: txnId,
        },

        theme: {
          color: "#00ff9d",
        },

        handler: function (
          paymentResponse
        ) {
          console.log(
            "Razorpay payment successful:",
            paymentResponse
          );

          showToast(
            "Payment received. RecoverAI is verifying the transaction."
          );

          /*
           * IMPORTANT:
           *
           * Do not mark the transaction as recovered
           * from the browser.
           *
           * Razorpay webhook is the source of truth.
           *
           * The backend will receive:
           *
           * payment.captured
           * order.paid
           *
           * and update MongoDB.
           */

          setTimeout(() => {
            showToast(
              "Razorpay payment completed successfully."
            );
            refreshLiveData();
          }, 1500);

          window.setTimeout(refreshLiveData, 3500);
          window.setTimeout(refreshLiveData, 6000);
        },

        modal: {
          ondismiss: function () {
            console.log(
              "Razorpay Checkout closed."
            );

            setRazorpayLoadingId(null);
          },
        },
      };

      // --------------------------------------------------------
      // Create Razorpay instance
      // --------------------------------------------------------

      const razorpay =
        new window.Razorpay(
          options
        );

      // --------------------------------------------------------
      // Listen for payment failure
      // --------------------------------------------------------

      razorpay.on(
        "payment.failed",
        function (response) {
          console.log(
            "Razorpay payment failed:",
            response?.error
          );

          showToast(
            "Payment failed. RecoverAI is initiating recovery."
          );

          refreshLiveData();
          window.setTimeout(refreshLiveData, 1500);
          window.setTimeout(refreshLiveData, 3500);
          window.setTimeout(refreshLiveData, 6000);

          /*
           * Do NOT directly call recoverTransaction()
           * here.
           *
           * Razorpay will send payment.failed to:
           *
           * /api/webhooks/razorpay
           *
           * The backend webhook will trigger
           * RecoverAI's actual recovery pipeline.
           */
        }
      );

      // --------------------------------------------------------
      // Open Checkout
      // --------------------------------------------------------

      razorpay.open();

      setRazorpayLoadingId(null);
    } catch (error) {
      console.error(
        "Razorpay payment error:",
        error
      );

      setRazorpayLoadingId(null);

      showToast(
        error?.message ||
        "Unable to open Razorpay Checkout."
      );
    }
  };

  // ============================================================
  // HUMAN APPROVAL
  // ============================================================

  const handleApproveCase = async (
    txnOrCaseId,
    notes
  ) => {
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
        showToast(
          `Case ${txnOrCaseId} was processed but is not marked recovered.`
        );
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

  // ============================================================
  // HUMAN REJECTION
  // ============================================================

  const handleRejectCase = (
    txnOrCaseId
  ) => {
    setCases((prev) =>
      prev.map((c) => {
        if (
          c.transaction_id ===
          txnOrCaseId ||
          c.case_id === txnOrCaseId
        ) {
          return {
            ...c,

            status: "failed",

            guardrail: {
              ...c.guardrail,

              reason:
                "Rejected by Human Operator",
            },
          };
        }

        return c;
      })
    );

    showToast(
      `Case ${txnOrCaseId} rejected and archived to Audit Trail.`
    );

    setSelectedReviewCase(
      null
    );

    refreshLiveData();
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="space-y-8 pb-12">

      {/* =====================================================
          1. HERO COMMAND BANNER
          ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">

        <div>
          <div className="flex items-center gap-2 mb-1">

            <span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_8px_#0284c7] radar-ping" />

            <span className="text-xs font-mono font-bold tracking-wider text-sky-700 uppercase">
              RecoverAI Mission Control
            </span>

          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Autonomous Revenue Recovery Engine
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 font-sans mt-0.5">
            Real-time failed payment diagnosis,
            automated retention, and deterministic
            safety guardrails.
          </p>
        </div>

        <div className="flex items-center gap-3">

          <div className="px-3.5 py-2 rounded-xl glass-panel text-xs font-mono text-slate-700 flex items-center gap-2 bg-white/90 border-slate-200 shadow-xs">

            <span className="w-2 h-2 rounded-full bg-emerald-500" />

            <span>
              Autonomous Mode:{" "}
              <strong className="text-slate-900">
                Active
              </strong>
            </span>

          </div>

        </div>

      </div>

      {/* =====================================================
          2. CORE METRICS
          ===================================================== */}

      <RevenueTracker
        metrics={metrics}
      />

      {/* =====================================================
          3. RAZORPAY TEST PAYMENT
          ===================================================== */}

      <GlassCard className="p-5">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <CreditCard size={20} />
            </div>

            <div>

              <div className="text-sm font-bold text-slate-900">
                Razorpay Payment Gateway
              </div>

              <div className="text-xs text-slate-500 mt-1">
                Test the live Razorpay →
                RecoverAI recovery flow.
              </div>

            </div>

          </div>

          <Button
            onClick={() =>
              handleRazorpayPayment(
                "pay_1002"
              )
            }
            disabled={
              razorpayLoadingId !== null
            }
          >
            {razorpayLoadingId ===
              "pay_1002" ? (
              <>
                <RefreshCw
                  size={15}
                  className="animate-spin"
                />
                Opening Checkout...
              </>
            ) : (
              <>
                <CreditCard
                  size={15}
                />
                Test ₹2,499 Payment
              </>
            )}
          </Button>

        </div>

      </GlassCard>

      {/* =====================================================
          4. LIVE RECOVERY STREAM
          ===================================================== */}

      <LiveCases
        cases={cases}
        onSelectCase={(item) =>
          setSelectedReviewCase(
            item
          )
        }
        onTriggerRecovery={
          handleTriggerRecovery
        }
        recoveringId={
          recoveringId
        }
        maxItems={5}
        onViewAll={
          onViewAllCases
        }
        searchQuery={
          searchQuery
        }
      />

      {/* =====================================================
          5. HIGH-RISK REVIEW MODAL
          ===================================================== */}

      {selectedReviewCase && (
        <HighRiskReviewPanel
          caseItem={
            selectedReviewCase
          }
          onClose={() =>
            setSelectedReviewCase(
              null
            )
          }
          onApprove={
            handleApproveCase
          }
          onReject={
            handleRejectCase
          }
          isApproving={
            isApproving
          }
        />
      )}

      {/* =====================================================
          6. TOAST
          ===================================================== */}

      {toastMessage && (
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 30,
            scale: 0.95,
          }}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-white/95 border border-emerald-300 text-slate-900 text-xs font-mono flex items-center gap-3 shadow-xl backdrop-blur-xl"
        >

          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle2
              size={16}
            />
          </div>

          <span>
            {toastMessage}
          </span>

        </motion.div>
      )}

    </div>
  );
}