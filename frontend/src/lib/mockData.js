/**
 * Telemetry initial state defaults for RecoverAI command center.
 * Real metrics and cases are fetched live from FastAPI backend.
 */

export const INITIAL_METRICS = {
  revenue_at_risk: 0,
  revenue_recovered: 0,
  recovery_rate: 0,
  successful_recoveries: 0,
  total_transactions: 0,
  audit_events: 0,
  average_recovery_time_sec: 4.2,
  autonomous_percentage: 86.4,
  active_ai_agents: 6,
  pipeline_health: 100,
};

export const REVENUE_TIMELINE = [
  { time: "00:00", at_risk: 42000, recovered: 0 },
  { time: "03:00", at_risk: 28000, recovered: 0 },
  { time: "06:00", at_risk: 65000, recovered: 0 },
  { time: "09:00", at_risk: 142000, recovered: 0 },
  { time: "12:00", at_risk: 198000, recovered: 0 },
  { time: "15:00", at_risk: 245000, recovered: 0 },
  { time: "18:00", at_risk: 180000, recovered: 0 },
  { time: "21:00", at_risk: 110000, recovered: 0 },
];

export const FAILURE_BREAKDOWN = [
  { reason: "Network / Gateway Timeout", share: 37, count: 37, amount: 369970, color: "#8b5cf6" },
  { reason: "Expired Card / Token Deficit", share: 37, count: 37, amount: 369970, color: "#06b6d4" },
  { reason: "Insufficient Balance / Limit Cap", share: 34, count: 34, amount: 339966, color: "#f59e0b" },
  { reason: "Temporary Payment Drop", share: 39, count: 39, amount: 389961, color: "#f43f5e" },
];

export const INITIAL_CASES = [];
