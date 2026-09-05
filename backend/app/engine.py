from datetime import datetime
from typing import Optional

from bson import ObjectId

from app.database import (
    audit_logs_collection,
    recovery_cases_collection,
    transactions_collection,
)
from app.anomaly_detector import detect_recovery_anomaly
from app.repositories.transaction_repository import (
    get_transaction,
    get_all_transactions,
    update_transaction,
)

from app.repositories.recovery_case_repository import (
    create_recovery_case,
    update_recovery_case,
    get_recovery_case
)

from app.services.customer_service import (
    get_or_create_customer,
    refresh_customer_profile,
)

from app.agents.trigger_agent import trigger_agent
from app.agents.diagnosis_agent import diagnosis_agent
from app.agents.decision_agent import decision_agent
from app.agents.guardrail_agent import guardrail_agent
from app.agents.executor_agent import executor_agent
from app.agents.verifier_agent import verifier_agent
from app.strategy_optimizer import optimize_recovery_strategy


# =============================================================
# MONGODB JSON SERIALIZER
# =============================================================

def serialize_mongo(value):
    """
    Convert MongoDB BSON values into JSON-safe Python values.

    FastAPI cannot directly serialize bson.ObjectId.
    This recursively converts ObjectId values to strings.
    """

    if isinstance(value, ObjectId):
        return str(value)

    if isinstance(value, dict):
        return {
            key: serialize_mongo(item)
            for key, item in value.items()
        }

    if isinstance(value, list):
        return [
            serialize_mongo(item)
            for item in value
        ]

    if isinstance(value, tuple):
        return [
            serialize_mongo(item)
            for item in value
        ]

    return value


# =============================================================
# SINGLE TRANSACTION RECOVERY
# =============================================================

def recover_transaction(transaction_id: str):
    """
    Run the complete RecoverAI pipeline for one transaction.

    Pipeline:

        Transaction
            ↓
        Customer Intelligence
            ↓
        Trigger Agent
            ↓
        Gemini Diagnosis Agent
            ↓
        Gemini Decision Agent
            ↓
        Deterministic Guardrail Agent
            ↓
        Executor Agent
            ↓
        Verifier Agent
            ↓
        MongoDB Update
            ↓
        Recovery Case
            ↓
        Audit Log
    """

    # =========================================================
    # 1. GET TRANSACTION
    # =========================================================

    transaction = get_transaction(transaction_id)

    if not transaction:
        return {
            "success": False,
            "error": "Transaction not found",
            "transaction_id": transaction_id,
        }

    # =========================================================
    # 2. CUSTOMER INTELLIGENCE
    # =========================================================

    customer_profile = None

    email = transaction.get("email")

    if email:
        customer_profile = get_or_create_customer(email)

    # =========================================================
    # 3. CREATE RECOVERY CASE
    # =========================================================

    case = create_recovery_case(
        transaction,
        customer_profile,
    )

    case_id = case["case_id"]

    # =========================================================
    # 4. TRIGGER AGENT
    # =========================================================

    trigger = trigger_agent(
        transaction,
    )

    update_recovery_case(
        case_id,
        {
            "trigger": trigger,
        },
    )

    if not trigger["triggered"]:

        update_recovery_case(
            case_id,
            {
                "status": "not_recoverable",
            },
        )

        return serialize_mongo({
            "success": False,
            "case_id": case_id,
            "transaction_id": transaction_id,
            "error": "Transaction does not require recovery",
        })

    # =========================================================
    # GLOBAL RECOVERY SAFETY CHECK (CIRCUIT BREAKER)
    # =========================================================

    all_transactions = list(
        transactions_collection.find(
            {},
            {"_id": 0}
        )
    )

    anomaly = detect_recovery_anomaly(
        all_transactions
    )

    if anomaly.get("circuit_breaker"):
        update_recovery_case(
            case_id,
            {
                "status": "circuit_breaker",
                "anomaly": anomaly,
                "requires_human_approval": True,
            },
        )
        return serialize_mongo({
            "success": False,
            "transaction_id": transaction_id,
            "status": "circuit_breaker",
            "message": (
                "Automatic recovery temporarily blocked "
                "because payment failures are significantly "
                "above the normal baseline."
            ),
            "anomaly": anomaly,
            "requires_human_approval": True,
        })

    # =========================================================
    # 5. GEMINI DIAGNOSIS AGENT
    # =========================================================

    diagnosis = diagnosis_agent(
        transaction,
        customer_profile,
    )

    update_recovery_case(
        case_id,
        {
            "diagnosis": diagnosis,
        },
    )

    # =========================================================
    # 6. GEMINI DECISION AGENT
    # =========================================================

    decision = decision_agent(
        transaction,
        diagnosis,
        customer_profile,
    )

    ml_strategy = optimize_recovery_strategy(transaction)

    if not ml_strategy.get("requires_human_review", False):
        recommended = ml_strategy["recommended_strategy"]

        decision.update({
            "action": recommended["action"],
            "confidence": recommended["probability"],
            "ai_generated": True,
            "ml_optimized": True,
            "recovery_probability": recommended["probability"],
            "expected_recovery_value":
                recommended["expected_recovery_value"],
        })

    update_recovery_case(
        case_id,
        {
            "decision": decision,
            "ml_strategy": ml_strategy,
        },
    )

    # =========================================================
    # 7. DETERMINISTIC GUARDRAIL
    # =========================================================

    guardrail = guardrail_agent(
        transaction,
        decision["action"],
    )

    update_recovery_case(
        case_id,
        {
            "guardrail": guardrail,
        },
    )

    # =========================================================
    # 8. STOP IF GUARDRAIL BLOCKS ACTION
    # =========================================================

    if not guardrail["passed"]:

        if guardrail["requires_human_approval"]:
            case_status = "human_approval"
        else:
            case_status = "stopped"

        update_recovery_case(
            case_id,
            {
                "status": case_status,
                "amount_recovered": 0,
            },
        )

        audit_logs_collection.insert_one(
            {
                "timestamp": datetime.now().isoformat(),
                "case_id": case_id,
                "transaction_id": transaction_id,
                "customer": transaction["customer"],
                "action": decision["action"],
                "status": case_status,
                "amount_recovered": 0,
                "diagnosis": diagnosis["diagnosis"],
                "guardrail": guardrail["reason"],
            }
        )

        return serialize_mongo({
            "success": False,
            "case_id": case_id,
            "transaction_id": transaction_id,
            "customer": transaction["customer"],
            "amount": transaction["amount"],
            "customer_profile": customer_profile,
            "trigger": trigger,
            "diagnosis": diagnosis,
            "decision": decision,
            "guardrail": guardrail,
            "status": case_status,
            "ml_strategy": ml_strategy,
        })

    # =========================================================
    # 9. EXECUTOR AGENT
    # =========================================================

    execution = executor_agent(
        transaction,
        decision,
        customer_profile,
    )

    update_recovery_case(
        case_id,
        {
            "execution": execution,
            "recovery_message": execution.get("recovery_message"),
        },
    )

    # =========================================================
    # 10. VERIFIER AGENT
    # =========================================================

    verification = verifier_agent(
        transaction,
        execution,
    )

    # =========================================================
    # 11. DETERMINE FINAL STATUS
    # =========================================================

    final_status = verification.get(
        "status",
        "unknown",
    )

    amount_recovered = verification.get(
        "amount_recovered",
        0,
    )

    # =========================================================
    # 12. UPDATE TRANSACTION
    # =========================================================

    transaction_update = {}

    if verification.get("recovered") is True:

        transaction_update = {
            "status": "success",
            "recoverable": False,
            "retry_count": (
                transaction.get(
                    "retry_count",
                    0,
                )
                + (
                    1
                    if decision["action"] == "retry_payment"
                    else 0
                )
            ),
        }

    elif final_status == "failed":

        transaction_update = {
            "status": "failed",
            "recoverable": False,
        }

    elif final_status == "stopped":

        transaction_update = {
            "recoverable": False,
        }

    elif final_status == "pending":

        transaction_update = {
            "status": transaction.get(
                "status",
                "failed",
            ),
            "recoverable": True,
        }

    if transaction_update:

        update_transaction(
            transaction_id,
            transaction_update,
        )

    # =========================================================
    # 13. UPDATE RECOVERY CASE
    # =========================================================

    update_recovery_case(
        case_id,
        {
            "status": final_status,
            "verification": verification,
            "amount_recovered": amount_recovered,
        },
    )

    # =========================================================
    # 14. AUDIT LOG
    # =========================================================

    audit_logs_collection.insert_one(
        {
            "timestamp": datetime.now().isoformat(),
            "case_id": case_id,
            "transaction_id": transaction_id,
            "customer": transaction["customer"],
            "action": decision["action"],
            "status": final_status,
            "amount_recovered": amount_recovered,
            "diagnosis": diagnosis["diagnosis"],
            "guardrail": guardrail["reason"],
            "ai_generated": decision.get(
                "ai_generated",
                False,
            ),
        }
    )

    # =========================================================
    # 15. REFRESH CUSTOMER PROFILE
    # =========================================================

    if email:

        try:

            refresh_customer_profile(
                email,
            )

        except Exception as error:

            print(
                f"Customer profile refresh failed: {error}"
            )

    # =========================================================
    # 16. RETURN COMPLETE RESULT
    # =========================================================

    result = {
        "success": True,
        "case_id": case_id,
        "transaction_id": transaction_id,
        "customer": transaction["customer"],
        "amount": transaction["amount"],
        "customer_profile": customer_profile,
        "trigger": trigger,
        "diagnosis": diagnosis,
        "decision": decision,
        "guardrail": guardrail,
        "execution": execution,
        "verification": verification,
        "ml_strategy": ml_strategy,
        "anomaly": anomaly,
    }

    # IMPORTANT:
    # Convert MongoDB ObjectId values before FastAPI returns JSON.
    return serialize_mongo(result)


# =============================================================
# BATCH RECOVERY
# =============================================================

def recover_batch():
    """
    Run recovery across all currently eligible transactions.

    Only VERIFIED successful recoveries contribute to
    revenue_recovered.
    """

    # =========================================================
    # 1. GET CURRENT TRANSACTIONS
    # =========================================================

    all_transactions = get_all_transactions()

    eligible_transactions = [
        transaction
        for transaction in all_transactions
        if transaction.get("recoverable") is True
    ]

    results = []

    # =========================================================
    # 2. PROCESS EACH TRANSACTION
    # =========================================================

    for transaction in eligible_transactions:

        result = recover_transaction(
            transaction["id"],
        )

        results.append(
            result,
        )

    # =========================================================
    # 3. CLASSIFY RESULTS
    # =========================================================

    recovered_cases = [
        result
        for result in results
        if result.get(
            "verification",
            {},
        ).get(
            "recovered",
        ) is True
    ]

    pending_cases = [
        result
        for result in results
        if result.get(
            "verification",
            {},
        ).get(
            "status",
        ) == "pending"
    ]

    stopped_cases = [
        result
        for result in results
        if result.get(
            "status",
        ) == "stopped"
    ]

    human_approval_cases = [
        result
        for result in results
        if result.get(
            "status",
        ) == "human_approval"
    ]

    failed_cases = [
        result
        for result in results
        if result.get(
            "verification",
            {},
        ).get(
            "status",
        ) == "failed"
    ]

    # =========================================================
    # 4. REVENUE AT RISK
    # =========================================================

    total_revenue_at_risk = sum(
        transaction["amount"]
        for transaction in eligible_transactions
    )

    # =========================================================
    # 5. ACTUAL REVENUE RECOVERED
    # =========================================================

    total_revenue_recovered = sum(
        result.get(
            "verification",
            {},
        ).get(
            "amount_recovered",
            0,
        )
        for result in results
    )

    # =========================================================
    # 6. REVENUE RECOVERY RATE
    # =========================================================

    revenue_recovery_rate = (
        (
            total_revenue_recovered
            / total_revenue_at_risk
        ) * 100
        if total_revenue_at_risk > 0
        else 0
    )

    # =========================================================
    # 7. CASE RECOVERY RATE
    # =========================================================

    total_cases = len(
        eligible_transactions,
    )

    case_recovery_rate = (
        (
            len(recovered_cases)
            / total_cases
        ) * 100
        if total_cases > 0
        else 0
    )

    # =========================================================
    # 8. RETURN BATCH ANALYTICS
    # =========================================================

    result = {
        "summary": {
            "total_cases": total_cases,

            "total_revenue_at_risk": (
                total_revenue_at_risk
            ),

            "total_revenue_recovered": (
                total_revenue_recovered
            ),

            "revenue_recovery_rate_percent": round(
                revenue_recovery_rate,
                2,
            ),

            "case_recovery_rate_percent": round(
                case_recovery_rate,
                2,
            ),
        },

        "outcomes": {
            "recovered": len(
                recovered_cases,
            ),

            "pending": len(
                pending_cases,
            ),

            "stopped": len(
                stopped_cases,
            ),

            "human_approval": len(
                human_approval_cases,
            ),

            "failed": len(
                failed_cases,
            ),
        },

        "cases": results,
    }

    # IMPORTANT:
    # Make absolutely sure the complete batch response is
    # JSON serializable before returning it to FastAPI.
    return serialize_mongo(result)
    # =============================================================
# HUMAN APPROVED RECOVERY
# =============================================================

def approve_recovery(transaction_id: str):
    """
    Continue a recovery case after explicit human approval.

    The original deterministic guardrail remains intact:
    the case was blocked because it required human approval.

    Human approval is the explicit authorization that allows
    the previously recommended action to proceed.

    This is still a simulated recovery for the buildathon.
    """

    # =========================================================
    # 1. GET TRANSACTION
    # =========================================================

    transaction = get_transaction(transaction_id)

    if not transaction:
        return {
            "success": False,
            "error": "Transaction not found",
            "transaction_id": transaction_id,
        }

    # =========================================================
    # 2. FIND EXISTING HUMAN-APPROVAL CASE
    # =========================================================

    cases = list(
        recovery_cases_collection.find(
            {
                "transaction_id": transaction_id,
                "status": "human_approval",
            }
        )
        .sort("_id", -1)
        .limit(1)
    )

    if not cases:
        return {
            "success": False,
            "error": (
                "No pending human-approval recovery "
                "case exists for this transaction."
            ),
            "transaction_id": transaction_id,
        }

    case = cases[0]

    case_id = case.get("case_id")

    decision = case.get("decision")

    if not decision:
        return {
            "success": False,
            "error": (
                "Recovery case has no stored AI decision."
            ),
            "case_id": case_id,
            "transaction_id": transaction_id,
        }

    action = decision.get(
        "action",
        "no_action",
    )

    # =========================================================
    # 3. RECORD HUMAN APPROVAL
    # =========================================================

    human_approval = {
        "approved": True,
        "approved_at": datetime.now().isoformat(),
        "approval_type": "human_operator",
        "message": (
            "Human operator approved execution "
            "of the AI-recommended recovery action."
        ),
    }

    update_recovery_case(
        case_id,
        {
            "human_approval": human_approval,
            "status": "approved",
        },
    )

    # =========================================================
    # 4. PRESERVE ORIGINAL GUARDRAIL DECISION
    # =========================================================

    original_guardrail = case.get(
        "guardrail",
        {},
    )

    approved_guardrail = {
        **original_guardrail,
        "passed": True,
        "requires_human_approval": False,
        "human_approved": True,
        "approval_reason": (
            "Explicit human approval received."
        ),
    }

    update_recovery_case(
        case_id,
        {
            "guardrail": approved_guardrail,
        },
    )

    # =========================================================
    # 5. EXECUTE THE ORIGINAL AI DECISION
    # =========================================================

    email = transaction.get("email")
    customer_profile = get_or_create_customer(email) if email else None

    execution = executor_agent(
        transaction,
        decision,
        customer_profile,
    )

    update_recovery_case(
        case_id,
        {
            "execution": execution,
            "recovery_message": execution.get("recovery_message"),
        },
    )

    # =========================================================
    # 6. VERIFY EXECUTION
    # =========================================================

    verification = verifier_agent(
        transaction,
        execution,
    )

    # =========================================================
    # 7. FINAL STATUS
    # =========================================================

    final_status = verification.get(
        "status",
        "unknown",
    )

    amount_recovered = verification.get(
        "amount_recovered",
        0,
    )

    # =========================================================
    # 8. UPDATE TRANSACTION
    # =========================================================

    transaction_update = {}

    if verification.get("recovered") is True:

        transaction_update = {
            "status": "success",
            "recoverable": False,
            "retry_count": (
                transaction.get(
                    "retry_count",
                    0,
                )
                + (
                    1
                    if action == "retry_payment"
                    else 0
                )
            ),
        }

    elif final_status == "failed":

        transaction_update = {
            "status": "failed",
            "recoverable": False,
        }

    elif final_status == "stopped":

        transaction_update = {
            "recoverable": False,
        }

    elif final_status == "pending":

        transaction_update = {
            "status": transaction.get(
                "status",
                "failed",
            ),
            "recoverable": True,
        }

    if transaction_update:

        update_transaction(
            transaction_id,
            transaction_update,
        )

    # =========================================================
    # 9. UPDATE RECOVERY CASE
    # =========================================================

    update_recovery_case(
        case_id,
        {
            "status": final_status,
            "verification": verification,
            "amount_recovered": amount_recovered,
        },
    )

    # =========================================================
    # 10. AUDIT LOG
    # =========================================================

    audit_logs_collection.insert_one(
        {
            "timestamp": datetime.now().isoformat(),
            "case_id": case_id,
            "transaction_id": transaction_id,
            "customer": transaction.get(
                "customer"
            ),
            "action": action,
            "status": final_status,
            "amount_recovered": amount_recovered,
            "diagnosis": (
                case.get("diagnosis", {})
                .get("diagnosis")
            ),
            "guardrail": (
                "Human approval granted after "
                "original guardrail block."
            ),
            "human_approved": True,
            "approval_type": "human_operator",
        }
    )

    # =========================================================
    # 11. REFRESH CUSTOMER PROFILE
    # =========================================================

    email = transaction.get("email")

    if email:

        try:

            refresh_customer_profile(
                email,
            )

        except Exception as error:

            print(
                f"Customer profile refresh failed: {error}"
            )

    # =========================================================
    # 12. RETURN COMPLETE RESULT
    # =========================================================

    result = {
        "success": True,
        "case_id": case_id,
        "transaction_id": transaction_id,
        "customer": transaction.get(
            "customer"
        ),
        "amount": transaction.get(
            "amount",
            0,
        ),
        "decision": decision,
        "original_guardrail": original_guardrail,
        "guardrail": approved_guardrail,
        "human_approval": human_approval,
        "execution": execution,
        "verification": verification,
        "status": final_status,
    }

    return serialize_mongo(result)


# =============================================================
# AUTHORITATIVE RAZORPAY PAYMENT RECOVERY
# =============================================================

def mark_payment_recovered(
    transaction_id: Optional[str] = None,
    payment_id: Optional[str] = None,
    order_id: Optional[str] = None,
    amount: Optional[float] = None,
    signature: Optional[str] = None,
    verification_method: str = "razorpay_checkout",
):
    """
    Atomically mark a transaction and its recovery case as RECOVERED
    upon genuine Razorpay verification.

    CRITICAL INVARIANT:
    This is the authoritative function in RecoverAI that sets recovered=True
    and updates recovered revenue in MongoDB.
    """
    query = {}
    if transaction_id:
        query["id"] = transaction_id
    elif order_id:
        query["razorpay_order_id"] = order_id
    elif payment_id:
        query["razorpay_payment_id"] = payment_id

    transaction = transactions_collection.find_one(query) if query else None

    if not transaction and order_id:
        transaction = transactions_collection.find_one({"razorpay_order_id": order_id})

    if not transaction and transaction_id:
        transaction = get_transaction(transaction_id)

    if not transaction:
        return {
            "success": False,
            "error": "Matching transaction not found for payment recovery",
            "transaction_id": transaction_id,
            "payment_id": payment_id,
            "order_id": order_id,
        }

    actual_transaction_id = transaction["id"]
    recovered_amount = float(amount if amount is not None else transaction.get("amount", 0))

    # 1. Update Transaction
    now_iso = datetime.now().isoformat()
    transactions_collection.update_one(
        {"id": actual_transaction_id},
        {
            "$set": {
                "status": "success",
                "recoverable": False,
                "razorpay_payment_id": payment_id,
                "razorpay_order_id": order_id or transaction.get("razorpay_order_id"),
                "recovered_at": now_iso,
                "verified_by": verification_method,
            }
        },
    )

    # 2. Update Recovery Case
    case = recovery_cases_collection.find_one(
        {"transaction_id": actual_transaction_id},
        sort=[("_id", -1)],
    )

    verification_doc = {
        "verified": True,
        "recovered": True,
        "amount_recovered": recovered_amount,
        "payment_id": payment_id,
        "order_id": order_id,
        "method": verification_method,
        "verified_at": now_iso,
        "signature_verified": bool(signature),
    }

    case_id = case.get("case_id") if case else f"case_{actual_transaction_id}"

    if case:
        recovery_cases_collection.update_one(
            {"_id": case["_id"]},
            {
                "$set": {
                    "status": "recovered",
                    "amount_recovered": recovered_amount,
                    "verification": verification_doc,
                    "recovered_at": now_iso,
                }
            },
        )
    else:
        recovery_cases_collection.insert_one({
            "case_id": case_id,
            "transaction_id": actual_transaction_id,
            "customer": transaction.get("customer"),
            "amount": recovered_amount,
            "status": "recovered",
            "amount_recovered": recovered_amount,
            "verification": verification_doc,
            "created_at": now_iso,
            "recovered_at": now_iso,
        })

    # 3. Add Authoritative Audit Log
    audit_logs_collection.insert_one({
        "timestamp": now_iso,
        "case_id": case_id,
        "transaction_id": actual_transaction_id,
        "customer": transaction.get("customer", "Customer"),
        "action": "razorpay_payment_verified",
        "status": "recovered",
        "amount_recovered": recovered_amount,
        "diagnosis": f"Payment verified via Razorpay {verification_method} [{payment_id}]",
        "guardrail": "Passed - Cryptographically verified payment",
        "ai_generated": False,
        "payment_id": payment_id,
        "order_id": order_id,
    })

    # 4. Refresh customer profile
    if transaction.get("email"):
        try:
            refresh_customer_profile(transaction["email"])
        except Exception:
            pass

    return serialize_mongo({
        "success": True,
        "transaction_id": actual_transaction_id,
        "case_id": case_id,
        "status": "recovered",
        "amount_recovered": recovered_amount,
        "payment_id": payment_id,
        "order_id": order_id,
        "verification": verification_doc,
        "message": f"Payment of ₹{recovered_amount:,.2f} successfully verified and marked RECOVERED.",
    })