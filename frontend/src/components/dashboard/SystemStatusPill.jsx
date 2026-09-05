import React from "react";
import GlassCard from "../ui/GlassCard";

export default function SystemStatusPill({ isDbConnected = true }) {
  const systems = [
    { label: "RECOVERY ENGINE", status: "ONLINE", isGreen: true },
    { label: "GEMINI ENGINE", status: "ONLINE", isGreen: true },
    { label: "RAZORPAY GATEWAY", status: "ONLINE", isGreen: true },
    {
      label: "MONGODB CLUSTER",
      status: isDbConnected ? "ONLINE" : "STANDBY",
      isGreen: isDbConnected,
    },
    { label: "WEBHOOK LOCKS", status: "ACTIVE", isGreen: true },
    { label: "SAFETY GUARDRAILS", status: "ENFORCING", isGreen: true },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-[28px] border border-[#cecac8] bg-[#f6f3f1]">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#797776]">
          <span className="size-2 rounded-full bg-[#059669] animate-pulse" />
          <span className="text-[#242424] font-medium">INFRASTRUCTURE STATUS</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {systems.map((s) => (
            <div
              key={s.label}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#cecac8] bg-[#f6f3f1] font-mono text-[10px] uppercase tracking-wider text-[#242424]"
            >
              <span
                className={`size-1.5 rounded-full ${
                  s.isGreen ? "bg-[#059669]" : "bg-[#f37a0a]"
                }`}
              />
              <span className="text-[#797776]">{s.label}</span>
              <span className="font-medium text-[#242424]">{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
