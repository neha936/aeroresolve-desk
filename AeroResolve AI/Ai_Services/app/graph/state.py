from typing import Any, Optional, TypedDict


class AgentState(TypedDict, total=False):
    """Explicit graph state. LangGraph passes and merges plain dict updates
    per node - nothing here is global or mutated in place."""

    user_message: str
    pnr: Optional[str]
    conversation_id: Optional[str]

    customer: Optional[dict[str, Any]]
    booking: Optional[dict[str, Any]]
    flight: Optional[dict[str, Any]]

    intent: Optional[str]
    unsupported_request: bool

    available_actions: Optional[dict[str, Any]]  # backend's resolution object
    applied_actions: Optional[list[dict[str, Any]]]
    selected_action: Optional[str]
    action_result: Optional[dict[str, Any]]

    escalation: Optional[dict[str, Any]]

    response: Optional[str]
    error: Optional[str]
