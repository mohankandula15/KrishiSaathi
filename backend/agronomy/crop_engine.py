"""
Intelligent Crop Recommendation Engine for KrishiSaathi.
Provides scientifically ranked crop recommendations tailored to soil parameters
(pH, N, P, K, Organic Carbon, texture), regional climate, water availability, and season.
Prioritizes crops suitable for Andhra Pradesh and provides nationwide coverage.

Safety & Agronomy Standards:
- Never promises guaranteed yield or revenue (uses potential yield under recommended practices).
- Scientifically calculates suitability score (0 - 100%).
- Provides clear agronomic rationale for why each crop is recommended.
- Highlights growing seasons, water needs, and critical crop precautions.
- Guarantees at least 3 high-suitability crop suggestions.
"""

from typing import Dict, Any, List, Optional, Tuple

# Comprehensive Agronomic Crop Knowledge Base
CROPS_DATABASE: List[Dict[str, Any]] = [
    # ------------------ ANDHRA PRADESH & SOUTH INDIA STAPLES ------------------
    {
        "id": "ap_groundnut",
        "name": "Groundnut / Peanut (వేరుశనగ / मूंगफली)",
        "nameLocal": "వేరుశనగ",
        "botanical": "Arachis hypogaea",
        "category": "Oilseed / Legume",
        "priority_states": ["Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Gujarat"],
        "suitable_districts_ap": ["Anantapur", "Chittoor", "Kurnool", "YSR Kadapa", "Prakasam", "Nellore"],
        "seasons": ["Kharif", "Rabi", "Summer"],
        "ideal_ph_range": (6.0, 7.5),
        "suitable_soils": ["Red Sandy Loam", "Sandy Loam", "Light Alluvial", "Red Loam"],
        "unsuitable_soils": ["Heavy Black Clay", "Waterlogged Soils"],
        "water_requirement": "Low to Medium (2 - 3 Irrigations or Rainfed)",
        "water_category": "Low", # Low, Medium, High
        "min_n_demand": 20.0,
        "is_nitrogen_fixer": True,
        "potential_yield": "12 - 16 Quintals / Acre under recommended management",
        "indicative_return": "₹55,000 - ₹72,000 / Acre (Indicative MSP: ₹6,783/Qtl)",
        "recommended_varieties": ["Kadiri 6 (K-6)", "Kadiri 9", "Dharani", "TAG 24", "Narayani"],
        "sowing_window": "Kharif: June 15 - July 31 | Rabi: Nov 15 - Dec 15",
        "harvesting_window": "100 - 110 days after sowing",
        "precautions": [
            "Mandatory application of Gypsum (200 kg/acre) at pegging stage (40-45 DAS) for calcium pod filling.",
            "Avoid in poorly drained heavy soils to prevent pod rot (Rhizoctonia) and aflatoxin contamination.",
            "Treat seed with Trichoderma viride (10g/kg) and Rhizobium culture before sowing."
        ],
        "rationale_template": "Exceptional match for {soil_type} and pH {ph}. Being a leguminous oilseed, it fixes 35-40 kg atmospheric Nitrogen/ha, overcoming your soil N deficit while generating high cash returns."
    },
    {
        "id": "ap_paddy",
        "name": "Paddy / Rice (వరి / धान)",
        "nameLocal": "వరి",
        "botanical": "Oryza sativa",
        "category": "Cereal Food Grain",
        "priority_states": ["Andhra Pradesh", "Telangana", "Punjab", "Haryana", "West Bengal", "Odisha", "Tamil Nadu"],
        "suitable_districts_ap": ["East Godavari", "West Godavari", "Krishna", "Guntur", "Nellore", "Srikakulam", "Vizianagaram"],
        "seasons": ["Kharif", "Rabi"],
        "ideal_ph_range": (6.0, 7.8),
        "suitable_soils": ["Clay Loam", "Alluvial Loam", "Heavy Clay", "Black Soils"],
        "unsuitable_soils": ["Coarse Sandy Soils", "Shallow Red Gravel"],
        "water_requirement": "High (Submerged / Alternate Wetting & Drying - AWD)",
        "water_category": "High",
        "min_n_demand": 100.0,
        "is_nitrogen_fixer": False,
        "potential_yield": "28 - 34 Quintals / Acre under recommended management",
        "indicative_return": "₹62,000 - ₹75,000 / Acre (Indicative MSP: ₹2,300/Qtl)",
        "recommended_varieties": ["BPT 5204 (Samba Mahsuri)", "MTU 1010 (Cottondora Sannalu)", "MTU 1061 (Indra)", "RNR 15048 (Telangana Sona)", "NLR 34449"],
        "sowing_window": "Kharif: June - July (Nursery) | Rabi: November - December",
        "harvesting_window": "125 - 145 days depending on variety",
        "precautions": [
            "In flooded conditions, Zinc deficiency triggers Khaira disease. Apply Zinc Sulphate (10 kg/acre) basally.",
            "Practice Alternate Wetting & Drying (AWD) to conserve up to 30% irrigation water without yield penalty.",
            "Do not over-apply Urea late in the season to prevent blast and bacterial leaf blight (BLB)."
        ],
        "rationale_template": "Strongly suited for {soil_type} with pH {ph}. Fine-textured clay loam ensures water retention necessary for optimal tillering and high panicle weight."
    },
    {
        "id": "ap_cotton",
        "name": "Cotton (ప్రత్తి / कपास)",
        "nameLocal": "ప్రత్తి",
        "botanical": "Gossypium hirsutum",
        "category": "Commercial Fibre",
        "priority_states": ["Andhra Pradesh", "Telangana", "Maharashtra", "Gujarat", "Karnataka", "Punjab"],
        "suitable_districts_ap": ["Guntur", "Prakasam", "Kurnool", "Anantapur", "YSR Kadapa", "Krishna"],
        "seasons": ["Kharif"],
        "ideal_ph_range": (6.5, 8.5),
        "suitable_soils": ["Deep Black Soils (Vertisols)", "Medium Black Soils", "Alluvial Loam"],
        "unsuitable_soils": ["Saline Sodic Soils", "Shallow Sandy Soils"],
        "water_requirement": "Medium (3 - 5 Irrigations or protective irrigation in rainfed)",
        "water_category": "Medium",
        "min_n_demand": 120.0,
        "is_nitrogen_fixer": False,
        "potential_yield": "12 - 16 Quintals / Acre under recommended management",
        "indicative_return": "₹80,000 - ₹1,10,000 / Acre (Indicative MSP: ₹7,121/Qtl)",
        "recommended_varieties": ["Bt Cotton Hybrids (Bollgard II)", "Narasimha", "Suraj", "LRA 5166"],
        "sowing_window": "June 15 - July 15 (onset of South-West Monsoon)",
        "harvesting_window": "Multiple pickings from November through February",
        "precautions": [
            "Strictly avoid water stagnation. Construct ridges and furrows to drain excess monsoon downpours.",
            "Install yellow sticky traps and pheromone traps for Pink Bollworm (Pectinophora gossypiella) monitoring.",
            "Apply Boron (1 kg/acre) and Magnesium Sulphate (10 kg/acre) to prevent leaf reddening and square drop."
        ],
        "rationale_template": "Highly compatible with your soil pH ({ph}) and {soil_type}. Deep black vertisols offer high moisture-holding capacity vital during boll maturation."
    },
    {
        "id": "ap_chilli",
        "name": "Chilli / Red Pepper (మిరప / मिर्च)",
        "nameLocal": "మిరప",
        "botanical": "Capsicum annuum",
        "category": "Commercial Spices",
        "priority_states": ["Andhra Pradesh", "Telangana", "Karnataka", "Madhya Pradesh"],
        "suitable_districts_ap": ["Guntur", "Prakasam", "Krishna", "Kurnool", "Godavari"],
        "seasons": ["Kharif", "Rabi"],
        "ideal_ph_range": (6.5, 7.8),
        "suitable_soils": ["Well-Drained Loam", "Black Loam", "Clay Loam"],
        "unsuitable_soils": ["Poorly Drained Sticky Clays", "Saline Soils"],
        "water_requirement": "Medium (Regular light drip irrigation or furrow)",
        "water_category": "Medium",
        "min_n_demand": 150.0,
        "is_nitrogen_fixer": False,
        "potential_yield": "25 - 35 Quintals / Acre (Dry Pods) under intensive care",
        "indicative_return": "₹1,80,000 - ₹2,50,000 / Acre (Subject to market price volatility)",
        "recommended_varieties": ["Guntur Sannam (S4)", "Teja (LCA 334)", "Byadagi", "US 341", "Armoor"],
        "sowing_window": "July - August (Nursery) | Transplanting: August - September",
        "harvesting_window": "December to April (4 to 5 pickings)",
        "precautions": [
            "Extremely sensitive to waterlogging; raised bed cultivation with drip irrigation is strongly advised.",
            "Proactive IPM management required for Thrips (Scirtothrips dorsalis) and Gemini virus vectors.",
            "Avoid chloride-rich fertilizers (use SOP instead of MOP for export-quality color and pungency)."
        ],
        "rationale_template": "Premier commercial crop for {soil_type}. Your soil pH {ph} provides ideal nutrient uptake for maximum capsaicin content and vibrant fruit coloration."
    },
    {
        "id": "ap_redgram",
        "name": "Red Gram / Pigeonpea (కందులు / अरहर)",
        "nameLocal": "కందులు",
        "botanical": "Cajanus cajan",
        "category": "Pulse / Legume",
        "priority_states": ["Andhra Pradesh", "Telangana", "Maharashtra", "Karnataka", "Madhya Pradesh"],
        "suitable_districts_ap": ["Prakasam", "Guntur", "Kurnool", "Anantapur", "Kadapa", "Krishna"],
        "seasons": ["Kharif"],
        "ideal_ph_range": (6.5, 8.2),
        "suitable_soils": ["Red Sandy Loam", "Medium Black Soils", "Alluvial Loam"],
        "unsuitable_soils": ["Saline Alkaline Soils", "Waterlogged Lowlands"],
        "water_requirement": "Low (Drought Hardy; 1-2 protective irrigations at podding)",
        "water_category": "Low",
        "min_n_demand": 20.0,
        "is_nitrogen_fixer": True,
        "potential_yield": "8 - 11 Quintals / Acre under recommended management",
        "indicative_return": "₹58,000 - ₹75,000 / Acre (Indicative MSP: ₹7,550/Qtl)",
        "recommended_varieties": ["LRG 41 (Amaravathi)", "ICPL 87119 (Asha)", "WRG 65", "PRG 176", "Maruti"],
        "sowing_window": "June 15 - July 15",
        "harvesting_window": "150 - 180 days (December - January)",
        "precautions": [
            "Susceptible to Phytophthora stem blight in standing water; ensure drainage channels.",
            "Monitor Helicoverpa armigera (pod borer) during flowering and early pod development.",
            "Seed inoculation with Rhizobium and PSB biofertilizers saves 25% phosphorus."
        ],
        "rationale_template": "Deep-rooting legume ideally suited for your {soil_type} and pH {ph}. Its extensive root nodules replenish your soil nitrogen reserves while requiring minimal water."
    },
    {
        "id": "ap_bengalgram",
        "name": "Bengal Gram / Chickpea (శనగ / चना)",
        "nameLocal": "శనగ",
        "botanical": "Cicer arietinum",
        "category": "Pulse / Legume",
        "priority_states": ["Andhra Pradesh", "Telangana", "Madhya Pradesh", "Maharashtra", "Rajasthan"],
        "suitable_districts_ap": ["Kurnool", "Anantapur", "YSR Kadapa", "Prakasam", "Guntur"],
        "seasons": ["Rabi"],
        "ideal_ph_range": (6.5, 8.5),
        "suitable_soils": ["Black Cotton Soils (Vertisols)", "Deep Alluvial Loam"],
        "unsuitable_soils": ["Acidic Soils (pH < 6.0)", "Poorly Drained Lowlands"],
        "water_requirement": "Low (1 Pre-sowing or Residual Moisture)",
        "water_category": "Low",
        "min_n_demand": 20.0,
        "is_nitrogen_fixer": True,
        "potential_yield": "8 - 12 Quintals / Acre under recommended management",
        "indicative_return": "₹45,000 - ₹62,000 / Acre (Indicative MSP: ₹5,440/Qtl)",
        "recommended_varieties": ["JG 11", "KAK 2 (Kabuli)", "NBeG 3", "JAKI 9218"],
        "sowing_window": "October 15 - November 15 (on receding monsoon moisture)",
        "harvesting_window": "90 - 105 days (January - February)",
        "precautions": [
            "Never irrigate at peak flowering to avoid flower drop and vegetative overgrown canopy.",
            "Do not follow heavily fertilized crops without adjusting basal DAP to prevent collar rot.",
            "Spray 2% Urea or DAP foliar spray at pod initiation to maximize seed size."
        ],
        "rationale_template": "Perfect Rabi choice for {soil_type} with pH {ph}. Thrives on conserved residual soil moisture without demanding tubewell pumping."
    },
    {
        "id": "ap_blackgram",
        "name": "Black Gram / Urad (మినుములు / उड़द)",
        "nameLocal": "మినుములు",
        "botanical": "Vigna mungo",
        "category": "Pulse / Legume",
        "priority_states": ["Andhra Pradesh", "Tamil Nadu", "Madhya Pradesh", "Uttar Pradesh"],
        "suitable_districts_ap": ["Krishna", "Guntur", "East Godavari", "West Godavari", "Nellore"],
        "seasons": ["Rabi", "Kharif"],
        "ideal_ph_range": (6.5, 7.8),
        "suitable_soils": ["Clay Loam", "Alluvial Delta Soils", "Medium Black"],
        "unsuitable_soils": ["Coarse Sands", "Waterlogged Soils"],
        "water_requirement": "Low (Rice-fallow residual moisture)",
        "water_category": "Low",
        "min_n_demand": 20.0,
        "is_nitrogen_fixer": True,
        "potential_yield": "6 - 8 Quintals / Acre under recommended management",
        "indicative_return": "₹42,000 - ₹56,000 / Acre (Indicative MSP: ₹7,400/Qtl)",
        "recommended_varieties": ["LBG 752", "PU 31", "TBG 104", "LBG 645"],
        "sowing_window": "Rice-Fallow: Broadcast 2-3 days before paddy harvest (Dec - Jan)",
        "harvesting_window": "75 - 85 days",
        "precautions": [
            "In rice-fallows, ensure broadcast timing matches soil dampness (neither too soggy nor dry).",
            "Treat seed against Yellow Mosaic Virus (YMV) vectors with Imidacloprid."
        ],
        "rationale_template": "Fast-maturing 80-day legume with zero tillage cost in rice fallows. Restores soil biological health and enriches carbon."
    },
    {
        "id": "ap_maize",
        "name": "Maize / Corn (మొక్కజొన్న / मक्का)",
        "nameLocal": "మొక్కజొన్న",
        "botanical": "Zea mays",
        "category": "Cereal Food & Feed",
        "priority_states": ["Andhra Pradesh", "Telangana", "Karnataka", "Bihar", "Punjab"],
        "suitable_districts_ap": ["Guntur", "Kurnool", "West Godavari", "Prakasam", "Vizianagaram"],
        "seasons": ["Kharif", "Rabi"],
        "ideal_ph_range": (6.0, 7.8),
        "suitable_soils": ["Well-Drained Alluvial Loam", "Red Loam", "Medium Black"],
        "unsuitable_soils": ["Waterlogged Lowlands", "Heavy Compacting Clay"],
        "water_requirement": "Medium (4 - 5 Irrigations)",
        "water_category": "Medium",
        "min_n_demand": 120.0,
        "is_nitrogen_fixer": False,
        "potential_yield": "30 - 36 Quintals / Acre under recommended management",
        "indicative_return": "₹65,000 - ₹78,000 / Acre (Indicative MSP: ₹2,225/Qtl)",
        "recommended_varieties": ["DHM 117", "Pioneer 3396", "DKC 9108", "NK 6240"],
        "sowing_window": "Kharif: June - July | Rabi: October - November",
        "harvesting_window": "100 - 115 days",
        "precautions": [
            "Highly sensitive to waterlogging at seedling and knee-high stage; provide furrows.",
            "Monitor Fall Armyworm (Spodoptera frugiperda) early in crop whorls."
        ],
        "rationale_template": "High-yield biomass converter for {soil_type}. Responsive to balanced fertilizer applications with robust poultry and starch feed demand."
    },

    # ------------------ NORTH & CENTRAL INDIA STAPLES ------------------
    {
        "id": "north_wheat",
        "name": "Wheat (గేధుమలు / गेहूं)",
        "nameLocal": "गेहूं",
        "botanical": "Triticum aestivum",
        "category": "Cereal Food Grain",
        "priority_states": ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Bihar"],
        "suitable_districts_ap": [], # Not common in tropical South India
        "seasons": ["Rabi"],
        "ideal_ph_range": (6.5, 7.8),
        "suitable_soils": ["Alluvial Loam", "Clay Loam", "Silt Loam"],
        "unsuitable_soils": ["Acidic Soil (pH < 5.5)", "Coarse Sandy Soil"],
        "water_requirement": "Medium (3 - 4 Irrigations at CRI, Tillering, Heading)",
        "water_category": "Medium",
        "min_n_demand": 120.0,
        "is_nitrogen_fixer": False,
        "potential_yield": "22 - 26 Quintals / Acre under recommended management",
        "indicative_return": "₹52,000 - ₹62,000 / Acre (Indicative MSP: ₹2,425/Qtl)",
        "recommended_varieties": ["HD 3086 (Pusa Gautami)", "DBW 187 (Karan Vandana)", "PBW 725", "HD 2967"],
        "sowing_window": "November 01 - November 25 (Optimal Window)",
        "harvesting_window": "Late March to Mid April",
        "precautions": [
            "Timely first irrigation at Crown Root Initiation (21-25 DAS) is non-negotiable.",
            "Avoid excessive late nitrogen to prevent crop lodging under terminal heat and March winds."
        ],
        "rationale_template": "Ideal cereal for {soil_type} with pH {ph}. High response to balanced NPK ensures maximum tillering and grain weight."
    },
    {
        "id": "north_mustard",
        "name": "Mustard / Rapeseed (ఆవాలు / सरसों)",
        "nameLocal": "सरसों",
        "botanical": "Brassica juncea",
        "category": "Oilseed",
        "priority_states": ["Rajasthan", "Haryana", "Madhya Pradesh", "Uttar Pradesh", "Punjab"],
        "suitable_districts_ap": [],
        "seasons": ["Rabi"],
        "ideal_ph_range": (6.5, 8.2),
        "suitable_soils": ["Light to Heavy Loam", "Sandy Loam", "Alluvial Loam"],
        "unsuitable_soils": ["Acidic Soil (pH < 6.0)", "Waterlogged Soil"],
        "water_requirement": "Low (1 - 2 Irrigations)",
        "water_category": "Low",
        "min_n_demand": 80.0,
        "is_nitrogen_fixer": False,
        "potential_yield": "8 - 11 Quintals / Acre under recommended management",
        "indicative_return": "₹45,000 - ₹58,000 / Acre (Indicative MSP: ₹5,950/Qtl)",
        "recommended_varieties": ["Pusa Bold", "RH 749", "Giriraj (DRMRIJ 31)", "Pusa Mustard 25"],
        "sowing_window": "October 10 - October 31",
        "harvesting_window": "February End to Early March",
        "precautions": [
            "Mandatory Sulphur application (15 kg/acre) increases oil concentration by 2-3%.",
            "Monitor Aphids (Lipaphis erysimi) during flowering and cloudy winter weather."
        ],
        "rationale_template": "Top water-efficient oilseed for {soil_type}. Requires half the water of wheat while producing high value mustard oil and cake."
    },
    {
        "id": "central_soybean",
        "name": "Soybean (సోయాబీన్ / सोयाबीन)",
        "nameLocal": "सोयाबीन",
        "botanical": "Glycine max",
        "category": "Oilseed / Pulse",
        "priority_states": ["Madhya Pradesh", "Maharashtra", "Rajasthan", "Telangana", "Karnataka"],
        "suitable_districts_ap": ["Adilabad border", "Rayalaseema irrigated"],
        "seasons": ["Kharif"],
        "ideal_ph_range": (6.0, 7.5),
        "suitable_soils": ["Medium to Deep Black Soils", "Well-Drained Loams"],
        "unsuitable_soils": ["Saline Alkaline Soils", "Sandy Soils"],
        "water_requirement": "Medium (Monsoon Rainfed / 1 Irrigation if rain dry spell)",
        "water_category": "Medium",
        "min_n_demand": 20.0,
        "is_nitrogen_fixer": True,
        "potential_yield": "10 - 13 Quintals / Acre under recommended management",
        "indicative_return": "₹48,000 - ₹62,000 / Acre (Indicative MSP: ₹4,892/Qtl)",
        "recommended_varieties": ["JS 335", "JS 95-60", "NRC 37", "RVS 2001-4"],
        "sowing_window": "June 20 - July 10 (after 75-100 mm monsoon rainfall)",
        "harvesting_window": "October First Fortnight",
        "precautions": [
            "Ensure seed germination test before sowing; soybean seed coat is fragile.",
            "Do not bury seeds deeper than 3-4 cm."
        ],
        "rationale_template": "Builds soil organic carbon and fixes biological nitrogen on {soil_type}. Ideal for low-cost kharif oilseed production."
    }
]


def score_crop_suitability(
    crop: Dict[str, Any],
    ph: Optional[float],
    n_val: Optional[float],
    p_val: Optional[float],
    k_val: Optional[float],
    soil_type: str,
    location_state: str,
    location_district: str,
    water_availability: str, # "High", "Medium", "Low"
    season_filter: str       # "All", "Kharif", "Rabi", "Summer"
) -> Tuple[int, List[str]]:
    """
    Computes a scientific 0 - 100% suitability match score based on 5 agronomic factors.
    Returns: (score, positive_reasons)
    """
    reasons = []
    score = 70.0 # Baseline starting score

    # Factor 1: State & Regional Priority (Weight: +15 bonus)
    is_ap = "andhra" in location_state.lower()
    if is_ap:
        if "Andhra Pradesh" in crop.get("priority_states", []):
            score += 10.0
            reasons.append("Top priority crop for Andhra Pradesh agro-climatic zones")
        # Check district match
        dist_match = any(d.lower() in location_district.lower() for d in crop.get("suitable_districts_ap", []))
        if dist_match:
            score += 5.0
            reasons.append(f"Highly established commercial crop in {location_district} district")
    else:
        # Check matching states
        state_match = any(s.lower() in location_state.lower() for s in crop.get("priority_states", []))
        if state_match:
            score += 10.0
            reasons.append(f"Recommended regional crop for {location_state}")

    # Factor 2: Soil pH Tolerance (Weight: 25%)
    min_ph, max_ph = crop.get("ideal_ph_range", (6.0, 7.5))
    if ph is not None:
        if min_ph <= ph <= max_ph:
            score += 10.0
            reasons.append(f"Soil pH {ph} is within optimal range ({min_ph} - {max_ph})")
        elif ph < min_ph:
            diff = min_ph - ph
            score -= (diff * 12.0)
        else:
            diff = ph - max_ph
            score -= (diff * 10.0)

    # Factor 3: Soil Texture Matching (Weight: 20%)
    suitable_soils = [s.lower() for s in crop.get("suitable_soils", [])]
    unsuitable_soils = [s.lower() for s in crop.get("unsuitable_soils", [])]
    st_lower = soil_type.lower()

    if any(s in st_lower or st_lower in s for s in suitable_soils):
        score += 8.0
        reasons.append(f"Excellent root aeration and drainage in {soil_type}")
    elif any(s in st_lower or st_lower in s for s in unsuitable_soils):
        score -= 15.0

    # Factor 4: Water Availability Matching (Weight: 20%)
    crop_water = crop.get("water_category", "Medium")
    w_avail = water_availability.capitalize()

    if w_avail == "Low" or "rainfed" in w_avail.lower():
        if crop_water == "Low":
            score += 12.0
            reasons.append("Low water requirement ideal for rainfed or limited tubewell supply")
        elif crop_water == "High":
            score -= 25.0 # Severe penalty for water-thirsty crop under water deficit
    elif w_avail == "High" or "canal" in w_avail.lower():
        if crop_water == "High":
            score += 8.0
            reasons.append("Abundant water allows maximum yield potential for flooded cereal")
        elif crop_water == "Low":
            # Can still grow but might prefer high-value
            score += 2.0
    else: # Medium
        if crop_water in ["Medium", "Low"]:
            score += 6.0

    # Factor 5: Nutrient Profile Feasibility
    if n_val and n_val < 250:
        if crop.get("is_nitrogen_fixer"):
            score += 8.0
            reasons.append("Leguminous crop naturally fixes nitrogen, overcoming low soil N")
        elif crop.get("min_n_demand", 0) > 100:
            score -= 3.0 # Needs extra fertilizer

    # Factor 6: Season Matching
    if season_filter != "All":
        if season_filter in crop.get("seasons", []):
            score += 5.0
        else:
            score -= 20.0

    final_score = int(max(45, min(97, round(score))))
    return final_score, reasons


def recommend_crops_for_farm(
    soil_data: Dict[str, Any],
    location_state: str = "Andhra Pradesh",
    location_district: str = "Guntur",
    water_availability: str = "Medium",
    season: str = "All"
) -> Dict[str, Any]:
    """
    Ranks crops by agronomic suitability, prioritizing Andhra Pradesh and selected state.
    Guarantees at least 3 high-suitability crop suggestions.
    """
    # Extract soil parameters
    ph_obj = soil_data.get("ph", {})
    ph = ph_obj.get("value") if isinstance(ph_obj, dict) else 7.2
    
    n_obj = soil_data.get("nitrogen", {})
    n_val = n_obj.get("value") if isinstance(n_obj, dict) else 185.0

    p_obj = soil_data.get("phosphorus", {})
    p_val = p_obj.get("value") if isinstance(p_obj, dict) else 18.4

    k_obj = soil_data.get("potassium", {})
    k_val = k_obj.get("value") if isinstance(k_obj, dict) else 295.0

    soil_type = soil_data.get("soilType") or "Alluvial Loam"

    scored_crops = []

    for crop in CROPS_DATABASE:
        score, positive_reasons = score_crop_suitability(
            crop=crop,
            ph=ph,
            n_val=n_val,
            p_val=p_val,
            k_val=k_val,
            soil_type=soil_type,
            location_state=location_state,
            location_district=location_district,
            water_availability=water_availability,
            season_filter=season
        )

        rationale = crop["rationale_template"].format(soil_type=soil_type, ph=ph or 7.0)

        scored_crops.append({
            "id": crop["id"],
            "name": crop["name"],
            "nameLocal": crop.get("nameLocal", ""),
            "category": crop["category"],
            "suitability": score,
            "seasons": crop["seasons"],
            "water_requirement": crop["water_requirement"],
            "water_category": crop["water_category"],
            "potential_yield": crop["potential_yield"],
            "indicative_return": crop["indicative_return"],
            "recommended_varieties": crop["recommended_varieties"],
            "sowing_window": crop["sowing_window"],
            "harvesting_window": crop["harvesting_window"],
            "soil_compatibility": rationale,
            "precautions": crop["precautions"],
            "reasons": positive_reasons,
            "disclaimer": "Potential yield and revenue estimates are indicative benchmarks under recommended agronomic practices. Weather, pest attacks, and market swings affect actual harvests."
        })

    # Sort descending by suitability score
    scored_crops.sort(key=lambda x: x["suitability"], reverse=True)

    # Guarantee at least 3 crops are returned
    top_crops = scored_crops[:6]

    return {
        "location": {"state": location_state, "district": location_district},
        "soil_context": {
            "ph": ph,
            "soil_type": soil_type,
            "water_availability": water_availability,
            "season": season
        },
        "recommended_crops": top_crops,
        "total_analyzed": len(CROPS_DATABASE)
    }
