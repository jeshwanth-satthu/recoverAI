from app.services.gemini_service import ask_gemini_json


def generate_customer_recovery_message(transaction, decision, customer_profile=None):
    """
    Generate an AI-tailored customer recovery message adapting tone,
    failure explanation, and call-to-action to the customer's history.

    Returns a structured message dossier with a clear mock/preview dispatch status.
    """
    customer_name = transaction.get("customer") or "Valued Customer"
    email = transaction.get("email") or "customer@example.com"
    amount = transaction.get("amount", 0)
    failure_reason = str(transaction.get("failure_reason") or "payment_failed").replace("_", " ").title()
    action = decision.get("action", "send_payment_reminder")

    # Determine adaptive tone based on customer profile & risk
    success_rate = (customer_profile or {}).get("success_rate", 80)
    if success_rate >= 75:
        tone = "Empathetic, High-Value VIP"
        tone_instruction = "Tone should be warm, courteous, and respectful of their strong history with us."
    else:
        tone = "Clear, Helpful & Direct"
        tone_instruction = "Tone should be polite, concise, and focused on clear next steps."

    prompt = f"""
You are the customer recovery communication specialist for RecoverAI.
Write a personalized customer recovery notification for a failed payment.

CUSTOMER: {customer_name}
EMAIL: {email}
AMOUNT: ₹{amount:,}
PAYMENT TYPE: {transaction.get("type", "checkout")}
FAILURE REASON: {failure_reason}
RECOMMENDED ACTION: {action}
CUSTOMER PROFILE TONE: {tone_instruction}

Generate a JSON object with:
- "subject": Email subject line
- "headline": Short 1-line heading
- "body": 2-3 friendly, empathetic paragraphs explaining the situation and providing clear next steps without technical jargon
- "tone": "{tone}"
- "call_to_action": e.g. "Complete Payment Securely" or "Update Payment Method"

Return ONLY valid JSON.
"""

    try:
        gemini_result = ask_gemini_json(prompt)
        if (
            isinstance(gemini_result, dict)
            and gemini_result.get("subject")
            and gemini_result.get("body")
        ):
            return {
                "channel": (customer_profile or {}).get("preferred_channel", "email"),
                "recipient": email,
                "recipient_name": customer_name,
                "subject": gemini_result.get("subject"),
                "headline": gemini_result.get("headline", f"Action required for your ₹{amount:,} payment"),
                "body": gemini_result.get("body"),
                "tone": gemini_result.get("tone", tone),
                "call_to_action": gemini_result.get("call_to_action", "Complete Payment"),
                "dispatch_status": "Ready to Send",
                "dispatch_mode": "Preview Only (Mock Dispatch)",
                "ai_generated": True,
            }
    except Exception as err:
        print(f"Gemini message generation fallback: {err}")

    # Deterministic high-quality fallback
    if "insufficient" in str(transaction.get("failure_reason", "")).lower():
        headline = f"Action Needed: Complete your ₹{amount:,} payment"
        body = (
            f"Hi {customer_name},\n\n"
            f"We noticed that your recent payment of ₹{amount:,} could not be completed due to insufficient funds in your account.\n\n"
            "We've preserved your order so you don't lose your spot. Whenever you're ready, you can complete the payment using our secure checkout link below with any supported payment method."
        )
        cta = "Complete ₹" + f"{amount:,} Payment"
    elif "abandon" in str(transaction.get("failure_reason", "")).lower():
        headline = "You left items in your cart"
        body = (
            f"Hi {customer_name},\n\n"
            f"It looks like your checkout for ₹{amount:,} was interrupted before completion.\n\n"
            "Your items are safely reserved for a limited time. Tap below to resume right where you left off."
        )
        cta = "Resume Checkout"
    elif "expired" in str(transaction.get("failure_reason", "")).lower():
        headline = "Your payment card has expired"
        body = (
            f"Hi {customer_name},\n\n"
            f"We were unable to process your subscription renewal of ₹{amount:,} because your payment card on file has expired.\n\n"
            "Please take a moment to update your payment details to ensure uninterrupted access to your service."
        )
        cta = "Update Payment Card"
    else:
        headline = f"Payment update for your ₹{amount:,} transaction"
        body = (
            f"Hi {customer_name},\n\n"
            f"We encountered a temporary issue while processing your payment of ₹{amount:,} ({failure_reason}).\n\n"
            "Click below to retry the transaction through our verified Razorpay checkout."
        )
        cta = "Retry Payment"

    return {
        "channel": (customer_profile or {}).get("preferred_channel", "email"),
        "recipient": email,
        "recipient_name": customer_name,
        "subject": f"Notice regarding your payment of ₹{amount:,}",
        "headline": headline,
        "body": body,
        "tone": tone,
        "call_to_action": cta,
        "dispatch_status": "Ready to Send",
        "dispatch_mode": "Preview Only (Mock Dispatch)",
        "ai_generated": False,
    }
