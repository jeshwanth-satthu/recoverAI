import os
import hmac
import hashlib
import json
from typing import Any, Optional
import razorpay
from datetime import datetime, timezone, timedelta
from pymongo.errors import DuplicateKeyError
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.data import transactions, audit_logs
from app.engine import (
    recover_transaction,
    recover_batch,
    approve_recovery,
    mark_payment_recovered,
)
from app.seed import reset_demo_data

from app.database import (
    check_database_connection,
    db,
    transactions_collection,
    recovery_cases_collection,
    audit_logs_collection,
)
razorpay_events_collection = transactions_collection.database["razorpay_events"]
from bson import ObjectId
from app.repositories.recovery_case_repository import (
    get_recovery_case,
    get_all_recovery_cases
)
from app.repositories.customer_repository import (
    get_all_customers,
    get_customer
)

from app.services.customer_service import (
    get_or_create_customer
)
from app.experiment import run_experiment
from app.repositories.experiment_repository import (
    get_experiments,
    get_experiment
)
from app.services.gemini_service import ask_gemini
from app.scoring import build_recovery_priority_queue
from app.strategy_optimizer import optimize_recovery_strategy
from app.anomaly_detector import detect_recovery_anomaly
from app.ml.model_registry import (
    get_model_registry,
    register_current_model,
)


app = FastAPI(
    title="RecoverAI",
    description="AI-powered Revenue Recovery Agent",
    version="1.0.0"
)
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

razorpay_client: Any = razorpay.Client(
    auth=(
        RAZORPAY_KEY_ID,
        RAZORPAY_KEY_SECRET,
    )
)
default_cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    extra_origins = [
        origin.strip()
        for origin in cors_origins_env.split(",")
        if origin.strip()
    ]
    cors_origins = list(dict.fromkeys(default_cors_origins + extra_origins))
else:
    cors_origins = default_cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "RecoverAI Backend is running",
        "status": "online"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/api/transactions")
def get_transactions():
    return {
        "count": len(transactions),
        "transactions": transactions
    }


@app.get("/api/revenue-risk")
def get_revenue_risk():
    risky_transactions = [
        transaction
        for transaction in transactions
        if transaction["recoverable"]
    ]

    total_at_risk = sum(
        float(transaction["amount"])
        for transaction in risky_transactions
    )

    return {
        "total_cases": len(risky_transactions),
        "revenue_at_risk": total_at_risk,
        "cases": risky_transactions
    }


@app.get("/api/dashboard")
def get_dashboard():
    revenue_at_risk = sum(
        t.get("amount", 0)
        for t in transactions_collection.find({"recoverable": True}, {"amount": 1, "_id": 0})
    )

    revenue_recovered = sum(
        c.get("amount_recovered", 0)
        for c in recovery_cases_collection.find({"status": "recovered"}, {"amount_recovered": 1, "_id": 0})
    )

    successful_recoveries = recovery_cases_collection.count_documents({"status": "recovered"})
    total_transactions = transactions_collection.count_documents({})
    audit_events = audit_logs_collection.count_documents({})

    return {
        "revenue_at_risk": revenue_at_risk,
        "revenue_recovered": revenue_recovered,
        "successful_recoveries": successful_recoveries,
        "total_transactions": total_transactions,
        "audit_events": audit_events,
    }


@app.get("/api/audit")
def get_audit_logs():
    logs = list(
        audit_logs_collection.find({}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(100)
    )
    return {
        "count": len(logs),
        "logs": logs,
    }


@app.get("/api/transactions/{transaction_id}")
def get_transaction(transaction_id: str):

    for transaction in transactions:
        if transaction["id"] == transaction_id:
            return transaction

    raise HTTPException(
        status_code=404,
        detail="Transaction not found"
    )
@app.post("/api/batch/recover")
def batch_recover():
    result = recover_batch()
    return serialize_mongo(result)
@app.get("/health/database")
def database_health():
    connected = check_database_connection()

    return {
        "database": "mongodb",
        "connected": connected
    }
@app.get("/api/mongodb/transactions")
def get_mongodb_transactions():

    transactions = list(
        transactions_collection.find(
            {},
            {"_id": 0}
        )
    )

    return {
        "count": len(transactions),
        "transactions": transactions
    }
@app.get("/api/recovery-cases")
def get_recovery_cases():

    cases = get_all_recovery_cases()

    return serialize_mongo({
        "count": len(cases),
        "cases": cases
    })


@app.get("/api/recovery-priority")
def recovery_priority():

    all_transactions = list(
        transactions_collection.find(
            {},
            {"_id": 0}
        )
    )

    queue = build_recovery_priority_queue(
        all_transactions
    )

    return serialize_mongo({
        "count": len(queue),
        "queue": queue,
    })


@app.get("/api/recovery-strategy/{transaction_id}")
def recovery_strategy(transaction_id: str):

    transaction = transactions_collection.find_one(
        {"id": transaction_id},
        {"_id": 0},
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found",
        )

    strategy = optimize_recovery_strategy(
        transaction
    )

    return serialize_mongo(strategy)



@app.get("/api/recovery-cases/{case_id}")
def get_recovery_case_by_id(case_id: str):

    case = get_recovery_case(case_id)

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Recovery case not found"
        )

    return serialize_mongo(case)
@app.get("/api/customers")
def customers():

    customer_list = get_all_customers()

    return serialize_mongo({
        "count": len(customer_list),
        "customers": customer_list
    })
@app.get("/api/customers/email/{email}")
def customer_by_email(email: str):

    customer = get_or_create_customer(email)

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return serialize_mongo(customer)
@app.post("/api/experiments/run")
def run_recovery_experiment():

    return run_experiment()
@app.get("/api/experiments")
def experiments():

    results = get_experiments()

    return {
        "count": len(results),
        "experiments": results
    }
@app.get("/api/ai/test")
def test_gemini():

    response = ask_gemini(
        """
        You are RecoverAI, an AI revenue recovery assistant.

        Respond with exactly one short sentence explaining
        why payment recovery matters for a merchant.
        """
    )

    return {
        "success": True,
        "model": "gemini",
        "response": response
    }
def serialize_mongo(value):
    """
    Convert MongoDB BSON values into JSON-safe values.
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

    return value
def claim_razorpay_event(event_id: str, event: str):
    """
    Atomically claim a Razorpay webhook event.

    Returns:
        "claimed"      -> this request should process the event
        "processed"   -> event was already completed
        "processing"  -> another request is currently processing it
    """

    if not event_id:
        return "missing"

    now = datetime.now(timezone.utc)
    lock_until = now + timedelta(minutes=5)

    try:
        razorpay_events_collection.insert_one({
            "_id": event_id,
            "event": event,
            "status": "processing",
            "created_at": now,
            "updated_at": now,
            "lock_until": lock_until,
        })

        return "claimed"

    except DuplicateKeyError:
        existing = razorpay_events_collection.find_one(
            {"_id": event_id}
        )

        if not existing:
            return "claimed"

        if existing.get("status") == "processed":
            return "processed"

        # If a previous attempt crashed and its lock expired,
        # allow Razorpay's retry to process the event again.
        if (
            existing.get("status") == "processing"
            and existing.get("lock_until")
            and existing["lock_until"] < now
        ):
            result = razorpay_events_collection.update_one(
                {
                    "_id": event_id,
                    "status": "processing",
                    "lock_until": {"$lt": now},
                },
                {
                    "$set": {
                        "updated_at": now,
                        "lock_until": lock_until,
                    }
                },
            )

            if result.modified_count == 1:
                return "claimed"

        if existing.get("status") == "failed":
            result = razorpay_events_collection.update_one(
                {
                    "_id": event_id,
                    "status": "failed",
                },
                {
                    "$set": {
                        "status": "processing",
                        "updated_at": now,
                        "lock_until": lock_until,
                    }
                },
            )

            if result.modified_count == 1:
                return "claimed"

        return "processing"
@app.post("/api/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    """
    Receive and process Razorpay webhook events.

    Razorpay sends:
        X-Razorpay-Signature
        X-Razorpay-Event-Id

    The webhook signature is verified using the raw request body.
    """

    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")

    if not webhook_secret:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "RAZORPAY_WEBHOOK_SECRET is not configured",
            },
        )

    # ---------------------------------------------------------
    # 1. Read the RAW request body
    # ---------------------------------------------------------
    body = await request.body()

    signature = request.headers.get("X-Razorpay-Signature")
    event_id = request.headers.get("x-razorpay-event-id")

    if not signature:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "Missing Razorpay webhook signature",
            },
        )

    # ---------------------------------------------------------
    # 2. Verify Razorpay signature
    # ---------------------------------------------------------
    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        expected_signature,
        signature,
    ):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "Invalid Razorpay webhook signature",
            },
        )

    # ---------------------------------------------------------
    # 3. Parse webhook JSON
    # ---------------------------------------------------------
    try:
        payload = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "Invalid JSON payload",
            },
        )

    event = payload.get("event")

    print("=" * 60)
    print("RAZORPAY WEBHOOK RECEIVED")
    print("Event:", event)
    print("Event ID:", event_id)
    print("=" * 60)

    # ---------------------------------------------------------
    # 4. Razorpay webhook idempotency
    # ---------------------------------------------------------

    if not event_id:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "Missing Razorpay event ID",
            },
        )

    event_claim = claim_razorpay_event(
        event_id,
        event,
    )

    if event_claim == "processed":
        print(
            f"Duplicate Razorpay event ignored: {event_id}"
        )

        return {
            "success": True,
            "duplicate": True,
            "event_id": event_id,
            "message": "Event already processed",
        }

    if event_claim == "processing":
        print(
            f"Razorpay event already processing: {event_id}"
        )

        return {
            "success": True,
            "duplicate": True,
            "event_id": event_id,
            "message": "Event is already being processed",
        }

    # ---------------------------------------------------------
    # 5. Ignore events we don't currently need
    # ---------------------------------------------------------
    if event not in {
        "payment.failed",
        "payment.captured",
        "order.paid",
    }:
        return {
            "success": True,
            "message": f"Event {event} received but not processed",
        }

    # ---------------------------------------------------------
    # 6. Extract payment information
    # ---------------------------------------------------------
    try:
        payment_entity = (
            payload
            .get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )

        payment_id = payment_entity.get("id")
        order_id = payment_entity.get("order_id")
        amount = payment_entity.get("amount", 0)
        email = payment_entity.get("email")

        # Razorpay amount is in paise
        amount_rupees = amount / 100

        print("Payment ID:", payment_id)
        print("Order ID:", order_id)
        print("Amount:", amount_rupees)
        print("Email:", email)

    except Exception as error:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": f"Unable to parse Razorpay payment: {str(error)}",
            },
        )

    # ---------------------------------------------------------
    # 7. Handle successful payment events
    # ---------------------------------------------------------
    if event in {
        "payment.captured",
        "order.paid",
    }:
        print(
            f"Razorpay payment successful: "
            f"{payment_id}"
        )

        recovery_result = mark_payment_recovered(
            payment_id=payment_id,
            order_id=order_id,
            amount=amount_rupees,
            verification_method="razorpay_webhook",
        )

        razorpay_events_collection.update_one(
            {"_id": event_id},
            {
                "$set": {
                    "status": "processed",
                    "updated_at": datetime.now(timezone.utc),
                    "payment_id": payment_id,
                    "order_id": order_id,
                    "recovery": recovery_result,
                }
            },
        )

        return serialize_mongo({
            "success": True,
            "event": event,
            "payment_id": payment_id,
            "order_id": order_id,
            "event_id": event_id,
            "recovery": recovery_result,
            "message": "Successful payment event processed and marked RECOVERED in MongoDB",
        })

    # ---------------------------------------------------------
    # 8. Handle payment.failed
    # ---------------------------------------------------------
    if event == "payment.failed":

        failure_reason = (
            payment_entity.get("error_description")
            or payment_entity.get("error_reason")
            or "razorpay_payment_failed"
        )

        print(
            f"RecoverAI detected failed Razorpay payment: "
            f"{payment_id}"
        )

        # -----------------------------------------------------
        # Find matching RecoverAI transaction
        # -----------------------------------------------------
        query = {
            "$or": [
                {"razorpay_payment_id": payment_id},
                {"razorpay_order_id": order_id},
            ]
        }

        transaction = transactions_collection.find_one(query)

        # -----------------------------------------------------
        # If no matching transaction exists
        # -----------------------------------------------------
        if not transaction:

            print(
                "No matching RecoverAI transaction found."
            )

            return {
                "success": True,
                "event": event,
                "payment_id": payment_id,
                "message": (
                    "Webhook received, but no matching "
                    "RecoverAI transaction exists."
                ),
            }

        transaction_id = transaction.get("id")

        if not transaction_id:
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": (
                        "Matching transaction has no "
                        "RecoverAI transaction ID."
                    ),
                },
            )

        # -----------------------------------------------------
        # Update failure information
        # -----------------------------------------------------
        transactions_collection.update_one(
            {"_id": transaction["_id"]},
            {
                "$set": {
                    "status": "failed",
                    "recoverable": True,
                    "failure_reason": failure_reason,
                    "razorpay_payment_id": payment_id,
                    "razorpay_order_id": order_id,
                    "razorpay_event_id": event_id,
                }
            },
        )

        # -----------------------------------------------------
        # Trigger existing RecoverAI engine
        # -----------------------------------------------------
        try:
            recovery_result = recover_transaction(
                transaction_id
            )

            print(
                "RecoverAI recovery result:",
                recovery_result,
            )

            # ---------------------------------------------------------
            # Mark webhook as successfully processed
            # ---------------------------------------------------------
            razorpay_events_collection.update_one(
                {"_id": event_id},
                {
                    "$set": {
                        "status": "processed",
                        "updated_at": datetime.now(timezone.utc),
                        "payment_id": payment_id,
                        "order_id": order_id,
                        "transaction_id": transaction_id,
                        "recovery_status": recovery_result.get("status"),
                        "recovery_success": recovery_result.get("success"),
                    }
                },
            )

            return serialize_mongo({
                "success": True,
                "event": event,
                "event_id": event_id,
                "payment_id": payment_id,
                "transaction_id": transaction_id,
                "recovery": recovery_result,
            })

        except Exception as error:

            print(
                "RecoverAI recovery error:",
                str(error),
            )

            # Allow Razorpay to retry this event later.
            razorpay_events_collection.update_one(
                {"_id": event_id},
                {
                    "$set": {
                        "status": "failed",
                        "updated_at": datetime.now(timezone.utc),
                        "error": str(error),
                    }
                },
            )

            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "event": event,
                    "event_id": event_id,
                    "payment_id": payment_id,
                    "transaction_id": transaction_id,
                    "error": str(error),
                },
            )

    return {
        "success": True,
        "message": f"Webhook event {event} completed",
    }

@app.post("/api/recovery/{transaction_id}")
def recovery(transaction_id: str):
    result = recover_transaction(transaction_id)

    if result.get("status") == "human_approval":
        return serialize_mongo(result)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)

    return serialize_mongo(result)
@app.post("/api/recovery/{transaction_id}/approve")
def approve_recovery_endpoint(
    transaction_id: str
):
    result = approve_recovery(
        transaction_id
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result,
        )

    return serialize_mongo(result)
@app.post("/api/razorpay/create-order/{transaction_id}")
def create_razorpay_order(transaction_id: str):

    transaction = transactions_collection.find_one(
        {"id": transaction_id},
        {"_id": 0}
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    existing_order_id = transaction.get("razorpay_order_id")
    existing_order_status = transaction.get("razorpay_order_status")

    if (
        existing_order_id
        and existing_order_status == "created"
    ):
        try:
            existing_order = razorpay_client.order.fetch(
                existing_order_id
            )

            return {
                "success": True,
                "transaction_id": transaction_id,
                "razorpay_key_id": RAZORPAY_KEY_ID,
                "order": existing_order,
            }

        except Exception:
            pass

    amount = transaction.get("amount")

    if not amount:
        raise HTTPException(
            status_code=400,
            detail="Transaction has no amount"
        )

    amount_paise = int(round(amount * 100))

    receipt = f"recoverai_{transaction_id}"

    try:

        order = razorpay_client.order.create(
            data={
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt,
                "notes": {
                    "recoverai_transaction_id": transaction_id,
                    "customer": transaction.get(
                        "customer",
                        ""
                    ),
                },
            }
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Razorpay order creation failed: {str(error)}"
        )

    transactions_collection.update_one(
        {"id": transaction_id},
        {
            "$set": {
                "razorpay_order_id": order["id"],
                "razorpay_order_status": order["status"],
            }
        }
    )

    return {
        "success": True,
        "transaction_id": transaction_id,
        "razorpay_key_id": RAZORPAY_KEY_ID,
        "order": order,
    }


@app.post("/api/razorpay/verify-payment")
async def verify_razorpay_payment(request: Request):
    """
    Verify Razorpay payment signature & payment capture status,
    then authoritatively mark the transaction as RECOVERED in MongoDB.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    transaction_id = payload.get("transaction_id")
    payment_id = payload.get("razorpay_payment_id")
    order_id = payload.get("razorpay_order_id")
    signature = payload.get("razorpay_signature")

    if not payment_id:
        raise HTTPException(
            status_code=400,
            detail="Missing razorpay_payment_id"
        )

    # 1. Verify Razorpay cryptographic signature if order_id & signature present
    signature_verified = False
    if order_id and signature and RAZORPAY_KEY_SECRET:
        msg = f"{order_id}|{payment_id}".encode("utf-8")
        expected_sig = hmac.new(
            RAZORPAY_KEY_SECRET.encode("utf-8"),
            msg,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected_sig, signature):
            raise HTTPException(
                status_code=400,
                detail="Invalid Razorpay payment signature"
            )
        signature_verified = True

    # 2. Fetch payment details from Razorpay to verify capture status & amount
    amount_rupees: Optional[float] = None
    try:
        payment_info = razorpay_client.payment.fetch(payment_id)
        status = payment_info.get("status")
        if status not in {"captured", "authorized"}:
            raise HTTPException(
                status_code=400,
                detail=f"Payment {payment_id} has status '{status}', which is not captured/authorized."
            )
        amount_rupees = float(payment_info.get("amount", 0)) / 100.0
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Razorpay fetch warning: {exc}")
        if not signature_verified:
            raise HTTPException(
                status_code=400,
                detail=f"Unable to verify payment with Razorpay: {exc}"
            )

    # 3. Authoritatively mark as recovered in MongoDB
    result = mark_payment_recovered(
        transaction_id=transaction_id,
        payment_id=payment_id,
        order_id=order_id,
        amount=amount_rupees,
        signature=signature,
        verification_method="razorpay_checkout",
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to mark transaction recovered")
        )

    return serialize_mongo(result)


@app.post("/api/demo/reset")
def reset_demo_endpoint():
    """
    Reset transactions and active demo cases to clean initial states.
    """
    result = reset_demo_data()
    return serialize_mongo({
        "success": True,
        "message": "Demo transactions successfully reset to initial states.",
        "details": result,
    })


@app.get("/api/recovery-anomaly")
def recovery_anomaly():

    transactions = list(
        transactions_collection.find(
            {},
            {"_id": 0},
        )
    )

    return serialize_mongo(
        detect_recovery_anomaly(
            transactions
        )
    )


@app.post("/api/recovery/{transaction_id}/feedback")
def recovery_feedback(
    transaction_id: str,
    feedback: dict,
):
    transaction = transactions_collection.find_one(
        {"id": transaction_id},
        {"_id": 0},
    )

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found",
        )

    feedback_value = feedback.get("feedback")

    if feedback_value not in {
        "positive",
        "negative",
    }:
        raise HTTPException(
            status_code=400,
            detail="Feedback must be positive or negative.",
        )

    action = feedback.get("action")

    if not action:
        raise HTTPException(
            status_code=400,
            detail="Recovery action is required.",
        )

    feedback_document = {
        "transaction_id": transaction_id,
        "customer": transaction.get("customer"),
        "amount": transaction.get("amount", 0),
        "failure_reason": transaction.get(
            "failure_reason"
        ),
        "risk_level": transaction.get(
            "risk_level"
        ),
        "retry_count": transaction.get(
            "retry_count",
            0
        ),
        "action": action,
        "feedback": feedback_value,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    db["recovery_feedback"].insert_one(
        feedback_document
    )

    return {
        "success": True,
        "transaction_id": transaction_id,
        "feedback": feedback_value,
        "action": action,
    }


@app.get("/api/recovery-feedback")
def get_recovery_feedback():

    feedback = list(
        db["recovery_feedback"].find(
            {},
            {"_id": 0},
        )
    )

    return serialize_mongo(feedback)


@app.post("/api/ml/retrain")
def retrain_ml_model():
    from app.ml.retrain import train_feedback_model
    return train_feedback_model()


@app.get("/api/ml/status")
def ml_status():
    from pathlib import Path
    import json

    metrics_path = (
        Path(__file__).resolve().parent
        / "ml"
        / "models"
        / "metrics.json"
    )

    if not metrics_path.exists():
        return {
            "available": False,
            "message": "No trained ML model found.",
        }

    try:
        with open(
            metrics_path,
            "r",
            encoding="utf-8",
        ) as file:
            metrics = json.load(file)

        pos_feedback = metrics.get(
            "positive_feedback",
            db["recovery_feedback"].count_documents({"feedback": "positive"})
        )
        neg_feedback = metrics.get(
            "negative_feedback",
            db["recovery_feedback"].count_documents({"feedback": "negative"})
        )

        training_samples = metrics.get(
            "training_samples",
            metrics.get("training_examples"),
        )
        testing_samples = metrics.get(
            "testing_samples",
            metrics.get("testing_examples"),
        )
        total_samples = metrics.get(
            "samples",
            ((training_samples or 0) + (testing_samples or 0)) or None,
        )

        return {
            "available": True,
            "model": metrics.get(
                "model",
                "logistic_regression",
            ),
            "model_version": (
                get_model_registry().get("active_version")
                or metrics.get("model_version")
                or metrics.get("version", "1.0")
            ),
            "roc_auc": metrics.get("roc_auc"),
            "samples": total_samples,
            "training_samples": training_samples,
            "testing_samples": testing_samples,
            "positive_feedback": pos_feedback,
            "negative_feedback": neg_feedback,
            "source": metrics.get(
                "source",
                "recovery_outcomes",
            ),
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to read ML metrics: {error}",
        )


@app.get("/api/ml/registry")
def ml_registry():
    return get_model_registry()


@app.post("/api/ml/register")
def register_ml_model():
    return register_current_model()


