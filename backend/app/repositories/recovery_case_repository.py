from datetime import datetime
from uuid import uuid4

from app.database import recovery_cases_collection


def create_recovery_case(transaction, customer_profile=None):
    case = {
        "case_id": f"RC-{uuid4().hex[:8].upper()}",
        "transaction_id": transaction["id"],
        "customer": transaction["customer"],
        "email": transaction.get("email"),
        "customer_profile": customer_profile,
        "amount": transaction["amount"],
        "currency": transaction.get("currency", "INR"),
        "transaction_type": transaction.get("type"),
        "initial_status": transaction["status"],
        "failure_reason": transaction.get("failure_reason"),
        "risk_level": transaction.get("risk_level"),
        "retry_count": transaction.get("retry_count", 0),
        "status": "processing",
        "diagnosis": None,
        "decision": None,
        "guardrail": None,
        "execution": None,
        "verification": None,
        "amount_recovered": 0,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

    recovery_cases_collection.insert_one(case)

    return case


def update_recovery_case(case_id, updates):
    updates["updated_at"] = datetime.now().isoformat()

    recovery_cases_collection.update_one(
        {"case_id": case_id},
        {"$set": updates}
    )


def get_recovery_case(case_id):
    return recovery_cases_collection.find_one(
        {"case_id": case_id},
        {"_id": 0}
    )


def get_all_recovery_cases():
    return list(
        recovery_cases_collection.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1)
    )