// Realistic Sample Soil Health Data for Indian Agro-Climatic Zones
// Based on Indian Council of Agricultural Research (ICAR) & Soil Health Card (SHC) standards

export const SAMPLE_SOIL_REPORTS = [
  {
    id: "SHC-PB-2025-0891",
    title: "North Field - 3.5 Acres (Alluvial Soil)",
    location: "Kila Raipur, Ludhiana, Punjab",
    farmerName: "Ramesh Kumar",
    sampleDate: "15 Oct 2025",
    labName: "District Soil Testing Laboratory, PAU Campus, Ludhiana",
    healthScore: 74, // out of 100
    overallStatus: "Moderate - Nitrogen & Zinc Deficient",
    soilType: "Alluvial Sandy Loam",
    primaryCrop: "Wheat (Rabi) / Paddy (Kharif)",
    
    // pH: 0-14 scale
    ph: {
      value: 7.2,
      rating: "Neutral",
      statusColor: "emerald",
      idealRange: "6.5 - 7.5",
      description: "Neutral & Optimal (Optimal for nutrient availability and root development)",
      advisory: "No liming or gypsum required. Soil pH is in the best range for cereal crops."
    },

    // Electrical Conductivity (EC in dS/m)
    ec: {
      value: 0.38,
      unit: "dS/m",
      rating: "Normal (Non-saline)",
      idealRange: "< 1.0",
      description: "Normal Salinity (Safe salinity level, no salt toxicity)"
    },

    // Organic Carbon (OC in %)
    organicCarbon: {
      value: 0.48,
      unit: "%",
      rating: "Low",
      statusColor: "amber",
      idealRange: "0.50 - 0.75%",
      description: "Low Organic Carbon (Deficient in soil organic matter)",
      advisory: "Add 4 to 5 tonnes of well-decomposed Farm Yard Manure (FYM) or vermicompost per acre before next sowing."
    },

    // Primary Nutrients (NPK) in kg/ha
    nutrients: {
      nitrogen: {
        symbol: "N",
        name: "Available Nitrogen",
        nameHindi: "उपलब्ध नाइट्रोजन",
        value: 185,
        unit: "kg/ha",
        rating: "Low",
        statusColor: "red",
        idealMin: 280,
        idealMax: 560,
        benchmark: 350,
        deficiencySymptom: "Lower leaves turning pale yellow (chlorosis), stunted tiller growth.",
        remedy: "Apply 110 kg Urea per acre in 3 split doses (basal, first irrigation, second irrigation)."
      },
      phosphorus: {
        symbol: "P",
        name: "Available Phosphorus (P₂O₅)",
        nameHindi: "उपलब्ध फास्फोरस",
        value: 18.4,
        unit: "kg/ha",
        rating: "Medium",
        statusColor: "emerald",
        idealMin: 14,
        idealMax: 28,
        benchmark: 22,
        deficiencySymptom: "Purplish discoloration on leaves, slow root development.",
        remedy: "Apply 45-50 kg DAP (Di-ammonium Phosphate) per acre as basal dose during sowing."
      },
      potassium: {
        symbol: "K",
        name: "Available Potassium (K₂O)",
        nameHindi: "उपलब्ध पोटाश",
        value: 295,
        unit: "kg/ha",
        rating: "High",
        statusColor: "sky",
        idealMin: 135,
        idealMax: 280,
        benchmark: 240,
        deficiencySymptom: "Marginal scorching and browning of leaf tips.",
        remedy: "Potassium reserves are ample. Reduce MOP (Muriate of Potash) by 50% to save input costs!"
      }
    },

    // Secondary & Micronutrients
    secondaryNutrients: {
      sulphur: {
        symbol: "S",
        name: "Available Sulphur",
        value: 12.5,
        unit: "ppm",
        rating: "Medium",
        statusColor: "emerald",
        benchmark: 15
      },
      zinc: {
        symbol: "Zn",
        name: "Available Zinc",
        value: 0.45,
        unit: "ppm",
        rating: "Deficient",
        statusColor: "red",
        benchmark: 0.60,
        deficiencySymptom: "White/bronze patches on young leaves (Khaira disease risk in paddy).",
        remedy: "Soil application of 10 kg Zinc Sulphate (21%) heptahydrate per acre."
      },
      iron: {
        symbol: "Fe",
        name: "Available Iron",
        value: 5.4,
        unit: "ppm",
        rating: "Sufficient",
        statusColor: "emerald",
        benchmark: 4.5
      },
      boron: {
        symbol: "B",
        name: "Available Boron",
        value: 0.52,
        unit: "ppm",
        rating: "Medium",
        statusColor: "emerald",
        benchmark: 0.50
      }
    },

    // Fertilizer Action Plan per Acre
    fertilizerPlan: [
      {
        fertilizer: "Urea (46% N)",
        bagsPerAcre: 2.2, // 45kg bag
        totalKg: 100,
        timing: "Basal (35 kg) + 1st Irrigation (35 kg) + 2nd Irrigation (30 kg)",
        estimatedCost: "₹590",
        savingTip: "Saved ₹350 by avoiding excess application."
      },
      {
        fertilizer: "DAP (18:46:0)",
        bagsPerAcre: 1.0, // 50kg bag
        totalKg: 50,
        timing: "Full dose at seed sowing drill",
        estimatedCost: "₹1,350",
        savingTip: "Balanced dose maintains phosphorus without soil fixing."
      },
      {
        fertilizer: "MOP (Muriate of Potash)",
        bagsPerAcre: 0.3,
        totalKg: 15,
        timing: "Reduced dose due to high native soil potassium",
        estimatedCost: "₹510",
        savingTip: "Saved ₹850 by cutting unnecessary MOP dosage!"
      },
      {
        fertilizer: "Zinc Sulphate (21%)",
        bagsPerAcre: 0.4,
        totalKg: 10,
        timing: "Broadcast during last land preparation (DO NOT mix with DAP)",
        estimatedCost: "₹420",
        savingTip: "Prevents grain yield loss of up to 15%."
      }
    ],

    // Crop Suitability Match
    cropRecommendations: [
      {
        crop: "Wheat (गेहूं - HD 3086 / DBW 187)",
        suitability: 94,
        season: "Rabi",
        soilMatch: "Excellent",
        waterNeed: "Medium (4-5 irrigations)",
        expectedYield: "20-22 Quintals / Acre",
        marketPotential: "High (Govt MSP Support)",
        badge: "Top Recommendation"
      },
      {
        crop: "Mustard (सरसों - Pusa Bold / RH 749)",
        suitability: 89,
        season: "Rabi",
        soilMatch: "Very Good",
        waterNeed: "Low (2 irrigations)",
        expectedYield: "8-10 Quintals / Acre",
        marketPotential: "High (Lucrative Oilseed Price)",
        badge: "Water Saver"
      },
      {
        crop: "Chickpea (चना - Pusa 372)",
        suitability: 82,
        season: "Rabi",
        soilMatch: "Good",
        waterNeed: "Low (1-2 irrigations)",
        expectedYield: "7-8 Quintals / Acre",
        marketPotential: "Medium-High",
        badge: "Soil Rejuvenator (Fixes N)"
      },
      {
        crop: "Paddy (धान - PR 126 / Basmati)",
        suitability: 85,
        season: "Kharif",
        soilMatch: "Good with Zinc application",
        waterNeed: "High",
        expectedYield: "26-28 Quintals / Acre",
        marketPotential: "Guaranteed Procurement",
        badge: "Kharif Staple"
      }
    ]
  },

  {
    id: "SHC-MH-2025-4102",
    title: "Canal Plot - 4.2 Acres (Black Cotton Soil)",
    location: "Baramati, Pune, Maharashtra",
    farmerName: "Ramesh Kumar (Demo Alternate)",
    sampleDate: "28 Sep 2025",
    labName: "KVK Soil Testing Center, Baramati",
    healthScore: 68,
    overallStatus: "Alkaline - Phosphorus & Organic Carbon Deficient",
    soilType: "Deep Black Clayey Regur Soil",
    primaryCrop: "Cotton / Soybean / Sugarcane",
    
    ph: {
      value: 8.1,
      rating: "Moderately Alkaline",
      statusColor: "amber",
      idealRange: "6.5 - 7.5",
      description: "Moderately Alkaline (Moderate alkalinity limits micronutrient uptake)",
      advisory: "Incorporate agricultural gypsum and green manuring (Dhaincha) to reduce soil sodicity."
    },

    ec: {
      value: 0.72,
      unit: "dS/m",
      rating: "Slightly elevated",
      idealRange: "< 1.0",
      description: "Slightly Elevated (Ensure adequate drainage to prevent salinity accumulation)"
    },

    organicCarbon: {
      value: 0.39,
      unit: "%",
      rating: "Very Low",
      statusColor: "red",
      idealRange: "0.50 - 0.75%",
      description: "Very Low Organic Carbon (Severely deficient in soil organic matter)",
      advisory: "Apply 6 tonnes FYM or bio-digester slurry per acre. Practice crop residue retention."
    },

    nutrients: {
      nitrogen: {
        symbol: "N",
        name: "Available Nitrogen",
        nameHindi: "उपलब्ध नाइट्रोजन",
        value: 210,
        unit: "kg/ha",
        rating: "Low",
        statusColor: "red",
        idealMin: 280,
        idealMax: 560,
        benchmark: 350,
        deficiencySymptom: "Reduced branching and light green foliage.",
        remedy: "Apply 90 kg Urea + Azotobacter bio-fertilizer seed treatment."
      },
      phosphorus: {
        symbol: "P",
        name: "Available Phosphorus (P₂O₅)",
        nameHindi: "उपलब्ध फास्फोरस",
        value: 11.2,
        unit: "kg/ha",
        rating: "Deficient",
        statusColor: "red",
        idealMin: 14,
        idealMax: 28,
        benchmark: 22,
        deficiencySymptom: "Delayed flowering and small boll formation in cotton.",
        remedy: "Apply 75 kg Single Super Phosphate (SSP) + PSB (Phosphate Solubilizing Bacteria)."
      },
      potassium: {
        symbol: "K",
        name: "Available Potassium (K₂O)",
        nameHindi: "उपलब्ध पोटाश",
        value: 380,
        unit: "kg/ha",
        rating: "Very High",
        statusColor: "emerald",
        idealMin: 135,
        idealMax: 280,
        benchmark: 240,
        deficiencySymptom: "None detected.",
        remedy: "No potash fertilizer needed this season. Direct saving of ₹1,100 per acre."
      }
    },

    secondaryNutrients: {
      sulphur: {
        symbol: "S",
        name: "Available Sulphur",
        value: 8.2,
        unit: "ppm",
        rating: "Low",
        statusColor: "red",
        benchmark: 15
      },
      zinc: {
        symbol: "Zn",
        name: "Available Zinc",
        value: 0.58,
        unit: "ppm",
        rating: "Marginal",
        statusColor: "amber",
        benchmark: 0.60,
        deficiencySymptom: "Mottling between veins on mature leaves.",
        remedy: "Foliar spray of 0.5% Zinc Chelate (EDTA) 45 days after sowing."
      },
      iron: {
        symbol: "Fe",
        name: "Available Iron",
        value: 4.1,
        unit: "ppm",
        rating: "Marginal",
        statusColor: "amber",
        benchmark: 4.5
      },
      boron: {
        symbol: "B",
        name: "Available Boron",
        value: 0.38,
        unit: "ppm",
        rating: "Low",
        statusColor: "red",
        benchmark: 0.50
      }
    },

    fertilizerPlan: [
      {
        fertilizer: "Urea (46% N)",
        bagsPerAcre: 2.0,
        totalKg: 90,
        timing: "Split into 3 doses with drip fertigation if possible",
        estimatedCost: "₹530",
        savingTip: "Use neem-coated urea to minimize volatilization in alkaline soil."
      },
      {
        fertilizer: "SSP (Single Super Phosphate)",
        bagsPerAcre: 2.5,
        totalKg: 125,
        timing: "Basal application (provides 16% P₂O₅ + 11% Sulphur + 19% Calcium)",
        estimatedCost: "₹1,125",
        savingTip: "SSP is far superior to DAP in high pH alkaline black soils."
      },
      {
        fertilizer: "Agricultural Gypsum",
        bagsPerAcre: 4.0,
        totalKg: 200,
        timing: "Broadcasting before plowing",
        estimatedCost: "₹800",
        savingTip: "Improves soil structure and water infiltration."
      }
    ],

    cropRecommendations: [
      {
        crop: "Soybean (सोयाबीन - JS 335 / NRC 37)",
        suitability: 91,
        season: "Kharif",
        soilMatch: "High",
        waterNeed: "Rainfed / Moderate",
        expectedYield: "9-11 Quintals / Acre",
        marketPotential: "Strong Commercial Demand",
        badge: "Legume Soil Enricher"
      },
      {
        crop: "Cotton (कपास - Bt Hybrid)",
        suitability: 86,
        season: "Kharif/Annual",
        soilMatch: "Deep Black Soil Ideal",
        waterNeed: "Medium",
        expectedYield: "12-14 Quintals / Acre",
        marketPotential: "High Cash Crop",
        badge: "High Value"
      },
      {
        crop: "Sorghum / Jowar (ज्वार - Maldandi)",
        suitability: 88,
        season: "Rabi",
        soilMatch: "Drought Tolerant",
        waterNeed: "Low",
        expectedYield: "10-12 Quintals / Acre",
        marketPotential: "Premium Millet Price",
        badge: "Climate Resilient"
      }
    ]
  }
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Jammu and Kashmir"
];

export { SUPPORTED_LANGUAGES, LANGUAGES } from '../i18n/languages';

