# RecoverAI — 5-Minute Evaluator & Judge Demo Guide

> A concise, step-by-step walkthrough for evaluating RecoverAI during live demos and technical reviews.  
> **Core Principle:** *"The AI recommends. Humans authorize. The payment provider confirms."*

---

## 🎯 What This Demo Proves

1. **Autonomous Closed-Loop Recovery**: AI diagnosis, ML prioritization, and test order creation with real-time settlement verification.
2. **Deterministic Safety Guardrails**: Strict policy interception for transactions $\ge$ ₹10,000, halting execution until an authorized human operator approves.
3. **Cryptographic Reconciliation**: Revenue is never marked `RECOVERED` until validated via Razorpay test webhook signatures.

---

## 🛠️ Quick Environment Launch

Ensure the backend and frontend are running:

### Terminal 1: Backend
```powershell
cd backend
.\venv312\Scripts\activate      # Or source venv/bin/activate
uvicorn app.main:app --port 8000 --reload
```

### Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 🌟 Scenario A: Standard Autonomous Recovery (₹1,999)

### Target Profile
- **Transaction ID**: `pay_1005`
- **Customer**: Vikram Singh (SaaS Subscription)
- **Amount**: ₹1,999
- **Failure Code**: `INSUFFICIENT_FUNDS`

### Step-by-Step Flow

1. **Clean Reset**:
   - In the frontend header or bottom Hackathon Demo Bar, click **"Reset Demo Data"** (or run `curl -X POST http://127.0.0.1:8000/api/demo/reset`).
   - Baseline seed data loads; recovered revenue initializes to ₹0.

2. **Trigger Autonomous Recovery**:
   - On the Dashboard Hero card, click **"Run Recovery Engine (pay_1005)"** (or locate `pay_1005` in the **Live Cases** table and click **"Auto-Recover"**).
   - *(API equivalent: `POST http://127.0.0.1:8000/api/recovery/pay_1005`)*

3. **Inspect AI Diagnosis & ML Priority**:
   - Click on `pay_1005` in the Live Cases table to open the **7-Stage Case Journey Modal**:
     - **Stage 1 (Trigger)**: Event validated; idempotency lock acquired.
     - **Stage 2 (Diagnosis)**: Gemini 2.0 analyzes telemetry (*Temporary insufficient balance; high customer lifetime value detected*).
     - **Stage 3 (Decision)**: Strategy selected: `send_payment_reminder` via WhatsApp.
     - **Stage 4 (ML Score)**: Scikit-learn model predicts ~82% recovery probability; EMV calculated.

4. **Verify Guardrail Clearance**:
   - **Stage 5 (Guardrail)**: Evaluates amount ₹1,999 against the ₹10,000 ceiling. Since ₹1,999 < ₹10,000, status is `APPROVED_FOR_AUTONOMOUS_EXECUTION`.

5. **Generate Razorpay Test Order**:
   - In the modal, click **"Open Razorpay Checkout"** (or call `POST /api/razorpay/create-order/pay_1005`).
   - The engine generates a test order (`order_...`). The standard Razorpay Test Checkout modal opens.

6. **Simulate / Verify Payment Settlement**:
   - Complete the test payment in the Razorpay Test modal (use UPI / Test Card), OR trigger test webhook verification directly:
     ```bash
     curl -X POST http://127.0.0.1:8000/api/recovery/pay_1005/verify
     ```
   - **Stage 6 (Verifier)**: Cryptographic signature passes; case transitions to **`RECOVERED`**.

7. **Verify Dashboard & Audit Trail**:
   - The **Revenue Recovered** metric updates in real-time by +₹1,999.
   - Open the **Audit** page to see the immutable chronological record.

---

## 🛡️ Scenario B: Safety Guardrail Interception (₹19,999)

Demonstrates how RecoverAI prevents runaway AI agents from executing high-value actions without human signoff.

### Target Profile
- **Transaction ID**: `pay_1003`
- **Customer**: Priya Sharma (Annual Enterprise Subscription)
- **Amount**: ₹19,999 (Exceeds ₹10,000 autonomous ceiling)
- **Failure Code**: `BANK_DECLINE`

### Step-by-Step Flow

```text
High-Value Failure (₹19,999)
             │
             ▼
     AI Diagnosis Agent
             │
             ▼
   AI Decision Recommendation
             │
             ▼
  Deterministic Guardrail Agent
 [Amount >= ₹10,000 Cap Triggered]
             │
             ▼
   Status: HELD_FOR_REVIEW
             │
             ▼
  High-Risk Operator Review Panel
      [Human Authorizes]
             │
             ▼
    Execution & Dispatch
```

1. **Trigger Recovery on High-Value Transaction**:
   - In the **Live Cases** table, find `pay_1003` (₹19,999) and click **"Auto-Recover"** (or call `POST /api/recovery/pay_1003`).

2. **Observe Guardrail Interception**:
   - The AI recommends an incentivized recovery.
   - The **Guardrail Agent** intercepts execution:
     > *"Automatic recovery is limited to transactions of ₹10,000 or less. This ₹19,999 transaction requires human approval."*
   - Status changes to **`HELD_FOR_REVIEW`** (Amber badge).

3. **Inspect the Operator Dossier**:
   - Click the review button on `pay_1003` to open the **High-Risk Review Panel** (`HighRiskReviewPanel.jsx`).
   - Inspect the dossier:
     - Root-cause diagnosis & confidence score.
     - ML recovery probability ($P_{\text{recovery}}$).
     - Customer risk tier and historical spend.
     - Proposed message draft and discount terms.

4. **Execute Operator Authorization**:
   - In the review modal, click **"Authorize Execution"** (or call `POST /api/recovery/pay_1003/approve`).
   - The execution unblocks and proceeds to order creation.
   - The **Audit** tab logs the event with `actor: "HUMAN_OPERATOR"`.

---

## 🧪 Headless Verification (Single Terminal Command)

Judges can execute the full end-to-end regression test suite without clicking:

```powershell
python tests/integration/test_recovery_pipeline.py
```

**Expected output:**
```text
=================================================================
RECOVERAI END-TO-END INTEGRATION TEST SUITE
=================================================================
  [PASS] 1. Backend /health is healthy
  [PASS] 2. MongoDB connection /health/database is active and healthy
  [PASS] 3. Demo dataset reset executed successfully
  [PASS] 4. Dashboard metrics retrieved successfully
  [PASS] 5. Cases and transactions retrieved
  [PASS] 6. Customer ledger and audit trail accessible
  [PASS] 7. Autonomous recovery pipeline executed for pay_1005
  [PASS] 8. Razorpay order generated successfully (order_...)
  [PASS] 9. Priority queue ranking evaluated with expected monetary values
  [PASS] 10. Gateway circuit breaker anomaly detector is operational
  [PASS] 11. ML Intelligence reporting active model parameters
  [PASS] 12. Operator feedback loop successfully stored for retraining
=================================================================
ALL 12 RECOVERAI INTEGRATION TESTS PASSED CLEANLY!
=================================================================
```
