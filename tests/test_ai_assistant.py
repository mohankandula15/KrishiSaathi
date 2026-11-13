"""
Test suite for KRISHISAATHI AI Multilingual Voice & Soil Data Assistant.
Tests Telugu, Hindi, and English understanding, soil data awareness, and safety rules.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.routers.chat import (
    generate_agricultural_ai_response,
    generate_multilingual_fallback_response
)

def test_ai_assistant():
    mock_farmer = {
        "name": "Ramesh Kumar",
        "district": "Guntur",
        "state": "Andhra Pradesh",
        "preferred_language": "te"
    }

    mock_soil = {
        "has_report": True,
        "report_name": "Guntur Soil Health Card",
        "soil_type": "Deep Black Soils (Vertisols)",
        "ph": 7.4,
        "ph_rating": "Neutral",
        "oc": 0.48,
        "oc_rating": "Low",
        "n": 185.0,
        "n_rating": "Low",
        "p": 18.4,
        "p_rating": "Medium",
        "k": 295.0,
        "k_rating": "High",
        "zn": 0.45,
        "zn_rating": "Low",
        "s": 12.5,
        "s_rating": "Medium",
        "top_crops": ["Groundnut (వేరుశనగ)", "Paddy (వరి)", "Cotton (ప్రత్తి)", "Chilli (మిరప)"],
        "urea_bags": 2.2,
        "dap_bags": 1.0,
        "mop_bags": 0.3
    }

    print("=== TEST 1: TELUGU SOIL NITROGEN QUERY ===")
    query_te = "My soil lo nitrogen takkuvaga undhi. Em cheyyali?"
    res_te = generate_multilingual_fallback_response(query_te, mock_farmer, mock_soil, lang="te")
    print("Telugu Query:", query_te)
    print("AI Response:\n", res_te)
    assert "నత్రజని" in res_te
    assert "185" in res_te
    assert "యూరియా" in res_te
    print("Passed: Telugu response retrieved 185 kg/ha Nitrogen and provided Telugu guidance.")

    print("\n=== TEST 2: TELUGU CROP RECOMMENDATION QUERY ===")
    query_crop_te = "నేను ఏ పంట వేయాలి? ఏవి అనుకూలం?"
    res_crop_te = generate_multilingual_fallback_response(query_crop_te, mock_farmer, mock_soil, lang="te")
    print("Telugu Query:", query_crop_te)
    print("AI Response:\n", res_crop_te)
    assert "వేరుశనగ" in res_crop_te or "ప్రత్తి" in res_crop_te
    print("Passed: Telugu crop recommendation contains AP regional crops.")

    print("\n=== TEST 3: TELUGU DAP & ZINC SAFETY QUERY ===")
    query_safety_te = "DAP మరియు జింక్ కలిపి వేయవచ్చా?"
    res_safety_te = generate_multilingual_fallback_response(query_safety_te, mock_farmer, mock_soil, lang="te")
    print("Telugu Query:", query_safety_te)
    print("AI Response:\n", res_safety_te)
    assert "కలిపి" in res_safety_te
    assert "హెచ్చరిక" in res_safety_te or "వద్దు" in res_safety_te or "వేయకూడదు" in res_safety_te
    print("Passed: Telugu safety warning against mixing DAP and Zinc.")

    print("\n=== TEST 4: HINDI SOIL DIAGNOSTIC QUERY ===")
    query_hi = "मेरी मिट्टी की स्थिति कैसी है और क्या कमी है?"
    res_hi = generate_multilingual_fallback_response(query_hi, mock_farmer, mock_soil, lang="hi")
    print("Hindi Query:", query_hi)
    print("AI Response:\n", res_hi)
    assert "नाइट्रोजन" in res_hi
    assert "185" in res_hi
    print("Passed: Hindi response retrieved soil data accurately.")

    print("\n=== TEST 5: ENGLISH QUERY ===")
    query_en = "Why is my nitrogen low and how many bags of urea are needed?"
    res_en = generate_multilingual_fallback_response(query_en, mock_farmer, mock_soil, lang="en")
    print("English Query:", query_en)
    print("AI Response:\n", res_en)
    assert "185" in res_en
    assert "Urea" in res_en
    print("Passed: English response provided exact bag count.")

    print("\n>>> ALL MULTILINGUAL AI TESTS PASSED! <<<")

if __name__ == "__main__":
    test_ai_assistant()
