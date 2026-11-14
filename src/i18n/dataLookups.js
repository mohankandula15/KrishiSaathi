// Lookup maps and helpers keyed by stable codes for data-driven entities
// Ensures no dynamic UI entity displays untranslated English

/**
 * Normalizes a string to a simple alphanumeric lowercase key
 */
function toCode(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Localized rating labels: Low, Medium, High, Optimal, Deficient, Sufficient, etc.
 */
export function getTranslatedRating(rating, t) {
  if (!rating) return '';
  const code = toCode(rating);
  
  if (code.includes('low') || code.includes('poor')) return t('ratings.low', 'Low');
  if (code.includes('medium') || code.includes('moderat')) return t('ratings.medium', 'Medium');
  if (code.includes('high') || code.includes('abundant') || code.includes('rich')) return t('ratings.high', 'High');
  if (code.includes('optimal')) return t('ratings.optimal', 'Optimal');
  if (code.includes('normal') || code.includes('nonsaline')) return t('ratings.normal', 'Normal');
  if (code.includes('deficient')) return t('ratings.deficient', 'Deficient');
  if (code.includes('sufficient') || code.includes('adequate')) return t('ratings.sufficient', 'Sufficient');
  if (code.includes('acidic')) return t('ratings.acidic', 'Acidic');
  if (code.includes('neutral')) return t('ratings.neutral', 'Neutral');
  if (code.includes('alkaline')) return t('ratings.alkaline', 'Alkaline');
  if (code.includes('critical') || code.includes('saline')) return t('ratings.critical', 'Critical (Saline)');

  return t(`ratings.${code}`, rating);
}

/**
 * Localized nutrient names
 */
export function getTranslatedNutrientName(keyOrName, t) {
  if (!keyOrName) return '';
  const code = toCode(keyOrName);

  if (code.startsWith('n') || code.includes('nitrogen')) return t('nutrients.nitrogen', 'Nitrogen (N)');
  if (code.startsWith('p') || code.includes('phosphorus')) return t('nutrients.phosphorus', 'Phosphorus (P)');
  if (code.startsWith('k') || code.includes('potass') || code.includes('potash')) return t('nutrients.potassium', 'Potassium (K)');
  if (code.includes('ph')) return t('nutrients.ph', 'Soil Reaction (pH)');
  if (code.includes('organiccarbon') || code === 'oc') return t('nutrients.organicCarbon', 'Organic Carbon (OC)');
  if (code.includes('ec') || code.includes('conduct')) return t('nutrients.ec', 'Electrical Conductivity (EC)');
  if (code.includes('zinc') || code === 'zn') return t('nutrients.zinc', 'Zinc (Zn)');
  if (code.includes('sulphur') || code === 's') return t('nutrients.sulphur', 'Sulphur (S)');
  if (code.includes('iron') || code === 'fe') return t('nutrients.iron', 'Iron (Fe)');
  if (code.includes('copper') || code === 'cu') return t('nutrients.copper', 'Copper (Cu)');
  if (code.includes('manganese') || code === 'mn') return t('nutrients.manganese', 'Manganese (Mn)');
  if (code.includes('boron') || code === 'b') return t('nutrients.boron', 'Boron (B)');

  return t(`nutrients.${code}`, keyOrName);
}

/**
 * Localized soil types
 */
export function getTranslatedSoilType(typeStr, t) {
  if (!typeStr) return '';
  const code = toCode(typeStr);

  if (code.includes('alluvial') && (code.includes('sand') || code.includes('loam'))) {
    return t('data.soilTypes.alluvialSandyLoam', 'Alluvial Sandy Loam');
  }
  if (code.includes('alluvial')) {
    return t('data.soilTypes.alluvialSoil', 'Alluvial Soil');
  }
  if (code.includes('black') || code.includes('vertisol')) {
    return t('data.soilTypes.blackClaySoil', 'Black Clay Soil (Vertisol)');
  }
  if (code.includes('red')) {
    return t('data.soilTypes.redSandyLoam', 'Red Sandy Loam');
  }
  if (code.includes('coastal')) {
    return t('data.soilTypes.coastalAlluvial', 'Coastal Alluvial Soil');
  }
  if (code.includes('clay') && code.includes('loam')) {
    return t('data.soilTypes.clayLoam', 'Clay Loam');
  }

  return t(`data.soilTypes.${code}`, typeStr);
}

/**
 * Localized crop names
 */
export function getTranslatedCropName(cropStr, t) {
  if (!cropStr) return '';
  const code = toCode(cropStr);

  if (code.includes('paddy') || code.includes('rice') || code.includes('వరి') || code.includes('धान')) {
    return t('data.crops.paddy', 'Paddy / Rice');
  }
  if (code.includes('wheat') || code.includes('गेहूं') || code.includes('గోధుమ')) {
    return t('data.crops.wheat', 'Wheat');
  }
  if (code.includes('cotton') || code.includes('కపాస్') || code.includes('ప్రత్తి') || code.includes('कपास')) {
    return t('data.crops.cotton', 'Cotton');
  }
  if (code.includes('groundnut') || code.includes('peanut') || code.includes('వేరుశనగ') || code.includes('मूंगफली')) {
    return t('data.crops.groundnut', 'Groundnut');
  }
  if (code.includes('chilli') || code.includes('chili') || code.includes('మిరప') || code.includes('मिर्च')) {
    return t('data.crops.chilli', 'Chilli');
  }
  if (code.includes('maize') || code.includes('corn') || code.includes('మొక్కజొన్న') || code.includes('मक्का')) {
    return t('data.crops.maize', 'Maize');
  }
  if (code.includes('chickpea') || code.includes('gram') || code.includes('శనగ') || code.includes('चना')) {
    return t('data.crops.chickpea', 'Chickpea / Bengal Gram');
  }
  if (code.includes('redgram') || code.includes('pigeonpea') || code.includes('కందులు') || code.includes('अरहर')) {
    return t('data.crops.redgram', 'Red Gram / Pigeonpea');
  }
  if (code.includes('mustard') || code.includes('ఆవాలు') || code.includes('सरसों')) {
    return t('data.crops.mustard', 'Mustard');
  }
  if (code.includes('sugarcane') || code.includes('చెరకు') || code.includes('गन्ना')) {
    return t('data.crops.sugarcane', 'Sugarcane');
  }
  if (code.includes('soybean') || code.includes('soya')) {
    return t('data.crops.soybean', 'Soybean');
  }
  if (code.includes('sorghum') || code.includes('jowar') || code.includes('జొన్న') || code.includes('ज्वार')) {
    return t('data.crops.sorghum', 'Sorghum / Jowar');
  }

  return t(`data.crops.${code}`, cropStr);
}

/**
 * Localized growing seasons
 */
export function getTranslatedSeason(seasonStr, t) {
  if (!seasonStr) return '';
  const code = toCode(seasonStr);

  if (code.includes('kharif')) return t('data.seasons.kharif', 'Kharif (Monsoon)');
  if (code.includes('rabi')) return t('data.seasons.rabi', 'Rabi (Winter)');
  if (code.includes('zaid') || code.includes('summer')) return t('data.seasons.zaid', 'Summer / Zaid');
  if (code.includes('annual')) return t('data.seasons.annual', 'Annual');
  if (code.includes('all')) return t('data.seasons.all', 'All Seasons');

  return t(`data.seasons.${code}`, seasonStr);
}

/**
 * Localized fertilizer names
 */
export function getTranslatedFertilizer(fertStr, t) {
  if (!fertStr) return '';
  const code = toCode(fertStr);

  if (code.includes('urea')) return t('data.fertilizers.urea', 'Neem Coated Urea (46% N)');
  if (code.includes('dap') || code.includes('diammonium')) return t('data.fertilizers.dap', 'Di-Ammonium Phosphate (DAP 18-46-0)');
  if (code.includes('mop') || code.includes('potash')) return t('data.fertilizers.mop', 'Muriate of Potash (MOP 60% K2O)');
  if (code.includes('ssp') || code.includes('superphosphate')) return t('data.fertilizers.ssp', 'Single Super Phosphate (SSP 16% P2O5)');
  if (code.includes('zinc')) return t('data.fertilizers.zincSulphate', 'Zinc Sulphate (21%)');
  if (code.includes('fym') || code.includes('manure') || code.includes('compost')) return t('data.fertilizers.fym', 'Farm Yard Manure (FYM)');

  return t(`data.fertilizers.${code}`, fertStr);
}

/**
 * Formats the summary line on SoilAnalysisPage & Dashboard
 * Example: "Neutral Soil • Low Nitrogen • High Potassium"
 */
export function getSummaryLine(report, t) {
  if (!report) return '';
  const phRating = getTranslatedRating(report.ph?.rating || 'Neutral', t);
  const nRating = getTranslatedRating(report.nutrients?.nitrogen?.rating || 'Low', t);
  const kRating = getTranslatedRating(report.nutrients?.potassium?.rating || 'High', t);

  const soilWord = t('common.soil', 'Soil');
  const nitrogenShort = t('nutrients.nitrogenShort', 'Nitrogen');
  const potassiumShort = t('nutrients.potassiumShort', 'Potassium');

  return `${phRating} ${soilWord} • ${nRating} ${nitrogenShort} • ${kRating} ${potassiumShort}`;
}

/**
 * Checks if a string looks like a raw UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)
 */
export function isUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

/**
 * Gets a human-readable name/number for a soil health card.
 * Never outputs a raw UUID.
 */
export function getCardDisplayName(report, t) {
  if (!report) return t('common.card', 'Card');

  // Preloaded benchmark demo cards
  if (report.id === 'SHC-PB-2025-0891') {
    return t('data.demoReports.punjab.title', 'Punjab - Alluvial Soil Card');
  }
  if (report.id === 'SHC-MH-2025-0412') {
    return t('data.demoReports.maharashtra.title', 'Maharashtra - Black Soil Card');
  }
  if (report.id === 'SHC-AP-2025-0104') {
    return t('data.demoReports.guntur.title', 'Guntur - Red Soil Card');
  }

  // If report has title and title is not a UUID
  if (report.title && !isUUID(report.title)) {
    return report.title;
  }

  // If report has cardNumber
  if (report.cardNumber && !isUUID(report.cardNumber)) {
    return `${t('common.card', 'Card')} • ${report.cardNumber}`;
  }

  // If report has farmer or village
  if (report.village && !isUUID(report.village)) {
    return `${report.village} ${t('common.card', 'Card')}`;
  }

  // If id is not a UUID, return it
  if (report.id && !isUUID(report.id)) {
    return `${t('common.card', 'Card')} • ${report.id}`;
  }

  // Fallback for UUID: truncate cleanly to short ID
  const shortId = report.id ? report.id.slice(0, 6).toUpperCase() : '01';
  return `${t('common.card', 'Card')} #${shortId}`;
}

/**
 * Translates benchmark demo cards shown in SoilUploadModal & sample cards
 */
export function getDemoCardMeta(reportOrId, t) {
  const id = typeof reportOrId === 'string' ? reportOrId : reportOrId?.id;
  if (id === 'SHC-PB-2025-0891') {
    return {
      title: t('data.demoReports.punjab.title', '🌾 Punjab - Alluvial Soil Card'),
      cropBadge: t('data.demoReports.punjab.cropBadge', 'Wheat/Paddy'),
      description: t('data.demoReports.punjab.description', 'Low Nitrogen (185), High Potash (295), Low Zinc (0.45)'),
      location: t('data.demoReports.punjab.location', 'Kila Raipur, Ludhiana, Punjab'),
      labName: t('data.demoReports.punjab.labName', 'District Soil Testing Laboratory, PAU Campus, Ludhiana')
    };
  }
  if (id === 'SHC-MH-2025-0412') {
    return {
      title: t('data.demoReports.maharashtra.title', '🌱 Maharashtra - Black Soil Card'),
      cropBadge: t('data.demoReports.maharashtra.cropBadge', 'Cotton/Soybean'),
      description: t('data.demoReports.maharashtra.description', 'Alkaline (pH 8.1), Low P (14.2), High K (310)'),
      location: t('data.demoReports.maharashtra.location', 'Baramati, Pune, Maharashtra'),
      labName: t('data.demoReports.maharashtra.labName', 'Krishi Vigyan Kendra Soil Lab, Baramati')
    };
  }
  return {
    title: t('data.demoReports.guntur.title', '🌶️ Andhra Pradesh - Red Soil Card'),
    cropBadge: t('data.demoReports.guntur.cropBadge', 'Chilli/Cotton'),
    description: t('data.demoReports.guntur.description', 'Medium N (210), High P (32), Moderate K (240)'),
    location: t('data.demoReports.guntur.location', 'Tadikonda, Guntur, Andhra Pradesh'),
    labName: t('data.demoReports.guntur.labName', 'Regional Agricultural Research Station (RARS) Lam, Guntur')
  };
}
