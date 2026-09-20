import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.graph import nodes
from app.graph.workflow import workflow
from app.main import app
from app.services.backend_client import BackendClientError

# Real resolution shapes, matching exactly what the Node policy engine
# (policyService.js) produces for the seeded assignment scenarios - nothing
# here re-derives or guesses the policy, it mirrors the backend's own output
# so these tests catch drift instead of asserting invented numbers.

CANCELLATION_RESOLUTION = {
    "entitlement": "AIRLINE_CANCELLATION",
    "options": ["REBOOK_NEXT_AVAILABLE_WITHIN_24H", "FULL_REFUND"],
    "customerChooses": True,
    "loyalty": {"entitlement": "LOYALTY_TIER", "loyaltyTier": "Gold", "priorityRebooking": True},
}

DELAY_4H_RESOLUTION = {
    "entitlement": "DELAY",
    "delayMinutes": 240,
    "entitlements": [
        {"type": "MEAL_VOUCHER", "amountInr": 500},
        {"type": "LOUNGE_ACCESS"},
    ],
    "loyalty": {"entitlement": "LOYALTY_TIER", "loyaltyTier": "Silver", "priorityRebooking": False},
}

DELAY_6H_RESOLUTION = {
    "entitlement": "DELAY",
    "delayMinutes": 360,
    "entitlements": [
        {"type": "MEAL_VOUCHER", "amountInr": 500},
        {"type": "LOUNGE_ACCESS"},
        {"type": "HOTEL_ACCOMMODATION", "coversDelayedHoursOnly": True},
    ],
    "loyalty": {"entitlement": "LOYALTY_TIER", "loyaltyTier": "Platinum", "priorityRebooking": True},
}


class HealthTests(unittest.TestCase):
    def test_health(self):
        client = TestClient(app)
        resp = client.get("/health")
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body, {"success": True, "service": "AeroResolve AI Service", "status": "healthy"})


class ChatEndpointTests(unittest.TestCase):
    def test_ai_chat_basic_shape(self):
        with patch("app.graph.nodes.customer_tools.get_customer_info", new=AsyncMock(return_value={"name": "Priya Nair", "loyaltyTier": "Gold"})), \
             patch("app.graph.nodes.booking_tools.get_booking_info", new=AsyncMock(return_value={"id": "booking-1", "pnr": "SK4821X", "status": "cancelled", "flight": {"status": "cancelled", "delayMinutes": 0}})), \
             patch("app.graph.nodes.policy_tools.check_and_resolve", new=AsyncMock(return_value={"conversationId": "conv-1", "resolution": CANCELLATION_RESOLUTION, "appliedActions": []})), \
             patch("app.services.gemini_service.gemini_service.classify_intent", new=AsyncMock(return_value={"intent": "disruption_inquiry", "unsupported_request": False, "summary": "asking about cancellation"})):
            client = TestClient(app)
            resp = client.post("/api/ai/chat", json={"message": "What can I do?", "pnr": "SK4821X"})

        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["conversation_id"], "conv-1")
        self.assertEqual(body["resolution"]["entitlement"], "AIRLINE_CANCELLATION")
        self.assertIsInstance(body["message"], str)
        self.assertTrue(len(body["message"]) > 0)

    def test_optional_conversation_id_accepts_missing_field(self):
        # Mirrors the pAi.txt note: conversation_id must be optional, and a
        # request that omits it entirely must not fail Pydantic validation.
        with patch("app.graph.nodes.understand_intent", new=AsyncMock(return_value={"pnr": None, "error": nodes.MISSING_PNR_MESSAGE})):
            client = TestClient(app)
            resp = client.post("/api/ai/chat", json={"message": "hello"})
        self.assertEqual(resp.status_code, 200)


class NodeTests(unittest.IsolatedAsyncioTestCase):
    async def test_missing_pnr(self):
        state = {"user_message": "hi", "pnr": None}
        result = await nodes.understand_intent(state)
        self.assertEqual(result["error"], nodes.MISSING_PNR_MESSAGE)

    async def test_unknown_pnr_returns_not_found_message(self):
        with patch("app.graph.nodes.customer_tools.get_customer_info", new=AsyncMock(side_effect=BackendClientError(404, "Booking not found for the given PNR"))):
            state = {"pnr": "ZZ0000X", "user_message": "hi"}
            result = await nodes.load_context(state)
        self.assertEqual(result["error"], nodes.NOT_FOUND_MESSAGE)

    async def test_backend_connection_failure(self):
        with patch("app.graph.nodes.customer_tools.get_customer_info", new=AsyncMock(side_effect=BackendClientError(0, "Could not reach the backend service."))):
            state = {"pnr": "SK4821X", "user_message": "hi"}
            result = await nodes.load_context(state)
        self.assertEqual(result["error"], nodes.GENERIC_ERROR_MESSAGE)
        # never leaks internal detail to the customer-facing message
        self.assertNotIn("Could not reach", result["error"])

    async def test_cancellation_scenario(self):
        with patch("app.graph.nodes.policy_tools.check_and_resolve", new=AsyncMock(return_value={"conversationId": "c1", "resolution": CANCELLATION_RESOLUTION, "appliedActions": []})):
            state = {"pnr": "SK4821X", "user_message": "cancelled?", "conversation_id": None}
            result = await nodes.check_policy_and_resolve(state)

        self.assertEqual(result["available_actions"]["entitlement"], "AIRLINE_CANCELLATION")
        self.assertEqual(
            set(result["available_actions"]["options"]),
            {"REBOOK_NEXT_AVAILABLE_WITHIN_24H", "FULL_REFUND"},
        )

    async def test_4h_delay_scenario_no_hotel(self):
        with patch("app.graph.nodes.policy_tools.check_and_resolve", new=AsyncMock(return_value={"conversationId": "c1", "resolution": DELAY_4H_RESOLUTION, "appliedActions": []})):
            state = {"pnr": "TR1190B", "user_message": "delayed?", "conversation_id": None}
            result = await nodes.check_policy_and_resolve(state)

        types_ = {e["type"] for e in result["available_actions"]["entitlements"]}
        self.assertEqual(types_, {"MEAL_VOUCHER", "LOUNGE_ACCESS"})
        self.assertNotIn("HOTEL_ACCOMMODATION", types_)

    async def test_6h_delay_scenario_includes_hotel(self):
        with patch("app.graph.nodes.policy_tools.check_and_resolve", new=AsyncMock(return_value={"conversationId": "c1", "resolution": DELAY_6H_RESOLUTION, "appliedActions": []})):
            state = {"pnr": "WL7742", "user_message": "need a hotel", "conversation_id": None}
            result = await nodes.check_policy_and_resolve(state)

        types_ = {e["type"] for e in result["available_actions"]["entitlements"]}
        self.assertEqual(types_, {"MEAL_VOUCHER", "LOUNGE_ACCESS", "HOTEL_ACCOMMODATION"})

    async def test_escalation_scenario(self):
        escalation_record = {"id": "esc-1", "status": "open", "reason": "fare waiver"}
        with patch("app.graph.nodes.action_tools.create_escalation", new=AsyncMock(return_value=escalation_record)) as mock_create:
            state = {
                "pnr": "WL7742",
                "user_message": "Please waive the full 2000 fare difference.",
                "booking": {"id": "booking-3"},
            }
            result = await nodes.handle_escalation(state)

        mock_create.assert_awaited_once()
        called_booking_id = mock_create.await_args.args[0]
        self.assertEqual(called_booking_id, "booking-3")
        self.assertEqual(result["escalation"], escalation_record)


class WorkflowRoutingTests(unittest.IsolatedAsyncioTestCase):
    async def test_full_workflow_routes_to_escalation_when_unsupported(self):
        with patch("app.graph.nodes.gemini_service.classify_intent", new=AsyncMock(return_value={"intent": "escalation_request", "unsupported_request": True, "summary": "wants a free upgrade"})), \
             patch("app.graph.nodes.customer_tools.get_customer_info", new=AsyncMock(return_value={"name": "Meher Kaur", "loyaltyTier": "Platinum"})), \
             patch("app.graph.nodes.booking_tools.get_booking_info", new=AsyncMock(return_value={"id": "booking-3", "flight": {"status": "delayed", "delayMinutes": 360}})), \
             patch("app.graph.nodes.policy_tools.check_and_resolve", new=AsyncMock(return_value={"conversationId": "c1", "resolution": DELAY_6H_RESOLUTION, "appliedActions": []})), \
             patch("app.graph.nodes.action_tools.create_escalation", new=AsyncMock(return_value={"id": "esc-9", "status": "open"})):
            result = await workflow.ainvoke(
                {"user_message": "Give me a free business upgrade.", "pnr": "WL7742", "unsupported_request": False}
            )

        self.assertEqual(result["escalation"]["id"], "esc-9")
        self.assertTrue(result["response"])


if __name__ == "__main__":
    unittest.main()
