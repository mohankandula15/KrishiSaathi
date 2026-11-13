import pytest
import uuid
from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import DatabaseManager

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_env():
    # Setup runs before each test
    yield

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_farmer_registration_and_login():
    mobile = f"98{uuid.uuid4().int % 100000000:08d}"
    reg_payload = {
        "name": "Ramesh Kumar",
        "mobile_number": mobile,
        "password": "FarmerPassword123",
        "village": "Kila Raipur",
        "district": "Ludhiana",
        "state": "Punjab",
        "preferred_language": "pa"
    }

    # 1. Registration
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["farmer"]["name"] == "Ramesh Kumar"
    assert reg_data["farmer"]["preferred_language"] == "pa"
    token = reg_data["access_token"]

    # 2. Duplicate registration should fail
    dup_res = client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code == 400

    # 3. Login with correct password
    login_res = client.post("/api/auth/login", json={
        "mobile_number": mobile,
        "password": "FarmerPassword123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Login with invalid password should fail
    bad_login_res = client.post("/api/auth/login", json={
        "mobile_number": mobile,
        "password": "WrongPassword"
    })
    assert bad_login_res.status_code == 401

    # 5. Profile management
    headers = {"Authorization": f"Bearer {token}"}
    profile_res = client.get("/api/farmers/profile", headers=headers)
    assert profile_res.status_code == 200
    assert profile_res.json()["district"] == "Ludhiana"

    # 6. Update profile
    update_res = client.put("/api/farmers/profile", json={
        "village": "Model Gram",
        "preferred_language": "hi"
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["village"] == "Model Gram"
    assert update_res.json()["preferred_language"] == "hi"

def test_farmer_isolation_and_soil_reports():
    """Ensure that one farmer CANNOT access another farmer's soil reports (HTTP 403)."""
    # Register Farmer A
    mobile_a = f"97{uuid.uuid4().int % 100000000:08d}"
    res_a = client.post("/api/auth/register", json={
        "name": "Farmer Alpha",
        "mobile_number": mobile_a,
        "password": "PasswordA123",
        "district": "Pune",
        "state": "Maharashtra"
    })
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register Farmer B
    mobile_b = f"96{uuid.uuid4().int % 100000000:08d}"
    res_b = client.post("/api/auth/register", json={
        "name": "Farmer Beta",
        "mobile_number": mobile_b,
        "password": "PasswordB123",
        "district": "Nashik",
        "state": "Maharashtra"
    })
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Farmer A creates a soil report
    report_payload = {
        "report_name": "Alpha Field North",
        "extracted_soil_data": {
            "nitrogen": {"value": 190, "rating": "Low"},
            "phosphorus": {"value": 16, "rating": "Medium"},
            "potassium": {"value": 310, "rating": "High"},
            "ph": {"value": 7.4, "rating": "Neutral"}
        }
    }
    report_res = client.post("/api/soil-reports/", json=report_payload, headers=headers_a)
    assert report_res.status_code == 201
    report_id = report_res.json()["id"]

    # Farmer A can retrieve their report
    get_a_res = client.get(f"/api/soil-reports/{report_id}", headers=headers_a)
    assert get_a_res.status_code == 200
    assert get_a_res.json()["report_name"] == "Alpha Field North"

    # SECURITY CHECK: Farmer B attempts to retrieve Farmer A's report -> MUST RECEIVE 403 FORBIDDEN
    forbidden_res = client.get(f"/api/soil-reports/{report_id}", headers=headers_b)
    assert forbidden_res.status_code == 403
    assert "Forbidden" in forbidden_res.json()["detail"]

    # Farmer B list of reports should be empty
    list_b = client.get("/api/soil-reports/", headers=headers_b)
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0

    # Farmer A recommendations were automatically computed
    rec_res = client.get("/api/recommendations/", headers=headers_a)
    assert rec_res.status_code == 200
    assert len(rec_res.json()) >= 1
    rec_data = rec_res.json()[0]
    assert "fertilizer_details" in rec_data
    assert "crop_details" in rec_data

def test_chat_history_persistence():
    mobile = f"95{uuid.uuid4().int % 100000000:08d}"
    reg_res = client.post("/api/auth/register", json={
        "name": "Suresh Patel",
        "mobile_number": mobile,
        "password": "SureshPassword123",
        "district": "Ahmedabad",
        "state": "Gujarat"
    })
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Send a query
    chat_res = client.post("/api/chat/send", json={
        "message": "गेहूं के लिए यूरिया की मात्रा कितनी है?",
        "language": "hi"
    }, headers=headers)
    assert chat_res.status_code == 201
    chat_data = chat_res.json()
    assert "यूरिया" in chat_data["response"]

    # Retrieve history
    history_res = client.get("/api/chat/history", headers=headers)
    assert history_res.status_code == 200
    assert len(history_res.json()) == 1
    assert history_res.json()[0]["message"] == "गेहूं के लिए यूरिया की मात्रा कितनी है?"
