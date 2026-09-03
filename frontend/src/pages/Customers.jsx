import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Search, ShieldCheck, AlertCircle, ArrowUpRight, TrendingUp, Cpu } from "lucide-react";
import { use3DTilt } from "../hooks/use3DTilt";
import { playClickSound, playHoverSound } from "../lib/soundFX";

const MOCK_CUSTOMERS = [
    { id: "CUST-9012", name: "Aarav Sharma", plan: "Enterprise", LTV: "₹1,45,000", riskScore: 12, recoveredRevenue: "₹24,500", status: "Healthy", gateway: "Stripe India" },
    { id: "CUST-8431", name: "Priya Patel", plan: "Pro Tier", LTV: "₹89,000", riskScore: 48, recoveredRevenue: "₹12,200", status: "Attention Needed", gateway: "Razorpay" },
    { id: "CUST-7219", name: "Vikram Malhotra", plan: "Enterprise", LTV: "₹3,20,000", riskScore: 82, recoveredRevenue: "₹65,000", status: "High Risk", gateway: "PayU" },
    { id: "CUST-6104", name: "Ananya Iyer", plan: "Growth", LTV: "₹42,000", riskScore: 5, recoveredRevenue: "₹0", status: "Optimal", gateway: "Stripe Global" },
    { id: "CUST-5590", name: "Rohan Verma", plan: "Enterprise", LTV: "₹2,10,000", riskScore: 28, recoveredRevenue: "₹38,900", status: "Healthy", gateway: "Razorpay" },
];

function Customer3DCard({ customer }) {
    const tiltProps = use3DTilt({ maxTilt: 10, scale: 1.02 });

    return (
        <div
            {...tiltProps}
            className="tilt-3d glass-card-hud"
            onMouseEnter={() => {
                tiltProps.onMouseEnter();
                playHoverSound();
            }}
            style={{ padding: "20px", borderRadius: "16px", cursor: "pointer" }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                    <span style={{ fontSize: "11px", fontFamily: "DM Mono", color: "var(--purple)" }}>{customer.id}</span>
                    <h3 style={{ margin: "4px 0 2px 0", fontSize: "16px", color: "var(--text)" }}>{customer.name}</h3>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{customer.plan} • {customer.gateway}</span>
                </div>
                <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "20px",
                    background: customer.riskScore > 50 ? "rgba(225, 29, 72, 0.1)" : customer.riskScore > 30 ? "rgba(217, 119, 6, 0.1)" : "rgba(5, 150, 105, 0.1)",
                    color: customer.riskScore > 50 ? "var(--danger)" : customer.riskScore > 30 ? "var(--warning)" : "var(--success)",
                    border: `1px solid ${customer.riskScore > 50 ? "rgba(225, 29, 72, 0.2)" : customer.riskScore > 30 ? "rgba(217, 119, 6, 0.2)" : "rgba(5, 150, 105, 0.2)"}`
                }}>
                    {customer.status}
                </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--surface-2)", padding: "12px", borderRadius: "10px" }}>
                <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>LTV VALUE</span>
                    <strong style={{ fontSize: "14px", color: "var(--text)" }}>{customer.LTV}</strong>
                </div>
                <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>RECOVERED</span>
                    <strong style={{ fontSize: "14px", color: "var(--success)" }}>{customer.recoveredRevenue}</strong>
                </div>
            </div>

            <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>AI Risk Index: <b style={{ color: "var(--purple)" }}>{customer.riskScore}%</b></span>
                <span style={{ fontSize: "11px", color: "var(--cyan)", display: "flex", alignItems: "center", gap: "4px" }}>
                    Telemetry <ArrowUpRight size={12} />
                </span>
            </div>
        </div>
    );
}

export default function Customers() {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        return MOCK_CUSTOMERS.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.id.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    return (
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* HERO HEADER */}
            <div className="glass-card-hud" style={{ padding: "28px", borderRadius: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--purple)", fontSize: "11px", fontFamily: "DM Mono", marginBottom: "8px" }}>
                            <Cpu size={14} /> CUSTOMER REVENUE INTELLIGENCE MATRIX
                        </div>
                        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>Customer Risk & Recovery Profiles</h1>
                        <p style={{ margin: "6px 0 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>
                            Real-time AI failure risk scoring and automated LTV retention metrics.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "320px", position: "relative" }}>
                        <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search customer profiles..."
                            style={{
                                width: "100%",
                                padding: "10px 12px 10px 38px",
                                borderRadius: "12px",
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                                fontSize: "13px"
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* CUSTOMERS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                {filtered.map(cust => (
                    <Customer3DCard key={cust.id} customer={cust} />
                ))}
            </div>
        </div>
    );
}
