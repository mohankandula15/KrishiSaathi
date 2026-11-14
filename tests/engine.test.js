import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  classifyNitrogen,
  classifyPhosphorus,
  classifyPotassium,
  classifyPh,
  classifyOrganicCarbon,
  classifyZinc,
  classifyLive,
  calculateFertilizerPlan,
  analyzeSoil,
  formatSoilReportText,
} from '../src/engine/icarEngine.js';

import {
  detectIntent,
  answerOffline,
} from '../src/engine/offlineAnswers.js';

import {
  formatLocalDate,
} from '../src/i18n/languages.js';

import {
  getReportStableCode,
  getReportTitle,
  getReportLocation,
  getReportLabName,
  getCardDisplayName,
  getDemoCardMeta,
} from '../src/i18n/dataLookups.js';

test('ICAR Rating Classifications', async (t) => {
  await t.test('Nitrogen threshold classification', () => {
    assert.equal(classifyNitrogen(185).rating, 'Low');
    assert.equal(classifyNitrogen(350).rating, 'Medium');
    assert.equal(classifyNitrogen(600).rating, 'High');
    assert.equal(classifyNitrogen(null).rating, null);
  });

  await t.test('Phosphorus threshold classification', () => {
    assert.equal(classifyPhosphorus(10).rating, 'Low');
    assert.equal(classifyPhosphorus(18.4).rating, 'Medium');
    assert.equal(classifyPhosphorus(35).rating, 'High');
  });

  await t.test('Potassium threshold classification', () => {
    assert.equal(classifyPotassium(110).rating, 'Low');
    assert.equal(classifyPotassium(200).rating, 'Medium');
    assert.equal(classifyPotassium(295).rating, 'High');
  });

  await t.test('pH threshold classification', () => {
    assert.equal(classifyPh(5.1).rating, 'Strongly acidic');
    assert.equal(classifyPh(6.0).rating, 'Moderately acidic');
    assert.equal(classifyPh(7.2).rating, 'Neutral');
    assert.equal(classifyPh(8.1).rating, 'Alkaline');
    assert.equal(classifyPh(8.9).rating, 'Strongly alkaline');
  });

  await t.test('Organic carbon classification', () => {
    assert.equal(classifyOrganicCarbon(0.42).rating, 'Low');
    assert.equal(classifyOrganicCarbon(0.65).rating, 'Medium');
    assert.equal(classifyOrganicCarbon(0.85).rating, 'High');
  });

  await t.test('Zinc classification', () => {
    assert.equal(classifyZinc(0.45).rating, 'Deficient');
    assert.equal(classifyZinc(0.75).rating, 'Sufficient');
  });

  await t.test('classifyLive unified helper', () => {
    assert.equal(classifyLive('nitrogen', 185).label, 'Low');
    assert.equal(classifyLive('ph', 7.2).label, 'Neutral');
    assert.equal(classifyLive('potassium', 295).label, 'High');
    assert.equal(classifyLive('unknown', 100), null);
  });
});

test('STCR Fertilizer Prescription Engine', async (t) => {
  await t.test('Calculates calibrated doses with DAP duplicate N deduction', () => {
    const report = {
      nutrients: {
        nitrogen: { value: 185 },
        phosphorus: { value: 18.4 },
        potassium: { value: 295 },
      },
      ph: { value: 7.2 },
      secondaryNutrients: {
        zinc: { value: 0.45 },
      },
    };

    const plan = calculateFertilizerPlan(report, 'Paddy', 1.0);

    // Paddy target N is boosted because N is Low (+25%)
    assert.ok(plan.urea.bagsPerAcre > 0);
    assert.ok(plan.phosphorusSource.bagsPerAcre > 0);
    // Potash is reduced by 50% because K > 280
    assert.ok(plan.mop.bagsPerAcre <= 0.5);
    // Zinc is required because Zn < 0.60
    assert.ok(plan.zinc !== null);
    assert.equal(plan.zinc.kgPerAcre, 10.0);
    // Safety precaution for Zinc + DAP
    assert.ok(plan.precautions.some((p) => p.includes('Never mix Zinc Sulphate directly with DAP')));
  });
});

test('Analyze Soil Comprehensive Engine', async (t) => {
  await t.test('Generates sorted deficiencies and health score', () => {
    const mockReport = {
      title: 'Test Field 1',
      nutrients: {
        nitrogen: { value: 180 },
        phosphorus: { value: 12 },
        potassium: { value: 295 },
      },
      ph: { value: 7.2 },
      organicCarbon: { value: 0.42 },
      secondaryNutrients: {
        zinc: { value: 0.40 },
      },
    };

    const analysis = analyzeSoil(mockReport);

    assert.ok(analysis.healthScore >= 35 && analysis.healthScore <= 98);
    assert.ok(analysis.deficiencies.length >= 3);
    // Highest severity comes first
    assert.equal(analysis.deficiencies[0].key, 'nitrogen');
    assert.equal(analysis.deficiencies[1].key, 'zinc');
    assert.equal(analysis.deficiencies[2].key, 'phosphorus');
    assert.ok(analysis.cropSuggestions.length > 0);
  });
});

test('Offline Intent Matching', async (t) => {
  await t.test('Detects mixing precautions in all languages', () => {
    assert.equal(detectIntent('జింక్ మరియు డిఎపి కలిపి వేయవచ్చా?'), 'mixing_precautions');
    assert.equal(detectIntent('dap zinc kalipi veyavacha?'), 'mixing_precautions');
    assert.equal(detectIntent('क्या डीएपी और जिंक को मिलाकर डाल सकते हैं?'), 'mixing_precautions');
    assert.equal(detectIntent('can I mix zinc sulphate with dap?'), 'mixing_precautions');
  });

  await t.test('Detects fertilizer dose intent', () => {
    assert.equal(detectIntent('ఎకరాకు ఎన్ని బస్తాల యూరియా వేయాలి?'), 'fertilizer_dose');
    assert.equal(detectIntent('ekaraku enni baglu urea veyali'), 'fertilizer_dose');
    assert.equal(detectIntent('प्रति एकड़ कितने बोरी खाद डालें?'), 'fertilizer_dose');
    assert.equal(detectIntent('how many bags of urea and dap per acre?'), 'fertilizer_dose');
  });

  await t.test('Detects crop recommendation intent', () => {
    assert.equal(detectIntent('నా నేలకు ఏ పంటలు అనుకూలం?'), 'crop_recommendation');
    assert.equal(detectIntent('ye panta veyali?'), 'crop_recommendation');
    assert.equal(detectIntent('मेरी मिट्टी के लिए कौन सी फसल अच्छी है?'), 'crop_recommendation');
    assert.equal(detectIntent('which crops are suitable for my soil?'), 'crop_recommendation');
  });

  await t.test('Detects nutrient intents', () => {
    assert.equal(detectIntent('నత్రజని లోపం గురించి చెప్పు'), 'nitrogen');
    assert.equal(detectIntent('नाइट्रोजन की क्या स्थिति है?'), 'nitrogen');
    assert.equal(detectIntent('tell me about nitrogen'), 'nitrogen');

    assert.equal(detectIntent('భాస్వరం ఎందుకు అవసరం?'), 'phosphorus');
    assert.equal(detectIntent('फास्फोरस खाद कब डालें?'), 'phosphorus');
    assert.equal(detectIntent('phosphorus dosage'), 'phosphorus');

    assert.equal(detectIntent('పొటాష్ ఎంత వేయాలి?'), 'potassium');
    assert.equal(detectIntent('पोटाश की कमी'), 'potassium');
    assert.equal(detectIntent('potassium status'), 'potassium');

    assert.equal(detectIntent('జింక్ లోపం'), 'zinc');
    assert.equal(detectIntent('खैरा रोग और जिंक'), 'zinc');
    assert.equal(detectIntent('zinc deficiency'), 'zinc');
  });
});

test('Offline Dynamic Answer Generation in 3 Languages', async (t) => {
  const dynamicReport = {
    title: 'Guntur Black Soil Plot',
    nutrients: {
      nitrogen: { value: 195 },
      phosphorus: { value: 16.5 },
      potassium: { value: 310 },
    },
    ph: { value: 7.8 },
    organicCarbon: { value: 0.55 },
    secondaryNutrients: {
      zinc: { value: 0.42 },
    },
  };

  await t.test('Dynamic values binding in Telugu', () => {
    const teAnswer = answerOffline('నత్రజని గురించి చెప్పు', 'te', dynamicReport, 'శ్రీనివాస్');
    assert.ok(teAnswer.includes('195 kg/ha'), 'Should contain dynamic nitrogen value 195');
    assert.ok(teAnswer.includes('Low') || teAnswer.includes('నత్రజని లోపం'));

    const teMixing = answerOffline('dap zinc kalapacha?', 'te', dynamicReport);
    assert.ok(teMixing.includes('కలిపి ఎప్పుడూ వేయకూడదు'));
  });

  await t.test('Dynamic values binding in Hindi', () => {
    const hiAnswer = answerOffline('नाइट्रोजन की स्थिति बताओ', 'hi', dynamicReport, 'रमेश');
    assert.ok(hiAnswer.includes('195 kg/ha'), 'Should contain dynamic nitrogen value 195');
    assert.ok(hiAnswer.includes('यूरिया'));

    const hiMixing = answerOffline('क्या डीएपी और जिंक मिला सकते हैं?', 'hi', dynamicReport);
    assert.ok(hiMixing.includes('कभी भी एक साथ मिलाकर न डालें'));
  });

  await t.test('Dynamic values binding in English', () => {
    const enAnswer = answerOffline('how is my nitrogen level?', 'en', dynamicReport, 'Farmer');
    assert.ok(enAnswer.includes('195 kg/ha'), 'Should contain dynamic nitrogen value 195');

    const enDose = answerOffline('how many bags of fertilizer per acre?', 'en', dynamicReport);
    assert.ok(enDose.includes('Urea'));
    assert.ok(enDose.includes('310 kg/ha'), 'Should cite dynamic potassium 310 kg/ha');

    const enMixing = answerOffline('can I mix zinc sulphate and dap?', 'en', dynamicReport);
    assert.ok(enMixing.includes('NEVER mix Zinc Sulphate directly with Di-Ammonium Phosphate'));
  });

  await t.test('Short greetings return warm greeting and 3 example questions without soil data', () => {
    const teGreeting = answerOffline('hello', 'te', dynamicReport, 'శ్రీను');
    assert.ok(teGreeting.includes('శ్రీను'), 'Telugu greeting should address farmer by name');
    assert.ok(teGreeting.includes('నమస్కారం'), 'Should contain Telugu greeting');
    assert.ok(teGreeting.includes('ఎకరాకు ఎన్ని బస్తాల యూరియా మరియు DAP వేయాలి?'), 'Should list example question 1');
    assert.ok(teGreeting.includes('నా నేలలో నత్రజని లోపం గురించి చెప్పు'), 'Should list example question 2');
    assert.ok(teGreeting.includes('నా నేలకు ఏ పంటలు అనుకూలం?'), 'Should list example question 3');
    assert.ok(!teGreeting.includes('195 kg/ha'), 'Greeting must NOT present soil data');
    assert.ok(!teGreeting.includes('pH:'), 'Greeting must NOT present soil data');

    const hiGreeting = answerOffline('namaste', 'hi', dynamicReport, 'किशन');
    assert.ok(hiGreeting.includes('किशन'), 'Hindi greeting should address farmer by name');
    assert.ok(hiGreeting.includes('नमस्ते'), 'Should contain Hindi greeting');
    assert.ok(hiGreeting.includes('प्रति एकड़ कितनी बोरी यूरिया और डीएपी डालें?'), 'Should list example question 1');
    assert.ok(hiGreeting.includes('मेरी मिट्टी में नाइट्रोजन की क्या स्थिति है?'), 'Should list example question 2');
    assert.ok(hiGreeting.includes('मेरी मिट्टी के लिए कौन सी फसल सबसे अच्छी है?'), 'Should list example question 3');
    assert.ok(!hiGreeting.includes('195 kg/ha'), 'Greeting must NOT present soil data');

    const enGreeting = answerOffline('hi', 'en', dynamicReport, 'John');
    assert.ok(enGreeting.includes('John'), 'English greeting should address farmer by name');
    assert.ok(enGreeting.includes('Welcome to KrishiSaathi'), 'Should contain English welcome');
    assert.ok(enGreeting.includes('How many bags of Urea and DAP per acre?'), 'Should list example question 1');
    assert.ok(enGreeting.includes('How is the nitrogen level in my soil?'), 'Should list example question 2');
    assert.ok(enGreeting.includes('What crops are recommended for my soil?'), 'Should list example question 3');
    assert.ok(!enGreeting.includes('195 kg/ha'), 'Greeting must NOT present soil data');

    const teNamaskaram = answerOffline('namaskaram', 'te', dynamicReport);
    assert.ok(teNamaskaram.includes('నమస్కారం'), 'Should handle namaskaram transliteration');
    assert.ok(!teNamaskaram.includes('195 kg/ha'), 'Greeting must NOT present soil data');
  });

  await t.test('Input-quality gate intercepts gibberish and returns "did not understand" with 3 questions', () => {
    // 1. Random keyboard consonant mash
    const gibberish1 = answerOffline('wdfghju', 'te', dynamicReport, 'శ్రీను');
    assert.ok(gibberish1.includes('క్షమించండి, మీ ప్రశ్న అర్థం కాలేదు'), 'Should return polite not understood in Telugu');
    assert.ok(gibberish1.includes('ఎకరాకు ఎన్ని బస్తాల యూరియా మరియు DAP వేయాలి?'), 'Should include example question');
    assert.ok(!gibberish1.includes('195 kg/ha'), 'Gibberish must NOT receive soil data');

    // 2. Home row mash
    const gibberish2 = answerOffline('asdf', 'hi', dynamicReport, 'किशन');
    assert.ok(gibberish2.includes('क्षमा करें, मुझे आपका सवाल समझ नहीं आया'), 'Should return polite not understood in Hindi');
    assert.ok(gibberish2.includes('प्रति एकड़ कितनी बोरी यूरिया और डीएपी डालें?'), 'Should include example question');
    assert.ok(!gibberish2.includes('195 kg/ha'), 'Gibberish must NOT receive soil data');

    // 3. Repeated punctuation
    const gibberish3 = answerOffline('......', 'en', dynamicReport, 'John');
    assert.ok(gibberish3.includes("I'm sorry, I didn't understand your question"), 'Should return polite not understood in English');
    assert.ok(gibberish3.includes('How many bags of Urea and DAP per acre?'), 'Should include example question');
    assert.ok(!gibberish3.includes('195 kg/ha'), 'Gibberish must NOT receive soil data');

    // 4. Digits only
    const gibberish4 = answerOffline('123456', 'en', dynamicReport, 'John');
    assert.ok(gibberish4.includes("I'm sorry, I didn't understand your question"));
    assert.ok(!gibberish4.includes('195 kg/ha'), 'Gibberish must NOT receive soil data');

    // 5. Unrecognized non-agricultural query
    const unrec = answerOffline('what is the capital of france', 'en', dynamicReport, 'John');
    assert.ok(unrec.includes("I'm sorry, I didn't understand your question"));
    assert.ok(!unrec.includes('195 kg/ha'), 'Unrecognized query must NOT receive soil data');
  });

  await t.test('Tanglish and multilingual farming queries pass gate and bind calibrated soil data', () => {
    // Tanglish query
    const tanglishAns = answerOffline('naa nelalo nitrogen takkuva undi', 'te', dynamicReport, 'రైతు');
    assert.ok(tanglishAns.includes('195 kg/ha'), 'Tanglish query should bind calibrated soil nitrogen value 195 kg/ha');
    assert.ok(tanglishAns.includes('యూరియా') || tanglishAns.includes('నత్రజని'), 'Should contain agricultural guidance');

    // Telugu script query
    const teAns = answerOffline('నా నేలలో నత్రజని లోపం గురించి చెప్పు', 'te', dynamicReport);
    assert.ok(teAns.includes('195 kg/ha'), 'Telugu script query should bind calibrated nitrogen 195 kg/ha');

    // Hindi query
    const hiAns = answerOffline('मेरी मिट्टी में नाइट्रोजन की स्थिति कैसी है?', 'hi', dynamicReport);
    assert.ok(hiAns.includes('195 kg/ha'), 'Hindi query should bind calibrated nitrogen 195 kg/ha');

    // English query
    const enAns = answerOffline('how is my nitrogen level?', 'en', dynamicReport);
    assert.ok(enAns.includes('195 kg/ha'), 'English query should bind calibrated nitrogen 195 kg/ha');
  });
});

test('Plain Text Soil Report Generator for WhatsApp & FPO Advisory', async (t) => {
  const sampleReport = {
    farmerName: 'రామయ్య (Ramayya)',
    location: 'నల్గొండ (Nalgonda)',
    sampleDate: '12-Nov-2026',
    nutrients: {
      nitrogen: { value: 165 },
      phosphorus: { value: 14.2 },
      potassium: { value: 120 },
    },
    ph: { value: 7.8 },
    organicCarbon: { value: 0.35 },
    secondaryNutrients: { zinc: { value: 0.42 } },
  };

  await t.test('Telugu WhatsApp report generation meets length and content requirements', () => {
    const text = formatSoilReportText(sampleReport, { lang: 'te' });

    assert.ok(text.length < 1500, `Telugu report must be < 1500 chars (was ${text.length})`);
    assert.ok(text.length > 200, 'Report text should not be empty');
    assert.ok(text.includes('రామయ్య'), 'Should contain farmer name');
    assert.ok(text.includes('నల్గొండ'), 'Should contain village name');
    assert.ok(text.includes('12-Nov-2026'), 'Should contain report date');
    assert.ok(text.includes('165 kg/ha'), 'Should contain nitrogen level');
    assert.ok(text.includes('14.2 kg/ha'), 'Should contain phosphorus level');
    assert.ok(text.includes('120 kg/ha'), 'Should contain potassium level');
    assert.ok(text.includes('యూరియా'), 'Should mention Urea in fertilizer plan');
    assert.ok(text.includes('బస్తాలు'), 'Should mention bags per acre');
    assert.ok(text.includes('ICAR Soil Health Card standards'), 'Must contain ICAR disclaimer');
  });

  await t.test('Hindi WhatsApp report generation meets length and content requirements', () => {
    const text = formatSoilReportText(sampleReport, { lang: 'hi', farmerName: 'राजेश पटेल', village: 'इंदौर' });

    assert.ok(text.length < 1500, `Hindi report must be < 1500 chars (was ${text.length})`);
    assert.ok(text.includes('राजेश पटेल'), 'Should contain farmer name');
    assert.ok(text.includes('इंदौर'), 'Should contain village name');
    assert.ok(text.includes('165 kg/ha'), 'Should contain nitrogen value');
    assert.ok(text.includes('बोरी'), 'Should mention bags in Hindi');
    assert.ok(text.includes('यूरिया'), 'Should mention urea in Hindi');
    assert.ok(text.includes('ICAR Soil Health Card standards'), 'Must contain ICAR disclaimer');
  });

  await t.test('English WhatsApp report generation meets length and content requirements', () => {
    const text = formatSoilReportText(sampleReport, { lang: 'en', farmerName: 'Ramesh Patel', village: 'Kadapa' });

    assert.ok(text.length < 1500, `English report must be < 1500 chars (was ${text.length})`);
    assert.ok(text.includes('Ramesh Patel'), 'Should contain farmer name');
    assert.ok(text.includes('Kadapa'), 'Should contain village name');
    assert.ok(text.includes('165 kg/ha'), 'Should contain nitrogen value');
    assert.ok(text.includes('Bags'), 'Should specify fertilizer bags');
    assert.ok(text.includes('Ratings follow ICAR Soil Health Card standards.'), 'Must contain exact ICAR disclaimer');
  });

  await t.test('Handles empty/missing report gracefully without hardcoded numbers or errors', () => {
    const text = formatSoilReportText(null, { lang: 'en' });
    assert.ok(text.length < 1500);
    assert.ok(text.includes('Ratings follow ICAR Soil Health Card standards.'));
  });
});

test('i18n Translation Integrity & Units Preservation', async (t) => {
  const en = JSON.parse(fs.readFileSync(new URL('../src/i18n/locales/en.json', import.meta.url), 'utf8'));
  const te = JSON.parse(fs.readFileSync(new URL('../src/i18n/locales/te.json', import.meta.url), 'utf8'));
  const hi = JSON.parse(fs.readFileSync(new URL('../src/i18n/locales/hi.json', import.meta.url), 'utf8'));

  await t.test('All locales have identical top-level sections', () => {
    const enKeys = Object.keys(en).sort();
    const teKeys = Object.keys(te).sort();
    const hiKeys = Object.keys(hi).sort();
    assert.deepEqual(teKeys, enKeys);
    assert.deepEqual(hiKeys, enKeys);
  });

  await t.test('Automated Key Parity: te.json and hi.json must have every nested key present in en.json', () => {
    function getLeafKeys(obj, prefix = '') {
      let keys = [];
      for (const [k, v] of Object.entries(obj)) {
        const full = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          keys = keys.concat(getLeafKeys(v, full));
        } else {
          keys.push(full);
        }
      }
      return keys;
    }

    const enKeys = getLeafKeys(en).sort();
    const teKeys = getLeafKeys(te).sort();
    const hiKeys = getLeafKeys(hi).sort();

    const missingInTe = enKeys.filter(k => !teKeys.includes(k));
    const missingInHi = enKeys.filter(k => !hiKeys.includes(k));

    assert.equal(missingInTe.length, 0, `Telugu locale is missing keys: ${missingInTe.join(', ')}`);
    assert.equal(missingInHi.length, 0, `Hindi locale is missing keys: ${missingInHi.join(', ')}`);
  });

  await t.test('Units are preserved identically across all languages', () => {
    assert.equal(en.common.units.kgPerHa, 'kg/ha');
    assert.equal(te.common.units.kgPerHa, 'kg/ha');
    assert.equal(hi.common.units.kgPerHa, 'kg/ha');

    assert.equal(en.common.units.ppm, 'ppm');
    assert.equal(te.common.units.ppm, 'ppm');
    assert.equal(hi.common.units.ppm, 'ppm');

    assert.equal(en.common.units.percent, '%');
    assert.equal(te.common.units.percent, '%');
    assert.equal(hi.common.units.percent, '%');

    assert.equal(en.common.units.dsPerM, 'dS/m');
    assert.equal(te.common.units.dsPerM, 'dS/m');
    assert.equal(hi.common.units.dsPerM, 'dS/m');
  });

  await t.test('Nutrient ratings are localized in Telugu and Hindi', () => {
    assert.ok(te.ratings.low.includes('తక్కువ'));
    assert.ok(hi.ratings.low.includes('कम'));
    assert.ok(te.ratings.high.includes('ఎక్కువ'));
    assert.ok(hi.ratings.high.includes('अधिक'));
    assert.ok(te.ratings.deficient.includes('లోపం'));
    assert.ok(hi.ratings.deficient.includes('कमी'));
    assert.ok(te.ratings.sufficient.includes('సమృద్ధి'));
    assert.ok(hi.ratings.sufficient.includes('पर्याप्त'));
  });

  await t.test('Consistent Telugu ("నేల") and Hindi ("मिट्टी") terminology across locales', () => {
    const teRaw = JSON.stringify(te);
    const hiRaw = JSON.stringify(hi);

    // Telugu must not use transliterations or "మట్టి"
    assert.ok(!teRaw.includes('సాయిల్'), 'Telugu locale must not contain transliterated "సాయిల్"');
    assert.ok(!teRaw.includes('మట్టి'), 'Telugu locale must use "నేల" instead of "మట్టి"');
    assert.ok(!teRaw.includes('కార్డ్'), 'Telugu locale must use "కార్డు" instead of "కార్డ్"');

    // Hindi must not use transliterations or "मृदा"
    assert.ok(!hiRaw.includes('सॉइल'), 'Hindi locale must not contain transliterated "सॉइल"');
    assert.ok(!hiRaw.includes('मृदा'), 'Hindi locale must use "मिट्टी" instead of "मृदा"');

    // Verify active card translations
    assert.equal(te.dashboard.activeCard, 'ప్రస్తుత నేల కార్డు');
    assert.equal(hi.dashboard.activeCard, 'सक्रिय मिट्टी कार्ड');
  });

  await t.test('Regional date formatting with Intl.DateTimeFormat (no stray commas)', () => {
    const formattedTe = formatLocalDate('2026-11-14', 'te');
    assert.equal(formattedTe, '14 నవంబర్ 2026');
    assert.ok(!formattedTe.includes(','), 'Telugu date should not contain stray commas');

    const formattedHi = formatLocalDate('2026-11-14', 'hi');
    assert.equal(formattedHi, '14 नवंबर 2026');
    assert.ok(!formattedHi.includes(','), 'Hindi date should not contain stray commas');

    const formattedEn = formatLocalDate('2026-11-14', 'en');
    assert.equal(formattedEn, '14 November 2026');
    assert.ok(!formattedEn.includes(','), 'English date should not contain stray commas');

    // Sample date format: "15 Oct 2025"
    assert.equal(formatLocalDate('15 Oct 2025', 'te'), '15 అక్టోబర్ 2025');
    assert.equal(formatLocalDate('15 Oct 2025', 'hi'), '15 अक्टूबर 2025');
  });

  await t.test('Demo soil report localization and lab names', () => {
    function makeT(dict) {
      return (key, fallback) => {
        const parts = key.split('.');
        let cur = dict;
        for (const p of parts) {
          if (!cur || typeof cur !== 'object') return fallback || key;
          cur = cur[p];
        }
        return cur !== undefined ? cur : (fallback || key);
      };
    }

    const tTe = makeT(te);
    const tHi = makeT(hi);
    const tEn = makeT(en);

    const punjabReport = { id: 'SHC-PB-2025-0891', title: 'North Field', location: 'Punjab', labName: 'PAU' };
    const maharashtraReport = { id: 'SHC-MH-2025-4102', title: 'Canal Plot', location: 'Maharashtra', labName: 'KVK' };

    // Stable codes
    assert.equal(getReportStableCode(punjabReport), 'punjab');
    assert.equal(getReportStableCode(maharashtraReport), 'maharashtra');
    assert.equal(getReportStableCode('SHC-MH-2025-0412'), 'maharashtra');

    // Localized demo titles
    assert.ok(getReportTitle(punjabReport, tTe).includes('పంజాబ్'));
    assert.ok(getReportTitle(punjabReport, tHi).includes('पंजाब'));
    assert.ok(getReportTitle(punjabReport, tEn).includes('Punjab'));

    // Localized lab names for demo cards
    assert.equal(getReportLabName(punjabReport, tTe), 'జిల్లా నేల పరీక్ష ప్రయోగశాల, PAU క్యాంపస్, లూధియానా');
    assert.equal(getReportLabName(punjabReport, tHi), 'जिला मिट्टी परीक्षण प्रयोगशाला, PAU परिसर, लुधियाना');
    assert.equal(getReportLabName(punjabReport, tEn), 'District Soil Testing Laboratory, PAU Campus, Ludhiana');

    assert.equal(getReportLabName(maharashtraReport, tTe), 'కృషి విజ్ఞాన కేంద్రం నేల పరీక్ష ప్రయోగశాల, బారామతి');
    assert.equal(getReportLabName(maharashtraReport, tHi), 'कृषि विज्ञान केंद्र मिट्टी परीक्षण प्रयोगशाला, बारामती');

    // User-typed custom report preserves exact user values and returns empty if no lab
    const customUserReport = { id: 'custom-card-999', title: 'My Field Plot 4', location: 'Nellore', labName: 'Nellore Agri Lab' };
    assert.equal(getReportStableCode(customUserReport), null);
    assert.equal(getReportTitle(customUserReport, tTe), 'My Field Plot 4');
    assert.equal(getReportLocation(customUserReport, tTe), 'Nellore');
    assert.equal(getReportLabName(customUserReport, tTe), 'Nellore Agri Lab');

    const customReportNoLab = { id: 'custom-card-888', title: 'My Field' };
    assert.equal(getReportLabName(customReportNoLab, tTe), '');

    // Card display names and demo meta
    assert.equal(getCardDisplayName(punjabReport, tTe), '🌾 పంజాబ్ - ఒండ్రు నేల కార్డు');
    const demoMetaPunjab = getDemoCardMeta(punjabReport, tTe);
    assert.ok(demoMetaPunjab);
    assert.equal(demoMetaPunjab.title, '🌾 పంజాబ్ - ఒండ్రు నేల కార్డు');
    assert.equal(demoMetaPunjab.labName, 'జిల్లా నేల పరీక్ష ప్రయోగశాల, PAU క్యాంపస్, లూధియానా');
    assert.equal(getDemoCardMeta(customUserReport, tTe), null);
  });

  await t.test('Landing page honesty fixes: truthful stats, built for FPOs, neutral CTA, and prototype demo tags', () => {
    // 1. Truthful stats items
    assert.equal(en.landing.stats.item1Title, 'ICAR-based analysis');
    assert.equal(en.landing.stats.item2Title, '3 Languages');
    assert.equal(en.landing.stats.item3Title, 'Works offline');
    assert.ok(en.landing.stats.item2Sub.includes('English, Hindi, Telugu'));

    // Check Telugu and Hindi stats
    assert.equal(te.landing.stats.item1Title, 'ICAR-ఆధారిత విశ్లేషణ');
    assert.equal(te.landing.stats.item2Title, '3 భాషలు');
    assert.equal(te.landing.stats.item3Title, 'ఆఫ్‌లైన్‌లో పనిచేస్తుంది');

    assert.equal(hi.landing.stats.item1Title, 'ICAR-आधारित विश्लेषण');
    assert.equal(hi.landing.stats.item2Title, '3 भाषाएं');
    assert.equal(hi.landing.stats.item3Title, 'ऑफ़लाइन काम करता है');

    // Verify inflated numbers are removed
    const landingStrEn = JSON.stringify(en.landing);
    const landingStrTe = JSON.stringify(te.landing);
    const landingStrHi = JSON.stringify(hi.landing);

    assert.ok(!landingStrEn.includes('120,000+'));
    assert.ok(!landingStrTe.includes('120,000+'));
    assert.ok(!landingStrHi.includes('120,000+'));

    assert.ok(!landingStrEn.includes('3,500'));
    assert.ok(!landingStrTe.includes('3,500'));
    assert.ok(!landingStrHi.includes('3,500'));

    assert.ok(!landingStrEn.includes('Gurpreet'));
    assert.ok(!landingStrTe.includes('గుర్‌ప్రీత్'));
    assert.ok(!landingStrHi.includes('गुरप्रीत'));

    // 2. Built for FPOs section
    assert.equal(en.landing.fpo.badge, 'Built for FPOs');
    assert.ok(en.landing.fpo.desc.includes('FPO staff scan'));
    assert.ok(te.landing.fpo.desc.includes('FPO'));
    assert.ok(hi.landing.fpo.desc.includes('FPO'));

    // 3. Neutral CTAs and headlines
    assert.equal(en.landing.bottomCta.registerBtn, 'Create account');
    assert.equal(te.landing.bottomCta.registerBtn, 'ఖాతాను సృష్టించండి');
    assert.equal(hi.landing.bottomCta.registerBtn, 'खाता बनाएं');

    assert.ok(!en.landing.heroTitleHighlight.includes('Earn More'));

    // 4. Prototype demo data labels
    assert.equal(en.common.prototypeDemo, 'Prototype - demo data');
    assert.equal(te.common.prototypeDemo, 'ప్రోటోటైప్ - డెమో డేటా');
    assert.equal(hi.common.prototypeDemo, 'प्रोटोटाइप - डेमो डेटा');
  });
});
