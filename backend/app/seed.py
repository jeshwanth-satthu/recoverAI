from datetime import datetime, timezone
from app.data import transactions
from app.database import (
    transactions_collection,
    recovery_cases_collection,
    audit_logs_collection,
    db,
)

razorpay_events_collection = db["razorpay_events"]

DEMO_TRANSACTION_IDS = [t["id"] for t in transactions]


def seed_transactions(force_update=False):
    inserted = 0
    updated = 0
    skipped = 0

    for transaction in transactions:
        existing = transactions_collection.find_one({
            "id": transaction["id"]
        })

        if existing:
            if force_update:
                transactions_collection.replace_one(
                    {"id": transaction["id"]},
                    transaction.copy()
                )
                updated += 1
            else:
                skipped += 1
            continue

        transactions_collection.insert_one(transaction.copy())
        inserted += 1

    return {
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
        "total": transactions_collection.count_documents({})
    }


def reset_demo_data():
    """
    Clean reset for the live demo:
    1. Resets known demo transactions (pay_1001 to pay_1008) to pristine initial states.
    2. Removes historical synthetic and prior demo recovery cases so Recovered Revenue starts at ₹0.
    3. Cleans audit logs of synthetic / old records, inserting a clean system initialization event.
    4. Clears previous razorpay test events.
    """
    # 1. Reset demo transactions
    tx_result = seed_transactions(force_update=True)

    # 2. Clean up recovery cases:
    deleted_cases = recovery_cases_collection.delete_many({
        "$or": [
            {"transaction_id": {"$regex": "^txn_"}},
            {"transaction_id": {"$regex": "^test_"}},
            {"transaction_id": {"$in": DEMO_TRANSACTION_IDS}},
        ]
    }).deleted_count

    # 3. Clean up audit logs:
    deleted_logs = audit_logs_collection.delete_many({
        "$or": [
            {"transaction_id": {"$regex": "^txn_"}},
            {"transaction_id": {"$regex": "^test_"}},
            {"transaction_id": {"$in": DEMO_TRANSACTION_IDS}},
        ]
    }).deleted_count

    # Insert a clean baseline log for the demo presentation
    now_iso = datetime.now(timezone.utc).isoformat()
    audit_logs_collection.insert_one({
        "timestamp": now_iso,
        "transaction_id": "pay_1005",
        "case_id": "DEMO-INIT",
        "customer": "Vikram Singh",
        "action": "system_ready",
        "status": "failed",
        "amount_recovered": 0,
        "diagnosis": "Payment failed due to insufficient funds (₹1,999). Ready for autonomous recovery.",
        "guardrail": "Deterministic policy: Under ₹10,000 ceiling. Autonomous recovery permitted.",
        "ai_generated": False,
    })

    # 4. Clear old Razorpay test events
    razorpay_events_collection.delete_many({})

    recovered_cases = recovery_cases_collection.count_documents({"status": "recovered"})
    recovered_revenue = sum(
        c.get("amount_recovered", 0)
        for c in recovery_cases_collection.find({"status": "recovered"}, {"amount_recovered": 1, "_id": 0})
    )

    return {
        "success": True,
        "demo_transactions_reset": len(DEMO_TRANSACTION_IDS),
        "deleted_cases": deleted_cases,
        "deleted_logs": deleted_logs,
        "total_recovery_cases": recovery_cases_collection.count_documents({}),
        "recovered_cases_count": recovered_cases,
        "recovered_revenue": recovered_revenue,
    }



if __name__ == "__main__":
    result = reset_demo_data()
    print(result)