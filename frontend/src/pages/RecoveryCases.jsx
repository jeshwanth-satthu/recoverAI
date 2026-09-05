import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    RefreshCw,
    ShieldCheck,
    Bot,
    Zap,
    AlertTriangle,
    CheckCircle2,
    UserRound,
    ChevronRight,
    X,
} from "lucide-react";

import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

import {
    getRecoveryCases,
    recoverTransaction,
} from "../services/api";


function money(value = 0) {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}


function getStatus(item) {
    if (
        item?.guardrail?.requires_human_approval ||
        item?.status === "human_approval" ||
        (item?.guardrail && item?.guardrail?.passed === false)
    ) {
        return "human_approval";
    }

    if (
        (item?.verification?.recovered || item?.status === "recovered") &&
        (Number(item?.amount_recovered || 0) > 0 || item?.verification?.verified)
    ) {
        return "recovered";
    }

    return "pending";
}



function StatusIcon({ status }) {
    if (status === "recovered") {
        return <CheckCircle2 size={15} />;
    }

    if (status === "human_approval") {
        return <UserRound size={15} />;
    }

    return <AlertTriangle size={15} />;
}


function PipelineStep({
    number,
    title,
    description,
    icon: Icon,
    active = true,
    danger = false,
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`case-pipeline-step ${active ? "active" : ""}`}
        >
            <div className="case-pipeline-number">
                {number}
            </div>

            <div
                className="case-pipeline-icon"
                style={
                    danger
                        ? {
                            color: "var(--warning)",
                            borderColor:
                                "rgba(255,191,103,.4)",
                        }
                        : undefined
                }
            >
                <Icon size={16} />
            </div>

            <strong>{title}</strong>

            <span>{description}</span>
        </motion.div>
    );
}


export default function RecoveryCases() {
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] =
        useState(null);

    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);

    const [executing, setExecuting] =
        useState(false);

    const [error, setError] = useState(null);


    async function loadCases(showRefresh = false) {
        try {
            if (showRefresh) {
                setRefreshing(true);
            }

            const result =
                await getRecoveryCases();

            setCases(
                Array.isArray(result?.cases)
                    ? result.cases
                    : []
            );

            setError(null);
        } catch (err) {
            console.error(err);
            setError(
                err?.message ||
                "Unable to load recovery cases."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }


    useEffect(() => {
        loadCases();

        const interval = setInterval(
            () => loadCases(),
            30000
        );

        return () => clearInterval(interval);
    }, []);


    const filteredCases = useMemo(() => {
        const normalized =
            query.trim().toLowerCase();

        return cases.filter((item) => {
            const status = getStatus(item);

            const matchesFilter =
                filter === "all" ||
                status === filter;

            if (!matchesFilter) {
                return false;
            }

            if (!normalized) {
                return true;
            }

            const searchable = [
                item?.case_id,
                item?.transaction_id,
                item?.customer,
                item?.failure_reason,
                item?.risk_level,
                item?.status,
                status,
                item?.diagnosis?.diagnosis,
                item?.decision?.action,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchable.includes(normalized);
        });
    }, [cases, query, filter]);


    async function executeRecovery(item) {
        const transactionId =
            item?.transaction_id;

        if (!transactionId) {
            return;
        }

        try {
            setExecuting(true);

            const result =
                await recoverTransaction(
                    transactionId
                );

            const updated = result?.case || result;
            setSelectedCase(updated);

            await loadCases();
        } catch (err) {
            setError(
                err?.message ||
                "Recovery execution failed."
            );
        } finally {
            setExecuting(false);
        }
    }


    return (
        <div
            className="dashboard"
            style={{ paddingTop: "28px" }}
        >
            {/* HEADER */}

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="section-header"
            >
                <div>
                    <div className="section-label">
                        RECOVERY OPERATIONS
                    </div>

                    <h2
                        style={{
                            fontSize: "28px",
                            marginTop: "8px",
                        }}
                    >
                        Recovery Cases
                    </h2>

                    <p
                        style={{
                            marginTop: "7px",
                            color: "#596274",
                            fontSize: "9px",
                        }}
                    >
                        Investigate every AI recovery decision
                        from trigger to verification.
                    </p>
                </div>

                <Button
                    variant="secondary"
                    onClick={() => loadCases(true)}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={13}
                        style={{
                            animation: refreshing
                                ? "spin 1s linear infinite"
                                : "none",
                        }}
                    />

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}
                </Button>
            </motion.div>


            {/* ERROR */}

            {error && (
                <GlassCard
                    style={{
                        marginTop: "16px",
                        padding: "13px",
                        color: "var(--danger)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "9px",
                        }}
                    >
                        <AlertTriangle size={14} />
                        {error}
                    </div>
                </GlassCard>
            )}


            {/* FILTERS */}

            <GlassCard
                style={{
                    marginTop: "18px",
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                }}
            >
                <div
                    className="search"
                    style={{
                        position: "relative",
                        width: "280px",
                    }}
                >
                    <Search size={14} />

                    <input
                        value={query}
                        onChange={(event) =>
                            setQuery(event.target.value)
                        }
                        placeholder="Search cases..."
                    />
                </div>


                {[
                    ["all", "All"],
                    [
                        "human_approval",
                        "Human approval",
                    ],
                    [
                        "recovered",
                        "Recovered",
                    ],
                    ["pending", "Pending"],
                ].map(([value, label]) => (
                    <button
                        key={value}
                        className={
                            filter === value
                                ? "ui-button ui-button-primary"
                                : "ui-button ui-button-secondary"
                        }
                        style={{
                            padding: "8px 11px",
                            fontSize: "8px",
                        }}
                        onClick={() =>
                            setFilter(value)
                        }
                    >
                        {label}
                    </button>
                ))}


                <div
                    style={{
                        marginLeft: "auto",
                        color: "#596274",
                        fontFamily:
                            "DM Mono, monospace",
                        fontSize: "8px",
                    }}
                >
                    {filteredCases.length} CASES
                </div>
            </GlassCard>


            {/* CASE TABLE */}

            <GlassCard
                style={{
                    marginTop: "12px",
                    overflow: "hidden",
                }}
            >
                {loading ? (
                    <div
                        style={{
                            padding: "60px 20px",
                            textAlign: "center",
                            color: "#596274",
                            fontSize: "9px",
                        }}
                    >
                        Loading recovery intelligence...
                    </div>
                ) : filteredCases.length === 0 ? (
                    <div
                        style={{
                            padding: "60px 20px",
                            textAlign: "center",
                            color: "#596274",
                            fontSize: "9px",
                        }}
                    >
                        No recovery cases match your filters.
                    </div>
                ) : (
                    filteredCases.map((item, index) => {
                        const status = getStatus(item);

                        return (
                            <motion.button
                                key={
                                    item.case_id ||
                                    item.transaction_id ||
                                    index
                                }
                                initial={{
                                    opacity: 0,
                                    x: -10,
                                }}
                                animate={{
                                    opacity: 1,
                                    x: 0,
                                }}
                                transition={{
                                    delay: index * 0.04,
                                }}
                                onClick={() =>
                                    setSelectedCase(item)
                                }
                                style={{
                                    width: "100%",
                                    display: "grid",
                                    gridTemplateColumns:
                                        "38px minmax(150px,1fr) 150px 120px 110px 20px",
                                    alignItems: "center",
                                    gap: "14px",
                                    padding: "15px 18px",
                                    border: 0,
                                    borderBottom:
                                        "1px solid rgba(255,255,255,.045)",
                                    color: "inherit",
                                    background: "transparent",
                                    textAlign: "left",
                                    cursor: "pointer",
                                }}
                                whileHover={{
                                    backgroundColor:
                                        "rgba(255,255,255,.025)",
                                    x: 3,
                                }}
                            >
                                <div
                                    className={`case-status ${status === "recovered"
                                            ? "recovered"
                                            : "human"
                                        }`}
                                >
                                    <StatusIcon
                                        status={status}
                                    />
                                </div>


                                <div className="case-main">
                                    <strong>
                                        {item.case_id ||
                                            item.transaction_id ||
                                            "Unknown case"}
                                    </strong>

                                    <span>
                                        {item.customer ||
                                            "Unknown customer"}
                                    </span>
                                </div>


                                <div>
                                    <div
                                        style={{
                                            color: "#d9ddea",
                                            fontSize: "9px",
                                        }}
                                    >
                                        {item.is_virtual
                                            ? "Awaiting recovery analysis"
                                            : (item.diagnosis?.diagnosis || "Diagnosis unavailable")}
                                    </div>

                                    <div
                                        style={{
                                            marginTop: "4px",
                                            color: "#50596b",
                                            fontSize: "7px",
                                        }}
                                    >
                                        {item.is_virtual ? (
                                            <span>
                                                AI confidence — • {item.risk_level?.toUpperCase() || "LOW"} RISK
                                            </span>
                                        ) : (
                                            <span>
                                                AI confidence{" "}
                                                {Math.round(
                                                    Number(
                                                        item.diagnosis
                                                            ?.confidence || 0
                                                    ) * 100
                                                )}
                                                %
                                            </span>
                                        )}
                                    </div>
                                </div>


                                <div>
                                    <strong
                                        style={{
                                            fontSize: "9px",
                                        }}
                                    >
                                        {money(item.amount)}
                                    </strong>

                                    <div
                                        style={{
                                            marginTop: "4px",
                                            color: "#50596b",
                                            fontSize: "7px",
                                        }}
                                    >
                                        {item.transaction_id}
                                        {item.failure_reason
                                            ? ` • ${item.failure_reason.replace(/_/g, " ")}`
                                            : ""}
                                    </div>
                                </div>


                                <Badge
                                    variant={
                                        status === "recovered"
                                            ? "recovered"
                                            : status === "human_approval"
                                            ? "warning"
                                            : "default"
                                    }
                                    dot
                                >
                                    {status ===
                                        "human_approval"
                                        ? "HUMAN REVIEW"
                                        : status.toUpperCase()}
                                </Badge>


                                <ChevronRight
                                    size={15}
                                    color="#555e70"
                                />
                            </motion.button>
                        );
                    })
                )}
            </GlassCard>


            {/* DETAIL DRAWER */}

            <AnimatePresence>
                {selectedCase && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() =>
                                setSelectedCase(null)
                            }
                            style={{
                                position: "fixed",
                                inset: 0,
                                zIndex: 80,
                                background:
                                    "rgba(0,0,0,.55)",
                                backdropFilter:
                                    "blur(6px)",
                            }}
                        />


                        <motion.aside
                            initial={{
                                x: "100%",
                            }}
                            animate={{
                                x: 0,
                            }}
                            exit={{
                                x: "100%",
                            }}
                            transition={{
                                type: "spring",
                                damping: 28,
                                stiffness: 260,
                            }}
                            style={{
                                position: "fixed",
                                top: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 90,
                                width: "min(650px, 92vw)",
                                overflowY: "auto",
                                padding: "28px",
                                borderLeft:
                                    "1px solid rgba(255,255,255,.08)",
                                background:
                                    "linear-gradient(180deg,#0c111b,#070a11)",
                                boxShadow:
                                    "-30px 0 100px rgba(0,0,0,.5)",
                            }}
                        >

                            {/* DRAWER HEADER */}

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems: "flex-start",
                                }}
                            >
                                <div>
                                    <div className="section-label">
                                        {selectedCase.is_virtual ? "QUEUED WORKLOAD" : "RECOVERY CASE"}
                                    </div>

                                    <h2
                                        style={{
                                            marginTop: "7px",
                                            fontSize: "21px",
                                        }}
                                    >
                                        {selectedCase.case_id ||
                                            selectedCase.transaction_id}
                                    </h2>

                                    <p
                                        style={{
                                            marginTop: "6px",
                                            color: "#596274",
                                            fontSize: "8px",
                                        }}
                                    >
                                        {selectedCase.customer || "Unknown customer"} • {selectedCase.transaction_id}
                                        {selectedCase.risk_level ? ` • ${selectedCase.risk_level.toUpperCase()} RISK` : ""}
                                        {selectedCase.failure_reason ? ` • ${selectedCase.failure_reason.replace(/_/g, " ")}` : ""}
                                    </p>
                                </div>


                                <button
                                    className="icon-button"
                                    onClick={() =>
                                        setSelectedCase(null)
                                    }
                                >
                                    <X size={16} />
                                </button>
                            </div>


                            {/* SUMMARY */}

                            <GlassCard
                                style={{
                                    marginTop: "20px",
                                    padding: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(4,1fr)",
                                        gap: "12px",
                                    }}
                                >
                                    <div>
                                        <span className="section-label">
                                            AMOUNT
                                        </span>

                                        <strong
                                            style={{
                                                display: "block",
                                                marginTop: "7px",
                                                fontSize: "16px",
                                            }}
                                        >
                                            {money(
                                                selectedCase.amount
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span className="section-label">
                                            ACTION / STRATEGY
                                        </span>

                                        <strong
                                            style={{
                                                display: "block",
                                                marginTop: "7px",
                                                fontSize: "9px",
                                            }}
                                        >
                                            {selectedCase.is_virtual
                                                ? "Not processed"
                                                : (selectedCase.decision?.action || "—")}
                                        </strong>
                                    </div>

                                    <div>
                                        <span className="section-label">
                                            RECOVERED
                                        </span>

                                        <strong
                                            style={{
                                                display: "block",
                                                marginTop: "7px",
                                                fontSize: "11px",
                                                color: (selectedCase.amount_recovered || 0) > 0 ? "var(--success)" : "#8e98a8",
                                            }}
                                        >
                                            {money(selectedCase.amount_recovered || 0)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span className="section-label">
                                            STATUS
                                        </span>

                                        <div
                                            style={{
                                                marginTop: "6px",
                                            }}
                                        >
                                            <Badge
                                                variant={
                                                    getStatus(
                                                        selectedCase
                                                    ) ===
                                                        "recovered"
                                                        ? "recovered"
                                                        : getStatus(
                                                            selectedCase
                                                        ) ===
                                                            "human_approval"
                                                        ? "warning"
                                                        : "default"
                                                }
                                            >
                                                {getStatus(
                                                    selectedCase
                                                ) ===
                                                "human_approval"
                                                    ? "HUMAN REVIEW"
                                                    : getStatus(
                                                        selectedCase
                                                    ).toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>


                            {/* PIPELINE */}

                            <div
                                style={{
                                    marginTop: "26px",
                                }}
                            >
                                <div className="section-label">
                                    DECISION TRACE
                                </div>

                                <h3
                                    style={{
                                        margin:
                                            "7px 0 17px",
                                        fontSize: "13px",
                                    }}
                                >
                                    {selectedCase.is_virtual
                                        ? "Recovery pipeline stages"
                                        : "Autonomous recovery chain"}
                                </h3>


                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(3,1fr)",
                                        gap: "20px 8px",
                                    }}
                                >

                                    <PipelineStep
                                        number="01"
                                        title="TRIGGER"
                                        description={
                                            selectedCase.is_virtual
                                                ? (selectedCase.failure_reason?.replace(/_/g, " ") || "failed")
                                                : (selectedCase.trigger?.event || "failed")
                                        }
                                        icon={Zap}
                                        active={!selectedCase.is_virtual}
                                    />

                                    <PipelineStep
                                        number="02"
                                        title="DIAGNOSE"
                                        description={
                                            selectedCase.is_virtual
                                                ? "Awaiting recovery analysis"
                                                : (selectedCase.diagnosis?.diagnosis || "Unknown")
                                        }
                                        icon={Bot}
                                        active={!selectedCase.is_virtual && Boolean(selectedCase.diagnosis)}
                                    />

                                    <PipelineStep
                                        number="03"
                                        title="DECIDE"
                                        description={
                                            selectedCase.is_virtual
                                                ? "Not processed"
                                                : (selectedCase.decision?.action || "No action")
                                        }
                                        icon={Bot}
                                        active={!selectedCase.is_virtual && Boolean(selectedCase.decision)}
                                    />

                                    <PipelineStep
                                        number="04"
                                        title="GUARDRAIL"
                                        description={
                                            selectedCase.is_virtual
                                                ? "Awaiting evaluation"
                                                : (selectedCase.guardrail?.passed
                                                    ? "Approved"
                                                    : "Human approval")
                                        }
                                        icon={ShieldCheck}
                                        active={!selectedCase.is_virtual && Boolean(selectedCase.guardrail)}
                                        danger={
                                            !selectedCase.is_virtual &&
                                            Boolean(selectedCase.guardrail) &&
                                            !selectedCase.guardrail?.passed
                                        }
                                    />

                                    <PipelineStep
                                        number="05"
                                        title="EXECUTE"
                                        description={
                                            selectedCase.is_virtual
                                                ? "Pending"
                                                : (selectedCase.execution?.status || "Pending")
                                        }
                                        icon={Zap}
                                        active={!selectedCase.is_virtual && Boolean(selectedCase.execution)}
                                    />

                                    <PipelineStep
                                        number="06"
                                        title="VERIFY"
                                        description={
                                            selectedCase.is_virtual
                                                ? "Pending"
                                                : (selectedCase.verification?.verified
                                                    ? "Verified"
                                                    : "Pending")
                                        }
                                        icon={ShieldCheck}
                                        active={!selectedCase.is_virtual && Boolean(selectedCase.verification?.verified)}
                                    />

                                </div>
                            </div>


                            {/* AI DIAGNOSIS */}

                            <GlassCard
                                style={{
                                    marginTop: "26px",
                                    padding: "16px",
                                }}
                            >
                                <div className="section-label">
                                    AI DIAGNOSIS
                                </div>

                                <h3
                                    style={{
                                        marginTop: "8px",
                                        fontSize: "12px",
                                    }}
                                >
                                    {selectedCase.is_virtual
                                        ? "Awaiting recovery analysis"
                                        : (selectedCase.diagnosis?.diagnosis || "Unavailable")}
                                </h3>

                                <p
                                    style={{
                                        marginTop: "8px",
                                        color: "#697286",
                                        fontSize: "9px",
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {selectedCase.is_virtual
                                        ? `Transaction failed with reason "${selectedCase.failure_reason || "unknown"}". Autonomous diagnosis will inspect telemetry once recovery is triggered.`
                                        : (selectedCase.diagnosis?.reasoning || "No reasoning recorded.")}
                                </p>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                        marginTop: "12px",
                                    }}
                                >
                                    <Badge
                                        variant="ai"
                                    >
                                        AI CONFIDENCE{" "}
                                        {selectedCase.is_virtual
                                            ? "—"
                                            : `${Math.round(
                                                Number(
                                                    selectedCase
                                                        .diagnosis
                                                        ?.confidence || 0
                                                ) * 100
                                            )}%`}
                                    </Badge>

                                    <Badge
                                        variant="neutral"
                                    >
                                        {selectedCase.is_virtual
                                            ? "QUEUED FOR ANALYSIS"
                                            : (selectedCase.diagnosis?.ai_generated
                                                ? "AI GENERATED"
                                                : "DETERMINISTIC FALLBACK")}
                                    </Badge>
                                </div>
                            </GlassCard>


                            {/* DECISION */}

                            <GlassCard
                                style={{
                                    marginTop: "10px",
                                    padding: "16px",
                                }}
                            >
                                <div className="section-label">
                                    DECISION
                                </div>

                                <div
                                    style={{
                                        marginTop: "8px",
                                        display: "flex",
                                        justifyContent:
                                            "space-between",
                                        gap: "10px",
                                    }}
                                >
                                    <strong
                                        style={{
                                            fontSize: "11px",
                                        }}
                                    >
                                        {selectedCase.is_virtual
                                            ? "Not processed"
                                            : (selectedCase.decision?.action || "no_action")}
                                    </strong>

                                    <Badge
                                        variant="ai"
                                    >
                                        {selectedCase.is_virtual
                                            ? "—"
                                            : `${Math.round(
                                                Number(
                                                    selectedCase
                                                        .decision
                                                        ?.confidence || 0
                                                ) * 100
                                            )}%`}
                                    </Badge>
                                </div>

                                <p
                                    style={{
                                        marginTop: "8px",
                                        color: "#697286",
                                        fontSize: "9px",
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {selectedCase.is_virtual
                                        ? "No strategy chosen yet. Recovery action will trigger diagnosis, strategy selection, and guardrail validation."
                                        : (selectedCase.decision?.reason || "No decision reason recorded.")}
                                </p>
                            </GlassCard>


                            {/* GUARDRAIL */}

                            <GlassCard
                                style={{
                                    marginTop: "10px",
                                    padding: "16px",
                                }}
                            >
                                <div className="section-label">
                                    MERCHANT GUARDRAIL
                                </div>

                                <div
                                    style={{
                                        marginTop: "10px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "9px",
                                    }}
                                >
                                    {selectedCase.is_virtual ? (
                                        <AlertTriangle
                                            size={17}
                                            color="#8e98a8"
                                        />
                                    ) : selectedCase.guardrail?.passed ? (
                                        <CheckCircle2
                                            size={17}
                                            color="var(--success)"
                                        />
                                    ) : (
                                        <AlertTriangle
                                            size={17}
                                            color="var(--warning)"
                                        />
                                    )}

                                    <strong
                                        style={{
                                            fontSize: "10px",
                                        }}
                                    >
                                        {selectedCase.is_virtual
                                            ? "GUARDRAIL CHECK PENDING"
                                            : (selectedCase.guardrail?.passed
                                                ? "AUTOMATION APPROVED"
                                                : "HUMAN APPROVAL REQUIRED")}
                                    </strong>
                                </div>

                                <p
                                    style={{
                                        marginTop: "8px",
                                        color: "#697286",
                                        fontSize: "9px",
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {selectedCase.is_virtual
                                        ? `Deterministic policy limits (₹10,000 threshold, customer risk level ${selectedCase.risk_level || "low"}) will evaluate upon execution.`
                                        : (selectedCase.guardrail?.reason || "No guardrail explanation recorded.")}
                                </p>
                            </GlassCard>


                            {/* EXECUTION */}

                            {selectedCase.execution && (
                                <GlassCard
                                    style={{
                                        marginTop: "10px",
                                        padding: "16px",
                                    }}
                                >
                                    <div className="section-label">
                                        EXECUTION
                                    </div>

                                    <div
                                        style={{
                                            marginTop: "10px",
                                            display: "flex",
                                            justifyContent:
                                                "space-between",
                                        }}
                                    >
                                        <strong
                                            style={{
                                                fontSize: "10px",
                                            }}
                                        >
                                            {
                                                selectedCase
                                                    .execution
                                                    .message
                                            }
                                        </strong>

                                        <Badge
                                            variant="recovered"
                                        >
                                            {
                                                selectedCase
                                                    .execution
                                                    .status
                                            }
                                        </Badge>
                                    </div>

                                    {selectedCase
                                        .execution
                                        .amount_recovered >
                                        0 && (
                                            <p
                                                style={{
                                                    marginTop: "8px",
                                                    color:
                                                        "var(--success)",
                                                    fontFamily:
                                                        "DM Mono",
                                                    fontSize: "9px",
                                                }}
                                            >
                                                {money(
                                                    selectedCase
                                                        .execution
                                                        .amount_recovered
                                                )}{" "}
                                                recovered
                                            </p>
                                        )}
                                </GlassCard>
                            )}


                            {/* ACTION */}

                            {(selectedCase.is_virtual ||
                                (selectedCase.guardrail?.passed &&
                                    !selectedCase.execution)) && (
                                <Button
                                    style={{
                                        width: "100%",
                                        marginTop: "18px",
                                    }}
                                    disabled={executing}
                                    onClick={() =>
                                        executeRecovery(
                                            selectedCase
                                        )
                                    }
                                >
                                    {executing
                                        ? "Executing recovery..."
                                        : selectedCase.is_virtual
                                        ? "Initiate Autonomous Recovery"
                                        : "Execute recovery"}
                                </Button>
                            )}

                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}