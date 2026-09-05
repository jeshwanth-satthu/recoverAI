import React from "react";
import {
  CreditCard,
  Brain,
  TrendingUp,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from "lucide-react";
import GlassCard from "../ui/GlassCard";

const PIPELINE_NODES = [
  {
    id: "transaction",
    label: "TRANSACTION",
    icon: CreditCard,
  },
  {
    id: "diagnosis",
    label: "DIAGNOSIS",
    icon: Brain,
  },
  {
    id: "strategy",
    label: "ML STRATEGY",
    icon: TrendingUp,
  },
  {
    id: "guardrail",
    label: "GUARDRAIL",
    icon: ShieldCheck,
  },
  {
    id: "execution",
    label: "EXECUTION",
    icon: Zap,
  },
  {
    id: "verification",
    label: "VERIFICATION",
    icon: CheckCircle2,
  },
];

export default function RecoveryPipelineDiagram() {
  return (
    <GlassCard id="recovery-pipeline-section" className="relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-6 border-b border-[#cecac8]">
        <div>
          <span className="text-[11px] font-mono tracking-wider uppercase text-[#797776]">
            SYSTEM TOPOLOGY / CLOSED-LOOP PIPELINE
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#242424] mt-1">
            Autonomous Recovery Pipeline
          </h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#4e4d4d]">
          <span className="size-1.5 rounded-full bg-[#2b59d1] animate-pulse" />
          <span>Active Flow</span>
        </div>
      </div>

      {/* PIPELINE NODES CONNECTED BY HAIRLINE LINES */}
      <div className="mt-8 pt-2">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-0 relative">
          {PIPELINE_NODES.map((node, index) => {
            const Icon = node.icon;
            const isLast = index === PIPELINE_NODES.length - 1;

            return (
              <React.Fragment key={node.id}>
                {/* Node Pill */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-[#cecac8] bg-[#f6f3f1] hover:border-[#242424] transition-all whitespace-nowrap shadow-none">
                  <div className="size-5 rounded-full flex items-center justify-center text-[#242424]">
                    <Icon size={13} />
                  </div>
                  <span className="font-mono text-[11px] font-medium tracking-wider uppercase text-[#242424]">
                    {node.label}
                  </span>
                </div>

                {/* Connecting hairline line */}
                {!isLast && (
                  <div className="flex-1 w-0.5 lg:w-auto h-5 lg:h-[1px] bg-[#cecac8] relative overflow-hidden my-1 lg:my-0 min-w-[16px]">
                    <div className="absolute inset-0 bg-[#2b59d1]/40 animate-pulse" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Technical Sub-Caption */}
        <div className="mt-8 pt-4 border-t border-[#cecac8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#797776]">
          <span>AI diagnoses → ML chooses strategy → Guardrails control execution → Verifier confirms</span>
          <span className="text-[#242424] tracking-wide">AI RECOMMENDS. HUMANS AUTHORIZE.</span>
        </div>
      </div>
    </GlassCard>
  );
}
