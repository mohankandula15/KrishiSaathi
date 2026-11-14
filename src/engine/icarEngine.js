/**
 * KrishiSaathi Deterministic ICAR Agronomy & Fertilizer Engine
 * Pure client-side JavaScript engine (zero network, works offline).
 * 
 * Provides:
 * 1. Scientific ICAR nutrient threshold classifications (Single Source of Truth).
 * 2. Soil Test Crop Response (STCR) calibrated fertilizer dosage calculations.
 * 3. Prevention of duplicate N application (deducts N contained in DAP from Urea).
 * 4. Soil pH amendments (Liming for acidic, Gypsum for alkaline/sodic).
 * 5. Agronomic crop suitability scoring and ranking.
 * 6. Critical safety precautions (e.g. Zinc Sulphate + DAP incompatibility).
 */

// ==============================================================================
// 1. ICAR THRESHOLDS & BENCHMARKS (SINGLE SOURCE OF TRUTH)
// ==============================================================================
export const ICAR_THRESHOLDS = {
  nitrogen: {
    unit: 'kg/ha',
    low: 280.0,
    medium: 560.0,
    benchmark: 350.0,
  },
  phosphorus: {
    unit: 'kg/ha',
    low: 14.0,
    medium: 28.0,
    benchmark: 22.0,
  },
  potassium: {
    unit: 'kg/ha',
    low: 135.0,
    medium: 280.0,
    benchmark: 240.0,
  },
  ph: {
    stronglyAcidic: 5.5,
    moderatelyAcidic: 6.5,
    neutralMax: 7.5,
    alkalineMax: 8.5,
    idealRange: '6.5 - 7.5',
  },
  organicCarbon: {
    unit: '%',
    low: 0.50,
    medium: 0.75,
    benchmark: 0.65,
  },
  ec: {
    unit: 'dS/m',
    normal: 1.0,
    slightlySaline: 2.0,
  },
  zinc: {
    unit: 'ppm',
    critical: 0.60,
  },
  sulphur: {
    unit: 'ppm',
    low: 10.0,
    medium: 20.0,
  },
  iron: {
    unit: 'ppm',
    critical: 4.5,
  },
  boron: {
    unit: 'ppm',
    critical: 0.50,
  },
  copper: {
    unit: 'ppm',
    critical: 0.20,
  },
  manganese: {
    unit: 'ppm',
    critical: 2.0,
  },
};

// ==============================================================================
// 2. INDIVIDUAL PARAMETER CLASSIFIERS
// ==============================================================================
export function classifyNitrogen(val) {
  if (val === null || val === undefined || isNaN(val)) return { rating: null, label: 'Not Available', description: 'Not Available' };
  const n = Number(val);
  if (n < ICAR_THRESHOLDS.nitrogen.low) {
    return {
      rating: 'Low',
      label: 'Low',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      description: 'Deficient in active root zone (<280 kg/ha). Apply Neem-coated Urea in 3 split doses.',
      remedy: 'Apply calibrated Neem-coated Urea in 3 split doses (basal, active tillering, panicle initiation).',
    };
  }
  if (n <= ICAR_THRESHOLDS.nitrogen.medium) {
    return {
      rating: 'Medium',
      label: 'Medium',
      color: 'bg-emerald-50 text-[#245C3A] border-emerald-200',
      description: 'Optimal availability (280-560 kg/ha). Standard basal & top-dressing recommended.',
      remedy: 'Apply standard recommended dose of urea.',
    };
  }
  return {
    rating: 'High',
    label: 'High',
    color: 'bg-sky-50 text-sky-900 border-sky-200',
    description: 'High reserves (>560 kg/ha). Reduce Urea application by 20-30% to avoid lodging.',
    remedy: 'Cut Urea application by 20-30% to prevent excessive vegetative growth and pest susceptibility.',
  };
}

export function classifyPhosphorus(val) {
  if (val === null || val === undefined || isNaN(val)) return { rating: null, label: 'Not Available', description: 'Not Available' };
  const p = Number(val);
  if (p < ICAR_THRESHOLDS.phosphorus.low) {
    return {
      rating: 'Low',
      label: 'Low',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      description: 'Deficient (<14 kg/ha). Drill DAP/SSP at sowing; use PSB bio-fertilizer.',
      remedy: 'Drill 45-50 kg DAP or 125 kg SSP per acre at sowing time.',
    };
  }
  if (p <= ICAR_THRESHOLDS.phosphorus.medium) {
    return {
      rating: 'Medium',
      label: 'Medium',
      color: 'bg-emerald-50 text-[#245C3A] border-emerald-200',
      description: 'Optimal availability (14-28 kg/ha). Standard basal DAP/SSP dose is adequate.',
      remedy: 'Standard basal phosphate application at sowing.',
    };
  }
  return {
    rating: 'High',
    label: 'High',
    color: 'bg-sky-50 text-sky-900 border-sky-200',
    description: 'High reserves (>28 kg/ha). Reduce phosphatic fertilizer to prevent zinc antagonism.',
    remedy: 'Cut DAP dose by 30% to prevent phosphorus fixation and zinc lockout.',
  };
}

export function classifyPotassium(val) {
  if (val === null || val === undefined || isNaN(val)) return { rating: null, label: 'Not Available', description: 'Not Available' };
  const k = Number(val);
  if (k < ICAR_THRESHOLDS.potassium.low) {
    return {
      rating: 'Low',
      label: 'Low',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      description: 'Deficient (<135 kg/ha). Apply 30-40 kg MOP (Muriate of Potash) per acre.',
      remedy: 'Apply 35-40 kg MOP (60% K2O) per acre at sowing for stalk strength and drought tolerance.',
    };
  }
  if (k <= ICAR_THRESHOLDS.potassium.medium) {
    return {
      rating: 'Medium',
      label: 'Medium',
      color: 'bg-emerald-50 text-[#245C3A] border-emerald-200',
      description: 'Optimal potassium levels for sturdy stalks and disease resistance.',
      remedy: 'Standard basal MOP application.',
    };
  }
  return {
    rating: 'High',
    label: 'High',
    color: 'bg-sky-50 text-sky-900 border-sky-200',
    description: 'High natural reserves (>280 kg/ha). Cut MOP dose by 50% to save input costs.',
    remedy: 'Reduce MOP by 50% to save ₹800-₹1,200 per acre with zero yield loss.',
  };
}

export function classifyPh(val) {
  if (val === null || val === undefined || isNaN(val)) return { rating: null, label: 'Not Available', description: 'Not Available' };
  const ph = Number(val);
  if (ph < ICAR_THRESHOLDS.ph.stronglyAcidic) {
    return {
      rating: 'Strongly acidic',
      label: 'Strongly acidic',
      color: 'bg-red-50 text-red-900 border-red-200',
      description: 'Strongly acidic (pH < 5.5). Severe nutrient lockout for phosphorus and calcium.',
      advisory: 'Apply 1.5 - 2 tonnes agricultural lime/calcite per acre before sowing.',
    };
  }
  if (ph < ICAR_THRESHOLDS.ph.moderatelyAcidic) {
    return {
      rating: 'Moderately acidic',
      label: 'Moderately acidic',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      description: 'Moderately acidic (pH 5.5 - 6.5). Favor acid-tolerant crops or apply light dolomite.',
      advisory: 'Apply 400-500 kg agricultural lime or farmyard manure to buffer pH.',
    };
  }
  if (ph <= ICAR_THRESHOLDS.ph.neutralMax) {
    return {
      rating: 'Neutral',
      label: 'Neutral',
      color: 'bg-emerald-50 text-[#245C3A] border-emerald-200',
      description: 'Ideal neutral range (pH 6.5 - 7.5). Maximum nutrient bioavailability for all crops.',
      advisory: 'No chemical amendments required. Soil pH is in optimal range.',
    };
  }
  if (ph <= ICAR_THRESHOLDS.ph.alkalineMax) {
    return {
      rating: 'Alkaline',
      label: 'Alkaline',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      description: 'Moderately alkaline (pH 7.5 - 8.5). Prefer Single Super Phosphate (SSP) over DAP.',
      advisory: 'Incorporate green manure (Dhaincha) and use acid-forming fertilizers like SSP/Ammonium sulphate.',
    };
  }
  return {
    rating: 'Strongly alkaline',
    label: 'Strongly alkaline',
    color: 'bg-purple-50 text-purple-900 border-purple-200',
    description: 'Strongly alkaline/sodic (pH > 8.5). High exchangeable sodium limits water infiltration.',
    advisory: 'Apply 500-1000 kg Agricultural Gypsum per acre followed by flushing with clean irrigation water.',
  };
}

export function classifyOrganicCarbon(val) {
  if (val === null || val === undefined || isNaN(val)) return { rating: null, label: 'Not Available', description: 'Not Available' };
  const oc = Number(val);
  if (oc < ICAR_THRESHOLDS.organicCarbon.low) {
    return {
      rating: 'Low',
      label: 'Low',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      description: 'Low organic matter (<0.50%). Impaired moisture holding capacity and soil biological life.',
      advisory: 'Incorporate 4 to 5 tonnes well-decomposed FYM, vermicompost, or green manure per acre.',
    };
  }
  if (oc <= ICAR_THRESHOLDS.organicCarbon.medium) {
    return {
      rating: 'Medium',
      label: 'Medium',
      color: 'bg-emerald-50 text-[#245C3A] border-emerald-200',
      description: 'Adequate organic carbon (0.50 - 0.75%). Good soil structure and microbial health.',
      advisory: 'Maintain with crop residue retention and regular compost additions.',
    };
  }
  return {
    rating: 'High',
    label: 'High',
    color: 'bg-emerald-50 text-[#245C3A] border-emerald-200',
    description: 'Rich organic matter (>0.75%). Excellent soil aeration, moisture retention, and biodiversity.',
    advisory: 'Excellent soil carbon reserve. Maintain with minimum tillage.',
  };
}

export function classifyEc(val) {
  if (val === null || val === undefined || isNaN(val)) return { rating: null, label: 'Not Available', description: 'Not Available' };
  const ec = Number(val);
  if (ec < ICAR_THRESHOLDS.ec.normal) {
    return {
      rating: 'Normal',
      label: 'Normal',
      color: 'bg-emerald-50 text-[#245C3A] border-emerald-200',
      description: 'Normal non-saline condition (<1.0 dS/m). Zero salinity stress on seeds or roots.',
    };
  }
  if (ec <= ICAR_THRESHOLDS.ec.slightlySaline) {
    return {
      rating: 'Slightly saline',
      label: 'Slightly saline',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      description: 'Slight salinity (1.0 - 2.0 dS/m). Ensure adequate drainage; avoid brackish borewell water.',
    };
  }
  return {
    rating: 'Saline',
    label: 'Saline',
    color: 'bg-red-50 text-red-900 border-red-200',
    description: 'Saline soil (>2.0 dS/m). Osmotic stress hinders water uptake by plant roots.',
  };
}

export function classifyZinc(val) {
  if (val === null || val === undefined || isNaN(val)) return { rating: null, label: 'Not Available', description: 'Not Available' };
  const zn = Number(val);
  if (zn < ICAR_THRESHOLDS.zinc.critical) {
    return {
      rating: 'Deficient',
      label: 'Low (Deficient)',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      description: 'Deficient (<0.60 ppm). High risk of Khaira disease in paddy and stunted crop growth.',
      remedy: 'Apply 10 kg Zinc Sulphate (21%) heptahydrate per acre. NEVER mix directly with DAP!',
    };
  }
  return {
    rating: 'Sufficient',
    label: 'Sufficient',
    color: 'bg-emerald-50 text-[#245C3A] border-emerald-200',
    description: 'Sufficient zinc reserves (≥0.60 ppm) for enzyme activation and seed development.',
    remedy: 'Zinc reserves are adequate.',
  };
}

export function classifySulphur(val) {
  if (val === null || val === undefined || isNaN(val)) return { rating: null, label: 'Not Available', description: 'Not Available' };
  const s = Number(val);
  if (s < ICAR_THRESHOLDS.sulphur.low) {
    return {
      rating: 'Low',
      label: 'Low',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      description: 'Deficient (<10 ppm). Restricts protein and oil synthesis in oilseeds and pulses.',
      remedy: 'Apply 15-20 kg agricultural Sulphur or choose SSP as phosphorus source.',
    };
  }
  if (s <= ICAR_THRESHOLDS.sulphur.medium) {
    return {
      rating: 'Medium',
      label: 'Medium',
      color: 'bg-emerald-50 text-[#245C3A] border-emerald-200',
      description: 'Adequate sulphur availability for cereal and oilseed crops.',
      remedy: 'Standard fertilizer program maintains sulphur.',
    };
  }
  return {
    rating: 'High',
    label: 'High',
    color: 'bg-emerald-50 text-[#245C3A] border-emerald-200',
    description: 'High sulphur reserves.',
    remedy: 'No additional sulphur needed.',
  };
}

export function classifyIron(val) {
  if (val === null || val === undefined || isNaN(val)) return { rating: null, label: 'Not Available', description: 'Not Available' };
  const fe = Number(val);
  if (fe < ICAR_THRESHOLDS.iron.critical) {
    return {
      rating: 'Low',
      label: 'Low',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      description: 'Deficient (<4.5 ppm). Causes interveinal chlorosis in young leaves.',
      remedy: 'Foliar spray of 0.5% Ferrous Sulphate (FeSO4) + 0.1% citric acid.',
    };
  }
  return {
    rating: 'Sufficient',
    label: 'Sufficient',
    color: 'bg-emerald-50 text-[#245C3A] border-emerald-200',
    description: 'Sufficient iron reserves for chlorophyll synthesis.',
    remedy: 'Iron reserves are adequate.',
  };
}

export function classifyBoron(val) {
  if (val === null || val === undefined || isNaN(val)) return { rating: null, label: 'Not Available', description: 'Not Available' };
  const b = Number(val);
  if (b < ICAR_THRESHOLDS.boron.critical) {
    return {
      rating: 'Low',
      label: 'Low',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      description: 'Deficient (<0.50 ppm). Impairs pollen viability and grain/pod set.',
      remedy: 'Apply 2 kg Borax or Solubor (1 kg/acre) during land preparation.',
    };
  }
  return {
    rating: 'Sufficient',
    label: 'Sufficient',
    color: 'bg-emerald-50 text-[#245C3A] border-emerald-200',
    description: 'Sufficient boron for proper flowering and grain formation.',
    remedy: 'Boron reserves are adequate.',
  };
}

// Unified classifyLive helper matching SoilUploadModal
export function classifyLive(param, val) {
  if (val === null || val === undefined || isNaN(val) || val === '') return null;
  switch (param) {
    case 'nitrogen': return classifyNitrogen(val);
    case 'phosphorus': return classifyPhosphorus(val);
    case 'potassium': return classifyPotassium(val);
    case 'ph': return classifyPh(val);
    case 'organicCarbon': return classifyOrganicCarbon(val);
    case 'ec': return classifyEc(val);
    case 'zinc': return classifyZinc(val);
    case 'sulphur': return classifySulphur(val);
    case 'iron': return classifyIron(val);
    case 'boron': return classifyBoron(val);
    default: return null;
  }
}

// ==============================================================================
// 3. CROPS & AGRONOMIC BENCHMARKS DATABASE
// ==============================================================================
export const CROP_AGRONOMY_DATABASE = {
  Paddy: {
    displayName: 'Paddy / Rice (వరి / धान)',
    localTe: 'వరి',
    localHi: 'धान',
    rdf_n: 100.0,
    rdf_p: 50.0,
    rdf_k: 50.0,
    preferred_p_source: 'DAP',
    ideal_ph_range: [6.0, 7.8],
    water_category: 'High',
    is_nitrogen_fixer: false,
    splits: [
      { stage: 'Basal (At Transplanting)', pct_n: 33, pct_p: 100, pct_k: 50, note: 'Incorporate in puddle before final leveling.' },
      { stage: 'Active Tillering (21-25 DAT)', pct_n: 33, pct_p: 0, pct_k: 0, note: 'Top-dress after draining standing water.' },
      { stage: 'Panicle Initiation (45-50 DAT)', pct_n: 34, pct_p: 0, pct_k: 50, note: 'Crucial for grain filling.' },
    ],
  },
  Wheat: {
    displayName: 'Wheat (గోధుమ / गेहूं)',
    localTe: 'గోధుమ',
    localHi: 'गेहूं',
    rdf_n: 120.0,
    rdf_p: 60.0,
    rdf_k: 40.0,
    preferred_p_source: 'DAP',
    ideal_ph_range: [6.0, 7.5],
    water_category: 'Medium',
    is_nitrogen_fixer: false,
    splits: [
      { stage: 'Basal (At Sowing)', pct_n: 35, pct_p: 100, pct_k: 100, note: 'Drill 5cm below seed line.' },
      { stage: '1st Irrigation (21-25 DAS / CRI)', pct_n: 35, pct_p: 0, pct_k: 0, note: 'Top-dress over damp soil.' },
      { stage: '2nd Irrigation (40-45 DAS)', pct_n: 30, pct_p: 0, pct_k: 0, note: 'Final split before boot stage.' },
    ],
  },
  Groundnut: {
    displayName: 'Groundnut (వేరుశనగ / मूंगफली)',
    localTe: 'వేరుశనగ',
    localHi: 'मूंगफली',
    rdf_n: 20.0, // Low N due to Rhizobium fixation
    rdf_p: 40.0,
    rdf_k: 40.0,
    preferred_p_source: 'SSP', // supplies essential Ca & S for pod filling
    ideal_ph_range: [6.0, 7.5],
    water_category: 'Low',
    is_nitrogen_fixer: true,
    splits: [
      { stage: 'Basal (At Sowing)', pct_n: 100, pct_p: 100, pct_k: 100, note: 'Apply SSP and MOP in furrows.' },
      { stage: 'Pegging (40-45 DAS)', pct_n: 0, pct_p: 0, pct_k: 0, note: 'Top-dress 200 kg Gypsum/acre for calcium pod filling.' },
    ],
  },
  Cotton: {
    displayName: 'Cotton (ప్రత్తి / कपास)',
    localTe: 'ప్రత్తి',
    localHi: 'कपास',
    rdf_n: 120.0,
    rdf_p: 60.0,
    rdf_k: 60.0,
    preferred_p_source: 'DAP',
    ideal_ph_range: [6.5, 8.5],
    water_category: 'Medium',
    is_nitrogen_fixer: false,
    splits: [
      { stage: 'Basal (At Sowing)', pct_n: 20, pct_p: 100, pct_k: 20, note: 'Spot placement away from seed.' },
      { stage: 'Square Formation (35-40 DAS)', pct_n: 40, pct_p: 0, pct_k: 40, note: 'Band placement along rows.' },
      { stage: 'Boll Development (65-70 DAS)', pct_n: 40, pct_p: 0, pct_k: 40, note: 'Prevents square dropping.' },
    ],
  },
  Chilli: {
    displayName: 'Chilli (మిరప / मिर्च)',
    localTe: 'మిరప',
    localHi: 'मिर्च',
    rdf_n: 150.0,
    rdf_p: 60.0,
    rdf_k: 80.0,
    preferred_p_source: 'DAP',
    ideal_ph_range: [6.5, 7.8],
    water_category: 'Medium',
    is_nitrogen_fixer: false,
    splits: [
      { stage: 'Basal (At Transplanting)', pct_n: 25, pct_p: 100, pct_k: 25, note: 'Furrow application.' },
      { stage: 'Vegetative (30 DAT)', pct_n: 25, pct_p: 0, pct_k: 25, note: 'Before earthing up.' },
      { stage: 'Flowering (60 DAT)', pct_n: 25, pct_p: 0, pct_k: 25, note: 'Supports continuous flower set.' },
      { stage: 'Fruit Setting (90 DAT)', pct_n: 25, pct_p: 0, pct_k: 25, note: 'Supports continuous picking.' },
    ],
  },
  Chickpea: {
    displayName: 'Chickpea / Bengal Gram (శనగ / चना)',
    localTe: 'శనగ',
    localHi: 'चना',
    rdf_n: 20.0,
    rdf_p: 50.0,
    rdf_k: 20.0,
    preferred_p_source: 'DAP',
    ideal_ph_range: [6.5, 8.0],
    water_category: 'Low',
    is_nitrogen_fixer: true,
    splits: [
      { stage: 'Basal (100% at Sowing)', pct_n: 100, pct_p: 100, pct_k: 100, note: 'Drill 7-10 cm deep. No post-sowing top-dress needed.' },
    ],
  },
  Maize: {
    displayName: 'Maize (మొక్కజొన్న / मक्का)',
    localTe: 'మొక్కజొన్న',
    localHi: 'मक्का',
    rdf_n: 120.0,
    rdf_p: 60.0,
    rdf_k: 50.0,
    preferred_p_source: 'DAP',
    ideal_ph_range: [6.0, 7.5],
    water_category: 'Medium',
    is_nitrogen_fixer: false,
    splits: [
      { stage: 'Basal (At Sowing)', pct_n: 33, pct_p: 100, pct_k: 100, note: 'Drill beside seed row.' },
      { stage: 'Knee-High (25-30 DAS)', pct_n: 33, pct_p: 0, pct_k: 0, note: 'Side dress 10cm from base.' },
      { stage: 'Tasseling (50-55 DAS)', pct_n: 34, pct_p: 0, pct_k: 0, note: 'Before silk emergence.' },
    ],
  },
};

const ACRE_TO_HECTARE = 0.404686;

// ==============================================================================
// 4. EXTRACT VALUES UNIFIED FROM ANY SOIL REPORT SHAPE
// ==============================================================================
export function extractReportValues(report) {
  if (!report) return {};

  const ext = report.extracted_soil_data || {};
  const nut = report.nutrients || {};
  const sec = report.secondaryNutrients || {};

  const getVal = (paths) => {
    for (const p of paths) {
      if (p !== undefined && p !== null && !isNaN(p) && p !== '') {
        return Number(p);
      }
    }
    return null;
  };

  const n = getVal([nut.nitrogen?.value, ext.nitrogen?.value, report.nitrogen?.value, report.nitrogen]);
  const p = getVal([nut.phosphorus?.value, ext.phosphorus?.value, report.phosphorus?.value, report.phosphorus]);
  const k = getVal([nut.potassium?.value, ext.potassium?.value, report.potassium?.value, report.potassium]);
  const ph = getVal([report.ph?.value, ext.ph?.value, report.ph]);
  const oc = getVal([report.organicCarbon?.value, ext.organic_carbon?.value, report.organic_carbon?.value, report.organicCarbon]);
  const ec = getVal([report.ec?.value, ext.ec?.value, report.ec]);
  const zn = getVal([sec.zinc?.value, ext.zinc?.value, report.zinc?.value, report.zinc]);
  const s = getVal([sec.sulphur?.value, ext.sulphur?.value, report.sulphur?.value, report.sulphur]);
  const fe = getVal([sec.iron?.value, ext.iron?.value, report.iron?.value, report.iron]);
  const b = getVal([sec.boron?.value, ext.boron?.value, report.boron?.value, report.boron]);

  return { n, p, k, ph, oc, ec, zn, s, fe, b };
}

// ==============================================================================
// 5. STCR FERTILIZER PRESCRIPTION ENGINE (CLIENT-SIDE)
// ==============================================================================
export function calculateFertilizerPlan(soilData, cropName = 'Paddy', acreage = 1.0) {
  const vals = extractReportValues(soilData);
  const nVal = vals.n ?? 185.0;
  const pVal = vals.p ?? 18.4;
  const kVal = vals.k ?? 295.0;
  const phVal = vals.ph ?? 7.2;
  const znVal = vals.zn;

  // Resolve crop
  let matchedKey = 'Paddy';
  const cropLower = String(cropName).toLowerCase();
  for (const k of Object.keys(CROP_AGRONOMY_DATABASE)) {
    if (cropLower.includes(k.toLowerCase()) || k.toLowerCase().includes(cropLower)) {
      matchedKey = k;
      break;
    }
  }
  const crop = CROP_AGRONOMY_DATABASE[matchedKey];

  // STCR Multipliers:
  // Low: +25%
  // Medium: 100%
  // High: -30%
  // High K (>280): -50%
  const nClass = classifyNitrogen(nVal);
  const pClass = classifyPhosphorus(pVal);
  const kClass = classifyPotassium(kVal);

  const adjN = nClass.rating === 'Low' ? 1.25 : (nClass.rating === 'High' ? 0.70 : 1.0);
  const adjP = pClass.rating === 'Low' ? 1.25 : (pClass.rating === 'High' ? 0.70 : 1.0);
  let adjK = kClass.rating === 'Low' ? 1.25 : (kClass.rating === 'High' ? 0.70 : 1.0);
  if (kVal > 280) adjK = 0.50; // Special Potash savings rule

  const targetNHa = crop.rdf_n * adjN;
  const targetPHa = crop.rdf_p * adjP;
  const targetKHa = crop.rdf_k * adjK;

  const targetNAcre = targetNHa * ACRE_TO_HECTARE;
  const targetPAcre = targetPHa * ACRE_TO_HECTARE;
  const targetKAcre = targetKHa * ACRE_TO_HECTARE;

  // 1. Phosphorus calculation (DAP or SSP)
  // DAP is 46% P2O5, 18% N
  const useSsp = crop.preferred_p_source === 'SSP' || phVal > 8.0;
  let dapKgAcre = 0;
  let dapBagsAcre = 0;
  let sspKgAcre = 0;
  let sspBagsAcre = 0;
  let nFromP = 0;

  if (useSsp) {
    sspKgAcre = targetPAcre / 0.16;
    sspBagsAcre = Math.round((sspKgAcre / 50.0) * 10) / 10;
    nFromP = 0;
  } else {
    dapKgAcre = targetPAcre / 0.46;
    dapBagsAcre = Math.round((dapKgAcre / 50.0) * 10) / 10;
    nFromP = dapKgAcre * 0.18; // 18% N contribution
  }

  // 2. Nitrogen calculation (Urea with DUPLICATE N DEDUCTED)
  const netNAcre = Math.max(0, targetNAcre - nFromP);
  const ureaKgAcre = netNAcre / 0.46;
  const ureaBagsAcre = Math.round((ureaKgAcre / 45.0) * 10) / 10; // 45kg bag

  // 3. Potash calculation (MOP 60% K2O)
  const mopKgAcre = targetKAcre / 0.60;
  const mopBagsAcre = Math.round((mopKgAcre / 50.0) * 10) / 10; // 50kg bag

  // 4. Zinc
  const needZinc = znVal !== null && znVal !== undefined && znVal < 0.60;
  const zincKgAcre = needZinc ? 10.0 : 0;

  // 5. Amendments
  const needLime = phVal < 5.5;
  const limeTonnesAcre = needLime ? 1.5 : 0;
  const needGypsum = phVal > 8.5 || matchedKey === 'Groundnut';
  const gypsumKgAcre = phVal > 8.5 ? 500 : (matchedKey === 'Groundnut' ? 200 : 0);

  // Precautions
  const precautions = [
    'CRITICAL: Never mix Zinc Sulphate directly with DAP. Phosphate binds with zinc to form insoluble Zinc Phosphate precipitate, rendering both unabsorbable.',
    'Neem-Coated Urea must be split into 2 to 3 doses across vegetative growth stages. Broadcast on moist soil, never during dry midday heat.',
  ];
  if (kVal > 280) {
    precautions.push(`High natural soil potash (${kVal} kg/ha). MOP dose is cut by 50% to save input costs!`);
  }
  if (needGypsum && matchedKey === 'Groundnut') {
    precautions.push('Apply 200 kg Gypsum/acre at pegging stage (40-45 DAS) for calcium pod filling.');
  }

  return {
    crop: matchedKey,
    cropDisplayName: crop.displayName,
    acreage,
    urea: {
      fertilizer: 'Neem Coated Urea (46% N)',
      kgPerAcre: Math.round(ureaKgAcre * 10) / 10,
      bagsPerAcre: ureaBagsAcre,
      totalBags: Math.round(ureaBagsAcre * acreage * 10) / 10,
      dapDeductionNote: useSsp ? null : `DAP already supplied ${Math.round(nFromP * 10) / 10} kg N/acre. Urea calibrated down to avoid lodging.`,
      timing: 'Split: 33% Basal + 33% Tillering (21-25 DAS) + 34% Panicle/Flower (45-50 DAS)',
    },
    phosphorusSource: useSsp
      ? {
          fertilizer: 'Single Super Phosphate (SSP - 16% P2O5)',
          kgPerAcre: Math.round(sspKgAcre * 10) / 10,
          bagsPerAcre: sspBagsAcre,
          totalBags: Math.round(sspBagsAcre * acreage * 10) / 10,
          timing: '100% Basal at sowing / transplanting.',
        }
      : {
          fertilizer: 'Di-Ammonium Phosphate (DAP 18-46-0)',
          kgPerAcre: Math.round(dapKgAcre * 10) / 10,
          bagsPerAcre: dapBagsAcre,
          totalBags: Math.round(dapBagsAcre * acreage * 10) / 10,
          timing: '100% Basal at sowing drilled 5cm below seed.',
        },
    mop: {
      fertilizer: 'Muriate of Potash (MOP 60% K2O)',
      kgPerAcre: Math.round(mopKgAcre * 10) / 10,
      bagsPerAcre: mopBagsAcre,
      totalBags: Math.round(mopBagsAcre * acreage * 10) / 10,
      timing: '100% Basal at sowing (or split 50:50 on sandy soils).',
    },
    zinc: needZinc
      ? {
          fertilizer: 'Zinc Sulphate Heptahydrate (21% Zn)',
          kgPerAcre: zincKgAcre,
          totalKg: zincKgAcre * acreage,
          timing: 'Broadcast during final land preparation (DO NOT mix with DAP).',
        }
      : null,
    amendments: {
      lime: needLime ? { required: true, quantityTonnesPerAcre: limeTonnesAcre } : null,
      gypsum: needGypsum ? { required: true, quantityKgPerAcre: gypsumKgAcre } : null,
    },
    precautions,
  };
}

// ==============================================================================
// 6. CROP SUITABILITY SCORING (PORT OF CROP ENGINE ESSENTIALS)
// ==============================================================================
export function recommendCrops(soilData) {
  const vals = extractReportValues(soilData);
  const ph = vals.ph ?? 7.2;
  const n = vals.n ?? 185.0;

  const results = [];

  for (const [key, crop] of Object.entries(CROP_AGRONOMY_DATABASE)) {
    let score = 70.0;
    const reasons = [];

    // pH match
    const [minPh, maxPh] = crop.ideal_ph_range;
    if (ph >= minPh && ph <= maxPh) {
      score += 15.0;
      reasons.push(`Soil pH ${ph} is in optimal range (${minPh} - ${maxPh})`);
    } else if (ph < minPh) {
      score -= (minPh - ph) * 12.0;
      reasons.push(`Soil pH is below preferred minimum (${minPh})`);
    } else {
      score -= (ph - maxPh) * 10.0;
      reasons.push(`Soil pH is above preferred maximum (${maxPh})`);
    }

    // Nitrogen synergy
    if (n < 280) {
      if (crop.is_nitrogen_fixer) {
        score += 12.0;
        reasons.push('Legume naturally fixes atmospheric N, overcoming soil N deficiency');
      } else if (crop.rdf_n > 110) {
        score -= 4.0;
      }
    }

    const finalScore = Math.max(48, Math.min(97, Math.round(score)));

    results.push({
      cropKey: key,
      crop: crop.displayName,
      localTe: crop.localTe,
      localHi: crop.localHi,
      suitability: finalScore,
      waterNeed: crop.water_category,
      rationale: reasons.join('; '),
    });
  }

  // Sort descending by suitability
  results.sort((a, b) => b.suitability - a.suitability);
  return results;
}

// ==============================================================================
// 7. COMPREHENSIVE ANALYZE SOIL (MAIN EXPORT)
// ==============================================================================
export function analyzeSoil(report) {
  const vals = extractReportValues(report);

  const ratings = {
    nitrogen: { value: vals.n, ...classifyNitrogen(vals.n) },
    phosphorus: { value: vals.p, ...classifyPhosphorus(vals.p) },
    potassium: { value: vals.k, ...classifyPotassium(vals.k) },
    ph: { value: vals.ph, ...classifyPh(vals.ph) },
    organicCarbon: { value: vals.oc, ...classifyOrganicCarbon(vals.oc) },
    ec: { value: vals.ec, ...classifyEc(vals.ec) },
    zinc: { value: vals.zn, ...classifyZinc(vals.zn) },
    sulphur: { value: vals.s, ...classifySulphur(vals.s) },
    iron: { value: vals.fe, ...classifyIron(vals.fe) },
    boron: { value: vals.b, ...classifyBoron(vals.b) },
  };

  // Collect deficiencies sorted by severity
  const defs = [];

  // 1. Extreme pH
  if (vals.ph !== null && (vals.ph < 5.5 || vals.ph > 8.5)) {
    defs.push({
      key: 'ph',
      name: 'Soil pH',
      value: vals.ph,
      severity: 1,
      status: ratings.ph.label,
      message: ratings.ph.description,
      remedy: ratings.ph.advisory,
    });
  }

  // 2. Nitrogen deficiency (<280)
  if (vals.n !== null && vals.n < ICAR_THRESHOLDS.nitrogen.low) {
    defs.push({
      key: 'nitrogen',
      name: 'Available Nitrogen (N)',
      value: vals.n,
      threshold: ICAR_THRESHOLDS.nitrogen.low,
      unit: 'kg/ha',
      severity: 2,
      status: 'Deficient (Low)',
      message: `Low Nitrogen (${vals.n} kg/ha vs 280 kg/ha benchmark). Causes pale leaves and reduced tillers.`,
      remedy: ratings.nitrogen.remedy,
    });
  }

  // 3. Zinc deficiency (<0.60)
  if (vals.zn !== null && vals.zn < ICAR_THRESHOLDS.zinc.critical) {
    defs.push({
      key: 'zinc',
      name: 'Available Zinc (Zn)',
      value: vals.zn,
      threshold: ICAR_THRESHOLDS.zinc.critical,
      unit: 'ppm',
      severity: 3,
      status: 'Deficient (<0.60 ppm)',
      message: `Zinc Deficient (${vals.zn} ppm). Risk of Khaira disease in paddy.`,
      remedy: ratings.zinc.remedy,
    });
  }

  // 4. Phosphorus deficiency (<14)
  if (vals.p !== null && vals.p < ICAR_THRESHOLDS.phosphorus.low) {
    defs.push({
      key: 'phosphorus',
      name: 'Available Phosphorus (P)',
      value: vals.p,
      threshold: ICAR_THRESHOLDS.phosphorus.low,
      unit: 'kg/ha',
      severity: 4,
      status: 'Deficient (Low)',
      message: `Low Phosphorus (${vals.p} kg/ha vs 14 kg/ha threshold). Inhibits root growth.`,
      remedy: ratings.phosphorus.remedy,
    });
  }

  // 5. Organic Carbon (<0.50)
  if (vals.oc !== null && vals.oc < ICAR_THRESHOLDS.organicCarbon.low) {
    defs.push({
      key: 'organicCarbon',
      name: 'Organic Carbon (OC)',
      value: vals.oc,
      threshold: ICAR_THRESHOLDS.organicCarbon.low,
      unit: '%',
      severity: 5,
      status: 'Low (<0.50%)',
      message: `Low Organic Carbon (${vals.oc}%). Depleted soil microbial activity.`,
      remedy: ratings.organicCarbon.advisory,
    });
  }

  // 6. Potassium deficiency (<135)
  if (vals.k !== null && vals.k < ICAR_THRESHOLDS.potassium.low) {
    defs.push({
      key: 'potassium',
      name: 'Available Potassium (K)',
      value: vals.k,
      threshold: ICAR_THRESHOLDS.potassium.low,
      unit: 'kg/ha',
      severity: 6,
      status: 'Deficient (Low)',
      message: `Low Potash (${vals.k} kg/ha vs 135 kg/ha threshold). Stalks vulnerable to lodging.`,
      remedy: ratings.potassium.remedy,
    });
  }

  // 7. Sulphur deficiency (<10)
  if (vals.s !== null && vals.s < ICAR_THRESHOLDS.sulphur.low) {
    defs.push({
      key: 'sulphur',
      name: 'Available Sulphur (S)',
      value: vals.s,
      threshold: ICAR_THRESHOLDS.sulphur.low,
      unit: 'ppm',
      severity: 7,
      status: 'Deficient (<10 ppm)',
      message: `Low Sulphur (${vals.s} ppm). Lowers oil and protein synthesis.`,
      remedy: ratings.sulphur.remedy,
    });
  }

  // Sort deficiencies strictly by severity
  defs.sort((a, b) => a.severity - b.severity);

  // Compute overall health score (0-100)
  const nScore = vals.n ? Math.min(25, (vals.n / 350.0) * 20) : 15;
  const pScore = vals.p ? Math.min(25, (vals.p / 22.0) * 20) : 15;
  const kScore = vals.k ? Math.min(25, (vals.k / 240.0) * 20) : 15;
  const ocScore = vals.oc ? Math.min(20, (vals.oc / 0.65) * 15) : 10;
  const phPenalty = vals.ph ? Math.abs(vals.ph - 7.0) * 7.0 : 0;
  const healthScore = Math.max(35, Math.min(98, Math.round(nScore + pScore + kScore + ocScore + 20 - phPenalty)));

  // Generate fertilizer plan and crop suggestions
  const fertilizerPlan = calculateFertilizerPlan(report, 'Paddy', 1.0);
  const cropSuggestions = recommendCrops(report);

  const phLabel = ratings.ph.label || 'Neutral';
  const nLabel = ratings.nitrogen.label || 'Medium';
  const kLabel = ratings.potassium.label || 'Medium';

  return {
    ratings,
    deficiencies: defs,
    healthScore,
    overallStatus: `${phLabel} Soil • ${nLabel} Nitrogen • ${kLabel} Potassium`,
    fertilizerPlan,
    cropSuggestions,
    values: vals,
  };
}

// ==============================================================================
// 8. PLAIN TEXT REPORT GENERATOR (WHATSAPP & COPY ADVISORY)
// ==============================================================================
export function formatSoilReportText(report, options = {}) {
  const analysis = analyzeSoil(report);
  const lang = ['te', 'hi', 'en'].includes(options.lang) ? options.lang : 'en';

  const farmerName = options.farmerName || report?.farmerName || report?.farmer?.name || report?.extracted_soil_data?.farmerName || (lang === 'te' ? 'రైతు' : (lang === 'hi' ? 'किसान' : 'Farmer'));
  const village = options.village || report?.location || report?.village || report?.extracted_soil_data?.village || (lang === 'te' ? 'గ్రామం' : (lang === 'hi' ? 'गांव' : 'Local Village'));
  const reportDate = options.reportDate || report?.sampleDate || report?.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const healthScore = analysis.healthScore;

  const vals = analysis.values;
  const plan = analysis.fertilizerPlan;
  const defs = analysis.deficiencies;
  const crops = analysis.cropSuggestions.slice(0, 3);

  const translateRating = (ratingStr) => {
    const raw = String(ratingStr || '').toLowerCase();
    if (lang === 'te') {
      if (raw.includes('low') || raw.includes('deficient')) return 'తక్కువ (లోపం)';
      if (raw.includes('high') || raw.includes('sufficient')) return 'ఎక్కువ (సమృద్ధి)';
      if (raw.includes('medium') || raw.includes('optimal')) return 'మధ్యస్థం (సహజం)';
      if (raw.includes('acid')) return 'ఆమ్ల గుణం';
      if (raw.includes('alkal')) return 'క్షార గుణం';
      if (raw.includes('neutral')) return 'తటస్థం';
      return ratingStr || 'సాధారణం';
    }
    if (lang === 'hi') {
      if (raw.includes('low') || raw.includes('deficient')) return 'कम (कमी)';
      if (raw.includes('high') || raw.includes('sufficient')) return 'अधिक (प्रचुर)';
      if (raw.includes('medium') || raw.includes('optimal')) return 'मध्यम (संतुलित)';
      if (raw.includes('acid')) return 'अम्लीय';
      if (raw.includes('alkal')) return 'क्षारीय';
      if (raw.includes('neutral')) return 'सामान्य (तटस्थ)';
      return ratingStr || 'संतुलित';
    }
    return ratingStr || 'Optimal';
  };

  const phLabel = translateRating(analysis.ratings.ph.label);
  const nLabel = translateRating(analysis.ratings.nitrogen.label);
  const pLabel = translateRating(analysis.ratings.phosphorus.label);
  const kLabel = translateRating(analysis.ratings.potassium.label);
  const ocLabel = translateRating(analysis.ratings.organicCarbon.label);
  const znLabel = translateRating(analysis.ratings.zinc.label);

  if (lang === 'te') {
    const localizeDefTe = (d) => {
      if (d.key === 'nitrogen') return '• నత్రజని (N): తక్కువ (<280 kg/ha)';
      if (d.key === 'phosphorus') return '• భాస్వరం (P): తక్కువ (<11 kg/ha)';
      if (d.key === 'potassium') return '• పొటాష్ (K): తక్కువ (<135 kg/ha)';
      if (d.key === 'zinc') return '• జింక్ (Zn): లోపం (<0.60 ppm)';
      if (d.key === 'organicCarbon') return '• సేంద్రీయ కర్బనం (OC): తక్కువ (<0.50%)';
      if (d.key === 'sulphur') return '• గంధకం / సల్ఫర్ (S): తక్కువ (<10 ppm)';
      if (d.key === 'ph') return `• నేల pH: ${translateRating(d.status)}`;
      return `• ${d.name}: ${d.status}`;
    };

    const topDefs = defs.length > 0
      ? defs.map(localizeDefTe).join('\n')
      : '• ప్రధాన లోపాలు లేవు (పోషకాలు సమతుల్యంగా ఉన్నాయి)';

    const cropList = crops.map(c => `• ${c.localTe || c.crop} (${c.suitability}% అనుకూలత)`).join('\n');
    const pName = plan.phosphorusSource.fertilizer.includes('SSP') ? 'SSP' : 'DAP';

    return `🌾 *కృషిసాథి - నేల ఆరోగ్య నివేదిక*
👤 రైతు: ${farmerName} | గ్రామం: ${village}
📅 తేదీ: ${reportDate}
🏆 నేల ఆరోగ్య స్కోర్: ${healthScore}/100

📊 *పోషకాల స్థాయిలు:*
• pH: ${vals.ph ?? 'N/A'} (${phLabel})
• నత్రజని (N): ${vals.n ?? 'N/A'} kg/ha (${nLabel})
• భాస్వరం (P): ${vals.p ?? 'N/A'} kg/ha (${pLabel})
• పొటాష్ (K): ${vals.k ?? 'N/A'} kg/ha (${kLabel})
• సేంద్రీయ కర్బనం (OC): ${vals.oc ?? 'N/A'}% (${ocLabel})
• జింక్ (Zn): ${vals.zn ?? 'N/A'} ppm (${znLabel})

⚠️ *ప్రధాన లోపాలు:*
${topDefs}

📦 *ఎకరాకు సిఫార్సు చేసిన ఎరువులు (బస్తాలు):*
• యూరియా: ~${plan.urea.bagsPerAcre} బస్తాలు (45kg)
• ${pName}: ~${plan.phosphorusSource.bagsPerAcre} బస్తాలు (50kg)
• పొటాష్ (MOP): ~${plan.mop.bagsPerAcre} బస్తాలు (50kg)
${plan.zinc ? `• జింక్ సల్ఫేట్: 10 kg/ఎకరాకు (DAP తో కలపవద్దు)\n` : ''}
🌱 *అనుకూలమైన పంటలు:*
${cropList}

ℹ️ Ratings follow ICAR Soil Health Card standards. (ICAR ప్రమాణాల ఆధారంగా రూపొందించబడింది)`;
  }

  if (lang === 'hi') {
    const localizeDefHi = (d) => {
      if (d.key === 'nitrogen') return '• नाइट्रोजन (N): कम (<280 kg/ha)';
      if (d.key === 'phosphorus') return '• फास्फोरस (P): कम (<11 kg/ha)';
      if (d.key === 'potassium') return '• पोटाश (K): कम (<135 kg/ha)';
      if (d.key === 'zinc') return '• जिंक (Zn): कमी (<0.60 ppm)';
      if (d.key === 'organicCarbon') return '• जैविक कार्बन (OC): कम (<0.50%)';
      if (d.key === 'sulphur') return '• सल्फर (S): कम (<10 ppm)';
      if (d.key === 'ph') return `• मिट्टी pH: ${translateRating(d.status)}`;
      return `• ${d.name}: ${d.status}`;
    };

    const topDefs = defs.length > 0
      ? defs.map(localizeDefHi).join('\n')
      : '• कोई गंभीर कमी नहीं (पोषक तत्व संतुलित हैं)';

    const cropList = crops.map(c => `• ${c.localHi || c.crop} (${c.suitability}% उपयुक्तता)`).join('\n');
    const pName = plan.phosphorusSource.fertilizer.includes('SSP') ? 'SSP' : 'DAP';

    return `🌾 *कृषिशाथी - मृदा स्वास्थ्य कार्ड रिपोर्ट*
👤 किसान: ${farmerName} | गांव: ${village}
📅 दिनांक: ${reportDate}
🏆 मृदा स्वास्थ्य स्कोर: ${healthScore}/100

📊 *पोषक तत्व स्तर:*
• pH: ${vals.ph ?? 'N/A'} (${phLabel})
• नाइट्रोजन (N): ${vals.n ?? 'N/A'} kg/ha (${nLabel})
• फास्फोरस (P): ${vals.p ?? 'N/A'} kg/ha (${pLabel})
• पोटाश (K): ${vals.k ?? 'N/A'} kg/ha (${kLabel})
• जैविक कार्बन (OC): ${vals.oc ?? 'N/A'}% (${ocLabel})
• जिंक (Zn): ${vals.zn ?? 'N/A'} ppm (${znLabel})

⚠️ *मुख्य कमियां:*
${topDefs}

📦 *प्रति एकड़ अनुशंसित उर्वरक (बोरी):*
• नीम यूरिया: ~${plan.urea.bagsPerAcre} बोरी (45kg)
• ${pName}: ~${plan.phosphorusSource.bagsPerAcre} बोरी (50kg)
• पोटाश (MOP): ~${plan.mop.bagsPerAcre} बोरी (50kg)
${plan.zinc ? `• जिंक सल्फेट: 10 kg/एकड़ (डीएपी के साथ न मिलाएं)\n` : ''}
🌱 *अनुशंसित फसलें:*
${cropList}

ℹ️ Ratings follow ICAR Soil Health Card standards. (ICAR मानकों के अनुसार)`;
  }

  // English default
  const topDefs = defs.length > 0
    ? defs.map(d => `• ${d.name}: ${d.status}`).join('\n')
    : '• No severe deficiencies (Nutrient profile is balanced)';

  const cropList = crops.map(c => `• ${c.crop} (${c.suitability}% match)`).join('\n');
  const pName = plan.phosphorusSource.fertilizer.includes('SSP') ? 'SSP' : 'DAP';

  return `🌾 *KrishiSaathi - Soil Health Card Report*
👤 Farmer: ${farmerName} | Village: ${village}
📅 Date: ${reportDate}
🏆 Soil Health Score: ${healthScore}/100

📊 *Nutrient Levels:*
• pH: ${vals.ph ?? 'N/A'} (${phLabel})
• Nitrogen (N): ${vals.n ?? 'N/A'} kg/ha (${nLabel})
• Phosphorus (P): ${vals.p ?? 'N/A'} kg/ha (${pLabel})
• Potassium (K): ${vals.k ?? 'N/A'} kg/ha (${kLabel})
• Organic Carbon (OC): ${vals.oc ?? 'N/A'}% (${ocLabel})
• Zinc (Zn): ${vals.zn ?? 'N/A'} ppm (${znLabel})

⚠️ *Top Deficiencies:*
${topDefs}

📦 *Recommended Fertilizers per Acre (Bags):*
• Neem Urea: ~${plan.urea.bagsPerAcre} Bags (45kg)
• ${pName}: ~${plan.phosphorusSource.bagsPerAcre} Bags (50kg)
• Potash (MOP): ~${plan.mop.bagsPerAcre} Bags (50kg)
${plan.zinc ? `• Zinc Sulphate (21%): 10 kg/acre (DO NOT mix with DAP)\n` : ''}
🌱 *Recommended Crops:*
${cropList}

ℹ️ Ratings follow ICAR Soil Health Card standards.`;
}
