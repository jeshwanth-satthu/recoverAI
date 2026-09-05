transactions = [
    {
        "id": "pay_1001",
        "customer": "Rahul Sharma",
        "email": "rahul@example.com",
        "amount": 4999,
        "currency": "INR",
        "type": "subscription",
        "status": "failed",
        "failure_reason": "temporary_payment_failure",
        "retry_count": 0,
        "risk_level": "medium",
        "recoverable": True
    },
    {
        "id": "pay_1002",
        "customer": "Priya Reddy",
        "email": "priya@example.com",
        "amount": 2499,
        "currency": "INR",
        "type": "subscription",
        "status": "failed",
        "failure_reason": "insufficient_funds",
        "retry_count": 0,
        "risk_level": "medium",
        "recoverable": True
    },
    {
        "id": "pay_1003",
        "customer": "Arjun Kumar",
        "email": "arjun@example.com",
        "amount": 8999,
        "currency": "INR",
        "type": "checkout",
        "status": "abandoned",
        "failure_reason": "checkout_abandoned",
        "retry_count": 0,
        "risk_level": "low",
        "recoverable": True
    },
    {
        "id": "pay_1004",
        "customer": "Sneha Patel",
        "email": "sneha@example.com",
        "amount": 19999,
        "currency": "INR",
        "type": "subscription",
        "status": "failed",
        "failure_reason": "expired_card",
        "retry_count": 0,
        "risk_level": "high",
        "recoverable": True
    },
    {
        "id": "pay_1005",
        "customer": "Vikram Singh",
        "email": "vikram@example.com",
        "amount": 1999,
        "currency": "INR",
        "type": "checkout",
        "status": "failed",
        "failure_reason": "insufficient_funds",
        "retry_count": 0,
        "risk_level": "medium",
        "recoverable": True
    },
    {
        "id": "pay_1006",
        "customer": "Ananya Rao",
        "email": "ananya@example.com",
        "amount": 6999,
        "currency": "INR",
        "type": "subscription",
        "status": "failed",
        "failure_reason": "network_timeout",
        "retry_count": 1,
        "risk_level": "low",
        "recoverable": True
    },
    {
        "id": "pay_1007",
        "customer": "Karthik Reddy",
        "email": "karthik@example.com",
        "amount": 12999,
        "currency": "INR",
        "type": "subscription",
        "status": "overdue",
        "failure_reason": "payment_overdue",
        "retry_count": 0,
        "risk_level": "high",
        "recoverable": True
    },
    {
        "id": "pay_1008",
        "customer": "Meera Nair",
        "email": "meera@example.com",
        "amount": 3499,
        "currency": "INR",
        "type": "checkout",
        "status": "failed",
        "failure_reason": "temporary_payment_failure",
        "retry_count": 0,
        "risk_level": "low",
        "recoverable": True
    }
]

audit_logs = []