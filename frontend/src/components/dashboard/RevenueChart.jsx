import React, { useState } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

const HOURLY_DATA = [
    { time: "09:00", atRisk: 45000, recovered: 32000 },
    { time: "10:00", atRisk: 62000, recovered: 58000 },
    { time: "11:00", atRisk: 38000, recovered: 34000 },
    { time: "12:00", atRisk: 89000, recovered: 76000 },
    { time: "13:00", atRisk: 54000, recovered: 49000 },
    { time: "14:00", atRisk: 98000, recovered: 92000 },
    { time: "15:00", atRisk: 115000, recovered: 108000 },
];

const DAILY_DATA = [
    { time: "Mon", atRisk: 240000, recovered: 210000 },
    { time: "Tue", atRisk: 310000, recovered: 285000 },
    { time: "Wed", atRisk: 180000, recovered: 165000 },
    { time: "Thu", atRisk: 420000, recovered: 390000 },
    { time: "Fri", atRisk: 390000, recovered: 375000 },
    { time: "Sat", atRisk: 150000, recovered: 142000 },
    { time: "Sun", atRisk: 280000, recovered: 268000 },
];

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(124, 58, 237, 0.2)",
                padding: "10px 14px",
                borderRadius: "10px",
                boxShadow: "0 10px 25px rgba(15, 23, 42, 0.1)",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px"
            }}>
                <strong style={{ color: "#0f172a", display: "block", marginBottom: "6px" }}>{label} Telemetry</strong>
                <div style={{ color: "#7c3aed", fontWeight: 600 }}>
                    Recovered: ₹{payload[0]?.value?.toLocaleString("en-IN")}
                </div>
                <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>
                    At Risk: ₹{payload[1]?.value?.toLocaleString("en-IN")}
                </div>
            </div>
        );
    }
    return null;
}

export default function RevenueChart() {
    const [timeframe, setTimeframe] = useState("hourly");
    const data = timeframe === "hourly" ? HOURLY_DATA : DAILY_DATA;

    return (
        <div className="glass-card-hud" style={{ padding: "22px", borderRadius: "18px", marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <span style={{ fontSize: "10px", fontFamily: "DM Mono", color: "#7c3aed", fontWeight: 600 }}>
                        REAL-TIME REVENUE ANALYTICS
                    </span>
                    <h3 style={{ margin: "4px 0 0 0", fontSize: "16px", color: "#0f172a" }}>
                        Autonomous Recovery Yield
                    </h3>
                </div>

                <div style={{ display: "flex", gap: "6px", background: "rgba(15, 23, 42, 0.05)", padding: "3px", borderRadius: "8px" }}>
                    <button
                        onClick={() => setTimeframe("hourly")}
                        style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            border: 0,
                            cursor: "pointer",
                            background: timeframe === "hourly" ? "#7c3aed" : "transparent",
                            color: timeframe === "hourly" ? "#ffffff" : "#475569"
                        }}
                    >
                        24 Hours
                    </button>
                    <button
                        onClick={() => setTimeframe("daily")}
                        style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            border: 0,
                            cursor: "pointer",
                            background: timeframe === "daily" ? "#7c3aed" : "transparent",
                            color: timeframe === "daily" ? "#ffffff" : "#475569"
                        }}
                    >
                        7 Days
                    </button>
                </div>
            </div>

            <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="atRiskGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                        <Tooltip content={<CustomTooltip />} />

                        <Area
                            type="monotone"
                            dataKey="recovered"
                            stroke="#7c3aed"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#recoveredGrad)"
                        />
                        <Area
                            type="monotone"
                            dataKey="atRisk"
                            stroke="#94a3b8"
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            fillOpacity={1}
                            fill="url(#atRiskGrad)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
