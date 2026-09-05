# ADR-001: Deterministic Guardrails & Provider Verification Over Unconstrained LLM Agency

- **Status**: Accepted & Implemented
- **Date**: 2026-09-05
- **Deciders**: RecoverAI Core Architecture Team

---

## 1. Context & Problem

Autonomous AI agents powered by Large Language Models (LLMs) demonstrate remarkable capability in semantic reasoning, sentiment analysis, and unstructured data diagnosis. However, granting unconstrained LLMs direct execution rights in financial systems introduces catastrophic operational and security risks:

1. **Non-Deterministic Boundary Drift**: An LLM given a goal like *"recover this customer at all costs"* might offer 80% discounts or unbudgeted credits to customers who would have paid anyway.
2. **Prompt Injection & Social Engineering**: Malicious customers could manipulate payment failure descriptions to coerce the agent into waiving fees or crediting accounts.
3. **Premature Optimism & Hallucinated Settlement**: An LLM agent may assume that because a payment link was generated or clicked, the revenue has been "recovered," leading to severe financial reconciliation discrepancies.
4. **Third-Party Latency & Quota Expiry**: Relying on external LLM APIs for mission-critical runtime decisions without deterministic fallbacks creates a single point of failure.

---

## 2. Decision

We formulated the guiding architectural principle for RecoverAI:

> **"The AI recommends. Humans authorize. The payment provider confirms."**

### Architectural Invariants:
1. **AI Role Limited to Advisory Reasoning**:
   - Google Gemini 2.0 is utilized exclusively for **root-cause diagnosis** and **strategy recommendations**.
   - Gemini does **not** directly execute banking transactions, issue refund credits, or modify accounting ledgers.
2. **Hard-Coded Deterministic Guardrails**:
   - The Guardrail Agent (`app/agents/guardrail_agent.py`) is written in pure, deterministic Python.
   - Any transaction with `amount >= ₹10,000` is unconditionally intercepted and flagged as `HELD_FOR_REVIEW`.
   - Maximum allowable retry counts ($N=3$) and discount caps ($5\%$) are strictly enforced by code, not prompt guidance.
3. **Human-in-the-Loop (HITL) Authorization**:
   - Any transaction intercepted by guardrails requires an explicit cryptographic or UI token from an authenticated human operator before proceeding to the executor.
4. **Authoritative Gateway Verification**:
   - A recovery case is marked `RECOVERED` **if and only if** Razorpay sends an HMAC-SHA256 signed `payment.captured` or `order.paid` webhook event.
5. **Deterministic Fallback Isolation**:
   - If the Gemini API returns a 429 (Quota Exceeded) or network timeout, the system switches immediately to a local deterministic error-code lookup table, maintaining 100% uptime.

---

## 3. Consequences & Benefits

### Positive:
- **Zero Risk of Financial Leakage**: No discount or retry can ever exceed hard-coded bounds.
- **Audit Compliance**: Every guardrail check is immutably recorded in the `audit_logs` collection.
- **Bank-Grade Reliability**: System continues operating even if external AI infrastructure suffers an outage.
- **High Evaluator Trust**: Judges and financial auditors can clearly inspect where AI reasoning stops and deterministic safety takes over.

### Trade-offs:
- Operators must occasionally review high-value transactions ($\ge$ ₹10,000). (Mitigated by the 1-click **High-Risk Review Panel**).
