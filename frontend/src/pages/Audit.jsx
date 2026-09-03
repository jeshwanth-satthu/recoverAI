import { useState } from "react";
import { ScrollText, ShieldCheck, Lock, CheckCircle2, Terminal, Filter } from "lucide-react";
import { use3DTilt } from "../hooks/use3DTilt";
import { playClickSound, playHoverSound } from "../lib/soundFX";

const AUDIT_LOGS = [
    { id: "LOG-8891", timestamp: "2026-09-02 14:05:12", event: "RECOVERY_EXECUTED", transactionId: "TXN-901283", guardrailCheck: "PASSED (Risk: 14%)", hash: "0x9f8a...3b2a", status: "VERIFIED" },
    { id: "LOG-8890", timestamp: "2026-09-02 13:58:44", event: "HUMAN_APPROVAL_REQUESTED", transactionId: "TXN-771249", guardrailCheck: "PAUSED (Amount > ₹50k Limit)", hash: "0x7c1d...8e91", status: "PENDING" },
    { id: "LOG-8889", timestamp: "2026-09-02 13:42:01", event: "DIAGNOSIS_COMPLETED", transactionId: "TXN-901283", guardrailCheck: "INSUFFICIENT_FUNDS", hash: "0x3e4b...1a8f", status: "VERIFIED" },
    { id: "LOG-8888", timestamp: "2026-09-02 13:30:19", event: "RECOVERY_EXECUTED", transactionId: "TXN-654129", guardrailCheck: "PASSED (Risk: 8%)", hash: "0x1d9c...4f2e", status: "VERIFIED" },
    { id: "LOG-8887", timestamp: "2026-09-02 13:11:05", event: "GUARDRAIL_EVALUATED", transactionId: "TXN-654129", guardrailCheck: "COMPLIANT", hash: "0x8a2f...6c1d", status: "VERIFIED" },
];

function AuditRow({ log }) {
    const tiltProps = use3DTilt({ maxTilt: 4, scale: 1.005 });

    return (
        <div
            {...tiltProps}
            className="tilt-3d glass-card-hud"
            onMouseEnter={() => {
                tiltProps.onMouseEnter();
                playHoverSound();
            }}
            style={{
                padding: "16px 20px",
                borderRadius: "12px",
                display: "grid",
                gridTemplateColumns: "120px 160px 1fr 180px 120px 100px",
                alignItems: "center",
                gap: "14px",
                fontSize: "13px",
                cursor: "pointer"
            }}
        >
            <span style={{ fontFamily: "DM Mono", color: "var(--purple)", fontSize: "11px", fontWeight: 600 }}>{log.id}</span>
            <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>{log.timestamp}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Terminal size={14} style={{ color: "var(--cyan)" }} />
                <strong style={{ color: "var(--text)" }}>{log.event}</strong>
            </div>
            <span style={{ fontFamily: "DM Mono", color: "var(--text-secondary)", fontSize: "11px" }}>{log.transactionId}</span>
            <span style={{ fontFamily: "DM Mono", color: "var(--text-muted)", fontSize: "10px" }}>{log.hash}</span>
            <span style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "12px",
                textAlign: "center",
                background: log.status === "VERIFIED" ? "rgba(5,150,105,0.1)" : "rgba(217,119,6,0.1)",
                color: log.status === "VERIFIED" ? "var(--success)" : "var(--warning)",
                border: `1px solid ${log.status === "VERIFIED" ? "rgba(5,150,105,0.2)" : "rgba(217,119,6,0.2)"}`
            }}>
                {log.status}
            </span>
        </div>
    );
}

export default function Audit() {
    return (
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="glass-card-hud" style={{ padding: "28px", borderRadius: "20px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--success)", fontSize: "11px", fontFamily: "DM Mono", marginBottom: "8px" }}>
                    <Lock size={14} /> IMMUTABLE AUDIT TRAIL LOGS
                </div>
                <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>Cryptographic Audit Logs</h1>
                <p style={{ margin: "6px 0 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>
                    Complete tamper-proof history of AI decisions, guardrail validations, and automated revenue recoveries.
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{
                    padding: "10px 20px",
                    display: "grid",
                    gridTemplateColumns: "120px 160px 1fr 180px 120px 100px",
                    gap: "14px",
                    fontSize: "11px",
                    fontFamily: "DM Mono",
                    color: "var(--text-muted)"
                }}>
                    <span>LOG ID</span>
                    <span>TIMESTAMP</span>
                    <span>ACTION EVENT</span>
                    <span>TRANSACTION ID</span>
                    <span>SHA-256 HASH</span>
                    <span>STATUS</span>
                </div>

                {AUDIT_LOGS.map(log => (
                    <AuditRow key={log.id} log={log} />
                ))}
            </div>
        </div>
    );
}
