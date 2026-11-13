// Agricultural knowledge base & sample voice prompts for KrishiSaathi AI Assistant

export const SAMPLE_QUESTIONS = [
  {
    category: "Fertilizer Advisory",
    questions: [
      "When and how much Urea should I apply for Wheat?",
      "Can I mix Zinc Sulphate and DAP together in soil?",
      "My soil is high in Potassium, should I still add MOP?",
      "Which fertilizers should I apply when sowing Mustard?"
    ]
  },
  {
    category: "Soil Health & Crops",
    questions: [
      "How can I increase Organic Carbon in my soil?",
      "My soil pH is 7.2, what does this mean for crops?",
      "Which Rabi crops give maximum profit with low irrigation?",
      "What are the symptoms and yield loss from Zinc deficiency in paddy?"
    ]
  },
  {
    category: "Crop Protection & Pests",
    questions: [
      "How do I prevent Yellow Rust in Wheat?",
      "How to protect crops from termites and root aphids naturally?"
    ]
  }
];

export const MOCK_BOT_RESPONSES = {
  "urea": {
    text: "नमस्ते किसान भाई! आपके मिट्टी परीक्षण के अनुसार नाइट्रोजन का स्तर 185 kg/ha (कम) है। गेहूं के लिए प्रति एकड़ कुल 2.2 बोरी (100 kg) यूरिया की सिफारिश है।\n\n1. बुवाई के समय: 35 kg यूरिया (बेसल डोज)\n2. पहली सिंचाई (21-25 दिन / CRI अवस्था): 35 kg यूरिया\n3. दूसरी सिंचाई (40-45 दिन): 30 kg यूरिया\n\nसलाह: नीम-लेपित यूरिया का ही प्रयोग करें और हमेशा हल्की सिंचाई के बाद ही बुरकाव करें।",
    englishText: "Hello Farmer! According to your soil test, Nitrogen is 185 kg/ha (Deficient). For wheat, total recommended Urea is 2.2 bags (100 kg) per acre in 3 split doses:\n\n1. At Sowing: 35 kg (Basal dose)\n2. First Irrigation (21-25 days / CRI stage): 35 kg\n3. Second Irrigation (40-45 days): 30 kg\n\nTip: Always apply neem-coated urea following a light irrigation to prevent leaching.",
    audioLang: "en-IN"
  },
  "zinc": {
    text: "सावधानी किसान भाई! जिंक सल्फेट और DAP को कभी भी एक साथ मिलाकर न डालें। DAP में मौजूद फॉस्फेट और जिंक मिलकर अघुलनशील 'जिंक फॉस्फेट' बना लेते हैं, जिससे दोनों खाद बेकार हो जाती हैं।\n\nसही तरीका:\n• DAP को बुवाई के समय ड्रिल से डालें।\n• जिंक सल्फेट (21%) 10 kg प्रति एकड़ को अंतिम जुताई में अलग से मिट्टी में मिलाएं।",
    englishText: "Caution! Never mix Zinc Sulphate and DAP together. Phosphate in DAP reacts with Zinc to form insoluble Zinc Phosphate, which plants cannot absorb.\n\nCorrect method:\n• Drill DAP at sowing time with seed drill.\n• Broadcast Zinc Sulphate (21%) at 10 kg/acre separately during final land preparation.",
    audioLang: "en-IN"
  },
  "ph": {
    text: "बधाई हो! आपकी मिट्टी का pH 7.2 है, जो बिल्कुल उदासीन (Neutral) और उत्तम श्रेणी में आता है।\n• 6.5 से 7.5 के बीच का pH गेहूं, धान, मक्का और सरसों के लिए सर्वोत्तम माना जाता है।\n• इसमें नाइट्रोजन, फॉस्फोरस और पोटाश तीनों पोषक तत्व पौधे आसानी से ग्रहण कर सकते हैं।\n• आपको जिप्सम या चूना डालने की कोई आवश्यकता नहीं है।",
    englishText: "Good news! Your soil pH is 7.2, which is optimal neutral.\n\n• pH between 6.5 and 7.5 is ideal for wheat, paddy, maize, and mustard.\n• Major nutrients (N, P, K) and secondary nutrients remain freely available for root absorption.\n• No agricultural lime or gypsum application is required.",
    audioLang: "en-IN"
  },
  "organic": {
    text: "मिट्टी में जैविक कार्बन (Organic Carbon) बढ़ाने के उपाय:\n1. प्रति एकड़ 4-5 टन सड़ी हुई गोबर की खाद (FYM) या वर्मीकम्पोस्ट डालें।\n2. गर्मियों में ढैंचा की हरी खाद बोकर 45 दिन में मिट्टी में पलटें।\n3. फसल अवशेषों को कभी न जलाएं, उन्हें खेत में ही मिला दें।",
    englishText: "Recommended steps to improve Soil Organic Carbon:\n\n1. Apply 4 to 5 tonnes of well-decomposed Farm Yard Manure (FYM) or vermicompost per acre.\n2. Sow Sesbania (Dhaincha) green manure during summer and plow into the soil after 45 days.\n3. Incorporate crop residues into the soil instead of burning.",
    audioLang: "en-IN"
  },
  "default": {
    text: "नमस्ते! मैं आपका कृषि साथी AI सहायक हूँ। आपकी मृदा स्वास्थ्य रिपोर्ट के अनुसार खेत में नाइट्रोजन और जिंक की कमी है, जबकि पोटाश प्रचुर मात्रा में है। आप खाद की मात्रा, फसल चयन या फसल रोग से जुड़ा कोई भी सवाल पूछ सकते हैं।",
    englishText: "Hello! I am your KrishiSaathi AI assistant. Based on your soil report, your field needs Nitrogen and Zinc supplementation, while Potassium is already sufficient. You can ask me any question about balanced fertilizer dosages, crop choice, or soil fertility.",
    audioLang: "en-IN"
  }
};
