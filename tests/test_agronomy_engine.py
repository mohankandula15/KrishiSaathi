"""
Test suite for KrishiSaathi Agronomic Engines:
1. Fertilizer Recommendation Engine (STCR, Duplicate N Deduction, pH amendments)
2. Crop Recommendation Engine (Suitability scoring, Andhra Pradesh priority, Water availability)
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.agronomy import (
    calculate_fertilizer_prescription,
    generate_gemini_fertilizer_explanation,
    recommend_crops_for_farm,
    CROP_RDF_DATABASE
)

def test_agronomy():
    # 1. Normal Soil Report (Ludhiana / Punjab benchmark)
    soil_punjab = {
        "ph": {"value": 7.2, "rating": "Neutral"},
        "nitrogen": {"value": 185.0, "rating": "Low"},
        "phosphorus": {"value": 18.4, "rating": "Medium"},
        "potassium": {"value": 295.0, "rating": "High"},
        "soilType": "Alluvial Loam",
        "micronutrients": {
            "zinc": {"value": 0.45, "rating": "Low"},
            "sulphur": {"value": 12.5, "rating": "Medium"}
        }
    }

    print("=== TEST 1: WHEAT FERTILIZER PRESCRIPTION (3.5 ACRES) ===")
    fert_wheat = calculate_fertilizer_prescription(soil_punjab, crop_name="Wheat", acreage=3.5, area_unit="acre")
    print(f"Crop: {fert_wheat['crop_display']}")
    print(f"Urea: {fert_wheat['totals']['urea_bags']} bags (45kg)")
    print(f"DAP: {fert_wheat['totals']['dap_bags']} bags (50kg)")
    print(f"MOP: {fert_wheat['totals']['mop_bags']} bags (50kg)")
    print(f"Estimated Cost: ₹{fert_wheat['totals']['estimated_cost_inr']:,}")
    print(f"Estimated Savings: ₹{fert_wheat['totals']['estimated_savings_inr']:,}")

    # Check N from DAP deduction
    assert fert_wheat['totals']['dap_bags'] > 0
    assert fert_wheat['totals']['urea_bags'] > 0
    # Potassium should have 50% discount because K is High
    assert "High natural Potash reserves (-50% savings)" in fert_wheat['stcr_summary']['potassium_adjustment']

    print("\n=== TEST 2: ACIDIC SOIL & ALKALINE SOIL AMENDMENT RULES ===")
    soil_acidic = {
        "ph": {"value": 5.2, "rating": "Strongly Acidic"},
        "nitrogen": {"value": 210.0, "rating": "Low"},
        "phosphorus": {"value": 12.0, "rating": "Low"},
        "potassium": {"value": 150.0, "rating": "Medium"},
        "soilType": "Laterite Loam"
    }
    fert_acidic = calculate_fertilizer_prescription(soil_acidic, crop_name="Paddy", acreage=2.0)
    # Check lime is in plan
    lime_found = any("Lime" in item["recommended_fertilizer"] for item in fert_acidic["fertilizer_plan"])
    assert lime_found, "Acidic soil (pH 5.2) MUST recommend Agricultural Lime!"
    print("Acidic soil correctly triggered Agricultural Lime amendment.")

    soil_alkaline = {
        "ph": {"value": 8.7, "rating": "Alkaline"},
        "nitrogen": {"value": 200.0, "rating": "Low"},
        "phosphorus": {"value": 16.0, "rating": "Medium"},
        "potassium": {"value": 220.0, "rating": "Medium"},
        "soilType": "Black Sodic Soil"
    }
    fert_alkaline = calculate_fertilizer_prescription(soil_alkaline, crop_name="Cotton", acreage=2.0)
    gypsum_found = any("Gypsum" in item["recommended_fertilizer"] for item in fert_alkaline["fertilizer_plan"])
    assert gypsum_found, "Alkaline soil (pH 8.7) MUST recommend Agricultural Gypsum!"
    print("Alkaline soil correctly triggered Agricultural Gypsum amendment.")

    print("\n=== TEST 3: ANDHRA PRADESH CROP RECOMMENDATIONS ===")
    soil_ap_rayalaseema = {
        "ph": {"value": 6.8, "rating": "Neutral"},
        "nitrogen": {"value": 175.0, "rating": "Low"},
        "phosphorus": {"value": 14.5, "rating": "Medium"},
        "potassium": {"value": 210.0, "rating": "Medium"},
        "soilType": "Red Sandy Loam"
    }
    crops_ap = recommend_crops_for_farm(
        soil_data=soil_ap_rayalaseema,
        location_state="Andhra Pradesh",
        location_district="Anantapur",
        water_availability="Low",
        season="Kharif"
    )

    print(f"Top Crops for Anantapur, Andhra Pradesh (Rainfed / Low Water):")
    for i, c in enumerate(crops_ap["recommended_crops"][:5], 1):
        print(f"  {i}. {c['name']} - {c['suitability']}% Match")
        print(f"     Varieties: {', '.join(c['recommended_varieties'][:3])}")
        print(f"     Potential Yield: {c['potential_yield']}")
        print(f"     Precautions: {c['precautions'][0]}")

    assert len(crops_ap["recommended_crops"]) >= 3, "Must display at least 3 crops"
    # Groundnut must be top recommendation for Anantapur with Red Sandy Loam and Low Water!
    top_crop_id = crops_ap["recommended_crops"][0]["id"]
    assert "groundnut" in top_crop_id, f"Groundnut should be #1 for Anantapur, got {top_crop_id}"
    print("Groundnut correctly ranked #1 for Anantapur with Red Sandy Loam!")

    print("\n=== TEST 4: COASTAL AP DELTA CROP RECOMMENDATIONS (PADDY / CHILLI) ===")
    soil_ap_guntur = {
        "ph": {"value": 7.4, "rating": "Neutral"},
        "nitrogen": {"value": 240.0, "rating": "Medium"},
        "phosphorus": {"value": 22.0, "rating": "Medium"},
        "potassium": {"value": 310.0, "rating": "High"},
        "soilType": "Deep Black Soils (Vertisols)"
    }
    crops_guntur = recommend_crops_for_farm(
        soil_data=soil_ap_guntur,
        location_state="Andhra Pradesh",
        location_district="Guntur",
        water_availability="Medium",
        season="Kharif"
    )
    print(f"Top Crops for Guntur, Andhra Pradesh:")
    for i, c in enumerate(crops_guntur["recommended_crops"][:4], 1):
        print(f"  {i}. {c['name']} - {c['suitability']}% Match")
    
    # Cotton or Chilli should be near top for Guntur Black Soils
    guntur_top_names = [c["id"] for c in crops_guntur["recommended_crops"][:3]]
    assert any("cotton" in c or "chilli" in c or "paddy" in c for c in guntur_top_names), "Guntur must rank Cotton/Chilli/Paddy"

    print("\n=== TEST 5: GEMINI AI EXPLANATION GENERATOR ===")
    explanation = generate_gemini_fertilizer_explanation(fert_wheat, farmer_name="Ramesh Kumar", language="en")
    print(f"Explanation:\n{explanation}")
    assert len(explanation) > 50
    assert "DAP" in explanation or "Urea" in explanation

    print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_agronomy()
