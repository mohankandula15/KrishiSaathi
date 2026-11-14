"""
Integration test for the KRISHISAATHI AI Multilingual Voice & Chat API.
Tests Telugu (Tanglish + Script), Hindi (Hinglish + Devanagari), English,
language detection, soil data integration, profile language update,
and conversation history persistence.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_chat_pipeline():
    # 1. Login
    print("1. Authenticating farmer...")
    login_res = client.post("/api/auth/login", json={
        "mobile_number": "9876543210",
        "password": "password123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   Farmer authenticated.")

    # 2. Test Multilingual Bug Fix:
    # Farmer speaks Tanglish without specifying language (or with default 'en')
    # Input: "My soil lo nitrogen takkuvaga undhi. Em cheyyali?"
    print("\n2. Testing auto-detection of Telugu Tanglish without explicit language...")
    te_auto_res = client.post("/api/chat/send", json={
        "message": "My soil lo nitrogen takkuvaga undhi. Em cheyyali?"
    }, headers=headers)
    assert te_auto_res.status_code == 201
    te_auto_data = te_auto_res.json()
    print("   Detected Language:", te_auto_data["language"])
    print("   Response Sample:", te_auto_data["response"][:80], "...")
    assert te_auto_data["language"] == "te", f"Expected 'te', got {te_auto_data['language']}"
    assert "నత్రజని" in te_auto_data["response"]
    assert "యూరియా" in te_auto_data["response"]

    # 3. Test Telugu Script: "నా నేలలో నత్రజని తక్కువగా ఉంది. ఏం చేయాలి?"
    print("\n3. Testing Telugu script recognition...")
    te_script_res = client.post("/api/chat/send", json={
        "message": "నా నేలలో నత్రజని తక్కువగా ఉంది. ఏం చేయాలి?",
        "language": "te"
    }, headers=headers)
    assert te_script_res.status_code == 201
    te_script_data = te_script_res.json()
    assert te_script_data["language"] == "te"
    assert "నత్రజని" in te_script_data["response"]

    # 4. Test Telugu Crop Question: "నేను ఏ పంట వేయాలి?"
    print("\n4. Sending Telugu crop question...")
    crop_res = client.post("/api/chat/send", json={
        "message": "నేను ఏ పంట వేయాలి?",
        "language": "te"
    }, headers=headers)
    assert crop_res.status_code == 201
    crop_data = crop_res.json()
    assert crop_data["language"] == "te"
    assert "పంట" in crop_data["response"] or "వేరుశనగ" in crop_data["response"]

    # 5. Test Hindi Hinglish auto-detection: "meri mitti me nitrogen kam hai kya kare"
    print("\n5. Testing auto-detection of Hindi Hinglish...")
    hi_auto_res = client.post("/api/chat/send", json={
        "message": "meri mitti me nitrogen kam hai kya kare"
    }, headers=headers)
    assert hi_auto_res.status_code == 201
    hi_auto_data = hi_auto_res.json()
    print("   Detected Language:", hi_auto_data["language"])
    assert hi_auto_data["language"] == "hi", f"Expected 'hi', got {hi_auto_data['language']}"
    assert "नाइट्रोजन" in hi_auto_data["response"]

    # 6. Test Hindi Devanagari Question: "मेरी मिट्टी में कौन से पोषक तत्वों की कमी है?"
    print("\n6. Sending Hindi Devanagari soil question...")
    hi_res = client.post("/api/chat/send", json={
        "message": "मेरी मिट्टी में कौन से पोषक तत्वों की कमी है?",
        "language": "hi"
    }, headers=headers)
    assert hi_res.status_code == 201
    hi_data = hi_res.json()
    assert hi_data["language"] == "hi"
    assert "नाइट्रोजन" in hi_data["response"]

    # 7. Test English Question: "Can I mix DAP and Zinc together?"
    print("\n7. Sending English safety question...")
    en_res = client.post("/api/chat/send", json={
        "message": "Can I mix DAP and Zinc together in the soil?",
        "language": "en"
    }, headers=headers)
    assert en_res.status_code == 201
    en_data = en_res.json()
    assert en_data["language"] == "en"
    assert "NEVER mix" in en_data["response"]

    # 8. Test Farmer Profile Language Persistence
    print("\n8. Testing profile language update...")
    prof_update = client.put("/api/farmers/profile", json={
        "preferred_language": "te"
    }, headers=headers)
    assert prof_update.status_code == 200
    assert prof_update.json()["preferred_language"] == "te"

    # 9. Verify Conversation History in Database
    print("\n9. Checking conversation history persistence...")
    hist_res = client.get("/api/chat/history", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    print(f"   Saved Messages in History: {len(history)}")
    assert len(history) >= 5

    # 10. Test Clear History
    print("\n10. Testing clear chat history...")
    del_res = client.delete("/api/chat/history", headers=headers)
    assert del_res.status_code == 204
    hist_after = client.get("/api/chat/history", headers=headers).json()
    print(f"   Messages after deletion: {len(hist_after)}")
    assert len(hist_after) == 0

    # 11. Test Neural gTTS Endpoint (/api/chat/tts)
    print("\n11. Testing TTS endpoint (/api/chat/tts)...")
    # A. Auth required
    unauth_tts = client.get("/api/chat/tts?text=test")
    assert unauth_tts.status_code == 401

    # B. Telugu TTS
    te_tts = client.get("/api/chat/tts", params={"text": "నమస్కారం రైతు గారు! 🙏🌾", "lang": "te"}, headers=headers)
    assert te_tts.status_code == 200
    assert "audio/mpeg" in te_tts.headers.get("content-type", "")
    assert len(te_tts.content) > 1000

    # C. Hindi TTS
    hi_tts = client.get("/api/chat/tts", params={"text": "नमस्ते किसान जी! 🙏", "lang": "hi"}, headers=headers)
    assert hi_tts.status_code == 200
    assert "audio/mpeg" in hi_tts.headers.get("content-type", "")
    assert len(hi_tts.content) > 1000

    # D. English TTS with Markdown stripping and 500-char truncation
    en_tts = client.get("/api/chat/tts", params={"text": "### **Hello Farmer!** 🌾 " + ("Nitrogen is essential for plant vegetative growth. " * 20), "lang": "en"}, headers=headers)
    assert en_tts.status_code == 200
    assert "audio/mpeg" in en_tts.headers.get("content-type", "")
    assert len(en_tts.content) > 1000

    print("   TTS endpoint validated successfully (Telugu, Hindi, English).")

    print("\n>>> ALL MULTILINGUAL CHAT & VOICE PIPELINE TESTS PASSED CLEANLY! <<<")

if __name__ == "__main__":
    test_chat_pipeline()
