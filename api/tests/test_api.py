import os
import uuid
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import AgentDecision, TicketDraft

client = TestClient(app)


def test_health_endpoint():
    """Verify /health returns 200 OK and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_root_endpoint():
    """Verify root GET / returns 200 OK."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_get_tickets_initial_seed():
    """Verify GET /tickets returns 10 seeded historical tickets."""
    response = client.get("/tickets")
    assert response.status_code == 200
    data = response.json()
    assert "historical_tickets" in data
    assert len(data["historical_tickets"]) == 10
    assert data["historical_tickets"][0]["id"] == "TK-1042"


def test_chat_mocked_end_to_end_flow():
    """
    Test POST /chat and persistence with a mocked agent decision:
    1. Send chat message
    2. Verify AgentDecision parsed
    3. Verify ticket created with TK-1052+ id
    4. Verify ticket in GET /tickets
    5. Verify entry in GET /audit
    """
    conv_id = f"test-mock-conv-{uuid.uuid4()}"
    mock_decision = AgentDecision(
        reply="Guest Wi-Fi credentials can be generated at the front-desk kiosk (KB-07).",
        action="resolve",
        sources=["KB-07"],
        ticket=TicketDraft(category="Network", summary="Guest Wi-Fi issued", status="Resolved"),
        escalation_reason=None,
    )

    with patch("app.agent.run_turn", return_value=mock_decision):
        payload = {
            "conversation_id": conv_id,
            "message": "Can I get Wi-Fi access for a guest visiting our office tomorrow?",
            "employee": "Vikram Chawla",
        }
        chat_resp = client.post("/chat", json=payload)
        assert chat_resp.status_code == 200
        chat_data = chat_resp.json()

        assert chat_data["action"] == "resolve"
        assert "KB-07" in chat_data["sources"]
        assert chat_data["ticket_id"] is not None
        ticket_id = chat_data["ticket_id"]
        assert ticket_id.startswith("TK-")

        # Verify GET /tickets
        tickets_resp = client.get("/tickets")
        assert tickets_resp.status_code == 200
        t_data = tickets_resp.json()
        assert any(t["id"] == ticket_id for t in t_data["created_tickets"])

        # Verify GET /audit
        audit_resp = client.get("/audit")
        assert audit_resp.status_code == 200
        a_data = audit_resp.json()
        assert any(a["ticket_id"] == ticket_id for a in a_data)


@pytest.mark.skipif(not os.environ.get("GROQ_API_KEY"), reason="GROQ_API_KEY not set in environment")
def test_chat_and_ticket_creation_live():
    """Test live end-to-end conversation against Groq API when key is configured."""
    conv_id = f"test-conv-{uuid.uuid4()}"
    payload = {
        "conversation_id": conv_id,
        "message": "Can I get Wi-Fi access for a guest visiting our office tomorrow?",
        "employee": "Vikram Chawla",
    }

    chat_resp = client.post("/chat", json=payload)
    assert chat_resp.status_code == 200
    chat_data = chat_resp.json()

    assert chat_data["action"] == "resolve"
    assert any("KB-07" in s for s in chat_data["sources"])
    assert chat_data["ticket_id"] is not None
