# RecoverAI
### Autonomous AI Revenue Recovery Engine

> **"The AI recommends. Humans authorize. The payment provider confirms."**

---

## ⚡ One-Sentence Problem Statement
Digital businesses lose over **$50 Billion annually** to involuntary payment failures caused by technical glitches, transient bank drops, and expired credentials that dumb retry scripts fail to recover while alienating legitimate customers.

## 💡 One-Sentence Solution
RecoverAI is a closed-loop multi-agent system that autonomously diagnoses payment failure telemetry, predicts recovery probability with machine learning, generates adaptive recovery campaigns within hard deterministic safety guardrails, and reconciles recovered revenue strictly via cryptographic gateway webhooks.

## 💎 Key Value Proposition
Unlike legacy systems that blast blind retries or send delayed generic emails, RecoverAI eliminates revenue leakage by combining **real-time AI root-cause diagnosis**, **mathematical Expected Monetary Value (EMV) prioritization**, and **foolproof financial guardrails**—ensuring merchants maximize recovered cash flow without ever risking runaway AI discounts or false settlement reconciliation.

---

## 🏗️ System Architecture

```text
       ┌────────────────────────────────────────────────────────┐
       │             Merchant Command Center (React 18)         │
       │       Live Stream • Priority Queue • HITL Review       │
       └───────────────────────────┬────────────────────────────┘
                                   │ HTTPS / JSON API
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Backend Service                            │
│                                                                          │
│  ┌──────────────────────┐  ┌───────────────────┐  ┌───────────────────┐  │
│  │ Ingestion & REST API │  │ Circuit Breaker   │  │ Webhook Listener  │  │
│  │ (/api/recovery/...)  │  │ Anomaly Detector  │  │ (HMAC Validation) │  │
│  └──────────┬───────────┘  └─────────┬─────────┘  └─────────┬─────────┘  │
│             │                        │                      │            │
│             └──────────────────┐     │     ┌────────────────┘            │
│                                ▼     ▼     ▼                             │
│                    ┌───────────────────────────────┐                     │
│                    │ 7-Stage Multi-Agent Pipeline  │                     │
│                    └───────────────┬───────────────┘                     │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  Google Gemini   │       │ Scikit-Learn ML  │       │  Razorpay Gateway│
│  Diagnosis Core  │       │ Model Registry   │       │   (Test Mode)    │
└──────────────────┘       └──────────────────┘       └──────────────────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     ▼
                     ┌───────────────────────────────┐
                     │     MongoDB Atlas Database    │
                     │  Transactions • Cases • Audit │
                     └───────────────────────────────┘
```

---

## 🔄 7-Stage Multi-Agent Recovery Pipeline

When a payment failure event is ingested, RecoverAI executes seven isolated stages:

```text
FAILED PAYMENT
      ↓
[1. TRIGGER AGENT]       ➔ Ingests event, checks idempotency, creates case
      ↓
[2. DIAGNOSIS AGENT]     ➔ Gemini AI diagnoses root cause (with deterministic fallback)
      ↓
[3. DECISION AGENT]      ➔ Selects channel, retry window, and bounded micro-incentive
      ↓
[4. ML PRIORITIZATION]   ➔ Scikit-learn model ranks case by Expected Monetary Value
      ↓
[5. GUARDRAIL AGENT]     ➔ Enforces ₹10,000 threshold, risk tiers, & retry limits
      ↓
[6. EXECUTOR AGENT]      ➔ Creates Razorpay Test Order & formats multichannel payload
      ↓
[7. VERIFIER AGENT]      ➔ Validates cryptographic gateway webhook before marking RECOVERED
      ↓
RECOVERED REVENUE
```

| Stage | Component | Core Responsibility |
| :---: | :--- | :--- |
| **1** | **Trigger Agent** | Ingests failure payloads, verifies schema, and guarantees idempotency. |
| **2** | **Diagnosis Agent** | Evaluates gateway error codes and customer history using Google Gemini AI. |
| **3** | **Decision Agent** | Recommends communication channels, dispatch timing, and bounded offers. |
| **4** | **ML Prioritization** | Computes $P_{\text{recovery}}$ and Expected Monetary Value ($EMV = P \times \text{Amount}$). |
| **5** | **Guardrail Agent** | Intercepts high-value ($\ge$ ₹10k) or risky transactions into `HELD_FOR_REVIEW`. |
| **6** | **Executor Agent** | Generates dynamic Razorpay payment orders and prepares personalized paylinks. |
| **7** | **Verifier Agent** | Validates HMAC-SHA256 signatures on incoming gateway webhooks to confirm settlement. |

---

## ⚖️ AI vs. Deterministic Responsibilities

To guarantee financial safety and operational predictability, RecoverAI strictly isolates generative reasoning from financial execution:

| Domain | Generative AI Responsibility (Gemini 2.0) | Deterministic Code Responsibility (Python/FastAPI) |
| :--- | :--- | :--- |
| **Diagnosis** | Synthesizes unstructured telemetry into human-readable explanations. | Validates gateway error codes and handles fallback if API quota is reached. |
| **Strategy** | Recommends optimal tone, channel, and discount proposition. | Binds discounts to a maximum 5% ceiling and strictly limits retry counts. |
| **Execution** | **Zero direct execution power.** Cannot issue credits or move funds. | Validates session authorization, creates Razorpay orders, and enforces quotas. |
| **Safety** | May flag perceived user intent. | **Hard threshold enforcement**: Any transaction $\ge$ ₹10,000 requires human approval. |
| **Settlement** | Never decides whether a transaction succeeded. | Authoritative reconciliation occurs **only** upon cryptographic webhook verification. |

---

## 🛡️ Human-in-the-Loop (HITL) Guardrails

RecoverAI prevents runaway automated actions using code-enforced financial policies:
- **Autonomous Recovery Ceiling**: Any transaction $\ge$ ₹10,000 is intercepted and transitioned to `HELD_FOR_REVIEW`.
- **Customer Risk Escalation**: High-risk profiles are blocked from autonomous incentives.
- **Operator Review Dossier**: Intercepted cases surface immediately in the **High-Risk Review Panel** on the dashboard, presenting operators with full AI reasoning, customer lifetime value, and 1-click Approve / Reject controls.
- **Immutable Audit Trail**: Every policy check, operator action, and state transition is permanently recorded in the append-only `audit_logs` MongoDB collection.

---

## 💳 Razorpay Verification Flow

RecoverAI never credits recovered revenue based on assumptions:
1. **Dynamic Order Generation**: The Executor Agent communicates with the Razorpay API to generate a unique test order (`order_...`).
2. **Payment Link Generation**: A secure checkout link is generated and attached to the customer payload.
3. **Cryptographic Webhook Ingestion**: Razorpay dispatches `payment.captured` or `order.paid` webhooks to `/api/razorpay/webhook`.
4. **Signature Verification**: The backend validates the `X-Razorpay-Signature` header using HMAC-SHA256 against `RAZORPAY_WEBHOOK_SECRET`.
5. **Settlement Attainment**: The case transitions to `RECOVERED` **only** after signature validation passes.

---

## 🧠 Machine Learning Subsystem

Located in `backend/app/ml/`, the predictive recovery subsystem calculates real-time success probabilities:
- **Feature Engineering** (`features.py`): Ingests transaction amount, retry history, failure reasons, customer lifetime value, and payment method encodings.
- **Trained Model** (`models/recovery_probability.joblib`): Scikit-Learn Logistic Regression model outputting calibrated probabilities ($0.0 \le P_{\text{recovery}} \le 1.0$).
- **Priority Queue Ranking** (`app/scoring.py`): Ranks recovery opportunities by Expected Monetary Value ($EMV = P_{\text{recovery}} \times \text{Amount}$) to optimize merchant focus.
- **Continuous Retraining** (`retrain.py`): Operator feedback submitted via the UI is recorded in `recovery_feedback` to continuously adapt model decision weights.

---

## 🛠️ Technology Stack

- **Backend Framework**: Python 3.12, FastAPI, Uvicorn, Pydantic, PyMongo
- **AI Core**: Google Gemini 2.0 (`google-genai` SDK) with deterministic fallback isolation
- **Machine Learning**: Scikit-Learn, Pandas, NumPy, Joblib
- **Payment Gateway**: Razorpay Python SDK (Test Mode) with HMAC-SHA256 webhook verification
- **Database**: MongoDB Atlas Cluster (Transactions, Recovery Cases, Customers, Audit Logs, Feedback)
- **Frontend Core**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+
- MongoDB instance (MongoDB Atlas URI or local MongoDB)
- Gemini API Key & Razorpay Test Keys

### 2. Backend Installation
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate | macOS/Linux: source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MONGODB_URI, GEMINI_API_KEY, and RAZORPAY test keys

# Start backend server (starts on http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Installation
```bash
cd frontend
npm install

# Configure environment
cp .env.example .env

# Start frontend dev server (starts on http://localhost:5173)
npm run dev
```

Visit **`http://localhost:5173`** for the dashboard and **`http://localhost:8000/docs`** for interactive Swagger API documentation.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | MongoDB connection string (e.g. `mongodb+srv://...` or `mongodb://localhost:27017/recoverai`) |
| `GEMINI_API_KEY` | Google Gemini API key for root-cause diagnosis |
| `GEMINI_MODEL` | Generative model name (default: `gemini-2.0-flash`) |
| `RAZORPAY_KEY_ID` | Razorpay Test Key ID (`rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Razorpay Test Key Secret |
| `RAZORPAY_WEBHOOK_SECRET`| Secret used for HMAC-SHA256 webhook signature validation |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins (e.g., `http://localhost:5173`) |

### Frontend (`frontend/.env`)
| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Base URL for backend API calls (e.g., `http://localhost:8000` or production URL) |

---

## 🧪 Testing

RecoverAI includes automated unit and end-to-end integration test suites:

```powershell
# Run deterministic guardrail and ML predictor unit tests
python tests/backend/test_guardrails.py
python tests/backend/test_predictor.py

# Run complete 12-step end-to-end recovery pipeline integration test
python tests/integration/test_recovery_pipeline.py
```

---

## 🧭 Evaluator Demo Instructions

See **[DEMO.md](DEMO.md)** for a complete 5-minute walkthrough of:
1. **Scenario A (Standard Recovery)**: Autonomous recovery of `pay_1005` (Vikram Singh, ₹1,999) from AI diagnosis to Razorpay order creation and webhook verification.
2. **Scenario B (Safety Interception)**: ₹19,999 transaction held by deterministic guardrails for human operator authorization.

For technical architecture details, consult **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## 📂 Project Structure

```text
recoverAI/
├── README.md                    ⭐ Evaluator entry point
├── ARCHITECTURE.md              ⭐ System architecture & agent specification
├── DEMO.md                      ⭐ 5-minute judge walkthrough
├── .env.example                 ⭐ Root environment template
│
├── backend/                     # FastAPI Service & Multi-Agent Core
│   ├── app/
│   │   ├── main.py              # API routes, CORS, Razorpay webhooks
│   │   ├── engine.py            # 7-stage multi-agent recovery pipeline
│   │   ├── database.py          # MongoDB Atlas connection manager
│   │   ├── seed.py              # Demo dataset reset and transaction seeder
│   │   ├── anomaly_detector.py  # Gateway circuit breaker anomaly detector
│   │   ├── strategy_optimizer.py# Strategy decision logic
│   │   ├── scoring.py           # Priority queue scoring (EMV)
│   │   ├── agents/              # Trigger, Diagnosis, Decision, Guardrail, Executor, Verifier
│   │   ├── ml/                  # Logistic regression, model registry, retraining
│   │   ├── repositories/        # MongoDB Data Access Layer
│   │   └── services/            # Gemini AI, Razorpay, and message services
│   └── requirements.txt
│
├── frontend/                    # React 18 + Vite Enterprise Dashboard
│   ├── src/
│   │   ├── pages/               # Dashboard, RecoveryCases, Customers, Audit, Experiments, Login
│   │   ├── components/          # Command center widgets, 3D visualizer, review panel
│   │   ├── services/            # Centralized API client (VITE_API_URL) & auth
│   │   └── lib/                 # Formatters, sound effects, mock data
│   └── package.json
│
├── docs/                        # Deep-dive technical specifications
│   ├── architecture/            # Recovery pipeline sequence diagrams
│   ├── demo/                    # Live judge presentation guide
│   └── decisions/               # Architecture Decision Records (Guardrails)
│
└── tests/                       # Automated test suites
    ├── backend/                 # Guardrails and ML predictor unit tests
    └── integration/             # End-to-end recovery pipeline test
```

---

## ⚠️ Limitations & Demo-Mode Disclosures

To ensure transparency during evaluation, please note the following operational boundaries:

1. **Razorpay Test Mode**: All payment flows, order creations, and checkouts utilize **Razorpay Test Mode** (`rzp_test_...`). No real money is transferred, and no real credit/debit cards are charged.
2. **Simulated Communication Delivery**: WhatsApp, SMS, and Email recovery messages are rendered, formatted, and verified as dispatch-ready payload objects in the database and UI. In demo mode, live SMS/WhatsApp telco networks are not invoked.
3. **Demo Session Authentication**: The authentication module demonstrates enterprise role-based access control (RBAC) and permission gating via local session storage. It is built for hackathon demonstration rather than production OAuth2/SAML SSO.
4. **No Autonomous Financial Authorization**: The system will **never** autonomously approve high-value transactions ($\ge$ ₹10,000) or issue unbudgeted refunds. All such actions require human operator authorization.
5. **Architectural Principles vs. Certifications**: Statements regarding auditability, idempotency, and security reflect software engineering design patterns and HMAC-SHA256 signature validation, not formal third-party SOC2 or PCI-DSS certifications.
