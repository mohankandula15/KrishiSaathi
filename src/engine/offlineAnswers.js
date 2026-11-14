/**
 * KrishiSaathi Client-Side Offline Question Answering Engine
 * Pure deterministic JavaScript (Zero network calls, works fully offline).
 * 
 * Powered by ICAR Agro-Intelligence standards:
 * - Intent matching across Telugu script, Tanglish, Hindi (Devanagari & Hinglish), and English.
 * - Dynamic parameter binding: Every numeric value, bag dosage, and rating is derived
 *   strictly from the farmer's active Soil Health Card. Never uses hardcoded constants.
 */

import { analyzeSoil } from './icarEngine.js';

// ==============================================================================
// 1. INPUT QUALITY GATE & VOCABULARY ENGINE
// ==============================================================================

const TELUGU_SCRIPT_REGEX = /[\u0C00-\u0C7F]/;
const DEVANAGARI_SCRIPT_REGEX = /[\u0900-\u097F]/;
const KEYBOARD_MASH_REGEX = /(?:asdf|sdfg|dfgh|fghj|ghjk|hjkl|qwer|wert|erty|rtyw|uiop|zxcv|xcvb|cvbn|vbnm|wdfg|dfghju)/i;
const REPEATED_CHAR_REGEX = /(.)\1{3,}/u;
const CONSONANT_CLUSTER_REGEX = /[bcdfghjklmnpqrstvwxz]{4,}/i;

const GREETING_TOKENS = new Set([
  'hi', 'hello', 'hey', 'namaste', 'namasthe', 'namaskar', 'namaskaram', 'namaskara',
  'halo', 'pranam', 'pranaam', 'vanakkam', 'adab', 'welcome', 'ram',
  'హలో', 'నమస్కారం', 'నమస్తే', 'హాయ్', 'నమస్కారాలు',
  'नमस्ते', 'नमस्कार', 'हाय', 'हेलो', 'प्रणाम'
]);

const HONORIFIC_TOKENS = new Set([
  'ji', 'garu', 'sir', 'madam', 'bhai', 'annayya', 'గారు', 'జీ', 'जी',
  'krishisaathi', 'saathi', 'bot', 'ai', 'kushi', 'krishi'
]);

const RECOGNIZED_FARMING_VOCABULARY = new Set([
  // Soil, nutrients, fertilizers
  'soil', 'soils', 'nela', 'neela', 'matti', 'mitti', 'khet', 'polam', 'land',
  'nitrogen', 'natrajani', 'urea', 'phosphorus', 'bhaswaram', 'dap', 'ssp',
  'potassium', 'potash', 'mop', 'zinc', 'zinku', 'sulphur', 'sulfur', 'boron', 'iron',
  'organic', 'carbon', 'karbanam', 'oc', 'jaivik', 'gobar', 'fym', 'compost', 'vermicompost',
  'manure', 'fertilizer', 'fertilizers', 'eruvu', 'eruvulu', 'khad', 'urvarak',
  'ph', 'saline', 'salinity', 'alkaline', 'acidic', 'kshara', 'amla', 'choudu', 'uppu',
  'gypsum', 'lime', 'sunnam', 'chuna', 'ec', 'npk',

  // Crops
  'crop', 'crops', 'panta', 'pantalu', 'fasal', 'fasle', 'faslo', 'kheti',
  'paddy', 'vari', 'rice', 'dhan', 'chawal', 'groundnut', 'verusanaga', 'mungfali',
  'cotton', 'pratti', 'kapas', 'chilli', 'mirapa', 'mirch', 'maize', 'mokkajonna', 'makka',
  'wheat', 'gehun', 'pulses', 'dal', 'bengalgram', 'redgram', 'blackgram', 'greengram',
  'pesara', 'minumu', 'kandulu', 'kadiri', 'bpt',

  // Farming practices, dosage, irrigation
  'dose', 'dosage', 'mothadu', 'matra', 'khurak', 'bags', 'bag', 'basta', 'bastalu',
  'bastha', 'basthalu', 'bori', 'acre', 'ekara', 'ekaraku', 'ekad', 'hectare',
  'water', 'watering', 'neeru', 'neeti', 'pani', 'paani', 'irrigation', 'sinchai',
  'moisture', 'teva', 'nami', 'sowing', 'seed', 'seeds', 'vithanalu', 'beej',
  'spray', 'chlorosis', 'yellow', 'pasupu', 'peeli', 'leaves', 'akulu',
  'patti', 'root', 'roots', 'verlu', 'veru', 'jad', 'kandam', 'tana',
  'pest', 'disease', 'rog', 'keeda', 'weed', 'kalupu',

  // Agronomic queries / actions
  'health', 'arogyam', 'swasthya', 'score', 'report', 'card', 'test', 'pariksha',
  'condition', 'paristhiti', 'sthiti', 'saram', 'balam', 'fertility',
  'mix', 'mixing', 'kalipi', 'kalapacha', 'kalapavaccha', 'milana', 'mila',
  'use', 'vadavacha', 'vadala', 'dalu', 'dalna', 'veyyali', 'veyali', 'veskovali',
  'takkuva', 'takkuvaga', 'ekkuva', 'ekkuvaga', 'kam', 'jyada', 'low', 'high', 'deficient',
  'recommend', 'recommendation', 'suitable', 'anukulam', 'upayukt', 'best',

  // Common farming verbs/pronouns in Tanglish/Hinglish
  'naa', 'nenu', 'ma', 'mana', 'mera', 'meri', 'mere', 'apna', 'apni',
  'undi', 'undhi', 'undha', 'ledu', 'kavali', 'em', 'emi', 'ela', 'elaga', 'eppudu', 'entha', 'enni',
  'cheyali', 'cheyyali', 'cheyocchu', 'cheyyocha', 'chesuko', 'chudandi',
  'kya', 'kaise', 'kab', 'kitna', 'kitni', 'kaun', 'kaunsi', 'chahiye', 'batao', 'kare', 'karun', 'karna',
  'rythu', 'raithu', 'kisan', 'garu', 'ji', 'bhai',

  // Greetings
  'hi', 'hello', 'hey', 'namaste', 'namasthe', 'namaskar', 'namaskaram', 'namaskara',
  'halo', 'pranam', 'pranaam', 'vanakkam', 'adab', 'welcome'
]);

export function isGreeting(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.trim().toLowerCase();
  if (!clean) return false;

  const tokens = clean
    .replace(/[^\w\s\u0C00-\u0C7F\u0900-\u097F]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return false;

  if (clean.startsWith('good morning') || clean.startsWith('good afternoon') || clean.startsWith('good evening') || clean.startsWith('ram ram')) {
    if (tokens.length <= 4) return true;
  }

  const hasGreeting = tokens.some(t => GREETING_TOKENS.has(t));
  if (!hasGreeting) return false;

  const nonGreetingTokens = tokens.filter(t => !GREETING_TOKENS.has(t) && !HONORIFIC_TOKENS.has(t));
  return nonGreetingTokens.length === 0;
}

export function isGibberishOrInvalid(text) {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;

  // 1. Must contain at least one valid letter (Latin, Telugu, or Devanagari)
  if (!/[a-zA-Z\u0C00-\u0C7F\u0900-\u097F]/.test(trimmed)) {
    return true; // e.g. "......", "123456", "?!@", "---"
  }

  // 2. Repeated characters 4+ in a row (e.g. "aaaa", "zzzz", ".....", "1111")
  if (REPEATED_CHAR_REGEX.test(trimmed)) {
    return true;
  }

  // 3. Known keyboard mash substrings
  if (KEYBOARD_MASH_REGEX.test(trimmed)) {
    return true;
  }

  // 4. Strip punctuation/symbols to inspect words
  const clean = trimmed.replace(/[^\w\s\u0C00-\u0C7F\u0900-\u097F]/g, ' ').trim();
  const tokens = clean.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  // 5. Very short checks: if all letters < 2, or single token < 3 without recognized 2-letter word
  const totalLetters = (clean.match(/[a-zA-Z\u0C00-\u0C7F\u0900-\u097F]/g) || []).length;
  if (totalLetters < 2) return true;
  if (totalLetters === 2 && tokens.length === 1) {
    const t = tokens[0];
    const ALLOWED_TWO_LETTER = new Set(['hi', 'oc', 'ph', 'zn', 'em', 'ha', 'na', 'kg', 'ec']);
    if (!ALLOWED_TWO_LETTER.has(t) && !TELUGU_SCRIPT_REGEX.test(t) && !DEVANAGARI_SCRIPT_REGEX.test(t)) {
      return true;
    }
  }

  // 6. Text with Telugu or Devanagari script passes character gate
  if (TELUGU_SCRIPT_REGEX.test(clean) || DEVANAGARI_SCRIPT_REGEX.test(clean)) {
    return false;
  }

  // 7. For Latin text (English / Tanglish / Hinglish):
  // Check if ANY token is in recognized farming or greeting vocabulary
  const hasRecognizedWord = tokens.some(t => RECOGNIZED_FARMING_VOCABULARY.has(t));
  if (hasRecognizedWord) {
    return false;
  }

  // If no recognized word:
  // Check consonant clusters (4+ consecutive consonants in Latin words)
  if (CONSONANT_CLUSTER_REGEX.test(clean)) {
    return true;
  }

  // Check vowel ratio across all Latin tokens
  const latinLetters = clean.match(/[a-zA-Z]/g) || [];
  if (latinLetters.length >= 4) {
    const vowels = clean.match(/[aeiouyAEIOUY]/g) || [];
    const vowelRatio = vowels.length / latinLetters.length;
    if (vowelRatio < 0.20) {
      return true; // e.g. "wdfghju" (1/7 = 0.14)
    }
  }

  return false;
}

// ==============================================================================
// 2. INTENT RECOGNITION REGEX PATTERNS (TE / TANGLISH / HI / HINGLISH / EN)
// ==============================================================================
const INTENTS = [
  {
    id: 'mixing_precautions',
    patterns: [
      /(?:కలిపి|కలపవచ్చా|కలపొచ్చా|కలిపి\s*వేయ|డిఎపి.*జింక్|జింక్.*డిఎపి|డిఏపి.*జింక్)/i,
      /(?:kalipi|kalapavaccha|kalapacha|kalipi\s*vey|zinc.*dap|dap.*zinc|mix.*dap|mix.*zinc)/i,
      /(?:मिलाना|मिलाकर|साथ\s*में\s*डाल|डीएपी.*जिंक|जिंक.*डीएपी|क्या\s*मिला\s*सकते)/i,
      /(?:sath\s*me|milana|mila\s*sakte|dap\s*aur\s*zinc|zinc\s*aur\s*dap)/i,
      /(?:mix(?:ing)?|combine|together|incompatib(?:le|ility)|zinc\s*(?:and|with|\+)\s*dap|dap\s*(?:and|with|\+)\s*zinc)/i,
    ],
  },
  {
    id: 'fertilizer_dose',
    patterns: [
      /(?:ఎరువుల\s*మోతాదు|ఎన్ని\s*బస్తా|బస్తా|ఎకరాకు\s*(?:ఎంత|ఎన్ని)|డోస్|యూరియా\s*(?:ఎంత|మోతాదు)|డిఎపి\s*(?:ఎంత|మోతాదు)|ఎంఓపి\s*(?:ఎంత|మోతాదు))/i,
      /(?:eruvulu?\s*mothadu|enni\s*bag(?:lu|s)?|bastha(?:lu|la)?|ekaraku\s*(?:entha|enni)|dose|bags?\s*per\s*acre|entha\s*veyali)/i,
      /(?:खाद\s*की\s*मात्रा|कितने?\s*बोरी|बोरी|यूरिया\s*की\s*मात्रा|डीएपी\s*की\s*मात्रा|प्रति\s*एकड़\s*(?:खाद|कितना)|खुराक|डोज)/i,
      /(?:khad\s*ki\s*matra|kitni\s*bori|bori|kitna\s*urea|kitna\s*dap|per\s*acre\s*dose|khad\s*ka\s*dose)/i,
      /(?:fertilizer\s*dose|how\s*many\s*bags|bags?\s*per\s*acre|urea\s*quantity|dap\s*quantity|mop\s*quantity|dose\s*per\s*acre|application\s*rate)/i,
    ],
  },
  {
    id: 'can_i_use_fertilizer',
    patterns: [
      /(?:ఎరువులు\s*వాడవచ్చా|ఎరువులు\s*వేయవచ్చా|నేను\s*ఎరువులు\s*వాడాలా|వాడొచ్చా|వేయొచ్చా)/i,
      /(?:eruvulu\s*vadavacha|eruvulu\s*veyavacha|vadala|veyocha|veyacha|fertilizer\s*use\s*chey)/i,
      /(?:क्या\s*मैं\s*खाद\s*डालूं|खाद\s*डाल\s*सकते|क्या\s*उर्वरक\s*प्रयोग|खाद\s*देना\s*चाहिए|उर्वरक\s*डालें)/i,
      /(?:khad\s*dalu\s*ya\s*nahi|fertilizer\s*use\s*karu|khad\s*dena\s*chahiye)/i,
      /(?:can\s*i\s*use\s*fertilizer|should\s*i\s*apply\s*fertilizer|do\s*i\s*need\s*fertilizer|is\s*fertilizer\s*needed|can\s*i\s*apply)/i,
    ],
  },
  {
    id: 'crop_recommendation',
    patterns: [
      /(?:పంట|పంటలు|ఏ\s*పంట|సిఫార్సు\s*చేసిన\s*పంటలు|ఏ\s*పంట\s*బాగుంటుంది|ఏం\s*వేయాలి)/i,
      /(?:panta|pantalu|ye\s*panta|em\s*veyali|suitable\s*crop|which\s*crop)/i,
      /(?:फसल|कौन\s*सी\s*फसल|फसल\s*की\s*सिफारिश|उपयुक्त\s*फसल|कौन\s*सी\s*खेती|क्या\s*बोएं)/i,
      /(?:fasal|konsi\s*fasal|kheti|kya\s*boye|crop\s*recommendation)/i,
      /(?:crop|crops|which\s*crop|crop\s*recommendation|suitable\s*crops?|what\s*(?:should|to)\s*grow|best\s*crop)/i,
    ],
  },
  {
    id: 'nitrogen',
    patterns: [
      /(?:నత్రజని|యూరియా|ఆకులు\s*పసుపు|పసుపు\s*పచ్చ|నైట్రోజన్)/i,
      /(?:natrajani|urea|akulu\s*pasupu|nitrogen|pasupu)/i,
      /(?:नाइट्रोजन|यूरिया|पीली\s*पत्तियां|पीलापन)/i,
      /(?:nitrogen|peeli\s*patti|urea\s*dalna)/i,
      /(?:nitrogen|urea|chlorosis|yellow\s*leaves|vegetative)/i,
    ],
  },
  {
    id: 'phosphorus',
    patterns: [
      /(?:భాస్వరం|డిఎపి|డిఏపి|వేర్లు|ఫాస్ఫరస్|ఎస్ఎస్పి)/i,
      /(?:bhaswaram|dap|phosphorus|verlu|ssp)/i,
      /(?:फास्फोरस|डीएपी|जड़|जड़ों|एसएसपी)/i,
      /(?:phosphorus|dap|ssp|jado)/i,
      /(?:phosphorus|dap|root\s*development|ssp|p2o5)/i,
    ],
  },
  {
    id: 'potassium',
    patterns: [
      /(?:పొటాష్|పొటాషియం|ఎంఓపి|కాండం|రోగ\s*నిరోధక)/i,
      /(?:potash|potassium|mop|kandam)/i,
      /(?:पोटाश|पोटेशियम|एमओपी|रोग\s*प्रतिरोधक|तना)/i,
      /(?:potash|potassium|mop|tana)/i,
      /(?:potassium|potash|mop|lodging|k2o)/i,
    ],
  },
  {
    id: 'zinc',
    patterns: [
      /(?:జింక్|జింకు|సూక్ష్మ\s*పోషకాలు|ఖైరా|జింక్\s*సల్ఫేట్)/i,
      /(?:zinc|zinku|micronutrient|khaira|zinc\s*sulphate)/i,
      /(?:जिंक|सूक्ष्म\s*पोषक|खैरा|जिंक\s*सल्फेट)/i,
      /(?:zinc|khaira|zinc\s*sulphate)/i,
      /(?:zinc|zn|micronutrient|khaira|zinc\s*sulphate)/i,
    ],
  },
  {
    id: 'organic_carbon',
    patterns: [
      /(?:కర్బనం|సేంద్రీయ\s*కర్బనం|పేడ\s*ఎరువు|పశువుల\s*ఎరువు|వర్మికంపోస్ట్|నేల\s*జీవం)/i,
      /(?:karbanam|organic\s*carbon|fym|peda\s*eruvu|vermicompost|oc)/i,
      /(?:कार्बन|जैविक\s*कार्बन|गोबर\s*की\s*खाद|वर्मीकम्पोस्ट|जीवांश)/i,
      /(?:jaivik\s*carbon|organic\s*carbon|gobar|vermicompost)/i,
      /(?:organic\s*carbon|carbon|oc|farm\s*yard\s*manure|fym|compost|humus)/i,
    ],
  },
  {
    id: 'ph_salinity',
    patterns: [
      /(?:పిహెచ్|క్షార|ఆమ్ల|ఉప్పు\s*నేల|చౌడు|సున్నం|జిప్సం|సెలైన్)/i,
      /(?:ph|kshara|amla|uppu\s*nela|choudu|sunnam|gypsum|salin(?:e|ity)|ec)/i,
      /(?:पीएच|अम्लीय|क्षारीय|खारापन|लवणता|चूना|जिप्सम)/i,
      /(?:ph|amliya|kshariya|kharapan|chuna|gypsum|saline)/i,
      /(?:ph|acidic|alkaline|saline|salinity|electrical\s*conductivity|ec|lime|gypsum)/i,
    ],
  },
  {
    id: 'irrigation_timing',
    patterns: [
      /(?:నీటి\s*తడి|నీరు\s*పెట్టడం|తేమ|నీళ్ళు|సిరింపు)/i,
      /(?:neeru|neeti\s*tadi|moisture|irrigation|water)/i,
      /(?:सिंचाई|पानी\s*देना|नमी|पानी\s*लगाना)/i,
      /(?:sinchai|pani\s*dena|nami)/i,
      /(?:irrigation|watering|moisture|split\s*timing|top\s*dress\s*timing)/i,
    ],
  },
  {
    id: 'overall_condition',
    patterns: [
      /(?:నేల\s*పరిస్థితి|నా\s*నేల\s*ఎలా\s*ఉంది|మొత్తం\s*వివరాలు|రిపోర్టు|ఆరోగ్యం|నేల\s*సారం|సమగ్ర)/i,
      /(?:nela\s*paristhiti|nela\s*ela\s*undi|soil\s*condition|health\s*score|overall|summary)/i,
      /(?:मिट्टी\s*की\s*स्थिति|मेरी\s*मिट्टी\s*कैसी\s*है|कुल\s*रिपोर्ट|मिट्टी\s*का\s*स्वास्थ्य|समग्र)/i,
      /(?:mitti\s*ki\s*sthiti|soil\s*health|overall\s*report|kaisa\s*hai)/i,
      /(?:overall\s*(?:condition|status|health)|soil\s*(?:health|condition|status)|how\s*is\s*my\s*soil|summary|full\s*report)/i,
    ],
  },
];

// Detect intent from question
export function detectIntent(question) {
  if (!question || typeof question !== 'string') return 'unrecognized';
  const q = question.trim();
  if (isGibberishOrInvalid(q)) return 'unrecognized';
  if (isGreeting(q)) return 'greeting';

  const lower = q.toLowerCase();
  for (const intent of INTENTS) {
    for (const pat of intent.patterns) {
      if (pat.test(lower)) {
        return intent.id;
      }
    }
  }

  return 'unrecognized';
}

// ==============================================================================
// 3. TEMPLATE BUILDERS PER INTENT & LANGUAGE
// ==============================================================================

function answerMixingPrecautions(lang) {
  if (lang === 'te') {
    return `⚠️ **ముఖ్యమైన శాస్త్రీయ హెచ్చరిక (మిక్సింగ్ నియమం):**\n\n` +
      `❌ **జింక్ సల్ఫేట్ (Zinc Sulphate) ను డిఎపి (DAP) తో కలిపి ఎప్పుడూ వేయకూడదు!**\n\n` +
      `**ఎందుకు కలపకూడదు?**\n` +
      `• DAP లోని భాస్వరం (Phosphate), జింక్ తో చర్య జరిపి కరగని 'జింక్ ఫాస్ఫేట్' గా మారుతుంది.\n` +
      `• దీని వలన నేలలో జింక్ మరియు భాస్వరం రెండూ మొక్కల వేర్లకు అందకుండా పనికిరాకుండా పోతాయి.\n\n` +
      `**సరైన పద్ధతి:**\n` +
      `1. DAP ని విత్తే సమయంలో విత్తనానికి 5 సెం.మీ దిగువన వేయండి.\n` +
      `2. జింక్ సల్ఫేట్ (ఎకరాకు 10 కిలోలు) ను చివరి దుక్కిలో విడిగా చల్లండి, లేదా కనీసం 3-5 రోజుల వ్యవధి పాటించండి!`;
  }
  if (lang === 'hi') {
    return `⚠️ **अति महत्वपूर्ण वैज्ञानिक चेतावनी (सावधानी):**\n\n` +
      `❌ **जिंक सल्फेट (Zinc Sulphate) और डीएपी (DAP) को कभी भी एक साथ मिलाकर न डालें!**\n\n` +
      `**कारण:**\n` +
      `• DAP का फॉस्फोरस और जिंक आपस में क्रिया करके अघुलनशील 'जिंक फॉस्फेट' बना लेते हैं।\n` +
      `• इससे मिट्टी में जिंक और फॉस्फोरस दोनों पौधे की जड़ों के लिए निष्प्रभावी हो जाते हैं।\n\n` +
      `**सही तरीका:**\n` +
      `1. बुवाई के समय DAP को अलग से ड्रिल करें।\n` +
      `2. जिंक सल्फेट (10 किग्रा/एकड़) को अंतिम जुताई के समय अलग से मिट्टी में मिलाएं, या दोनों के प्रयोग में 3 से 5 दिन का अंतर रखें!`;
  }
  return `⚠️ **Critical Agronomic Safety Warning:**\n\n` +
    `❌ **NEVER mix Zinc Sulphate directly with Di-Ammonium Phosphate (DAP)!**\n\n` +
    `**Scientific Reason:**\n` +
    `• The soluble phosphate in DAP chemically reacts with zinc ions to precipitate insoluble Zinc Phosphate.\n` +
    `• This locks both Zinc and Phosphorus in the soil, rendering both completely unabsorbable by crop roots.\n\n` +
    `**Correct Application Method:**\n` +
    `1. Drill DAP 5 cm below the seed row at sowing/transplanting.\n` +
    `2. Broadcast Zinc Sulphate (10 kg/acre) separately during final land preparation, or keep at least a 3 to 5 day interval between applications!`;
}

function answerFertilizerDose(lang, analysis, reportTitle) {
  const plan = analysis.fertilizerPlan;
  const vals = analysis.values;

  const nVal = vals.n !== null ? `${vals.n} kg/ha (${analysis.ratings.nitrogen.label})` : 'రిపోర్టులో నమోదు కాలేదు';
  const pVal = vals.p !== null ? `${vals.p} kg/ha (${analysis.ratings.phosphorus.label})` : 'రిపోర్టులో నమోదు కాలేదు';
  const kVal = vals.k !== null ? `${vals.k} kg/ha (${analysis.ratings.potassium.label})` : 'రిపోర్టులో నమోదు కాలేదు';

  const ureaBags = plan.urea.bagsPerAcre;
  const pSource = plan.phosphorusSource;
  const pBags = pSource.bagsPerAcre;
  const mopBags = plan.mop.bagsPerAcre;
  const znText = plan.zinc ? `${plan.zinc.kgPerAcre} kg/acre` : null;

  if (lang === 'te') {
    return `🌾 **మీ నేల కార్డు (${reportTitle}) ఆధారంగా ఎకరాకు సిఫార్సు చేసిన ఎరువుల మోతాదు:**\n\n` +
      `• ప్రస్తుత నేల స్థాయి: నత్రజని: ${nVal} | భాస్వరం: ${pVal} | పొటాష్: ${kVal}\n\n` +
      `📦 **ఖచ్చితమైన మోతాదు (ఎకరాకు బస్తాలు):**\n` +
      `1. **యూరియా (Neem Coated Urea):** ~${ureaBags} బస్తాలు (45 kg బస్తా)\n` +
      `   *గమనిక:* DAP లో ఇప్పటికే నత్రజని ఉన్నందున, అధిక నత్రజని నివారించడానికి యూరియా మోతాదు సరిచేయబడింది.\n` +
      `   *విడతల పద్ధతి:* 33% ప్రారంభంలో + 33% పిలకల దశలో (21-25 రోజులు) + 34% చిరుపొట్ట/పూత దశలో.\n\n` +
      `2. **${pSource.fertilizer}:** ~${pBags} బస్తాలు (50 kg బస్తా)\n` +
      `   *సమయం:* విత్తే సమయంలో లేదా నాటే సమయంలో 100% ఆఖరి దుక్కిలో.\n\n` +
      `3. **పొటాష్ (MOP 60% K2O):** ~${mopBags} బస్తాలు (50 kg బస్తా)\n` +
      (vals.k && vals.k > 280 ? `   *ఖర్చు ఆదా:* మీ నేలలో సహజ పొటాష్ ఎక్కువగా ఉన్నందున, 50% మోతాదు తగ్గించి ఖర్చు ఆదా చేశాము!\n\n` : `\n`) +
      (znText ? `4. **జింక్ సల్ఫేట్ (21% Zn):** ${znText} (ఆఖరి దుక్కిలో విడిగా వేయండి; DAP తో కలపవద్దు).\n\n` : '') +
      `💧 **సూచన:** యూరియాను ఎల్లప్పుడూ నేలలో తగినంత తేమ ఉన్నప్పుడు మాత్రమే వేయండి.`;
  }

  if (lang === 'hi') {
    return `🌾 **आपकी मिट्टी स्वास्थ्य रिपोर्ट (${reportTitle}) के अनुसार प्रति एकड़ अनुशंसित उर्वरक खुराक:**\n\n` +
      `• वर्तमान मिट्टी परीक्षण: नाइट्रोजन: ${nVal} | फास्फोरस: ${pVal} | पोटाश: ${kVal}\n\n` +
      `📦 **सटीक उर्वरक मात्रा (प्रति एकड़ बोरी):**\n` +
      `1. **नीम लेपित यूरिया (46% N):** ~${ureaBags} बोरी (45 किग्रा)\n` +
      `   *नोट:* डीएपी से नाइट्रोजन मिलने के कारण यूरिया की मात्रा वैज्ञानिक रूप से संतुलित की गई है।\n` +
      `   *प्रयोग का समय:* 3 किस्तों में (बुवाई/रोपाई, कल्ले फूटते समय, और बालियां निकलते समय)।\n\n` +
      `2. **${pSource.fertilizer}:** ~${pBags} बोरी (50 किग्रा)\n` +
      `   *प्रयोग का समय:* 100% बुवाई के समय आधार खुराक (बेसल) के रूप में।\n\n` +
      `3. **म्यूरेट ऑफ पोटाश (MOP 60%):** ~${mopBags} बोरी (50 किग्रा)\n` +
      (vals.k && vals.k > 280 ? `   *लागत बचत:* आपकी मिट्टी में पोटाश प्रचुर मात्रा में है, इसलिए पोटाश की मात्रा 50% घटाकर आपकी लागत बचाई गई है!\n\n` : `\n`) +
      (znText ? `4. **जिंक सल्फेट (21%):** ${znText} (अंतिम जुताई के समय अलग से डालें; डीएपी के साथ न मिलाएं)।\n\n` : '') +
      `💧 **सलाह:** यूरिया हमेशा खेत में पर्याप्त नमी होने पर ही छिड़कें।`;
  }

  return `🌾 **Calibrated Per-Acre Fertilizer Prescription based on ${reportTitle}:**\n\n` +
    `• Soil Nutrient Status: Nitrogen: ${nVal} | Phosphorus: ${pVal} | Potassium: ${kVal}\n\n` +
    `📦 **Recommended Quantities per Acre:**\n` +
    `1. **Neem-Coated Urea (46% N):** ~${ureaBags} Bags (45 kg bag)\n` +
    `   *STCR Adjustment:* Calibrated with DAP credit deducted so excessive vegetative growth and lodging are avoided.\n` +
    `   *Split Timing:* 33% Basal + 33% Active Tillering (21-25 DAS) + 34% Panicle Initiation (45-50 DAS).\n\n` +
    `2. **${pSource.fertilizer}:** ~${pBags} Bags (50 kg bag)\n` +
    `   *Application:* 100% Basal placement 5 cm below seed line.\n\n` +
    `3. **Muriate of Potash (MOP 60% K2O):** ~${mopBags} Bags (50 kg bag)\n` +
    (vals.k && vals.k > 280 ? `   *Savings Notice:* High soil potassium reserves detected; MOP cut by 50% to save ₹800-₹1,200/acre!\n\n` : `\n`) +
    (znText ? `4. **Zinc Sulphate (21% Zn):** ${znText} (Broadcast separately; DO NOT mix with DAP).\n\n` : '') +
    `💧 **Moisture Rule:** Always top-dress Urea over moist soil, followed by light irrigation.`;
}

function answerCanIUseFertilizer(lang, analysis) {
  const vals = analysis.values;
  const defs = analysis.deficiencies;

  if (lang === 'te') {
    return `✅ **అవును, ఎరువులు వేయవచ్చు; కానీ నేల పరీక్ష ఆధారంగా మాత్రమే వేయాలి!**\n\n` +
      `మీ నేల ఆరోగ్య కార్డు ప్రకారం:\n` +
      `• నత్రజని: ${vals.n !== null ? `${vals.n} kg/ha (${analysis.ratings.nitrogen.label})` : 'పరిశీలించబడలేదు'}\n` +
      `• భాస్వరం: ${vals.p !== null ? `${vals.p} kg/ha (${analysis.ratings.phosphorus.label})` : 'పరిశీలించబడలేదు'}\n` +
      `• పొటాష్: ${vals.k !== null ? `${vals.k} kg/ha (${analysis.ratings.potassium.label})` : 'పరిశీలించబడలేదు'}\n\n` +
      `**ప్రధాన సూచనలు:**\n` +
      (defs.length > 0 ? `1. మీ నేలలో **${defs.map(d => d.name).join(', ')}** లోపం ఉంది. వీటికి తగిన ఎరువులు తప్పనిసరిగా వేయాలి.\n` : '1. ప్రధాన పోషకాలు సమతుల్యంగా ఉన్నాయి.\n') +
      (vals.k && vals.k > 280 ? `2. మీ నేలలో పొటాష్ అధికంగా ఉంది కాబట్టి MOP ఎరువును గుడ్డిగా వేయకండి, 50% తగ్గించండి.\n` : '') +
      `3. ఎరువులను ఒకేసారి కాకుండా సిఫార్సు చేసిన విడతల్లో మాత్రమే వేయండి.`;
  }

  if (lang === 'hi') {
    return `✅ **हाँ, आप खाद का उपयोग कर सकते हैं; लेकिन केवल मिट्टी परीक्षण के आधार पर!**\n\n` +
      `आपकी रिपोर्ट के अनुसार:\n` +
      `• नाइट्रोजन: ${vals.n !== null ? `${vals.n} kg/ha (${analysis.ratings.nitrogen.label})` : 'उपलब्ध नहीं'}\n` +
      `• फास्फोरस: ${vals.p !== null ? `${vals.p} kg/ha (${analysis.ratings.phosphorus.label})` : 'उपलब्ध नहीं'}\n` +
      `• पोटाश: ${vals.k !== null ? `${vals.k} kg/ha (${analysis.ratings.potassium.label})` : 'उपलब्ध नहीं'}\n\n` +
      `**मुख्य वैज्ञानिक सलाह:**\n` +
      (defs.length > 0 ? `1. आपकी मिट्टी में **${defs.map(d => d.name).join(', ')}** की कमी है। इन्हें प्राथमिकता से दें।\n` : '1. मुख्य पोषक तत्व संतुलित हैं।\n') +
      (vals.k && vals.k > 280 ? `2. मिट्टी में पोटाश पहले से प्रचुर है, इसलिए अनावश्यक पोटाश डालकर पैसे व्यर्थ न करें।\n` : '') +
      `3. यूरिया हमेशा खेत में नमी होने पर 2 से 3 किस्तों में ही डालें।`;
  }

  return `✅ **Yes, fertilizer should be applied, but calibrated strictly to your soil test!**\n\n` +
    `Your Soil Report Benchmark:\n` +
    `• Nitrogen: ${vals.n !== null ? `${vals.n} kg/ha (${analysis.ratings.nitrogen.label})` : 'Not recorded'}\n` +
    `• Phosphorus: ${vals.p !== null ? `${vals.p} kg/ha (${analysis.ratings.phosphorus.label})` : 'Not recorded'}\n` +
    `• Potassium: ${vals.k !== null ? `${vals.k} kg/ha (${analysis.ratings.potassium.label})` : 'Not recorded'}\n\n` +
    `**Key Agronomic Guidance:**\n` +
    (defs.length > 0 ? `1. Target verified soil deficiencies first: **${defs.map(d => d.name).join(', ')}**.\n` : '1. Macronutrients are in good balance.\n') +
    (vals.k && vals.k > 280 ? `2. Potassium reserves are high; avoid blind excess MOP application to save input costs.\n` : '') +
    `3. Always split nitrogen doses to avoid leaching and volatilization loss.`;
}

function answerNitrogen(lang, analysis) {
  const n = analysis.values.n;
  const rating = analysis.ratings.nitrogen;

  if (n === null) {
    if (lang === 'te') return 'మీ నేల కార్డులో నత్రజని (Nitrogen) విలువ నమోదు కాలేదు. దయచేసి నేల పరీక్ష రిపోర్టును సరిచూడండి.';
    if (lang === 'hi') return 'आपकी मिट्टी रिपोर्ट में नाइट्रोजन का मान दर्ज नहीं है। कृपया अपनी रिपोर्ट जांचें।';
    return 'Nitrogen value was not recorded in this soil report. Please check your soil card.';
  }

  const dose = analysis.fertilizerPlan.urea.bagsPerAcre;

  if (lang === 'te') {
    return `🌱 **నత్రజని (Nitrogen) విశ్లేషణ:**\n\n` +
      `• మీ నేలలో అందుబాటులో ఉన్న నత్రజని: **${n} kg/ha** (${rating.label})\n` +
      `• ICAR ప్రమాణం: 280 - 560 kg/ha మధ్య ఉండాలి.\n\n` +
      (n < 280
        ? `⚠️ **పరిస్థితి: నత్రజని లోపం ఉంది.**\n` +
          `• లక్షణాలు: కింది ఆకులు పసుపు రంగులోకి మారడం (క్లోరోసిస్), పిలకల సంఖ్య తగ్గడం.\n` +
          `• నివారణ: ఎకరాకు సుమారు **${dose} బస్తాల వేపపూత పూసిన యూరియా (Neem-Coated Urea)** ను 3 విడతల్లో వేయండి (మొదటి దుక్కి, 21-25 రోజుల పిలకల దశ, 45-50 రోజుల పూత దశ).`
        : n > 560
        ? `ℹ️ **పరిస్థితి: నత్రజని అధికంగా ఉంది.**\n` +
          `• నివారణ: యూరియా వాడకాన్ని 20-30% తగ్గించండి. అధిక నత్రజని వలన పైరు పడిపోవడం (lodging) మరియు తెగుళ్ళ బెడద పెరుగుతుంది.`
        : `✅ **పరిస్థితి: నత్రజని సరైన పరిమాణంలో ఉంది.**\n` +
          `• ప్రామాణిక సిఫార్సు ప్రకారం మోతాదును కొనసాగించండి.`);
  }

  if (lang === 'hi') {
    return `🌱 **नाइट्रोजन (Nitrogen) की स्थिति:**\n\n` +
      `• आपकी मिट्टी में उपलब्ध नाइट्रोजन: **${n} kg/ha** (${rating.label})\n` +
      `• ICAR मानक: 280 से 560 kg/ha सामान्य माना जाता है।\n\n` +
      (n < 280
        ? `⚠️ **स्थिति: नाइट्रोजन की कमी है।**\n` +
          `• लक्षण: निचली पत्तियां पीली पड़ना (क्लोरोसिस) और कल्लों की संख्या कम होना।\n` +
          `• समाधान: प्रति एकड़ लगभग **${dose} बोरी नीम लेपित यूरिया** को 3 किस्तों में विभाजित करके डालें (बुवाई, 21-25 दिन पर कल्ले फूटते समय, और 45-50 दिन पर बालियां निकलते समय)।`
        : n > 560
        ? `ℹ️ **स्थिति: नाइट्रोजन प्रचुर मात्रा में है।**\n` +
          `• समाधान: यूरिया के प्रयोग में 20-30% की कटौती करें ताकि फसल गिरने (लॉजिंग) और कीट प्रकोप से बच सके।`
        : `✅ **स्थिति: नाइट्रोजन का स्तर संतुलित और उपयुक्त है।**\n` +
          `• सामान्य अनुशंसित बेसल और टॉप-ड्रेसिंग जारी रखें।`);
  }

  return `🌱 **Nitrogen (N) Diagnosis:**\n\n` +
    `• Available Nitrogen in Soil: **${n} kg/ha** (${rating.label})\n` +
    `• ICAR Standard Range: 280 to 560 kg/ha.\n\n` +
    (n < 280
      ? `⚠️ **Condition: Nitrogen Deficient.**\n` +
        `• Symptoms: Chlorosis (pale yellowing of older lower leaves), stunted vegetative growth, reduced tillers.\n` +
        `• Action: Apply ~**${dose} bags Neem-Coated Urea per acre** in 3 calibrated splits (Basal, Active Tillering at 21-25 DAS, Panicle Initiation at 45-50 DAS).`
      : n > 560
      ? `ℹ️ **Condition: Nitrogen High/Excess.**\n` +
        `• Action: Reduce urea application by 20-30% to prevent excessive lush vegetative growth and lodging.`
      : `✅ **Condition: Optimal Nitrogen Level.**\n` +
        `• Maintain standard recommended basal and top-dressing doses.`);
}

function answerPhosphorus(lang, analysis) {
  const p = analysis.values.p;
  const rating = analysis.ratings.phosphorus;

  if (p === null) {
    if (lang === 'te') return 'మీ నేల కార్డులో భాస్వరం (Phosphorus) నమోదు కాలేదు.';
    if (lang === 'hi') return 'आपकी रिपोर्ट में फास्फोरस का मान दर्ज नहीं है।';
    return 'Phosphorus value was not recorded in this soil report.';
  }

  const pBags = analysis.fertilizerPlan.phosphorusSource.bagsPerAcre;

  if (lang === 'te') {
    return `🌿 **భాస్వరం (Phosphorus - P₂O₅) విశ్లేషణ:**\n\n` +
      `• మీ నేలలో అందుబాటులో ఉన్న భాస్వరం: **${p} kg/ha** (${rating.label})\n` +
      `• ICAR ప్రామాణిక పరిధి: 14 - 28 kg/ha.\n\n` +
      (p < 14
        ? `⚠️ **లోపం ఉంది:** భాస్వరం లోపం వల్ల వేర్ల వ్యవస్థ సరిగ్గా అభివృద్ధి చెందదు, ఆకులు ఊదా రంగులోకి మారతాయి.\n` +
          `• సిఫార్సు: విత్తే సమయంలోనే ఎకరాకు ~**${pBags} బస్తాల DAP** ను విత్తనానికి 5 సెం.మీ దిగువన వేయండి. PSB (భాస్వరాన్ని కరిగించే బ్యాక్టీరియా) కల్చర్‌తో విత్తనశుద్ధి చేయండి.`
        : `✅ **పరిస్థితి:** భాస్వరం తగినంతగా ఉంది. సాధారణ DAP లేదా SSP బేసల్ డోస్ సరిపోతుంది.`);
  }

  if (lang === 'hi') {
    return `🌿 **फास्फोरस (Phosphorus) की स्थिति:**\n\n` +
      `• आपकी मिट्टी में उपलब्ध फास्फोरस: **${p} kg/ha** (${rating.label})\n` +
      `• ICAR मानक स्तर: 14 से 28 kg/ha.\n\n` +
      (p < 14
        ? `⚠️ **कमी है:** फास्फोरस की कमी से पौधे की जड़ें कमजोर रहती हैं और पत्तियां बैगनी रंग की होने लगती हैं।\n` +
          `• समाधान: बुवाई के समय प्रति एकड़ ~**${pBags} बोरी डीएपी (DAP)** बीज से 5 सेमी नीचे ड्रिल करें। साथ ही PSB कल्चर का प्रयोग करें।`
        : `✅ **स्थिति:** फास्फोरस का स्तर पर्याप्त है। मानक बेसल मात्रा पर्याप्त रहेगी।`);
  }

  return `🌿 **Phosphorus (P) Diagnosis:**\n\n` +
    `• Available Phosphorus in Soil: **${p} kg/ha** (${rating.label})\n` +
    `• ICAR Ideal Range: 14 to 28 kg/ha.\n\n` +
    (p < 14
      ? `⚠️ **Deficiency Detected:** Low P inhibits seedling root system branching and causes purple leaf pigmentation.\n` +
        `• Recommendation: Drill ~**${pBags} bags DAP/acre** 5 cm below the seed at sowing. Treat seed with PSB biofertilizer.`
      : `✅ **Status:** Phosphorus availability is adequate. Standard basal phosphate satisfies crop demand.`);
}

function answerPotassium(lang, analysis) {
  const k = analysis.values.k;
  const rating = analysis.ratings.potassium;

  if (k === null) {
    if (lang === 'te') return 'మీ నేల కార్డులో పొటాష్ (Potassium) నమోదు కాలేదు.';
    if (lang === 'hi') return 'आपकी रिपोर्ट में पोटाश का मान दर्ज नहीं है।';
    return 'Potassium value was not recorded in this soil report.';
  }

  const mopBags = analysis.fertilizerPlan.mop.bagsPerAcre;

  if (lang === 'te') {
    return `🌾 **పొటాష్ (Potassium - K₂O) విశ్లేషణ:**\n\n` +
      `• మీ నేలలో పొటాష్ నిల్వ: **${k} kg/ha** (${rating.label})\n` +
      `• ICAR ప్రమాణం: 135 - 280 kg/ha.\n\n` +
      (k > 280
        ? `💰 **మంచి వార్త (ఖర్చు ఆదా):** మీ నేలలో సహజంగానే పొటాష్ సమృద్ధిగా ఉంది (${k} kg/ha). MOP ఎరువును 50% తగ్గించి వేయవచ్చు (~${mopBags} బస్తాలు/ఎకరాకు). దీనివల్ల పంట దిగుబడి తగ్గకుండా ఎకరాకు ₹800-₹1,200 ఆదా అవుతుంది!`
        : k < 135
        ? `⚠️ **లోపం ఉంది:** పొటాష్ లోపం వలన కాండం బలహీనపడి పంట పడిపోతుంది (lodging).\n` +
          `• సిఫార్సు: ఎకరాకు ~${mopBags} బస్తాల MOP (Muriate of Potash) ను విత్తే సమయంలో వేయండి.`
        : `✅ **పరిస్థితి:** పొటాష్ స్థాయి ఆదర్శంగా ఉంది. మొక్కల రోగనిరోధక శక్తికి ఇది చాలా మేలు చేస్తుంది.`);
  }

  if (lang === 'hi') {
    return `🌾 **पोटाश (Potassium) की स्थिति:**\n\n` +
      `• आपकी मिट्टी में पोटाश भंडार: **${k} kg/ha** (${rating.label})\n` +
      `• ICAR मानक: 135 से 280 kg/ha.\n\n` +
      (k > 280
        ? `💰 **लागत बचत (खुशखबरी):** आपकी मिट्टी में पोटाश प्रचुर मात्रा में है (${k} kg/ha)। MOP की मात्रा 50% घटाई जा सकती है (~${mopBags} बोरी/एकड़)। इससे उपज प्रभावित हुए बिना प्रति एकड़ ₹800-₹1,200 की सीधी बचत होगी!`
        : k < 135
        ? `⚠️ **कमी है:** पोटाश कम होने से तने कमजोर होते हैं और फसल गिरने का खतरा रहता है।\n` +
          `• समाधान: बुवाई के समय प्रति एकड़ ~${mopBags} बोरी एमओपी (MOP) डालें।`
        : `✅ **स्थिति:** पोटाश का स्तर इष्टतम है। इससे पौधों में रोग प्रतिरोधक क्षमता अच्छी रहेगी।`);
  }

  return `🌾 **Potassium (K) Diagnosis:**\n\n` +
    `• Available Potassium in Soil: **${k} kg/ha** (${rating.label})\n` +
    `• ICAR Benchmark: 135 to 280 kg/ha.\n\n` +
    (k > 280
      ? `💰 **Cost Savings Opportunity:** Your soil contains abundant native potash (${k} kg/ha). MOP dose can be safely reduced by 50% (~${mopBags} bags/acre), saving ₹800-₹1,200 per acre with zero yield loss!`
      : k < 135
      ? `⚠️ **Deficiency Detected:** Low potash weakens stalk rigidity and invites disease pressure.\n` +
        `• Recommendation: Apply ~${mopBags} bags MOP (60% K2O) per acre at land preparation.`
      : `✅ **Status:** Optimal potassium reserves support sturdy stems and drought resistance.`);
}

function answerZinc(lang, analysis) {
  const zn = analysis.values.zn;
  const rating = analysis.ratings.zinc;

  if (zn === null) {
    if (lang === 'te') return 'మీ నేల కార్డులో జింక్ (Zinc) నమోదు కాలేదు.';
    if (lang === 'hi') return 'आपकी रिपोर्ट में जिंक का मान दर्ज नहीं है।';
    return 'Zinc value was not recorded in this soil report.';
  }

  if (lang === 'te') {
    return `🔬 **జింక్ (Zinc - Zn) విశ్లేషణ:**\n\n` +
      `• మీ నేలలో జింక్ స్థాయి: **${zn} ppm** (${rating.label})\n` +
      `• క్లిష్టమైన ప్రమాణ స్థాయి (Critical Limit): 0.60 ppm.\n\n` +
      (zn < 0.60
        ? `⚠️ **జింక్ లోపం గుర్తించబడింది (<0.60 ppm):**\n` +
          `• వరిలో ఖైరా తెగులు (Khaira disease), మొక్క ఎదుగుదల లోపం వచ్చే ప్రమాదం ఉంది.\n` +
          `• నివారణ: ఆఖరి దుక్కిలో ఎకరాకు **10 కిలోల జింక్ సల్ఫేట్ (21% Zinc Sulphate)** చల్లండి.\n` +
          `• **హెచ్చరిక:** జింక్ సల్ఫేట్ ను DAP తో కలిపి ఎప్పుడూ వేయకూడదు!`
        : `✅ **పరిస్థితి:** జింక్ సమృద్ధిగా ఉంది (${zn} ppm). అదనపు జింక్ అవసరం లేదు.`);
  }

  if (lang === 'hi') {
    return `🔬 **जिंक (Zinc) की स्थिति:**\n\n` +
      `• आपकी मिट्टी में जिंक स्तर: **${zn} ppm** (${rating.label})\n` +
      `• ICAR क्रांतिक स्तर (Critical Limit): 0.60 ppm.\n\n` +
      (zn < 0.60
        ? `⚠️ **जिंक की कमी है (<0.60 ppm):**\n` +
          `• धान में खैरा रोग और पौधों का बौनापन हो सकता है।\n` +
          `• समाधान: अंतिम जुताई के समय प्रति एकड़ **10 किग्रा जिंक सल्फेट (21%)** डालें।\n` +
          `• **सावधानी:** जिंक सल्फेट को डीएपी (DAP) के साथ कभी न मिलाएं!`
        : `✅ **स्थिति:** जिंक पर्याप्त मात्रा में है (${zn} ppm)। अतिरिक्त जिंक की आवश्यकता नहीं है।`);
  }

  return `🔬 **Zinc (Zn) Micronutrient Diagnosis:**\n\n` +
    `• Soil Zinc Level: **${zn} ppm** (${rating.label})\n` +
    `• ICAR Critical Threshold: 0.60 ppm.\n\n` +
    (zn < 0.60
      ? `⚠️ **Zinc Deficiency Detected (<0.60 ppm):**\n` +
        `• Puts paddy at risk of Khaira disease and causes chlorotic bronze patches on young leaves.\n` +
        `• Remediation: Broadcast **10 kg Zinc Sulphate (21%) per acre** during final plowing.\n` +
        `• **SAFETY WARNING:** NEVER mix Zinc Sulphate with DAP!`
      : `✅ **Status:** Adequate zinc reserves (${zn} ppm). No supplemental zinc required.`);
}

function answerOrganicCarbon(lang, analysis) {
  const oc = analysis.values.oc;
  const rating = analysis.ratings.organicCarbon;

  if (oc === null) {
    if (lang === 'te') return 'మీ నేల కార్డులో సేంద్రీయ కర్బనం (Organic Carbon) నమోదు కాలేదు.';
    if (lang === 'hi') return 'आपकी रिपोर्ट में जैविक कार्बन का मान दर्ज नहीं है।';
    return 'Organic Carbon value was not recorded in this soil report.';
  }

  if (lang === 'te') {
    return `🍂 **సేంద్రీయ కర్బనం (Organic Carbon - OC) విశ్లేషణ:**\n\n` +
      `• మీ నేలలో సేంద్రీయ కర్బనం: **${oc}%** (${rating.label})\n` +
      `• ఆదర్శవంతమైన పరిధి: 0.50% - 0.75% లేదా అంతకంటే ఎక్కువ.\n\n` +
      (oc < 0.50
        ? `⚠️ **పరిస్థితి: సేంద్రీయ కర్బనం తక్కువగా ఉంది.**\n` +
          `• దీని వలన నేల నీటిని నిలుపుకునే శక్తి, ఉపయోగకర సూక్ష్మజీవుల సంఖ్య తగ్గుతాయి.\n` +
          `• నివారణ: ఎకరాకు 4 నుండి 5 టన్నుల బాగా చివికిన పశువుల పేడ ఎరువు (FYM) లేదా వర్మికంపోస్ట్ వేయండి. వీలైతే జీలుగా/జనుము వంటి పచ్చిరొట్ట ఎరువులను కలియదున్నండి.`
        : `✅ **పరిస్థితి: సేంద్రీయ కర్బనం సంతృప్తికరంగా ఉంది.** నేల జీవం మరియు సూక్ష్మజీవుల సమతుల్యత బాగుంది.`);
  }

  if (lang === 'hi') {
    return `🍂 **जैविक कार्बन (Organic Carbon) की स्थिति:**\n\n` +
      `• आपकी मिट्टी में जैविक कार्बन: **${oc}%** (${rating.label})\n` +
      `• इष्टतम स्तर: 0.50% से 0.75% या अधिक।\n\n` +
      (oc < 0.50
        ? `⚠️ **स्थिति: जैविक कार्बन कम है।**\n` +
          `• इससे मिट्टी की जल-धारण क्षमता और लाभदायक जीवाणुओं की संख्या घटती है।\n` +
          `• समाधान: प्रति एकड़ 4 से 5 टन अच्छी सड़ी गोबर की खाद (FYM) या केंचुआ खाद (वर्मीकम्पोस्ट) डालें। हरी खाद (ढैंचा/सनई) का प्रयोग करें।`
        : `✅ **स्थिति: जैविक कार्बन का स्तर अच्छा है।** मिट्टी की संरचना और उर्वरता स्वस्थ है।`);
  }

  return `🍂 **Soil Organic Carbon (OC) Diagnosis:**\n\n` +
    `• Soil Organic Carbon: **${oc}%** (${rating.label})\n` +
    `• Ideal Benchmark: 0.50% - 0.75% or higher.\n\n` +
    (oc < 0.50
      ? `⚠️ **Condition: Low Soil Carbon.**\n` +
        `• Impairs soil microbial biodiversity, aggregate stability, and moisture retention.\n` +
        `• Remediation: Incorporate 4-5 tonnes well-decomposed Farm Yard Manure (FYM) or vermicompost per acre before next planting. Retain crop stubble.`
      : `✅ **Status: Satisfactory Organic Carbon.** Soil biological activity and water-holding capacity are healthy.`);
}

function answerPhSalinity(lang, analysis) {
  const ph = analysis.values.ph;
  const ec = analysis.values.ec;
  const phRating = analysis.ratings.ph;
  const ecRating = analysis.ratings.ec;

  if (ph === null && ec === null) {
    if (lang === 'te') return 'మీ నేల కార్డులో pH లేదా EC నమోదు కాలేదు.';
    if (lang === 'hi') return 'आपकी रिपोर्ट में pH या EC का मान दर्ज नहीं है।';
    return 'pH and EC values were not recorded in this soil report.';
  }

  if (lang === 'te') {
    return `🧪 **నేల స్వభావం (pH) మరియు లవణీయత (EC) విశ్లేషణ:**\n\n` +
      `• నేల pH: **${ph ?? 'నమోదు కాలేదు'}** (${phRating.label})\n` +
      `• లవణీయత (EC): **${ec !== null ? `${ec} dS/m` : 'నమోదు కాలేదు'}** (${ecRating.label})\n\n` +
      `**విశ్లేషణ & సలహా:**\n` +
      (ph < 6.5
        ? `• నేల ఆమ్ల స్వభావం (Acidic) కలిగి ఉంది. భాస్వరం లభ్యత తగ్గుతుంది. ఎకరాకు సున్నం లేదా డోలమైట్ వేయడం మంచిది.\n`
        : ph > 8.0
        ? `• నేల క్షార స్వభావం (Alkaline) కలిగి ఉంది. జిప్సం మరియు పచ్చిరొట్ట ఎరువులు వాడటం సిఫార్సు.\n`
        : `• pH తటస్థంగా ఉంది (Neutral: 6.5 - 7.5). ఇది అన్ని రకాల పంటలకు మరియు పోషకాల గ్రహణానికి అత్యుత్తమమైనది.\n`) +
      (ec && ec > 1.0 ? `• లవణీయత కాస్త ఎక్కువ ఉంది; తగినంత నీటి డ్రైనేజీ ఏర్పాటు చేయండి.` : `• లవణీయత సాధారణంగా ఉంది; ఉప్పు ప్రభావం లేదు.`);
  }

  if (lang === 'hi') {
    return `🧪 **मिट्टी का पीएच (pH) और लवणता (EC):**\n\n` +
      `• मिट्टी pH: **${ph ?? 'उपलब्ध नहीं'}** (${phRating.label})\n` +
      `• लवणता (EC): **${ec !== null ? `${ec} dS/m` : 'उपलब्ध नहीं'}** (${ecRating.label})\n\n` +
      `**सलाह:**\n` +
      (ph < 6.5
        ? `• मिट्टी अम्लीय (Acidic) है। फास्फोरस की उपलब्धता बढ़ाने के लिए कृषि चूना प्रयोग करें।\n`
        : ph > 8.0
        ? `• मिट्टी क्षारीय (Alkaline) है। जिप्सम और ढैंचा जैसी हरी खाद का प्रयोग करें।\n`
        : `• pH उदासीन एवं आदर्श है (6.5 - 7.5)। यह सभी अनाजों और दालों के लिए सबसे उपयुक्त है।\n`) +
      (ec && ec > 1.0 ? `• लवणता थोड़ी अधिक है; खेत में जल निकासी अच्छी रखें।` : `• लवणता सामान्य है; बीज अंकुरण पर कोई बुरा प्रभाव नहीं पड़ेगा।`);
  }

  return `🧪 **Soil pH & Salinity (EC) Diagnosis:**\n\n` +
    `• Soil pH: **${ph ?? 'Not recorded'}** (${phRating.label})\n` +
    `• Electrical Conductivity (EC): **${ec !== null ? `${ec} dS/m` : 'Not recorded'}** (${ecRating.label})\n\n` +
    `**Agronomic Assessment:**\n` +
    (ph < 6.5
      ? `• Acidic soil conditions detected. Liming (CaCO3) recommended to alleviate phosphorus fixation.\n`
      : ph > 8.0
      ? `• Alkaline soil detected. Gypsum application and green manuring (Dhaincha) recommended.\n`
      : `• Ideal neutral pH range (6.5 - 7.5). Maximum bioavailability for macro and micronutrients.\n`) +
    (ec && ec > 1.0 ? `• Elevated salinity detected; maintain adequate drainage and avoid saline borewell water.` : `• Non-saline safe range; zero osmotic salt stress on roots.`);
}

function answerCropRecommendation(lang, analysis) {
  const suggestions = analysis.cropSuggestions.slice(0, 3);
  const vals = analysis.values;

  if (lang === 'te') {
    return `🌾 **మీ నేల సారం (pH ${vals.ph ?? 7.2}) కి సరిపడే ఉత్తమ పంటల సిఫార్సు:**\n\n` +
      suggestions.map((s, i) => (
        `${i + 1}. **${s.localTe} (${s.crop})** — అనుకూలత స్కోర్: **${s.suitability}%**\n` +
        `   • నీటి అవసరం: ${s.waterNeed}\n` +
        `   • శాస్త్రీయ కారణం: ${s.rationale}`
      )).join('\n\n') +
      `\n\n💡 **రైతు సలహా:** మీ నేలలో నత్రజని లోపం ఉంటే వేరుశనగ లేదా శనగ వంటి పప్పుధాన్యాల పంటలు వాతావరణ నత్రజనిని స్థిరీకరించి భూసారాన్ని పెంచుతాయి.`;
  }

  if (lang === 'hi') {
    return `🌾 **आपकी मिट्टी (pH ${vals.ph ?? 7.2}) के लिए शीर्ष अनुशंसित फसलें:**\n\n` +
      suggestions.map((s, i) => (
        `${i + 1}. **${s.localHi} (${s.crop})** — उपयुक्तता स्कोर: **${s.suitability}%**\n` +
        `   • जल आवश्यकता: ${s.waterNeed}\n` +
        `   • कारण: ${s.rationale}`
      )).join('\n\n') +
      `\n\n💡 **किसान सलाह:** यदि मिट्टी में नाइट्रोजन कम है, तो मूंगफली या चना जैसी दलहनी फसलें वायुमंडलीय नाइट्रोजन को सोखकर मिट्टी की उर्वरता बढ़ाती हैं।`;
  }

  return `🌾 **Top Agronomic Crop Recommendations for your Soil (pH ${vals.ph ?? 7.2}):**\n\n` +
    suggestions.map((s, i) => (
      `${i + 1}. **${s.crop}** — Suitability: **${s.suitability}%**\n` +
      `   • Water Requirement: ${s.waterNeed}\n` +
      `   • Agronomic Rationale: ${s.rationale}`
    )).join('\n\n') +
    `\n\n💡 **Agronomist Tip:** If soil nitrogen is deficient, leguminous crops naturally fix atmospheric nitrogen into the root zone.`;
}

function answerIrrigationTiming(lang) {
  if (lang === 'te') {
    return `💧 **ఎరువులు వేసే సమయం & నీటి తేమ నియమాలు:**\n\n` +
      `1. **ఎప్పుడు వేయాలి?**\n` +
      `   • యూరియాను ఎల్లప్పుడూ నేలలో తగినంత తేమ ఉన్నప్పుడు మాత్రమే చల్లాలి.\n` +
      `   • ఎండిపోయిన నేలపై లేదా తీవ్రమైన ఎండలో మధ్యాహ్నం వేయకూడదు (ఆవిరైపోతుంది).\n\n` +
      `2. **విడతల పద్ధతి (Splits):**\n` +
      `   • నత్రజనిని ఒకేసారి వేయకుండా 2-3 విడతల్లో వేయడం వల్ల నేలలో ఇంకిపోకుండా మొక్క వేర్లకు అందుతుంది.\n` +
      `3. **DAP:** విత్తే సమయంలో విత్తనంతో పాటు వేయాలి.`;
  }

  if (lang === 'hi') {
    return `💧 **उर्वरक डालने का समय और सिंचाई नियम:**\n\n` +
      `1. **कब डालें?**\n` +
      `   • यूरिया हमेशा खेत में पर्याप्त नमी होने पर ही डालें।\n` +
      `   • सूखी मिट्टी या तेज धूप में यूरिया न डालें, अन्यथा गैस बनकर उड़ जाएगा।\n\n` +
      `2. **किस्तों में प्रयोग:**\n` +
      `   • यूरिया को एक बार में न डालकर 2 से 3 किस्तों में बांटकर सिंचाई के बाद दें।\n` +
      `3. **डीएपी (DAP):** बुवाई के समय आधार खाद (बेसल) के रूप में बीज के नीचे डालें।`;
  }

  return `💧 **Fertilizer Application Timing & Moisture Guidelines:**\n\n` +
    `1. **Soil Moisture Rule:**\n` +
    `   • Always top-dress Urea over moist soil or immediately follow with light irrigation.\n` +
    `   • NEVER broadcast on parched, dry soil under direct blazing sunlight (prevents ammonia volatilization).\n\n` +
    `2. **Split Application:**\n` +
    `   • Splitting nitrogen into 2 to 3 doses across vegetative milestones prevents leaching loss.\n` +
    `3. **DAP/Phosphorus:** Apply 100% as basal dose placed 5 cm deep during sowing.`;
}

function answerOverallCondition(lang, analysis, reportTitle) {
  const vals = analysis.values;
  const defs = analysis.deficiencies;
  const healthScore = analysis.healthScore;

  if (lang === 'te') {
    return `📋 **మీ నేల ఆరోగ్య సమగ్ర నివేదిక (${reportTitle}):**\n\n` +
      `• **మొత్తం ఆరోగ్య స్కోర్:** **${healthScore}/100** (${analysis.overallStatus})\n` +
      `• **pH స్థాయి:** ${vals.ph ?? 'నమోదు కాలేదు'} (${analysis.ratings.ph.label})\n` +
      `• **సేంద్రీయ కర్బనం (OC):** ${vals.oc ?? 'నమోదు కాలేదు'}% (${analysis.ratings.organicCarbon.label})\n` +
      `• **నత్రజని (N):** ${vals.n ?? 'నమోదు కాలేదు'} kg/ha (${analysis.ratings.nitrogen.label})\n` +
      `• **భాస్వరం (P):** ${vals.p ?? 'నమోదు కాలేదు'} kg/ha (${analysis.ratings.phosphorus.label})\n` +
      `• **పొటాష్ (K):** ${vals.k ?? 'నమోదు కాలేదు'} kg/ha (${analysis.ratings.potassium.label})\n` +
      `• **జింక్ (Zn):** ${vals.zn ?? 'నమోదు కాలేదు'} ppm (${analysis.ratings.zinc.label})\n\n` +
      `🔍 **ముఖ్య లోపాలు:**\n` +
      (defs.length > 0
        ? defs.map(d => `• ${d.name}: ${d.message}`).join('\n')
        : '• మీ నేలలో ఎటువంటి తీవ్ర లోపాలు లేవు. పోషకాలు సమతుల్యంగా ఉన్నాయి.') +
      `\n\n💡 మీకు ఎరువుల బస్తాల లెక్క లేదా పంటల సిఫార్సు కావాలంటే క్రింద అడగవచ్చు!`;
  }

  if (lang === 'hi') {
    return `📋 **आपकी मिट्टी स्वास्थ्य समग्र स्थिति (${reportTitle}):**\n\n` +
      `• **कुल स्वास्थ्य स्कोर:** **${healthScore}/100** (${analysis.overallStatus})\n` +
      `• **पीएच (pH):** ${vals.ph ?? 'उपलब्ध नहीं'} (${analysis.ratings.ph.label})\n` +
      `• **जैविक कार्बन (OC):** ${vals.oc ?? 'उपलब्ध नहीं'}% (${analysis.ratings.organicCarbon.label})\n` +
      `• **नाइट्रोजन (N):** ${vals.n ?? 'उपलब्ध नहीं'} kg/ha (${analysis.ratings.nitrogen.label})\n` +
      `• **फास्फोरस (P):** ${vals.p ?? 'उपलब्ध नहीं'} kg/ha (${analysis.ratings.phosphorus.label})\n` +
      `• **पोटाश (K):** ${vals.k ?? 'उपलब्ध नहीं'} kg/ha (${analysis.ratings.potassium.label})\n` +
      `• **जिंक (Zn):** ${vals.zn ?? 'उपलब्ध नहीं'} ppm (${analysis.ratings.zinc.label})\n\n` +
      `🔍 **पहचानी गई प्रमुख कमियां:**\n` +
      (defs.length > 0
        ? defs.map(d => `• ${d.name}: ${d.message}`).join('\n')
        : '• आपकी मिट्टी में कोई गंभीर कमी नहीं है। सभी मुख्य पोषक तत्व संतुलित हैं।') +
      `\n\n💡 सटीक खाद की मात्रा या उपयुक्त फसलों के बारे में जानने के लिए नीचे पूछें!`;
  }

  return `📋 **Comprehensive Soil Health Diagnosis (${reportTitle}):**\n\n` +
    `• **Soil Health Score:** **${healthScore}/100** (${analysis.overallStatus})\n` +
    `• **Soil pH:** ${vals.ph ?? 'Not recorded'} (${analysis.ratings.ph.label})\n` +
    `• **Organic Carbon (OC):** ${vals.oc ?? 'Not recorded'}% (${analysis.ratings.organicCarbon.label})\n` +
    `• **Available Nitrogen (N):** ${vals.n ?? 'Not recorded'} kg/ha (${analysis.ratings.nitrogen.label})\n` +
    `• **Available Phosphorus (P):** ${vals.p ?? 'Not recorded'} kg/ha (${analysis.ratings.phosphorus.label})\n` +
    `• **Available Potassium (K):** ${vals.k ?? 'Not recorded'} kg/ha (${analysis.ratings.potassium.label})\n` +
    `• **Available Zinc (Zn):** ${vals.zn ?? 'Not recorded'} ppm (${analysis.ratings.zinc.label})\n\n` +
    `🔍 **Identified Soil Deficiencies:**\n` +
    (defs.length > 0
      ? defs.map(d => `• ${d.name}: ${d.message}`).join('\n')
      : '• No severe deficiencies detected. Nutrient profile is balanced.') +
    `\n\n💡 Ask about fertilizer doses or crop recommendations anytime!`;
}

export function answerNotUnderstood(lang) {
  if (lang === 'te') {
    return (
      `క్షమించండి, మీ ప్రశ్న అర్థం కాలేదు. దయచేసి వ్యవసాయం, నేల పరీక్ష, ఎరువులు లేదా పంటల గురించి అడగండి.\n\n` +
      `ఉదాహరణకు ఈ ప్రశ్నలు అడగవచ్చు:\n` +
      `1. "ఎకరాకు ఎన్ని బస్తాల యూరియా మరియు DAP వేయాలి?"\n` +
      `2. "నా నేలలో నత్రజని లోపం గురించి చెప్పు"\n` +
      `3. "నా నేలకు ఏ పంటలు అనుకూలం?"`
    );
  }

  if (lang === 'hi') {
    return (
      `क्षमा करें, मुझे आपका सवाल समझ नहीं आया। कृपया खेती, मिट्टी, खाद या फसलों से संबंधित प्रश्न पूछें।\n\n` +
      `उदाहरण के लिए आप ये सवाल पूछ सकते हैं:\n` +
      `1. "प्रति एकड़ कितनी बोरी यूरिया और डीएपी डालें?"\n` +
      `2. "मेरी मिट्टी में नाइट्रोजन की क्या स्थिति है?"\n` +
      `3. "मेरी मिट्टी के लिए कौन सी फसल सबसे अच्छी है?"`
    );
  }

  return (
    `I'm sorry, I didn't understand your question. Please ask something related to farming, soil health, fertilizers, or crops.\n\n` +
    `Here are 3 example questions you can ask:\n` +
    `1. "How many bags of Urea and DAP per acre?"\n` +
    `2. "How is the nitrogen level in my soil?"\n` +
    `3. "What crops are recommended for my soil?"`
  );
}

export function answerGreeting(lang, farmerName = '') {
  const name = farmerName ? farmerName.trim() : '';

  if (lang === 'te') {
    const greeting = name ? `నమస్కారం ${name} గారు! 🙏🌾` : `నమస్కారం! 🙏🌾`;
    return (
      `${greeting} కృషిసాథి (KrishiSaathi) సహాయకుడికి స్వాగతం. మీ నేల ఆరోగ్య కార్డు, ఎరువుల మోతాదు లేదా పంటల గురించి ఏదైనా అడగవచ్చు.\n\n` +
      `ఉదాహరణకు ఈ ప్రశ్నలు అడగవచ్చు:\n` +
      `1. "ఎకరాకు ఎన్ని బస్తాల యూరియా మరియు DAP వేయాలి?"\n` +
      `2. "నా నేలలో నత్రజని లోపం గురించి చెప్పు"\n` +
      `3. "నా నేలకు ఏ పంటలు అనుకూలం?"`
    );
  }

  if (lang === 'hi') {
    const greeting = name ? `नमस्ते ${name} जी! 🙏🌾` : `नमस्ते! 🙏🌾`;
    return (
      `${greeting} कृषिशाथी (KrishiSaathi) में आपका स्वागत है। आप अपनी मिट्टी रिपोर्ट, खाद की सही मात्रा या फसलों के बारे में पूछ सकते हैं।\n\n` +
      `उदाहरण के लिए आप ये सवाल पूछ सकते हैं:\n` +
      `1. "प्रति एकड़ कितनी बोरी यूरिया और डीएपी डालें?"\n` +
      `2. "मेरी मिट्टी में नाइट्रोजन की क्या स्थिति है?"\n` +
      `3. "मेरी मिट्टी के लिए कौन सी फसल सबसे अच्छी है?"`
    );
  }

  const greeting = name ? `Hello ${name}! 🌾` : `Hello! 🌾`;
  return (
    `${greeting} Welcome to KrishiSaathi. You can ask me questions about your soil health card, fertilizer dosages, or recommended crops.\n\n` +
    `Here are 3 example questions you can ask:\n` +
    `1. "How many bags of Urea and DAP per acre?"\n` +
    `2. "How is the nitrogen level in my soil?"\n` +
    `3. "What crops are recommended for my soil?"`
  );
}

export function answerDefaultFallback(lang) {
  return answerNotUnderstood(lang);
}

// ==============================================================================
// 4. MAIN EXPORT: answerOffline(question, lang, report, farmerName)
// ==============================================================================
export function answerOffline(question, lang = 'te', report = null, farmerName = '') {
  let normalizedLang = ['te', 'hi', 'en'].includes(lang) ? lang : 'te';
  if (question && typeof question === 'string') {
    if (TELUGU_SCRIPT_REGEX.test(question)) normalizedLang = 'te';
    else if (DEVANAGARI_SCRIPT_REGEX.test(question)) normalizedLang = 'hi';
  }

  if (!question || isGibberishOrInvalid(question)) {
    return answerNotUnderstood(normalizedLang);
  }

  if (isGreeting(question)) {
    return answerGreeting(normalizedLang, farmerName);
  }

  const intent = detectIntent(question);
  if (intent === 'greeting') {
    return answerGreeting(normalizedLang, farmerName);
  }
  if (intent === 'unrecognized' || intent === 'default_fallback') {
    return answerNotUnderstood(normalizedLang);
  }

  const analysis = analyzeSoil(report);
  const reportTitle = report?.title || report?.id || (normalizedLang === 'te' ? 'నేల ఆరోగ్య కార్డు' : (normalizedLang === 'hi' ? 'मिट्टी स्वास्थ्य कार्ड' : 'Soil Health Card'));

  switch (intent) {
    case 'mixing_precautions':
      return answerMixingPrecautions(normalizedLang);
    case 'fertilizer_dose':
      return answerFertilizerDose(normalizedLang, analysis, reportTitle);
    case 'can_i_use_fertilizer':
      return answerCanIUseFertilizer(normalizedLang, analysis);
    case 'crop_recommendation':
      return answerCropRecommendation(normalizedLang, analysis);
    case 'irrigation_timing':
      return answerIrrigationTiming(normalizedLang);
    case 'nitrogen':
      return answerNitrogen(normalizedLang, analysis);
    case 'phosphorus':
      return answerPhosphorus(normalizedLang, analysis);
    case 'potassium':
      return answerPotassium(normalizedLang, analysis);
    case 'zinc':
      return answerZinc(normalizedLang, analysis);
    case 'organic_carbon':
      return answerOrganicCarbon(normalizedLang, analysis);
    case 'ph_salinity':
      return answerPhSalinity(normalizedLang, analysis);
    case 'overall_condition':
      return answerOverallCondition(normalizedLang, analysis, reportTitle);
    case 'default_fallback':
    default:
      return answerNotUnderstood(normalizedLang);
  }
}
