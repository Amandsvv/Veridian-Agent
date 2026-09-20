import os
import pytest
from app.agent import run_turn


@pytest.mark.skipif(not os.environ.get("GROQ_API_KEY"), reason="GROQ_API_KEY not set in environment")
def test_case_1_laptop_policy_conflict():
    """
    REQ-01: 'My laptop won't turn on at all, it's completely dead, had it about 3.5 years now.'
    Expected: escalate (KB-03 3-year threshold vs ASSET-POLICY 4-year refresh cycle conflict).
    """
    message = "My laptop won't turn on at all, it's completely dead, had it about 3.5 years now."
    decision = run_turn(conversation_history=[], new_message=message)

    assert decision.action == "escalate", f"Expected 'escalate', got '{decision.action}'. Reply: {decision.reply}"
    assert any("KB-03" in s or "ASSET-POLICY" in s for s in decision.sources), f"Expected KB-03 or ASSET-POLICY in sources: {decision.sources}"
    assert decision.ticket is not None
    assert decision.escalation_reason is not None


@pytest.mark.skipif(not os.environ.get("GROQ_API_KEY"), reason="GROQ_API_KEY not set in environment")
def test_case_2_admin_access_request_precedent():
    """
    REQ-10: 'Can someone give me admin access to the finance reporting server? Need it urgently for month-end.'
    Expected: escalate and cite TK-1050 as precedent for ungrounded admin access request.
    """
    message = "Can someone give me admin access to the finance reporting server? Need it urgently for month-end."
    decision = run_turn(conversation_history=[], new_message=message)

    assert decision.action == "escalate", f"Expected 'escalate', got '{decision.action}'. Reply: {decision.reply}"
    assert any("TK-1050" in s for s in decision.sources), f"Expected 'TK-1050' in sources: {decision.sources}"
    assert decision.ticket is not None


@pytest.mark.skipif(not os.environ.get("GROQ_API_KEY"), reason="GROQ_API_KEY not set in environment")
def test_case_3_vague_request_followup():
    """
    REQ-15: 'hey can you help, its not working'
    Expected: ask_followup (too vague, cannot determine the issue).
    """
    message = "hey can you help, its not working"
    decision = run_turn(conversation_history=[], new_message=message)

    assert decision.action == "ask_followup", f"Expected 'ask_followup', got '{decision.action}'. Reply: {decision.reply}"
    assert decision.ticket is None, "Follow-up decisions must have null ticket."
