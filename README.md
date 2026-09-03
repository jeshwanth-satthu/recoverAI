# RecoverAI — Autonomous Revenue Recovery Agent

RecoverAI is an autonomous, AI-powered revenue recovery platform designed to detect payment failures, intelligently diagnose root causes, and execute recovery strategies with deterministic safety guardrails and human-in-the-loop oversight.

---

## ⚡ Core Features

- **Webhook Ingestion & Idempotency**: Real-time integration with payment gateways (Razorpay) featuring atomic event claiming and idempotency locks.
- **Multi-Agent AI Pipeline**:
  - **Trigger Agent**: Ingests failed payment webhooks and flags recoverable transactions.
  - **Diagnosis Agent**: Evaluates failure telemetry using Google Gemini AI to analyze root causes and customer intent.
  - **Decision Agent**: Selects bounded, targeted recovery actions (priority paylinks, retry scheduling, gateway routing).
  - **Guardrail Agent**: Enforces strict deterministic safety checks (amount caps, customer tier validation) to halt risky autonomous executions.
  - **Executor Agent**: Deterministic execution for recovery actions.
  - **Verifier Agent**: Verifies transaction resolution and revenue attribution.
- **Human-in-the-Loop Override Dossier**: Interactive dashboard for operators to review intercepted high-risk transactions with real-time AI reasoning and 1-click approvals.
- **Enterprise Command Center**: Futuristic 3D dashboard built with React, Three.js / React Three Fiber, Framer Motion, and Tailwind CSS.

---

## 🏗️ Architecture

```text
Payment Failure (Razorpay)
         │
         ▼
[ Webhook Ingestion & Atomic Claim ]
         │
         ▼
[ Diagnosis Agent (Gemini AI) ]
         │
         ▼
[ Decision Agent (Gemini AI) ]
         │
         ▼
[ Safety Guardrail Agent ] ──(Threshold Exceeded)──► [ Human Approval Queue ]
         │ (Passed)                                          │ (Approved)
         ▼                                                   │
[ Executor Agent ] ◄─────────────────────────────────────────┘
         │
         ▼
[ Verifier Agent & Audit Ledger ]
         │
         ▼
   Revenue Recovered
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB instance (local or MongoDB Atlas)
- Gemini API Key

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Configure your environment variables in `backend/.env` (see `.env.example`):
```env
MONGODB_URI=mongodb://localhost:27017/recoverai
GEMINI_API_KEY=your_gemini_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

Run the backend:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will be accessible at `http://localhost:5173`.
The backend API documentation is available at `http://localhost:8000/docs`.

---

## 🛡️ Safety & Guardrails
- **Autonomous Recovery Cap**: High-value transactions automatically require human operator review.
- **Audit Trails**: Every agent decision and operator override is logged in MongoDB with timestamps and diagnostic rationale.
