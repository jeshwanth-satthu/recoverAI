# Judge & Evaluator Flow Cheat Sheet

> Fast-path reference for evaluating RecoverAI during live demos or code inspections.

---

## ⚡ 60-Second Elevator Pitch

> *"Payment failures cause over $50 Billion in lost revenue every year. Most companies either spam customers with dumb retries or send delayed generic emails.*  
>  
> *RecoverAI is an autonomous multi-agent revenue recovery engine. It uses Gemini 2.0 to diagnose why a payment failed, Scikit-Learn ML to rank cases by expected value, and an adaptive strategy agent to pick the best channel and timing.*  
>  
> *Crucially, it is built with enterprise safety: hard deterministic guardrails prevent runaway discounts, transactions over ₹10,000 require human authorization, and revenue is only counted when verified cryptographically by Razorpay."*

---

## 🧭 Live Demo Navigation

| Goal | UI Action | Expected Result |
| :--- | :--- | :--- |
| **Reset Environment** | Click **"Reset Demo Data"** in header / demo bar | All counters reset to baseline; 6 seed cases loaded. |
| **Standard AI Recovery** | Click **"Run Recovery Engine (pay_1005)"** on Hero | Full 7-stage pipeline runs; AI diagnosis & strategy generated; Razorpay order created. |
| **Inspect AI Reasoning** | Click on `pay_1005` in **Live Cases** table | **7-Stage Case Journey Modal** shows Gemini diagnosis, ML probability, and guardrail check. |
| **Test Human-in-the-Loop** | Click **"Auto-Recover"** on `pay_1003` (₹19,999) | Guardrail intercepts; case moves to `HELD_FOR_REVIEW`; appears in **High-Risk Review Panel**. |
| **Authorize High-Risk Case**| In **High-Risk Review Panel**, click **"Authorize"** | Operator authorization logged in audit trail; execution resumes. |
| **Gateway Safety** | Inspect **Circuit Breaker** widget | Shows live gateway anomaly monitor (`CLOSED` = Healthy). |
| **ML Intelligence** | Inspect **ML Intelligence** widget | Displays active model version, ROC-AUC score, and retraining sample count. |

---

## 💻 Terminal Command Cheat Sheet

### 1. Health & Database Status
```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/health/database
```

### 2. Reset Demo State
```bash
curl -X POST http://127.0.0.1:8000/api/demo/reset
```

### 3. Run Autonomous Recovery for pay_1005
```bash
curl -X POST http://127.0.0.1:8000/api/recovery/pay_1005
```

### 4. Inspect Case Details & Audit Logs
```bash
curl http://127.0.0.1:8000/api/recovery-cases/pay_1005
curl http://127.0.0.1:8000/api/audit
```

### 5. Inspect ML Model & Anomaly Detection
```bash
curl http://127.0.0.1:8000/api/ml/status
curl http://127.0.0.1:8000/api/recovery-anomaly
```

### 6. Run Complete Automated Regression Suite
```bash
cd backend
python ../tests/integration/test_recovery_pipeline.py
```
*(Runs 18 automated checks in ~3 seconds with zero manual setup required).*
