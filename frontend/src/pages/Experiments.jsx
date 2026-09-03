import { useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Play, Pause, CheckCircle2, Zap, ArrowUpRight, BarChart2 } from "lucide-react";
import { use3DTilt } from "../hooks/use3DTilt";
import { playClickSound, playHoverSound } from "../lib/soundFX";

const EXPERIMENTS = [
    {
        id: "EXP-101",
        title: "Dynamic Smart-Retry Timing Window",
        description: "Optimizes retry intervals based on issuer bank traffic windows for card payment drops.",
        variantA: "Fixed 24hr Retry (Baseline)",
        variantB: "Adaptive 3-Tier AI Window (+14.2% Lift)",
        winRate: "94.8%",
        status: "Active Running",
        samples: "14,200 txns",
        gain: "+₹1,84,000"
    },
    {
        id: "EXP-102",
        title: "UPI Dynamic QR Fallback vs SMS Deep-Link",
        description: "Tests immediate web-view UPI QR generation against SMS action triggers.",
        variantA: "SMS Trigger Link",
        variantB: "In-App Instant UPI QR (+22.6% Lift)",
        winRate: "98.1%",
        status: "Concluded",
        samples: "8,900 txns",
        gain: "+₹2,42,500"
    },
    {
        id: "EXP-103",
        title: "AI Tone Selection: Urgency vs Assistance",
        description: "Evaluates recovery messaging copy tone across high-churn subscription renewals.",
        variantA: "Direct Warning",
        variantB: "Concierge Assistance (+8.4% Lift)",
        winRate: "89.2%",
        status: "Active Running",
        samples: "5,400 txns",
        gain: "+₹68,000"
    }
];

function ExperimentCard({ exp }) {
    const tiltProps = use3DTilt({ maxTilt: 8, scale: 1.01 });

    return (
        <div
            {...tiltProps}
            className="tilt-3d glass-card-hud"
            onMouseEnter={() => {
                tiltProps.onMouseEnter();
                playHoverSound();
            }}
            style={{ padding: "24px", borderRadius: "18px" }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                    <span style={{ fontSize: "11px", fontFamily: "DM Mono", color: "var(--purple)" }}>{exp.id}</span>
                    <h3 style={{ margin: "4px 0 6px 0", fontSize: "18px", color: "var(--text)" }}>{exp.title}</h3>
                </div>
                <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: "20px",
                    background: exp.status.includes("Active") ? "rgba(5, 150, 105, 0.1)" : "rgba(124, 58, 237, 0.1)",
                    color: exp.status.includes("Active") ? "var(--success)" : "var(--purple)",
                    border: `1px solid ${exp.status.includes("Active") ? "rgba(5, 150, 105, 0.2)" : "rgba(124, 58, 237, 0.2)"}`
                }}>
                    {exp.status}
                </span>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 20px 0", lineHeight: 1.5 }}>
                {exp.description}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
                <div style={{ background: "var(--surface-2)", padding: "14px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>VARIANT A (CONTROL)</span>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{exp.variantA}</span>
                </div>
                <div style={{ background: "rgba(124,58,237,0.06)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(124,58,237,0.2)" }}>
                    <span style={{ fontSize: "10px", color: "var(--purple)", display: "block", marginBottom: "4px" }}>VARIANT B (AI WINNER)</span>
                    <span style={{ fontSize: "12px", color: "var(--text)", fontWeight: 600 }}>{exp.variantB}</span>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", gap: "20px" }}>
                    <div>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>WIN CONFIDENCE</span>
                        <strong style={{ fontSize: "15px", color: "var(--success)" }}>{exp.winRate}</strong>
                    </div>
                    <div>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>TOTAL RECOVERY LIFT</span>
                        <strong style={{ fontSize: "15px", color: "var(--purple)" }}>{exp.gain}</strong>
                    </div>
                </div>
                <button
                    onClick={playClickSound}
                    style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        padding: "8px 16px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}
                >
                    <BarChart2 size={14} /> View Telemetry
                </button>
            </div>
        </div>
    );
}

export default function Experiments() {
    return (
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="glass-card-hud" style={{ padding: "28px", borderRadius: "20px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--purple)", fontSize: "11px", fontFamily: "DM Mono", marginBottom: "8px" }}>
                    <FlaskConical size={14} /> AUTONOMOUS A/B HYPOTHESIS TESTING LAB
                </div>
                <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>AI Recovery Experiments</h1>
                <p style={{ margin: "6px 0 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>
                    Continuous machine learning strategy optimization to maximize authorization rates.
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {EXPERIMENTS.map(exp => (
                    <ExperimentCard key={exp.id} exp={exp} />
                ))}
            </div>
        </div>
    );
}
