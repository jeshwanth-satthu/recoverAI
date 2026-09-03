import json
import os
import time

from dotenv import load_dotenv
from google import genai


load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.6-flash"
)


if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing from backend/.env"
    )


client = genai.Client(
    api_key=GEMINI_API_KEY
)


# =========================================================
# GEMINI STATE
# =========================================================

GEMINI_QUOTA_EXCEEDED = False

MAX_RETRIES = 2


# =========================================================
# GEMINI REQUEST
# =========================================================

def _generate_content(
    prompt: str,
    json_mode: bool = False
):
    """
    Centralized Gemini request handler.

    Returns None when Gemini is unavailable.

    IMPORTANT:
    This service does NOT make recovery decisions.
    Recovery decisions belong to decision_agent.py.
    """

    global GEMINI_QUOTA_EXCEEDED

    if GEMINI_QUOTA_EXCEEDED:
        return None

    for attempt in range(
        MAX_RETRIES + 1
    ):

        try:

            if json_mode:

                response = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json"
                    }
                )

            else:

                response = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt
                )

            return response

        except Exception as error:

            error_text = str(
                error
            ).lower()

            # ---------------------------------------------
            # QUOTA / RATE LIMIT
            # ---------------------------------------------

            if (
                "resource_exhausted" in error_text
                or "quota" in error_text
                or "429" in error_text
            ):

                print(
                    "Gemini quota exceeded. "
                    "Switching to safe fallback mode."
                )

                GEMINI_QUOTA_EXCEEDED = True

                return None

            # ---------------------------------------------
            # TEMPORARY FAILURE
            # ---------------------------------------------

            if attempt < MAX_RETRIES:

                wait_time = 2 ** attempt

                print(
                    f"Gemini temporary error. "
                    f"Retrying in {wait_time}s..."
                )

                time.sleep(
                    wait_time
                )

            else:

                print(
                    f"Gemini request failed: {error}"
                )

                return None

    return None


# =========================================================
# TEXT
# =========================================================

def ask_gemini(prompt: str):
    """
    Generate normal text.

    Returns None when Gemini is unavailable.
    """

    response = _generate_content(
        prompt,
        json_mode=False
    )

    if response is None:
        return None

    try:
        return response.text

    except Exception:
        return None


# =========================================================
# JSON
# =========================================================

def ask_gemini_json(prompt: str):
    """
    Generate JSON using Gemini.

    IMPORTANT:
    This function does NOT invent a recovery action
    when Gemini is unavailable.

    It returns None so that the calling agent can
    apply its own deterministic fallback rules.
    """

    response = _generate_content(
        prompt,
        json_mode=True
    )

    if response is None:
        return None

    try:

        text = response.text.strip()

    except Exception:

        return None

    # -----------------------------------------------------
    # Normal JSON
    # -----------------------------------------------------

    try:

        return json.loads(
            text
        )

    except json.JSONDecodeError:

        pass

    # -----------------------------------------------------
    # Markdown JSON
    # -----------------------------------------------------

    if text.startswith("```"):

        cleaned = (
            text
            .replace(
                "```json",
                ""
            )
            .replace(
                "```",
                ""
            )
            .strip()
        )

        try:

            return json.loads(
                cleaned
            )

        except json.JSONDecodeError:

            pass

    print(
        "Gemini returned invalid JSON."
    )

    return None