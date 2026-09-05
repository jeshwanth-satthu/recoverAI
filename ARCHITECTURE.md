# RecoverAI — System Architecture Specification

> **Engineering Design Document**  
> Autonomous Revenue Recovery Engine with Deterministic Guardrails & Provider Verification.  
> **Core Statement:** *"The AI recommends. Humans authorize. The payment provider confirms."*

---

## 1. Problem Statement

Payment failures in digital commerce, subscription services, and B2B platforms generate **over $50 Billion in involuntary churn annually**. Conventional recovery workflows suffer from critical engineering flaws:
- **Blind Retries**: Repeatedly submitting failed transactions against card networks without diagnosing root cause triggers bank fraud filters and increases payment processing fees.
- **Delayed Batch Marketing**: Generic "Your payment has failed" emails sent 24–48 hours later suffer from abysmal conversion rates.
- **Unbounded Agent Risk**: Permitting generative AI models direct execution privileges in financial systems introduces risks of hallucinated refunds or runaway discounts.
- **Unverified Reconciliation**: Crediting accounts or renewing subscriptions before bank settlement is confirmed creates financial reconciliation drift.

**RecoverAI** addresses this by separating **advisory reasoning** from **deterministic execution**, strictly enforcing policy guardrails, and requiring cryptographic payment provider confirmation.

---

## 2. System Architecture & Request/Event Flow

RecoverAI uses an asynchronous, decoupled architecture separating the React command center, FastAPI core, AI diagnostic services, Scikit-Learn ML subsystem, MongoDB persistence, and payment gateway webhooks:

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                   Merchant Command Center (React 18)                   │
 │   Real-Time Stream • Priority Queue • HITL Review • Visual Timeline    │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / JSON API
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         FastAPI Backend Layer                          │
 │                                                                        │
 │  ┌───────────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
 │  │ REST API Endpoints    │  │ Circuit Breaker  │  │ Razorpay        │  │
 │  │ (/api/recovery/...)   │  │ Anomaly Detector │  │ Webhook Handler │  │
 │  └──────────┬────────────┘  └────────┬─────────┘  └────────┬────────┘  │
 │             │                        │                     │           │
 │             └──────────────────┐     │     ┌───────────────┘           │
 │                                ▼     ▼     ▼                           │
 │                      ┌────────────────────────────┐                    │
 │                      │ 7-Stage Multi-Agent Engine │                    │
 │                      └──────────────┬─────────────┘                    │
 └─────────────────────────────────────┼──────────────────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
 ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
 │   Google Gemini     │    │   Scikit-Learn ML   │    │  Razorpay Test API  │
 │   Diagnosis Core    │    │   Model Registry    │    │ (Orders & Checkout) │
 └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       ▼
                       ┌──────────────────────────────┐
                       │     MongoDB Atlas Cluster    │
                       │ 6 Collections (Transactions, │
                       │  Cases, Audit, Customers...) │
                       └──────────────────────────────┘
```

### End-to-End Request & Event Lifecycle:
1. **Failure Ingestion**: Inbound transaction failure event is posted to `/api/recovery/{transaction_id}` (or received via gateway webhook).
2. **Circuit Breaker Check**: System verifies gateway anomaly detector is `CLOSED` (healthy).
3. **Agent Pipeline Execution**: Trigger Agent initializes case $\rightarrow$ Diagnosis Agent analyzes failure $\rightarrow$ Decision Agent formulates strategy $\rightarrow$ ML predicts recovery probability $\rightarrow$ Guardrail Agent evaluates policies.
4. **Branching**:
   - If guardrails pass: Executor Agent calls Razorpay API to generate order and checkout link.
   - If guardrails trigger: Case enters `HELD_FOR_REVIEW` and waits for operator authorization.
5. **Webhook Confirmation**: Customer completes test payment $\rightarrow$ Razorpay dispatches signed webhook $\rightarrow$ Verifier Agent validates HMAC signature $\rightarrow$ Case marked `RECOVERED`.

---

## 3. The 7-Stage Multi-Agent Recovery Pipeline

```text
 ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
 │  1. Trigger  │ ───► │ 2. Diagnosis │ ───► │ 3. Decision  │
 │    Agent     │      │ Agent(Gemini)│      │    Agent     │
 └──────────────┘      └──────────────┘      └──────┬───────┘
                                                    │
                                                    ▼
 ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
 │ 6. Verifier  │ ◄─── │ 5. Executor  │ ◄─── │ 4. Guardrail │
 │    Agent     │      │    Agent     │      │    Agent     │
 └──────┬───────┘      └──────────────┘      └──────────────┘
        │
        ▼
 ┌──────────────┐
 │ 7. Retrain   │ (Feedback Loop)
 └──────────────┘
```

| Stage | Agent | Source File | Function |
| :---: | :--- | :--- | :--- |
| **1** | **Trigger Agent** | `app/agents/trigger_agent.py` | Ingests payload, validates schema, asserts event idempotency. |
| **2** | **Diagnosis Agent** | `app/agents/diagnosis_agent.py` | Evaluates gateway error codes & customer history using Gemini AI (with deterministic fallback). |
| **3** | **Decision Agent** | `app/agents/decision_agent.py` | Recommends channel (WhatsApp/SMS/Email), retry delay, and bounded micro-incentives. |
| **4** | **Guardrail Agent** | `app/agents/guardrail_agent.py` | Deterministic policy enforcement (₹10,000 threshold, customer risk tiers, retry limits). |
| **5** | **Executor Agent** | `app/agents/executor_agent.py` | Creates dynamic Razorpay orders (`order_...`) and constructs dispatch payload. |
| **6** | **Verifier Agent** | `app/agents/verifier_agent.py` | Validates HMAC-SHA256 signatures on payment webhooks to confirm real settlement. |
| **7** | **Feedback Loop** | `app/ml/retrain.py` | Captures merchant review ratings to continuously retrain ML model weights. |

---

## 4. AI Diagnosis & Safe Isolation (Gemini 2.0)

The **Diagnosis Agent** leverages Google Gemini 2.0 (`google-genai` SDK) to evaluate technical and behavioural nuances in payment failures.

### Failure Isolation & Graceful Fallback
External AI APIs can experience rate limits or network latency. RecoverAI enforces strict **graceful fallback**:
```python
try:
    diagnosis = gemini_client.models.generate_content(...)
except Exception as e:
    logger.warning("Gemini API quota exceeded. Switching to safe deterministic diagnosis.")
    diagnosis = get_deterministic_diagnosis_fallback(failure_code, telemetry)
```
If the Gemini API returns a 429 quota exhaustion or network timeout, the engine automatically falls back to deterministic rule-based catalog diagnosis without interrupting platform operation.

---

## 5. ML Decision Support Subsystem

Located in `backend/app/ml/`, this subsystem calculates recovery probability:
- **Feature Engineering** (`features.py`): Ingests amount, retry counts, failure reasons, customer lifetime value, and payment method encodings.
- **Trained Model** (`models/recovery_probability.joblib`): Scikit-Learn Logistic Regression model outputting calibrated probabilities ($0.0 \le P_{\text{recovery}} \le 1.0$).
- **Priority Queue Ranking** (`app/scoring.py`): Cases are dynamically prioritized by **Expected Monetary Value (EMV)**:
$$\text{EMV} = P_{\text{recovery}} \times \text{Transaction Amount}$$
This ensures merchants focus operational bandwidth where financial return is mathematically maximized.

---

## 6. Deterministic Guardrails

The **Guardrail Agent** (`app/agents/guardrail_agent.py`) enforces strict, hard-coded constraints that cannot be overridden by AI prompts or model inferences:

```text
                     Incoming Decision
                            │
                            ▼
              ┌───────────────────────────┐
              │  Amount >= ₹10,000 Cap?   │ ──(YES)──► HELD_FOR_REVIEW
              └─────────────┬─────────────┘
                            │ (NO)
                            ▼
              ┌───────────────────────────┐
              │ Customer Tier == High Risk│ ──(YES)──► HELD_FOR_REVIEW
              └─────────────┬─────────────┘
                            │ (NO)
                            ▼
              ┌───────────────────────────┐
              │ Retry Count >= Max (3)?   │ ──(YES)──► HALT_TERMINATED
              └─────────────┬─────────────┘
                            │ (NO)
                            ▼
                    APPROVED FOR EXECUTION
```

- **Safety Cap**: Any transaction $\ge$ ₹10,000 is intercepted into `HELD_FOR_REVIEW`.
- **High-Risk Threshold**: Customers flagged with high risk cannot receive autonomous discount incentives.
- **Retry Ceiling**: Maximum of 3 automated recovery attempts per transaction lifecycle.

---

## 7. Human-in-the-Loop (HITL) Approval Flow

When a transaction is held by guardrails:
1. State transitions to `HELD_FOR_REVIEW`.
2. Appears immediately in the **High-Risk Review Panel** (`HighRiskReviewPanel.jsx`).
3. The operator inspects the **AI Decision Dossier**:
   - Gemini diagnosis & confidence score.
   - ML recovery probability ($P_{\text{recovery}}$).
   - Customer lifetime value and historical dispute rate.
   - Proposed message template and discount terms.
4. The operator can **Authorize** (resumes autonomous execution) or **Reject** (halts recovery).
5. Operator decision is permanently recorded in the immutable audit trail.

---

## 8. Razorpay Webhook Verification

Settlement verification strictly adheres to the principle: **"The payment provider confirms."**

1. **Dynamic Order Creation**: The Executor Agent calls Razorpay `/orders` API with receipt tags matching the internal recovery `case_id`.
2. **HMAC-SHA256 Signature Verification**: Inbound webhooks sent to `/api/razorpay/webhook` are cryptographically verified against `RAZORPAY_WEBHOOK_SECRET` before processing.
3. **Atomic Idempotency**: Each `event_id` is atomically claimed in the `razorpay_events` collection (`claim_razorpay_event()`). Duplicate webhooks are rejected or ignored without re-execution.
4. **Reconciliation**: A case is marked `RECOVERED` **only** after signature validation passes.

---

## 9. MongoDB Database Collections

RecoverAI persists system state across six collections in MongoDB Atlas:

| Collection | Schema Highlights | Primary Function |
| :--- | :--- | :--- |
| `transactions` | `id`, `amount`, `customer_id`, `error_code`, `status`, `payment_method`, `risk_level` | Transaction master ledger. |
| `recovery_cases`| `case_id`, `transaction_id`, `status`, `stage`, `diagnosis`, `decision`, `guardrail`, `order_id` | Full multi-stage lifecycle state. |
| `customers` | `customer_id`, `name`, `email`, `phone`, `lifetime_value`, `risk_score`, `tier` | Customer behavioural profiles. |
| `audit_logs` | `timestamp`, `transaction_id`, `case_id`, `action`, `stage`, `actor`, `metadata` | Append-only compliance audit trail. |
| `razorpay_events` | `event_id`, `received_at`, `payload`, `processed` | Idempotent gateway webhook log. |
| `recovery_feedback`| `case_id`, `action`, `feedback`, `rating`, `timestamp` | Human feedback dataset for ML retraining. |

---

## 10. Immutable Audit Trail

Every state transition, AI diagnostic reasoning string, guardrail policy check, and operator decision is recorded in `audit_logs`:
```json
{
  "timestamp": "2026-09-05T17:19:16Z",
  "transaction_id": "pay_1005",
  "case_id": "DEMO-INIT",
  "action": "guardrail_evaluation",
  "status": "passed",
  "actor": "AGENT_SYSTEM",
  "diagnosis": "Payment failed due to insufficient funds (₹1,999). Ready for autonomous recovery.",
  "guardrail": "Deterministic policy: Under ₹10,000 ceiling. Autonomous recovery permitted."
}
```

---

## 11. Failure & Recovery Lifecycle State Machine

```text
[FAILED]
   │
   ▼
[QUEUED] ──► [DIAGNOSING] ──► [STRATEGY_SELECTED]
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
        [Under ₹10k & Low Risk]           [>= ₹10k or High Risk]
                  │                                   │
                  ▼                                   ▼
        [APPROVED_FOR_EXECUTION]             [HELD_FOR_REVIEW]
                  │                                   │
                  │                          ┌────────┴────────┐
                  │                          ▼                 ▼
                  │                    [AUTHORIZED]       [REJECTED]
                  ▼                          │                 │
             [EXECUTING] ◄───────────────────┘                 ▼
                  │                                       [TERMINATED]
                  ▼
            [DISPATCHED]
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
(Webhook Verified)    (Retry Exceeded)
        │                   │
        ▼                   ▼
   [RECOVERED]        [UNRECOVERED]
```

---

## 12. Circuit Breaker & Anomaly Detection

The **Circuit Breaker Anomaly Detector** (`app/anomaly_detector.py`) protects merchants during banking infrastructure outages:
- **Baseline Monitoring**: Computes payment failure-to-success ratios across sliding time windows.
- **Outage Tripping**: If failure rates exceed 3.5x normal baseline (signaling an outage at major payment gateways or card networks), the circuit breaker trips to `OPEN`.
- **Customer Protection**: Outbound recovery notifications are paused immediately to prevent spamming customers for issues outside their control.
- **Auto-Reset**: Resets to `CLOSED` when failure rates normalize.
