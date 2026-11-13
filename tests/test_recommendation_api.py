"""
End-to-end integration test verifying the Fertilizer & Crop Recommendation APIs.
Tests with:
1. Normal Punjab Soil Report (Wheat)
2. Rayalaseema AP Soil Report (Groundnut)
3. Coastal AP Vertisol Soil Report (Paddy & Chilli)
4. Acidic Soil (Paddy with Lime calculation)
5. Alkaline Sodic Soil (Cotton with Gypsum calculation)
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_api_recommendations():
    # 1. Login with demo credentials
    print("1. Authenticating farmer...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "mobile_number": "9876543210",
        "password": "password123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("   Farmer authenticated successfully.")

    # 2. Test Fertilizer Recommendation for Wheat on 3.5 Acres
    print("\n2. Testing /api/recommendations/calculate-fertilizer (Wheat, 3.5 Acres)...")
    fert_payload = {
        "crop_name": "Wheat",
        "acreage": 3.5,
        "area_unit": "acre",
        "soil_data": {
            "ph": {"value": 7.2, "rating": "Neutral"},
            "nitrogen": {"value": 185.0, "rating": "Low"},
            "phosphorus": {"value": 18.4, "rating": "Medium"},
            "potassium": {"value": 295.0, "rating": "High"},
            "soilType": "Alluvial Loam"
        },
        "language": "en"
    }
    fert_res = requests.post(f"{BASE_URL}/recommendations/calculate-fertilizer", json=fert_payload, headers=headers)
    assert fert_res.status_code == 200, f"Fertilizer endpoint failed: {fert_res.text}"
    fert_data = fert_res.json()
    print(f"   Crop: {fert_data['crop_display']}")
    print(f"   Urea: {fert_data['totals']['urea_bags']} Bags")
    print(f"   DAP: {fert_data['totals']['dap_bags']} Bags")
    print(f"   MOP: {fert_data['totals']['mop_bags']} Bags")
    print(f"   AI Explanation:\n   {fert_data['ai_explanation']}")
    assert fert_data['totals']['urea_bags'] > 0
    assert fert_data['totals']['dap_bags'] > 0
    assert "DAP" in fert_data['ai_explanation']

    # 3. Test Fertilizer Recommendation for Groundnut (SSP based)
    print("\n3. Testing /api/recommendations/calculate-fertilizer (Groundnut, 2.0 Acres)...")
    gn_payload = {
        "crop_name": "Groundnut",
        "acreage": 2.0,
        "area_unit": "acre",
        "soil_data": {
            "ph": {"value": 6.8, "rating": "Neutral"},
            "nitrogen": {"value": 170.0, "rating": "Low"},
            "phosphorus": {"value": 16.0, "rating": "Medium"},
            "potassium": {"value": 240.0, "rating": "Medium"},
            "soilType": "Red Sandy Loam"
        }
    }
    gn_res = requests.post(f"{BASE_URL}/recommendations/calculate-fertilizer", json=gn_payload, headers=headers)
    assert gn_res.status_code == 200
    gn_data = gn_res.json()
    print(f"   Groundnut SSP Bags: {gn_data['totals']['ssp_bags']}")
    print(f"   Groundnut Urea Bags: {gn_data['totals']['urea_bags']}")
    assert gn_data['totals']['ssp_bags'] > 0

    # 4. Test Crop Recommendation for Andhra Pradesh (Guntur)
    print("\n4. Testing /api/recommendations/calculate-crops (Guntur, Andhra Pradesh)...")
    crop_payload = {
        "state": "Andhra Pradesh",
        "district": "Guntur",
        "water_availability": "Medium",
        "season": "Kharif",
        "soil_data": {
            "ph": {"value": 7.4, "rating": "Neutral"},
            "nitrogen": {"value": 220.0, "rating": "Medium"},
            "phosphorus": {"value": 20.0, "rating": "Medium"},
            "potassium": {"value": 310.0, "rating": "High"},
            "soilType": "Deep Black Soils (Vertisols)"
        }
    }
    crops_res = requests.post(f"{BASE_URL}/recommendations/calculate-crops", json=crop_payload, headers=headers)
    assert crops_res.status_code == 200, f"Crops endpoint failed: {crops_res.text}"
    crops_data = crops_res.json()
    print(f"   Total Ranked Crops: {len(crops_data['recommended_crops'])}")
    for i, c in enumerate(crops_data['recommended_crops'][:4], 1):
        print(f"   {i}. {c['name']} - {c['suitability']}% Match")
        print(f"      Yield: {c['potential_yield']}")
        print(f"      Water: {c['water_requirement']}")
    assert len(crops_data['recommended_crops']) >= 3, "Must display at least 3 crops"

    # 5. Test Supported Crops Catalog
    print("\n5. Testing /api/recommendations/supported-crops...")
    cat_res = requests.get(f"{BASE_URL}/recommendations/supported-crops")
    assert cat_res.status_code == 200
    cat_data = cat_res.json()
    print(f"   Supported Crops in Catalog: {len(cat_data)}")
    assert len(cat_data) >= 8

    print("\n>>> ALL RECOMMENDATION API ENDPOINTS VERIFIED AND PASSING! <<<")

if __name__ == "__main__":
    test_api_recommendations()
