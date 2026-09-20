import json
from typing import Any, Optional

from google import genai
from google.genai import types

from app.config import get_logger, settings

logger = get_logger(__name__)

INTENT_SYSTEM_PROMPT = """You are an intent classifier for an airline disruption support agent.
Read the customer's message and classify it. Respond with ONLY a JSON object:
{
  "intent": one of ["disruption_inquiry", "request_hotel", "request_refund", "request_rebook",
                     "escalation_request", "general_question"],
  "unsupported_request": true if the customer is asking for something outside standard airline
     disruption policy (e.g. a free upgrade, compensation beyond policy, waiving a large fare
     difference, a legal threat/formal complaint, or a refund to a different payment method),
     otherwise false,
  "summary": a short (<15 word) paraphrase of what the customer wants
}
Do not decide whether the request will be approved - only classify it."""

RESPONSE_SYSTEM_PROMPT = """You are AeroResolve AI, a calm, clear, professional airline
customer support agent. You are given structured facts about a customer's booking and the
resolution their airline's policy engine has already decided. Write a short, natural,
customer-facing reply (2-4 sentences).

Rules:
- Only state entitlements/options/amounts that appear in the provided facts. Never invent
  compensation, upgrades, or policy exceptions that are not present in the facts.
- If an escalation was created, say the request has been sent for supervisor review and why.
- If the customer asked for something not covered by the facts and no escalation was created,
  explain politely that it is outside standard policy.
- Be warm but concise. No markdown, no bullet lists, plain prose."""


class GeminiService:
    """Thin, isolated wrapper around the Gemini API.

    Every Gemini call in this service goes through here so the rest of the
    codebase never talks to the model/provider directly, and the provider
    could be swapped later without touching graph logic.
    """

    def __init__(self):
        self._model = settings.GEMINI_MODEL
        self._client: Optional[genai.Client] = None
        if settings.GEMINI_API_KEY:
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            logger.warning("GEMINI_API_KEY not set; falling back to deterministic responses.")

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    async def classify_intent(self, user_message: str) -> dict[str, Any]:
        fallback = {
            "intent": "disruption_inquiry",
            "unsupported_request": False,
            "summary": user_message[:120],
        }
        if not self._client:
            return fallback

        try:
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=f"{INTENT_SYSTEM_PROMPT}\n\nCustomer message: {user_message!r}",
                config=types.GenerateContentConfig(
                    response_mime_type="application/json", temperature=0.0
                ),
            )
            parsed = json.loads(response.text)
            return {
                "intent": parsed.get("intent", fallback["intent"]),
                "unsupported_request": bool(parsed.get("unsupported_request", False)),
                "summary": parsed.get("summary", fallback["summary"]),
            }
        except Exception:
            logger.exception("Gemini intent classification failed; using fallback.")
            return fallback

    async def generate_customer_message(self, facts: dict[str, Any]) -> str:
        if not self._client:
            return self._deterministic_message(facts)

        try:
            prompt = f"{RESPONSE_SYSTEM_PROMPT}\n\nFacts (JSON): {json.dumps(facts, default=str)}"
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.4),
            )
            text = (response.text or "").strip()
            return text or self._deterministic_message(facts)
        except Exception:
            logger.exception("Gemini response generation failed; using fallback.")
            return self._deterministic_message(facts)

    @staticmethod
    def _deterministic_message(facts: dict[str, Any]) -> str:
        """A safe, factual message used when Gemini is unavailable or fails."""
        if facts.get("error"):
            return facts["error"]

        name = (facts.get("customer") or {}).get("name", "there")
        resolution = facts.get("resolution") or {}
        entitlement = resolution.get("entitlement")

        if entitlement == "AIRLINE_CANCELLATION":
            return (
                f"Hi {name}. Your flight was cancelled. You can choose a free rebooking on "
                "the next available flight within 24 hours, or a full refund to your original "
                "payment method."
            )
        if entitlement == "DELAY":
            items = ", ".join(
                e["type"].replace("_", " ").lower() for e in resolution.get("entitlements", [])
            )
            return f"Hi {name}. Your flight is delayed. You're eligible for: {items}."
        if facts.get("escalation"):
            return (
                f"Hi {name}. This request is outside standard policy, so I've sent it to a "
                "supervisor for review."
            )
        return f"Hi {name}. I don't see any active disruption on this booking right now."


gemini_service = GeminiService()
