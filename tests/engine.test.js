import test from 'node:test';
import assert from 'node:assert/strict';

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

  await t.test('Default fallback lists example questions in all languages', () => {
    const teDef = answerOffline('hello', 'te', dynamicReport, 'శ్రీను');
    assert.ok(teDef.includes('శ్రీను'));
    assert.ok(teDef.includes('195 kg/ha'));

    const hiDef = answerOffline('namaste', 'hi', dynamicReport, 'किशन');
    assert.ok(hiDef.includes('किशन'));
    assert.ok(hiDef.includes('195 kg/ha'));

    const enDef = answerOffline('random question without keywords', 'en', dynamicReport, 'John');
    assert.ok(enDef.includes('John'));
    assert.ok(enDef.includes('195 kg/ha'));
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
