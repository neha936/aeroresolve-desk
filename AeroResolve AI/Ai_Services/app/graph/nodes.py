from app.config import get_logger
from app.graph.state import AgentState
from app.services.backend_client import BackendClientError
from app.services.gemini_service import gemini_service
from app.tools import action_tools, booking_tools, customer_tools, policy_tools

logger = get_logger(__name__)

GENERIC_ERROR_MESSAGE = "Sorry, I'm unable to retrieve your booking right now. Please try again."
NOT_FOUND_MESSAGE = "I couldn't find a booking for that PNR. Could you double-check it?"
MISSING_PNR_MESSAGE = "Could you share your PNR/booking reference so I can look into this?"


def _safe_error_message(exc: BackendClientError) -> str:
    if exc.status_code == 404:
        return NOT_FOUND_MESSAGE
    return GENERIC_ERROR_MESSAGE


async def understand_intent(state: AgentState) -> dict:
    pnr = (state.get("pnr") or "").strip()
    if not pnr:
        logger.info("Chat request received without a PNR.")
        return {"pnr": None, "error": MISSING_PNR_MESSAGE}

    logger.info("Chat request received for PNR=%s", pnr)
    classification = await gemini_service.classify_intent(state["user_message"])
    logger.info("Classified intent=%s unsupported=%s", classification["intent"], classification["unsupported_request"])
    return {
        "pnr": pnr,
        "intent": classification["intent"],
        "unsupported_request": classification["unsupported_request"],
    }


async def load_context(state: AgentState) -> dict:
    pnr = state["pnr"]
    try:
        customer = await customer_tools.get_customer_info(pnr)
        booking = await booking_tools.get_booking_info(pnr)
    except BackendClientError as exc:
        logger.warning("load_context failed for PNR=%s: %s", pnr, exc.message)
        return {"error": _safe_error_message(exc)}

    return {"customer": customer, "booking": booking, "flight": booking.get("flight")}


async def check_policy_and_resolve(state: AgentState) -> dict:
    pnr = state["pnr"]
    try:
        result = await policy_tools.check_and_resolve(
            pnr, state["user_message"], state.get("conversation_id")
        )
    except BackendClientError as exc:
        logger.warning("check_policy_and_resolve failed for PNR=%s: %s", pnr, exc.message)
        return {"error": _safe_error_message(exc)}

    resolution = result.get("resolution")
    logger.info("Policy resolution entitlement=%s", (resolution or {}).get("entitlement"))
    return {
        "conversation_id": result.get("conversationId"),
        "available_actions": resolution,
        "applied_actions": result.get("appliedActions"),
    }


async def handle_escalation(state: AgentState) -> dict:
    booking = state.get("booking")
    if not booking:
        return {}

    reason = f"Customer request outside standard policy: {state['user_message']}"
    try:
        escalation = await action_tools.create_escalation(
            booking["id"],
            reason,
            {"type": "CUSTOMER_REQUEST", "pnr": state["pnr"], "message": state["user_message"]},
        )
    except BackendClientError as exc:
        logger.warning("Escalation creation failed for PNR=%s: %s", state["pnr"], exc.message)
        return {}

    logger.info("Escalation created id=%s for PNR=%s", escalation.get("id"), state["pnr"])
    return {"escalation": escalation}


async def generate_response(state: AgentState) -> dict:
    if state.get("error"):
        return {"response": state["error"]}

    facts = {
        "customer": state.get("customer"),
        "flight": state.get("flight"),
        "resolution": state.get("available_actions"),
        "applied_actions": state.get("applied_actions"),
        "escalation": state.get("escalation"),
    }
    message = await gemini_service.generate_customer_message(facts)
    return {"response": message}
