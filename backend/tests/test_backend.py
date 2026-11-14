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

def test_chat_gibberish_and_greeting_quality_gate():
    """Verify input-quality gate for greetings, gibberish, and valid multilingual questions."""
    mobile = f"94{uuid.uuid4().int % 100000000:08d}"
    reg_res = client.post("/api/auth/register", json={
        "name": "Venkat Rao",
        "mobile_number": mobile,
        "password": "VenkatPassword123",
        "district": "Guntur",
        "state": "Andhra Pradesh",
        "preferred_language": "te"
    })
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Greetings return greeting and 3 example questions without fake soil numbers
    res_hello = client.post("/api/chat/send", json={"message": "hello", "language": "en"}, headers=headers)
    assert res_hello.status_code == 201
    txt_hello = res_hello.json()["response"]
    assert "Welcome to KrishiSaathi" in txt_hello or "Hello" in txt_hello
    assert "How many bags of Urea and DAP per acre?" in txt_hello
    assert "195 kg/ha" not in txt_hello

    res_namaste = client.post("/api/chat/send", json={"message": "namaste", "language": "hi"}, headers=headers)
    assert res_namaste.status_code == 201
    txt_namaste = res_namaste.json()["response"]
    assert "नमस्ते" in txt_namaste
    assert "प्रति एकड़ कितनी बोरी यूरिया" in txt_namaste
    assert "195 kg/ha" not in txt_namaste

    res_te_greet = client.post("/api/chat/send", json={"message": "నమస్కారం", "language": "te"}, headers=headers)
    assert res_te_greet.status_code == 201
    txt_te_greet = res_te_greet.json()["response"]
    assert "నమస్కారం" in txt_te_greet
    assert "ఎకరాకు ఎన్ని బస్తాల యూరియా" in txt_te_greet

    # 2. Gibberish queries return polite 'did not understand' message with 3 example questions
    res_wdf = client.post("/api/chat/send", json={"message": "wdfghju", "language": "te"}, headers=headers)
    assert res_wdf.status_code == 201
    txt_wdf = res_wdf.json()["response"]
    assert "క్షమించండి, మీ ప్రశ్న అర్థం కాలేదు" in txt_wdf
    assert "ఎకరాకు ఎన్ని బస్తాల యూరియా మరియు DAP వేయాలి?" in txt_wdf
    assert "185.0" not in txt_wdf and "195 kg/ha" not in txt_wdf

    res_asdf = client.post("/api/chat/send", json={"message": "asdf", "language": "hi"}, headers=headers)
    assert res_asdf.status_code == 201
    txt_asdf = res_asdf.json()["response"]
    assert "क्षमा करें, मुझे आपका सवाल समझ नहीं आया" in txt_asdf
    assert "प्रति एकड़ कितनी बोरी यूरिया" in txt_asdf

    res_dots = client.post("/api/chat/send", json={"message": "......", "language": "en"}, headers=headers)
    assert res_dots.status_code == 201
    txt_dots = res_dots.json()["response"]
    assert "I'm sorry, I didn't understand your question" in txt_dots
    assert "How many bags of Urea and DAP per acre?" in txt_dots

    res_digits = client.post("/api/chat/send", json={"message": "123456", "language": "en"}, headers=headers)
    assert res_digits.status_code == 201
    txt_digits = res_digits.json()["response"]
    assert "I'm sorry, I didn't understand your question" in txt_digits

    # 3. Valid queries pass gate and provide proper agricultural guidance
    res_tanglish = client.post("/api/chat/send", json={"message": "naa nelalo nitrogen takkuva undi", "language": "te"}, headers=headers)
    assert res_tanglish.status_code == 201
    txt_tanglish = res_tanglish.json()["response"]
    assert "నత్రజని" in txt_tanglish or "యూరియా" in txt_tanglish

    res_valid_en = client.post("/api/chat/send", json={"message": "how is my nitrogen level?", "language": "en"}, headers=headers)
    assert res_valid_en.status_code == 201
    txt_valid_en = res_valid_en.json()["response"]
    assert "Nitrogen" in txt_valid_en or "Urea" in txt_valid_en

def test_extract_soil_report_multipart():
    """Test /api/soil-reports/extract endpoint with multipart file upload."""
    sample_pdf_path = Path(__file__).resolve().parent.parent.parent / "tests" / "samples" / "sample_soil_report.pdf"
    if sample_pdf_path.exists():
        content = sample_pdf_path.read_bytes()
    else:
        content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000118 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n206\n%%EOF"

    files = {"file": ("sample_soil_report.pdf", content, "application/pdf")}
    res = client.post("/api/soil-reports/extract", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "extracted_soil_data" in data
    assert "file_url" in data
    assert "report_name" in data
    assert "avg_confidence" in data
    assert "requires_confirmation" in data
    assert "missing_core" in data
