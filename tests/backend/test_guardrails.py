"""
Unit tests for deterministic safety guardrails.
Enforces hard policy boundaries regardless of LLM recommendations.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path so app modules are resolvable
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.agents.guardrail_agent import guardrail_agent, MAX_AUTOMATIC_RECOVERY_AMOUNT


def test_guardrail_passes_normal_transaction():
    transaction = {
        "id": "pay_test_001",
        "amount": 1999,
        "risk_level": "low",
        "retry_count": 0,
    }
    result = guardrail_agent(transaction, "send_payment_reminder")
    assert result["passed"] is True
    assert result["requires_human_approval"] is False


def test_guardrail_intercepts_high_amount():
    # Exceeds the ₹10,000 threshold
    transaction = {
        "id": "pay_test_high_amount",
        "amount": 19999,
        "risk_level": "low",
        "retry_count": 0,
    }
    result = guardrail_agent(transaction, "send_payment_reminder")
    assert result["passed"] is False
    assert result["requires_human_approval"] is True
    reason = str(result.get("reason", ""))
    assert "₹10,000" in reason or f"₹{MAX_AUTOMATIC_RECOVERY_AMOUNT:,}" in reason


def test_guardrail_intercepts_high_risk_customer():
    transaction = {
        "id": "pay_test_high_risk",
        "amount": 500,
        "risk_level": "high",
        "retry_count": 0,
    }
    result = guardrail_agent(transaction, "send_payment_reminder")
    assert result["passed"] is False
    assert result["requires_human_approval"] is True
    reason = str(result.get("reason", ""))
    assert "High-risk" in reason


def test_guardrail_blocks_exceeded_retries():
    transaction = {
        "id": "pay_test_max_retries",
        "amount": 1500,
        "risk_level": "low",
        "retry_count": 3,
    }
    result = guardrail_agent(transaction, "retry_payment")
    assert result["passed"] is False
    assert result["requires_human_approval"] is True
    reason = str(result.get("reason", ""))
    assert "retry limit" in reason.lower()


def test_guardrail_blocks_unauthorized_action():
    transaction = {
        "id": "pay_test_invalid_action",
        "amount": 1000,
        "risk_level": "low",
        "retry_count": 0,
    }
    result = guardrail_agent(transaction, "unauthorized_refund_credit")
    assert result["passed"] is False
    assert result["requires_human_approval"] is True


if __name__ == "__main__":
    test_guardrail_passes_normal_transaction()
    test_guardrail_intercepts_high_amount()
    test_guardrail_intercepts_high_risk_customer()
    test_guardrail_blocks_exceeded_retries()
    test_guardrail_blocks_unauthorized_action()
    print("All Guardrail Unit Tests Passed!")
