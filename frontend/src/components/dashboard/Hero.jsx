import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Layers, Box } from "lucide-react";
import heroPipeline4kWebp from "../../assets/hero-pipeline-4k.webp";
import heroPipeline8kWebp from "../../assets/hero-pipeline-8k.webp";
import heroPipeline4kPng from "../../assets/hero-pipeline-4k.png";
import heroPipeline8kPng from "../../assets/hero-pipeline-8k.png";
import RecoveryCoreScene from "../scroll-experience/RecoveryCoreScene";

export default function Hero({
  metrics = {},
  onViewPipeline,
  onExploreCases,
  pulseRecovery = false,
}) {
  const [viewMode, setViewMode] = useState("render"); // "render" or "interactive"
  const potentialRecoveryValue =
    metrics?.potential_recovery ||
    (metrics?.revenue_at_risk
      ? `₹${Math.round(Number(metrics.revenue_at_risk) * 0.734).toLocaleString("en-IN")}`
      : "₹0");

  const handleScrollToPipeline = () => {
    if (onViewPipeline) {
      onViewPipeline();
      return;
    }
    const el =
      document.getElementById("recovery-pipeline-section") ||
      document.getElementById("pipeline-diagram");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScrollToCases = () => {
    if (onExploreCases) {
      onExploreCases();
      return;
    }
    const el =
      document.getElementById("cases-section") ||
      document.getElementById("live-cases-table");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full pt-4 pb-10 md:pt-6 md:pb-14">
      {/* Subtle Atmospheric Gradient Wash */}
      <div className="absolute atmospheric-wash-coral-sky -top-12 -left-12 w-[340px] md:w-[480px] h-[240px] md:h-[320px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* =====================================================
            LEFT COLUMN: EDITORIAL REVENUE RECOVERY TYPOGRAPHY
            ===================================================== */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-6 z-10">
          {/* Monospace Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full border border-[#cecac8] bg-[#f6f3f1] font-mono text-[11px] uppercase tracking-wider text-[#242424]">
            <span className="size-1.5 rounded-full bg-[#059669] animate-pulse" />
            <span>AUTONOMOUS RECOVERY ENGINE / ONLINE</span>
          </div>

          {/* Section Brand Tag & Editorial Headline */}
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#797776] block mb-2">
              RECOVERAI
            </span>
            <h1 className="font-serif text-5xl sm:text-6xl md:text-[68px] font-normal text-[#242424] tracking-tight leading-[1.08]">
              Autonomous<br />
              Revenue Recovery
            </h1>
          </div>

          {/* Value Proposition Description */}
          <p className="font-mono text-xs sm:text-[13px] text-[#4e4d4d] max-w-[490px] leading-relaxed">
            Recover failed payments before they become lost revenue. AI diagnoses
            root cause, optimizes strategy, enforces deterministic guardrails, and
            learns continuously from human feedback.
          </p>

          {/* Key Metrics Row (3 Columns) */}
          <div className="grid grid-cols-3 gap-6 sm:gap-8 pt-1 max-w-[500px]">
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-normal text-[#242424]">
                {potentialRecoveryValue}
              </div>
              <div className="font-mono text-[10px] tracking-wider uppercase text-[#797776] mt-1">
                POTENTIAL RECOVERY
              </div>
            </div>
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-normal text-[#242424]">
                94.2%
              </div>
              <div className="font-mono text-[10px] tracking-wider uppercase text-[#797776] mt-1">
                DIAGNOSIS ACCURACY
              </div>
            </div>
            <div>
              <div className="font-serif text-3xl sm:text-4xl font-normal text-[#242424]">
                3.1x
              </div>
              <div className="font-mono text-[10px] tracking-wider uppercase text-[#797776] mt-1">
                FASTER RECOVERY
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleScrollToPipeline}
              className="px-8 py-3.5 rounded-[100px] bg-[#242424] text-[#f6f3f1] hover:bg-[#383838] font-mono text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer shadow-none group"
            >
              <span>VIEW RECOVERY PIPELINE</span>
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>

            <button
              type="button"
              onClick={handleScrollToCases}
              className="px-8 py-3.5 rounded-[100px] border border-[#242424] bg-transparent text-[#242424] hover:bg-[#242424] hover:text-[#f6f3f1] font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>EXPLORE CASES</span>
            </button>
          </div>

          {/* Micro Status Line */}
          <div className="flex items-center gap-2.5 pt-2 text-[#059669] font-mono text-[10px] sm:text-[11px] uppercase tracking-wider">
            <svg
              width="20"
              height="12"
              viewBox="0 0 24 14"
              fill="none"
              stroke="#059669"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M1 7h4l3-5 4 10 3-7 3 4h5" />
            </svg>
            <span className="text-[#797776]">
              TURNING FAILED PAYMENTS INTO REVENUE AGAIN
            </span>
          </div>
        </div>

        {/* =====================================================
            RIGHT COLUMN: 3D ISOMETRIC PIPELINE ILLUSTRATION
            ===================================================== */}
        <div className="lg:col-span-6 xl:col-span-7 relative flex flex-col items-center justify-center select-none">
          {/* Subtle Mode Switch Pill */}
          <div className="self-end mb-2 flex items-center gap-1 p-1 rounded-full border border-[#cecac8] bg-[#f6f3f1] text-[10px] font-mono z-20">
            <button
              type="button"
              onClick={() => setViewMode("render")}
              className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors cursor-pointer ${
                viewMode === "render"
                  ? "bg-[#242424] text-[#f6f3f1] font-medium"
                  : "text-[#797776] hover:text-[#242424]"
              }`}
            >
              <Layers size={11} />
              <span>8K RENDER</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("interactive")}
              className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors cursor-pointer ${
                viewMode === "interactive"
                  ? "bg-[#242424] text-[#f6f3f1] font-medium"
                  : "text-[#797776] hover:text-[#242424]"
              }`}
            >
              <Box size={11} />
              <span>LIVE 3D SCENE</span>
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative w-full max-w-[680px]"
          >
            {/* Subtle atmospheric glow behind the 3D pipeline */}
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#cfdaf5]/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#a7fccd]/20 rounded-full blur-3xl pointer-events-none" />

            {viewMode === "render" ? (
              <picture>
                <source
                  type="image/webp"
                  srcSet={`${heroPipeline4kWebp} 1x, ${heroPipeline8kWebp} 2x`}
                />
                <source
                  type="image/png"
                  srcSet={`${heroPipeline4kPng} 1x, ${heroPipeline8kPng} 2x`}
                />
                <img
                  src={heroPipeline4kWebp}
                  alt="Autonomous Revenue Recovery 3D Pipeline — Intelligence, Diagnosis, Strategy, Guardrails, Execution, Verification, Recovery"
                  className="w-full h-auto object-contain select-none pointer-events-none"
                  loading="eager"
                  decoding="async"
                />
              </picture>
            ) : (
              <div className="border border-[#cecac8] rounded-[32px] overflow-hidden bg-[#f6f3f1]">
                <RecoveryCoreScene
                  progress={0.5}
                  activeStageIndex={3}
                  pulseRecovery={pulseRecovery}
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
