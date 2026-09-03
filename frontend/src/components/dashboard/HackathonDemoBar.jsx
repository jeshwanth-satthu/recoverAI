import React from "react";
import { Zap, Play, ShieldAlert, Sparkles, Cpu } from "lucide-react";
import { playClickSound, playSuccessSound } from "../../lib/soundFX";

export default function HackathonDemoBar({
    onSimulateFailure,
    onBatchRecover,
    onSimulateGuardrail,
    isSimulating
}) {
    return (
        <div
            className="glass-card-hud"
            style={{
                padding: "16px 20px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(2, 132, 199, 0.08))",
                border: "1.5px solid rgba(124, 58, 237, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
                marginBottom: "20px"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #7c3aed, #0284c7)",
                    display: "grid",
                    placeItems: "center",
                    color: "#ffffff"
                }}>
                    <Sparkles size={18} />
                </div>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <strong style={{ fontSize: "14px", color: "#0f172a" }}>HACKATHON DEMO CONTROL CENTER</strong>
                        <span style={{
                            fontSize: "9px",
                            fontFamily: "DM Mono",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "#7c3aed",
                            color: "#ffffff"
                        }}>
                            JUDGE PRESETS
                        </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#475569" }}>
                        One-click instant simulation of AI autonomous recovery pipeline.
                    </span>
                </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                    onClick={() => {
                        playClickSound();
                        onSimulateFailure();
                    }}
                    disabled={isSimulating}
                    style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        background: "#0284c7",
                        color: "#ffffff",
                        border: 0,
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)"
                    }}
                >
                    <Zap size={14} /> Simulate Live Payment Drop
                </button>

                <button
                    onClick={() => {
                        playClickSound();
                        onBatchRecover();
                    }}
                    disabled={isSimulating}
                    style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        background: "#7c3aed",
                        color: "#ffffff",
                        border: 0,
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)"
                    }}
                >
                    <Play size={14} /> Auto-Recover All Cases
                </button>

                <button
                    onClick={() => {
                        playClickSound();
                        onSimulateGuardrail();
                    }}
                    disabled={isSimulating}
                    style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        background: "#ffffff",
                        border: "1px solid rgba(15, 23, 42, 0.15)",
                        color: "#0f172a",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}
                >
                    <ShieldAlert size={14} style={{ color: "#d97706" }} /> Test Guardrail Block
                </button>
            </div>
        </div>
    );
}
