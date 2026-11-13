"""
Test script verifying OCR and extraction engine for KrishiSaathi.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.extractor import extract_soil_data_from_raw_text

# 1. Sample Government of India Soil Health Card Text
SAMPLE_GOVT_SHC = """
SOIL HEALTH CARD - GOVERNMENT OF INDIA
Ministry of Agriculture and Farmers Welfare
Farmer Name: Ramesh Kumar   Village: Kila Raipur   District: Ludhiana   State: Punjab
Soil Sample No: SHC/PB/LDH/2025/9402
Testing Date: 12-10-2025   Lab: District Soil Testing Laboratory, PAU Campus

TEST RESULTS & NUTRIENT STATUS:
1. Soil Reaction (pH) (1:2.5) : 7.35  (Neutral)
2. Electrical Conductivity (EC) : 0.42 dS/m  (Normal)
3. Organic Carbon (OC) : 0.46 %  (Low)
4. Available Nitrogen (N) : 192.5 kg/ha  (Low)
5. Available Phosphorus (P) : 17.8 kg/ha  (Medium)
6. Available Potassium (K) : 310.0 kg/ha  (High)
7. Available Sulphur (S) : 13.4 ppm  (Medium)
8. Available Zinc (Zn) : 0.48 ppm  (Deficient)
9. Available Iron (Fe) : 6.2 ppm  (Sufficient)
10. Available Boron (B) : 0.55 ppm  (Medium)
11. Available Copper (Cu) : 0.85 ppm  (Sufficient)
12. Available Manganese (Mn) : 4.1 ppm  (Sufficient)
"""

# 2. Sample Private / University Lab Report with Missing Micro-nutrients
SAMPLE_PRIVATE_LAB = """
DR. SOIL AGRONOMY TESTING SERVICES PVT LTD
SOIL DIAGNOSTIC CERTIFICATE
Farmer: Suresh Patil   Location: Baramati, Maharashtra
Sample ID: DS-MH-8219

Parameters Analyzed:
pH: 8.20
EC: 0.65 dS/m
Organic Carbon: 0.38 %
Nitrogen: 215 kg/ha
Phosphorus: 12.5 kg/ha
Potash: 275 kg/ha
Zinc: 0.42 ppm
"""

def test_extraction():
    print("--- TESTING GOVT SHC EXTRACTION ---")
    res1 = extract_soil_data_from_raw_text(SAMPLE_GOVT_SHC)
    print(f"Nitrogen: {res1['nitrogen']['value']} kg/ha, Rating: {res1['nitrogen']['rating']}, Missing: {res1['nitrogen']['is_missing']}")
    print(f"Phosphorus: {res1['phosphorus']['value']} kg/ha, Rating: {res1['phosphorus']['rating']}, Missing: {res1['phosphorus']['is_missing']}")
    print(f"Potassium: {res1['potassium']['value']} kg/ha, Rating: {res1['potassium']['rating']}, Missing: {res1['potassium']['is_missing']}")
    print(f"pH: {res1['ph']['value']}, Rating: {res1['ph']['rating']}")
    print(f"Organic Carbon: {res1['organic_carbon']['value']}%, Rating: {res1['organic_carbon']['rating']}")
    print(f"EC: {res1['ec']['value']} dS/m, Rating: {res1['ec']['rating']}")
    print(f"Zinc: {res1['micronutrients']['zinc']['value']} ppm, Rating: {res1['micronutrients']['zinc']['rating']}")
    print(f"Sulphur: {res1['micronutrients']['sulphur']['value']} ppm, Rating: {res1['micronutrients']['sulphur']['rating']}")
    print(f"Boron: {res1['micronutrients']['boron']['value']} ppm, Rating: {res1['micronutrients']['boron']['rating']}")
    print(f"Health Score: {res1['healthScore']}/100, Status: {res1['overallStatus']}")
    print(f"Requires Confirmation: {res1['requires_confirmation']}")

    assert res1['nitrogen']['value'] == 192.5
    assert res1['phosphorus']['value'] == 17.8
    assert res1['potassium']['value'] == 310.0
    assert res1['ph']['value'] == 7.35
    assert res1['ph']['rating'] == "Neutral"
    assert res1['organic_carbon']['value'] == 0.46
    assert res1['micronutrients']['zinc']['value'] == 0.48
    assert res1['micronutrients']['zinc']['rating'] == "Low"

    print("\n--- TESTING PRIVATE LAB (WITH MISSING VALUES) ---")
    res2 = extract_soil_data_from_raw_text(SAMPLE_PRIVATE_LAB)
    print(f"Nitrogen: {res2['nitrogen']['value']}, Missing: {res2['nitrogen']['is_missing']}")
    print(f"pH: {res2['ph']['value']}, Rating: {res2['ph']['rating']}")
    print(f"Sulphur Missing: {res2['micronutrients']['sulphur']['is_missing']}, Value: {res2['micronutrients']['sulphur']['value']}")
    print(f"Boron Missing: {res2['micronutrients']['boron']['is_missing']}, Value: {res2['micronutrients']['boron']['value']}")

    assert res2['ph']['value'] == 8.20
    assert res2['ph']['rating'] == "Alkaline"
    assert res2['micronutrients']['sulphur']['is_missing'] is True
    assert res2['micronutrients']['sulphur']['value'] is None
    print("\nALL ASSERTIONS PASSED! Extraction logic validated.")

if __name__ == "__main__":
    test_extraction()
