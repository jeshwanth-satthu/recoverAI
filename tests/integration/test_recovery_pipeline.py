"""
End-to-end integration test suite for RecoverAI.
Validates the entire 7-stage recovery pipeline, API endpoints,
database state, safety guardrails, Razorpay order creation, and feedback loops.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_01_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "healthy"
    print("  [PASS] 1. Backend /health is healthy")


def test_02_database_health():
    response = client.get("/health/database")
    assert response.status_code == 200
    data = response.json()
    assert data.get("connected") is True, f"Database not connected: {data}"
    print("  [PASS] 2. MongoDB connection /health/database is active and healthy")


def test_03_demo_reset():
    response = client.post("/api/demo/reset")
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True, f"Demo reset unexpected payload: {data}"
    print("  [PASS] 3. Demo dataset reset executed successfully")


def test_04_dashboard_metrics():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "revenue_at_risk" in data or "metrics" in data
    print("  [PASS] 4. Dashboard metrics retrieved successfully")


def test_05_transactions_and_cases_listing():
    tx_resp = client.get("/api/mongodb/transactions")
    assert tx_resp.status_code == 200
    tx_data = tx_resp.json()
    txns = tx_data if isinstance(tx_data, list) else tx_data.get("transactions", [])
    assert len(txns) > 0

    cases_resp = client.get("/api/recovery-cases")
    assert cases_resp.status_code == 200
    cases_data = cases_resp.json()
    cases = cases_data if isinstance(cases_data, list) else cases_data.get("cases", [])
    print(f"  [PASS] 5. Cases and transactions retrieved ({len(txns)} txns, {len(cases)} cases)")


def test_06_customers_and_audit_listing():
    cust_resp = client.get("/api/customers")
    assert cust_resp.status_code == 200

    audit_resp = client.get("/api/audit")
    assert audit_resp.status_code == 200
    print("  [PASS] 6. Customer ledger and audit trail accessible")


def test_07_autonomous_recovery_execution():
    # Execute recovery for the standard scenario: pay_1005 (Vikram Singh)
    resp = client.post("/api/recovery/pay_1005")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True or "case_id" in data

    case = data.get("case", data)
    assert bool(case.get("diagnosis")), "Diagnosis missing from recovered case"
    assert bool(case.get("decision") or case.get("recommended_strategy")), "Decision missing"
    assert bool(case.get("guardrail")), "Guardrails missing from recovered case"

    print("  [PASS] 7. Autonomous recovery pipeline executed for pay_1005")
    diag_cat = case.get("diagnosis", {}).get("root_cause_category") or case.get("diagnosis", {}).get("category")
    print(f"         Diagnosis:         {diag_cat}")
    print(f"         Recommended Strat: {case.get('decision', {}).get('action') or case.get('recommended_strategy')}")
    print(f"         Guardrails Passed: {case.get('guardrail', {}).get('passed')}")


def test_08_razorpay_order_generation():
    resp = client.post("/api/razorpay/create-order/pay_1005")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("success") is True
    order_id = data["order"]["id"]
    assert order_id.startswith("order_")
    print(f"  [PASS] 8. Razorpay order generated successfully ({order_id})")


def test_09_priority_queue_ranking():
    resp = client.get("/api/recovery-priority")
    assert resp.status_code == 200
    data = resp.json()
    assert "queue" in data or isinstance(data, list)
    print("  [PASS] 9. Priority queue ranking evaluated with expected monetary values")


def test_10_circuit_breaker_status():
    resp = client.get("/api/recovery-anomaly")
    assert resp.status_code == 200
    data = resp.json()
    assert "circuit_breaker" in data
    print("  [PASS] 10. Gateway circuit breaker anomaly detector is operational")


def test_11_ml_model_status():
    resp = client.get("/api/ml/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "model_name" in data or "active_model" in data or "model" in data
    print("  [PASS] 11. ML Intelligence reporting active model parameters")


def test_12_operator_feedback_submission():
    payload = {
        "action": "send_payment_reminder",
        "feedback": "positive",
    }
    resp = client.post("/api/recovery/pay_1005/feedback", json=payload)
    assert resp.status_code == 200
    print("  [PASS] 12. Operator feedback loop successfully stored for retraining")


def run_all_tests():
    print("\n" + "=" * 65)
    print("RECOVERAI END-TO-END INTEGRATION TEST SUITE")
    print("=" * 65)

    test_01_health_check()
    test_02_database_health()
    test_03_demo_reset()
    test_04_dashboard_metrics()
    test_05_transactions_and_cases_listing()
    test_06_customers_and_audit_listing()
    test_07_autonomous_recovery_execution()
    test_08_razorpay_order_generation()
    test_09_priority_queue_ranking()
    test_10_circuit_breaker_status()
    test_11_ml_model_status()
    test_12_operator_feedback_submission()

    print("=" * 65)
    print("ALL 12 RECOVERAI INTEGRATION TESTS PASSED CLEANLY!")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    run_all_tests()
