import os
import re
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List, Optional
from ..models import ChatMessageCreate, ChatMessageResponse
from ..database import db
from ..dependencies import get_current_farmer
from ..config import settings

router = APIRouter(prefix="/api/chat", tags=["AI Conversation History"])

# ==============================================================================
# MULTILINGUAL LANGUAGE DETECTION ENGINE
# ==============================================================================

TELUGU_SCRIPT_REGEX = re.compile(r"[\u0C00-\u0C7F]")
DEVANAGARI_SCRIPT_REGEX = re.compile(r"[\u0900-\u097F]")

TELUGU_MARKERS = {
    "lo", "undhi", "undi", "undha", "takkuva", "takkuvaga", "takkuve",
    "ekkuva", "ekkuvaga", "em", "emi", "cheyyali", "cheyali", "cheyocchu",
    "cheyyocha", "panta", "pantalu", "matti", "nela", "neela", "polam",
    "eruvulu", "eruvu", "ela", "eppudu", "elaga", "naa", "nenu", "chudandi",
    "vesukovali", "veskovali", "veyyali", "saram", "balam", "paristhiti",
    "kavali", "ledu", "chesuko", "raithu", "rythu", "bhaswaram", "sukshma",
    "poshakalu", "garu", "namaskaram", "gurinchi", "valla", "baga", "manchidi",
    "entha", "enni", "kadiri", "pasupu", "mirapa", "kalipi"
}

STRONG_TELUGU_MARKERS = {
    "undhi", "undi", "undha", "takkuvaga", "takkuva", "takkuve", "ekkuvaga", "ekkuva",
    "cheyyali", "cheyali", "cheyocchu", "cheyyocha", "pantalu", "panta",
    "veskovali", "vesukovali", "veyyali", "neela", "eruvulu", "paristhiti",
    "namaskaram", "chesuko", "kadiri", "kalipi"
}

HINDI_MARKERS = {
    "kya", "kare", "kaise", "kyun", "mera", "meri", "mere", "khet", "mitti",
    "khad", "kam", "jyada", "batao", "chahiye", "fasal", "dalo", "dalna",
    "kisan", "paani", "rog", "sthiti", "namaste", "ji", "kitna", "kitni",
    "kaun", "kaunsi", "upay", "accha", "acchi", "karun", "karna", "de", "dena"
}

STRONG_HINDI_MARKERS = {
    "kare", "kaise", "khet", "mitti", "khad", "chahiye", "fasal", "batao",
    "namaste", "kitna", "kitni", "upay", "karun", "dalna"
}

def detect_language(text: str, preferred_lang: Optional[str] = None) -> str:
    """
    Detect whether the farmer is speaking/typing Telugu, Hindi, or English.
    1. If text contains Telugu script (U+0C00-U+0C7F), return 'te'.
    2. If text contains Devanagari script (U+0900-U+097F), return 'hi'.
    3. If text contains strong Telugu transliteration (Tanglish), return 'te'.
    4. If text contains strong Hindi transliteration (Hinglish), return 'hi'.
    5. If text is general and farmer selected a preferred language, honor that preference.
    6. Defaults to 'en' only if text is pure English and no regional preference is set.
    """
    clean_text = (text or "").strip()
    if not clean_text:
        return preferred_lang or "en"

    # Step 1: Native Script Recognition (100% certainty)
    if TELUGU_SCRIPT_REGEX.search(clean_text):
        return "te"
    if DEVANAGARI_SCRIPT_REGEX.search(clean_text):
        return "hi"

    # Step 2: Transliteration / Phonetic Keyword matching
    words = set(re.findall(r"[a-zA-Z]+", clean_text.lower()))

    has_strong_te = bool(words.intersection(STRONG_TELUGU_MARKERS))
    te_count = len(words.intersection(TELUGU_MARKERS))

    has_strong_hi = bool(words.intersection(STRONG_HINDI_MARKERS))
    hi_count = len(words.intersection(HINDI_MARKERS))

    # Distinct transliteration markers override English default
    if has_strong_te or te_count >= 2:
        return "te"
    if has_strong_hi or hi_count >= 2:
        return "hi"

    # Step 3: Farmer's selected/preferred language
    if preferred_lang:
        p = preferred_lang.lower().strip()
        if "te" in p or "tel" in p:
            return "te"
        if "hi" in p or "hin" in p:
            return "hi"
        if "en" in p or "eng" in p:
            return "en"

    # Step 4: Single transliteration token match if no preference was set
    if te_count > hi_count and te_count > 0:
        return "te"
    if hi_count > te_count and hi_count > 0:
        return "hi"

    return "en"


def get_farmer_soil_context(farmer_id: str) -> Dict[str, Any]:
    """Retrieve the farmer's latest confirmed soil test report and recommendations."""
    reports = db.get_soil_reports_by_farmer(farmer_id)
    if not reports:
        # Default baseline if no report has been uploaded yet
        return {
            "has_report": False,
            "report_name": "No Report Uploaded",
            "soil_type": "Alluvial Loam",
            "ph": 7.2,
            "ph_rating": "Neutral",
            "oc": 0.48,
            "oc_rating": "Low",
            "n": 185.0,
            "n_rating": "Low",
            "p": 18.4,
            "p_rating": "Medium",
            "k": 295.0,
            "k_rating": "High",
            "zn": 0.45,
            "zn_rating": "Low",
            "s": 12.5,
            "s_rating": "Medium",
            "top_crops": ["Groundnut (కదిరి 6)", "Paddy (BPT 5204)", "Cotton", "Chilli"],
            "urea_bags": 2.2,
            "dap_bags": 1.0,
            "mop_bags": 0.3
        }

    latest = reports[0]
    extracted = latest.get("extracted_soil_data", {})
    if not isinstance(extracted, dict):
        extracted = {}

    ph_obj = extracted.get("ph", {})
    ph_val = ph_obj.get("value") if isinstance(ph_obj, dict) else 7.2
    ph_rating = ph_obj.get("rating") if isinstance(ph_obj, dict) else "Neutral"

    oc_obj = extracted.get("organic_carbon", {})
    oc_val = oc_obj.get("value") if isinstance(oc_obj, dict) else 0.48
    oc_rating = oc_obj.get("rating") if isinstance(oc_obj, dict) else "Low"

    n_obj = extracted.get("nitrogen", {})
    n_val = n_obj.get("value") if isinstance(n_obj, dict) else 185.0
    n_rating = n_obj.get("rating") if isinstance(n_obj, dict) else "Low"

    p_obj = extracted.get("phosphorus", {})
    p_val = p_obj.get("value") if isinstance(p_obj, dict) else 18.4
    p_rating = p_obj.get("rating") if isinstance(p_obj, dict) else "Medium"

    k_obj = extracted.get("potassium", {})
    k_val = k_obj.get("value") if isinstance(k_obj, dict) else 295.0
    k_rating = k_obj.get("rating") if isinstance(k_obj, dict) else "High"

    micro = extracted.get("micronutrients", {})
    zn_val = micro.get("zinc", {}).get("value") if isinstance(micro, dict) else 0.45
    s_val = micro.get("sulphur", {}).get("value") if isinstance(micro, dict) else 12.5

    # Check recommendations
    recs = db.get_recommendation_by_report(latest["id"], farmer_id)
    top_crops = []
    urea_bags = 2.2
    dap_bags = 1.0
    mop_bags = 0.3

    if recs:
        c_details = recs.get("crop_details", [])
        if isinstance(c_details, list) and c_details:
            top_crops = [c.get("name") or c.get("crop") for c in c_details[:4] if isinstance(c, dict)]
        f_details = recs.get("fertilizer_details", {})
        if isinstance(f_details, dict):
            totals = f_details.get("totals", {})
            urea_bags = totals.get("urea_bags", 2.2)
            dap_bags = totals.get("dap_bags", 1.0)
            mop_bags = totals.get("mop_bags", 0.3)

    if not top_crops:
        top_crops = ["Groundnut / Peanut (వేరుశనగ)", "Paddy (వరి)", "Cotton (ప్రత్తి)", "Chilli (మిరప)"]

    return {
        "has_report": True,
        "report_name": latest.get("report_name", "Soil Health Card"),
        "soil_type": extracted.get("soilType", "Alluvial Loam"),
        "ph": ph_val,
        "ph_rating": ph_rating,
        "oc": oc_val,
        "oc_rating": oc_rating,
        "n": n_val,
        "n_rating": n_rating,
        "p": p_val,
        "p_rating": p_rating,
        "k": k_val,
        "k_rating": k_rating,
        "zn": zn_val,
        "zn_rating": "Low" if (zn_val and zn_val < 0.60) else "Optimal",
        "s": s_val,
        "s_rating": "Low" if (s_val and s_val < 15.0) else "Optimal",
        "top_crops": top_crops,
        "urea_bags": urea_bags,
        "dap_bags": dap_bags,
        "mop_bags": mop_bags
    }


def generate_multilingual_fallback_response(
    query: str,
    farmer: Dict[str, Any],
    soil: Dict[str, Any],
    lang: str = "te"
) -> str:
    """
    Intelligent agronomy engine providing native, highly contextual agricultural guidance
    in Telugu (తెలుగు), Hindi (हिंदी), and English when Gemini API is offline or unkeyed.
    """
    text = query.lower()
    farmer_name = farmer.get("name", "రైతు" if lang == "te" else ("किसान" if lang == "hi" else "Farmer"))
    district = farmer.get("district", "గుంటూరు" if lang == "te" else "Guntur")
    state = farmer.get("state", "ఆంధ్రప్రదేశ్" if lang == "te" else "Andhra Pradesh")

    # --------------------------------------------------------------------------
    # 1. TELUGU ADVISORY ENGINE (తెలుగు)
    # --------------------------------------------------------------------------
    if lang == "te":
        # Case A: Nitrogen / Urea / నత్రజని / యూరియా / takkuva
        if any(w in text for w in ["nitrogen", "నత్రజని", "యూరియా", "urea", "takkuva", "తక్కువ", "లోపం", "deficien"]):
            return (
                f"నమస్కారం {farmer_name} గారు! 🙏\n\n"
                f"మీ నేల పరీక్ష ప్రకారం నత్రజని (Nitrogen) {soil['n']} kg/ha మాత్రమే ఉంది. ఇది సిఫార్సు చేసిన 280 kg/ha కంటే తక్కువ (లోపం).\n\n"
                "నత్రజని లోపాన్ని సరిచేయడానికి శాస్త్రీయ సూచనలు:\n"
                f"1. యూరియా మోతాదు: మీ పొలానికి ఎకరానికి సుమారు {soil['urea_bags']} బస్తాల (45 kg) వేప పూత పూసిన యూరియా అవసరం. దీనిని ఒకేసారి వేయకుండా 3 దఫాలుగా వేయాలి:\n"
                "   • విత్తే సమయంలో (బాసల్): 35 కిలోలు\n"
                "   • మొదటి తడి తర్వాత (21-25 రోజులకు): 35 కిలోలు\n"
                "   • చిరుపొట్ట/పిలకల దశలో (45 రోజులకు): 30 కిలోలు\n"
                "2. పచ్చిరొట్ట ఎరువులు: వేసవిలో జనుము లేదా జీలుగ పంటను సాగు చేసి పూత దశలో (45 రోజులకు) నేలలో కలియదున్నండి. దీనివల్ల 25-30 కిలోల నత్రజని సహజంగా పెరుగుతుంది.\n"
                "3. సేంద్రీయ ఎరువు: ఎకరానికి 4-5 టన్నుల పశువుల ఎరువు (FYM) లేదా వర్మీ కంపోస్ట్ వేయండి.\n\n"
                "గమనిక: DAP వాడుతున్నట్లయితే, అందులోని 18% నత్రజనిని పరిగణనలోకి తీసుకుని యూరియా మోతాదు తగ్గించండి."
            )

        # Case B: Crop Recommendations / పంటలు / ఏ పంట వేయాలి / panta
        elif any(w in text for w in ["crop", "crops", "పంట", "పంటలు", "panta", "pantalu", "veyyali", "వేయాలి", "suitab", "which crop"]):
            crops_str = "\n".join([f"• {c}" for c in soil["top_crops"][:4]])
            return (
                f"నమస్కారం {farmer_name} గారు! 🌾\n\n"
                f"మీ నేల లక్షణాలు (pH {soil['ph']} - {soil['ph_rating']}, {soil['soil_type']}) మరియు {district}, {state} ప్రాంత వాతావరణం ఆధారంగా సిఫార్సు చేసిన ఉత్తమ పంటలు:\n\n"
                f"{crops_str}\n\n"
                "ఎందుకు ఈ పంటలు అనుకూలం?\n"
                f"1. వేరుశనగ (కదిరి 6, కదిరి 9, ధరణి): మీ నేలలో నత్రజని తక్కువగా ఉన్నందున, లెగ్యూమ్ జాతికి చెందిన వేరుశనగ గాలిలోని నత్రజనిని వేరుబొడిపెల ద్వారా నేలలో స్థిరీకరించి నేల బలాన్ని పెంచుతుంది.\n"
                "2. ప్రత్తి & మిరప: గుంటూరు మరియు రాయలసీమ నల్లరేగడి/గరిప నేలలకు అధిక లాభదాయకం.\n\n"
                "రైతు భరోసా కేంద్రం (RBK) లేదా మీ గ్రామ వ్యవసాయ సహాయకుడిని సంప్రదించి ధృవీకరించిన విత్తనాలను మాత్రమే ఎంచుకోండి."
            )

        # Case C: Soil Condition / పరిస్థితి / health / fertility
        elif any(w in text for w in ["condition", "పరిస్థితి", "paristhiti", "health", "సారం", "బలం", "fertility", "overall", "రిపోర్ట్"]):
            return (
                f"నమస్కారం {farmer_name} గారు! మీ నేల ఆరోగ్య కార్డు ({soil['report_name']}) విశ్లేషణ:\n\n"
                f"• నేల రకం: {soil['soil_type']}\n"
                f"• pH విలువ: {soil['ph']} ({soil['ph_rating']}) — తటస్థంగా మరియు చాలా అనుకూలంగా ఉంది\n"
                f"• సేంద్రీయ కర్బనం (Organic Carbon): {soil['oc']}% ({soil['oc_rating']})\n"
                f"• నత్రజని (Nitrogen): {soil['n']} kg/ha ({soil['n_rating']} — లోపం)\n"
                f"• భాస్వరం (Phosphorus): {soil['p']} kg/ha ({soil['p_rating']})\n"
                f"• పొటాష్ (Potassium): {soil['k']} kg/ha ({soil['k_rating']} — సమృద్ధి)\n"
                f"• జింక్ (Zinc): {soil['zn']} ppm ({soil['zn_rating']})\n\n"
                "సారాంశం: మీ నేలలో పొటాష్ పుష్కలంగా ఉంది, కాబట్టి MOP ఎరువును 50% తగ్గించి ఖర్చు ఆదా చేసుకోవచ్చు. అయితే నత్రజని మరియు జింక్ లోపాలను సరిదిద్దడం అత్యంత అవసరం."
            )

        # Case D: pH / ఆమ్ల / క్షార / alkaline / acidic
        elif any(w in text for w in ["ph", "పిహెచ్", "alkaline", "acidic", "క్షార", "ఆమ్ల", "gypsum", "జిప్సం", "lime", "సున్నం"]):
            if soil['ph'] > 7.8:
                return (
                    f"మీ నేల pH విలువ {soil['ph']} గా ఉంది, ఇది క్షార (Alkaline) స్వభావాన్ని సూచిస్తుంది.\n\n"
                    "క్షార నేలల యాజమాన్యం:\n"
                    "1. ఎకరానికి 500 నుండి 1,000 కిలోల వ్యవసాయ జిప్సం వేసి, పొలాన్ని కలియదున్ని నీరు నిలగట్టి తర్వాత మురుగు నీటిని బయటకు తీసివేయాలి.\n"
                    "2. పచ్చిరొట్ట ఎరువులైన జీలుగ సాగు చేయడం వల్ల విడుదలయ్యే సేంద్రీయ ఆమ్లాలు నేల క్షారత్వాన్ని తగ్గిస్తాయి."
                )
            elif soil['ph'] < 6.5:
                return (
                    f"మీ నేల pH విలువ {soil['ph']} గా ఉంది, ఇది ఆమ్ల (Acidic) స్వభావాన్ని సూచిస్తుంది.\n\n"
                    "ఆమ్ల నేలల యాజమాన్యం:\n"
                    "విత్తే 3-4 వారాల ముందు ఎకరానికి 500 కిలోల వ్యవసాయ సున్నం (Lime) వేసి దున్నడం వల్ల అల్యూమినియం విషప్రభావం తొలగి, భాస్వరం మొక్కలకు సులభంగా అందుతుంది."
                )
            else:
                return (
                    f"మీ నేల pH విలువ {soil['ph']} గా ఉంది, ఇది ఉత్తమమైన తటస్థ (Neutral 6.5 - 7.5) శ్రేణిలో ఉంది. "
                    "ఈ pH వద్ద ప్రధాన పోషకాలు (N, P, K) మరియు సూక్ష్మ పోషకాలు మొక్కల వేర్లకు సులభంగా అందుతాయి. "
                    "మీరు జిప్సం లేదా సున్నం వేయనవసరం లేదు."
                )

        # Case E: Zinc & DAP Safety / జింక్ / dap
        elif any(w in text for w in ["zinc", "జింక్", "dap", "డిఎపి", "mix", "కలపవచ్చా", "kalipi"]):
            return (
                f"ముఖ్యమైన భద్రతా హెచ్చరిక {farmer_name} గారు! ⚠️\n\n"
                "DAP మరియు జింక్ సల్ఫేట్ (Zinc Sulphate) లను ఎట్టి పరిస్థితుల్లోనూ కలిపి ఒకేసారి వేయకూడదు!\n\n"
                "ఎందుకు వేయకూడదు?\n"
                "DAP లోని ఫాస్ఫేట్ మరియు జింక్ కలిసిపోయి కరగని 'జింక్ ఫాస్ఫేట్' గా మారుతుంది. దీనివల్ల రెండు ఎరువులు వృధా అయి మొక్కల వేర్లకు పోషకాలు అందవు.\n\n"
                "సరైన పద్ధతి:\n"
                "• DAP ని విత్తే సమయంలో విత్తన గొర్రుతో నేలలో 5 సెం.మీ లోతులో వేయాలి.\n"
                "• జింక్ సల్ఫేట్ (21%) ఎకరానికి 10 కిలోలను ఆఖరి దుక్కిలో విడిగా చల్లి కలియదున్నాలి."
            )

        # Case F: Organic Carbon / సేంద్రీయ కర్బనం / పెంచాలి
        elif any(w in text for w in ["carbon", "కర్బనం", "karbanam", "oc", "సేంద్రీయ", "sendriya", "organic"]):
            return (
                f"నమస్కారం {farmer_name} గారు! 🌱\n\n"
                f"మీ నేలలో సేంద్రీయ కర్బనం (Organic Carbon) {soil['oc']}% గా ఉంది ({soil['oc_rating']} — తక్కువ). సారవంతమైన నేలకు కనీసం 0.75% కర్బనం ఉండాలి.\n\n"
                "సేంద్రీయ కర్బనాన్ని పెంచడానికి ఆచరణాత్మక పద్ధతులు:\n"
                "1. పశువుల ఎరువు (FYM): విత్తే ముందు ఎకరానికి 4 నుండి 5 టన్నుల బాగా కుళ్లిన పశువుల ఎరువు లేదా 2 టన్నుల వర్మీ కంపోస్ట్ వేయండి.\n"
                "2. పచ్చిరొట్ట పైర్లు: ఖరీఫ్ ముందు లేదా వేసవిలో జనుము, జీలుగ లేదా పిల్లిపెసర సాగు చేసి 45-50 రోజులకు పూత దశలో భూమిలో కలియదున్నండి. ఇది నేలలో సేంద్రీయ కర్బనాన్ని వేగంగా పెంచుతుంది.\n"
                "3. పంట వ్యర్థాల యాజమాన్యం: పంట కొయ్యలు, చొప్ప తగులబెట్టకుండా రోటవేటర్‌తో నేలలో కలిపి వేయండి.\n\n"
                "సేంద్రీయ కర్బనం పెరిగితే నేల నీటి నిల్వ సామర్థ్యం మరియు సూక్ష్మజీవుల సంఖ్య పెరిగి పంట దిగుబడి రెట్టింపవుతుంది."
            )

        # Default Telugu Response
        else:
            return (
                f"నమస్కారం {farmer_name} గారు! మీ ప్రశ్న '{query}' కి సంబంధించి:\n\n"
                f"మీ {district} ప్రాంత నేల పరీక్ష ప్రకారం నత్రజని తక్కువగా ఉంది ({soil['n']} kg/ha) మరియు pH {soil['ph']} గా ఉంది. "
                "సమతుల్య ఎరువుల యాజమాన్యం పాటించడం మరియు తగిన సమయంలో సాగునీరు అందించడం ద్వారా దిగుబడిని 15-20% పెంచుకోవచ్చు.\n\n"
                "మరిన్ని వివరాల కోసం మీ రైతు భరోసా కేంద్రం (RBK) లేదా డ్యాష్‌బోర్డ్‌లోని ఎరువుల కాలిక్యులేటర్‌ను చూడండి."
            )

    # --------------------------------------------------------------------------
    # 2. HINDI ADVISORY ENGINE (हिंदी)
    # --------------------------------------------------------------------------
    elif lang == "hi":
        if any(w in text for w in ["nitrogen", "नाइट्रोजन", "यूरिया", "urea", "कम", "kam"]):
            return (
                f"नमस्ते {farmer_name} जी! 🙏\n\n"
                f"आपके मिट्टी स्वास्थ्य कार्ड के अनुसार नाइट्रोजन (Nitrogen) का स्तर {soil['n']} kg/ha है, जो अनुशंसित स्तर (280 kg/ha) से कम है।\n\n"
                "नाइट्रोजन की कमी दूर करने के उपाय:\n"
                f"1. यूरिया की मात्रा: प्रति एकड़ लगभग {soil['urea_bags']} बोरी (45 kg) नीम-लेपित यूरिया 3 खुराकों में दें:\n"
                "   • बुवाई के समय (बेसल): 35 kg\n"
                "   • पहली सिंचाई (CRI अवस्था - 21-25 दिन): 35 kg\n"
                "   • दूसरी सिंचाई (45 दिन): 30 kg\n"
                "2. हरी खाद: गर्मियों में ढैंचा या सनई की फसल बोकर 45 दिन में मिट्टी में पलटें।\n"
                "3. गोबर की खाद: 4-5 टन सड़ी हुई देसी खाद या वर्मीकम्पोस्ट अवश्य डालें।\n\n"
                "सुझाव: यदि DAP डाल रहे हैं तो यूरिया की मात्रा उसी अनुसार घटाएं।"
            )
        elif any(w in text for w in ["crop", "crops", "फसल", "fasal", "बोएं", "suitab"]):
            crops_str = "\n".join([f"• {c}" for c in soil["top_crops"][:4]])
            return (
                f"नमस्ते {farmer_name} जी! 🌾\n\n"
                f"आपकी मिट्टी के प्रकार ({soil['soil_type']}) और pH {soil['ph']} के आधार पर {district}, {state} के लिए सर्वश्रेष्ठ अनुशंसित फसलें:\n\n"
                f"{crops_str}\n\n"
                "कारण: मूंगफली/दलहनी फसलें मिट्टी में नाइट्रोजन की प्राकृतिक आपूर्ति करती हैं। हमेशा प्रमाणित बीज का ही प्रयोग करें।"
            )
        elif any(w in text for w in ["condition", "स्थिति", "sthiti", "स्वास्थ्य", "उर्वरता", "report"]):
            return (
                f"नमस्ते {farmer_name} जी! आपकी मिट्टी ({soil['report_name']}) की स्थिति:\n\n"
                f"• pH: {soil['ph']} ({soil['ph_rating']}) — उत्तम एवं अनुकूल\n"
                f"• जैविक कार्बन: {soil['oc']}% ({soil['oc_rating']})\n"
                f"• नाइट्रोजन: {soil['n']} kg/ha (कमी)\n"
                f"• पोटाश: {soil['k']} kg/ha (प्रचुर मात्रा)\n"
                f"• जिंक: {soil['zn']} ppm (कमी)\n\n"
                "सलाह: पोटाश भरपूर है, इसलिए MOP खाद में 50% की कटौती कर प्रति एकड़ ₹1,200 बचाएं।"
            )
        elif any(w in text for w in ["zinc", "जिंक", "dap", "डीएपी"]):
            return (
                f"सावधानी किसान भाई {farmer_name} जी! ⚠️\n\n"
                "DAP और जिंक सल्फेट को कभी भी एक साथ मिलाकर न डालें!\n\n"
                "दोनों को मिलाने से अघुलनशील 'जिंक फॉस्फेट' बन जाता है, जिससे पौधे दोनों को नहीं ले पाते। "
                "DAP बुवाई के समय ड्रिल से डालें और जिंक सल्फेट (21%) 10 kg/एकड़ अंतिम जुताई में अलग से मिट्टी में मिलाएं।"
            )
        elif any(w in text for w in ["carbon", "कार्बन", "karban", "जैविक", "jaivik", "organic"]):
            return (
                f"नमस्ते {farmer_name} जी! 🌱\n\n"
                f"आपकी मिट्टी में जैविक कार्बन (Organic Carbon) {soil['oc']}% है ({soil['oc_rating']} — कम)। अच्छी उपजाऊ मिट्टी के लिए यह कम से कम 0.75% होना चाहिए।\n\n"
                "जैविक कार्बन बढ़ाने के उपाय:\n"
                "1. गोबर की खाद: बुवाई से पहले प्रति एकड़ 4-5 टन सड़ी हुई देसी गोबर की खाद या 2 टन केंचुआ खाद (वर्मीकम्पोस्ट) डालें।\n"
                "2. हरी खाद: ढैंचा या सनई की बुवाई करें और 45 दिन बाद फूल आने पर मिट्टी में जुताई कर मिला दें।\n"
                "3. फसल अवशेष न जलाएं: नरवाई या पराली को रोटावेटर से मिट्टी में मिला दें।\n\n"
                "इससे मिट्टी की जल धारण क्षमता बढ़ेगी और फसल उत्पादन में वृद्धि होगी।"
            )
        else:
            return (
                f"नमस्ते {farmer_name} जी! आपके सवाल '{query}' के लिए कृषि मार्गदर्शन:\n\n"
                f"आपके क्षेत्र ({district}, {state}) में आपकी मिट्टी के pH {soil['ph']} के अनुसार संतुलित उर्वरक प्रबंधन और समय पर सिंचाई करने से पैदावार में 15-20% की बढ़ोतरी संभव है।"
            )

    # --------------------------------------------------------------------------
    # 3. ENGLISH ADVISORY ENGINE
    # --------------------------------------------------------------------------
    else:
        if any(w in text for w in ["nitrogen", "urea", "low", "deficient"]):
            return (
                f"Hello {farmer_name}! Based on your confirmed soil health card ({soil['report_name']}), "
                f"Available Nitrogen is {soil['n']} kg/ha, which is below the optimal threshold of 280 kg/ha.\n\n"
                "Precision Agronomic Solutions:\n"
                f"1. Neem-Coated Urea: Apply {soil['urea_bags']} bags (45 kg) per acre in 3 growth-stage splits:\n"
                "   • Basal (At Sowing): 35 kg\n"
                "   • 1st Irrigation (CRI stage / 21-25 days): 35 kg\n"
                "   • Tillering stage (40-45 days): 30 kg\n"
                "2. Green Manuring: Practice summer green manuring with Sesbania (Dhaincha) to add 25-30 kg biological N naturally.\n"
                "3. Farmyard Manure: Incorporate 4 to 5 tonnes of well-decomposed FYM or vermicompost per acre.\n\n"
                "Safety Note: Since DAP contributes 18% starter N, deduct this from your Urea to avoid excessive vegetative growth."
            )
        elif any(w in text for w in ["crop", "crops", "grow", "recommend", "suitable"]):
            crops_str = "\n".join([f"• {c}" for c in soil["top_crops"][:4]])
            return (
                f"Hello {farmer_name}! Based on your soil pH ({soil['ph']} - {soil['ph_rating']}), "
                f"{soil['soil_type']} structure, and {district}, {state} conditions, here are the top scientifically matched crops:\n\n"
                f"{crops_str}\n\n"
                "Why recommended? Leguminous crops like Groundnut (Kadiri 6 / Dharani) actively fix atmospheric nitrogen via root nodules, "
                "naturally overcoming your soil nitrogen deficit while yielding high commercial returns."
            )
        elif any(w in text for w in ["condition", "health", "fertility", "report", "status"]):
            return (
                f"Hello {farmer_name}! Here is your soil health diagnostic summary:\n\n"
                f"• Soil Type: {soil['soil_type']}\n"
                f"• Reaction (pH): {soil['ph']} ({soil['ph_rating']}) — Optimal for nutrient uptake\n"
                f"• Organic Carbon: {soil['oc']}% ({soil['oc_rating']})\n"
                f"• Nitrogen (N): {soil['n']} kg/ha (Deficient)\n"
                f"• Phosphorus (P): {soil['p']} kg/ha ({soil['p_rating']})\n"
                f"• Potassium (K): {soil['k']} kg/ha (Rich reserves)\n"
                f"• Zinc (Zn): {soil['zn']} ppm (Deficient)\n\n"
                "Action Plan: Cut Potash (MOP) application by 50% to save ₹1,200/acre. Supplement Nitrogen and Zinc to achieve peak crop yields."
            )
        elif any(w in text for w in ["zinc", "dap", "mix"]):
            return (
                f"Critical Agronomic Warning {farmer_name}! ⚠️\n\n"
                "NEVER mix Zinc Sulphate and DAP together in the same drill or container.\n\n"
                "Chemical Conflict: Water-soluble phosphate in DAP reacts instantaneously with zinc to form insoluble Zinc Phosphate precipitate, "
                "locking both nutrients away from root uptake.\n\n"
                "Correct Practice: Drill DAP 5cm beneath seeds at planting, and broadcast Zinc Sulphate (21%) at 10 kg/acre separately during final plowing."
            )
        elif any(w in text for w in ["carbon", "organic", "oc"]):
            return (
                f"Hello {farmer_name}! 🌱\n\n"
                f"Your soil Organic Carbon is {soil['oc']}% ({soil['oc_rating']} — Low). Healthy, fertile soil requires at least 0.75% Organic Carbon.\n\n"
                "Agronomic Practices to Increase Soil Organic Carbon:\n"
                "1. Farmyard Manure (FYM): Incorporate 4-5 tonnes of well-decomposed FYM or 2 tonnes of vermicompost per acre before sowing.\n"
                "2. Green Manuring: Sow Sesbania (Dhaincha) or Sunhemp during summer and incorporate into the soil at 45-50 days before the main crop.\n"
                "3. Crop Residue Recycling: Never burn stubble or straw; shred and incorporate residues into the topsoil using a rotavator.\n\n"
                "Boosting Organic Carbon enhances microbial activity, water retention, and fertilizer use efficiency."
            )
        else:
            return (
                f"Hello {farmer_name}! For your query '{query}':\n\n"
                f"Based on your soil diagnostic card ({soil['report_name']}) in {district}, {state}, "
                f"your neutral pH ({soil['ph']}) provides an excellent base for cereal and pulse cultivation. "
                "Refer to the Fertilizer Calculator on your dashboard for exact per-acre bag schedules."
            )


def generate_agricultural_ai_response(
    query: str,
    farmer: Dict[str, Any],
    soil: Dict[str, Any],
    lang: str = "te"
) -> str:
    """
    Main KRISHISAATHI AI Generation Pipeline.
    Attempts Google Gemini API (gemini-2.5-flash) first when GEMINI_API_KEY is configured.
    Seamlessly falls back to our domain agronomy engine if offline or unkeyed.
    """
    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)

            farmer_name = farmer.get("name", "రైతు" if lang == "te" else ("किसान" if lang == "hi" else "Farmer"))

            lang_instructions = {
                "te": (
                    "CRITICAL REQUIREMENT: Your entire response MUST be written in 100% Telugu script (తెలుగు లిపి). "
                    "Do NOT output English sentences or English explanations. "
                    "Even if the farmer typed or spoke in Tanglish (Romanized English letters like 'My soil lo nitrogen takkuvaga undhi. Em cheyyali?'), "
                    f"you MUST respond fully in polite, simple, natural conversational Telugu script. Address the farmer as '{farmer_name} గారు'. "
                    "Use simple, farmer-friendly terms: నమస్కారం, నత్రజని, యూరియా, పచ్చిరొట్ట ఎరువులు, సేంద్రీయ ఎరువు."
                ),
                "hi": (
                    "CRITICAL REQUIREMENT: Your entire response MUST be written in 100% Devanagari Hindi script (हिंदी लिपि). "
                    "Do NOT output English sentences. "
                    "Even if the farmer asked in Hinglish, you MUST respond fully in natural, simple, respectful conversational Hindi. "
                    f"Address the farmer as '{farmer_name} जी'."
                ),
                "en": (
                    "Respond in encouraging, clear, friendly agricultural English without overwhelming technical jargon. "
                    f"Address the farmer as '{farmer_name}'."
                )
            }

            instr = lang_instructions.get(lang, lang_instructions["te"])
            crops_list = ", ".join(soil.get("top_crops", []))

            system_context = f"""
            You are 'KrishiSaathi AI' (కృషిసాథి / कृषिशाथी), an expert agricultural and soil science advisor talking to an Indian farmer named {farmer.get('name', 'Farmer')} in {farmer.get('district', 'District')}, {farmer.get('state', 'Andhra Pradesh')}.

            FARMER'S CONFIRMED SOIL TEST REPORT:
            - Report Name: {soil.get('report_name')}
            - Soil Type: {soil.get('soil_type')}
            - pH: {soil.get('ph')} ({soil.get('ph_rating')})
            - Organic Carbon: {soil.get('oc')}% ({soil.get('oc_rating')})
            - Available Nitrogen (N): {soil.get('n')} kg/ha ({soil.get('n_rating')}) [Benchmark: 280-560 kg/ha]
            - Available Phosphorus (P): {soil.get('p')} kg/ha ({soil.get('p_rating')}) [Benchmark: 14-28 kg/ha]
            - Available Potassium (K): {soil.get('k')} kg/ha ({soil.get('k_rating')}) [Benchmark: 135-280 kg/ha]
            - Available Zinc (Zn): {soil.get('zn')} ppm ({soil.get('zn_rating')})
            - Available Sulphur (S): {soil.get('s')} ppm ({soil.get('s_rating')})
            - Top Ranked Crops for this field: {crops_list}
            - Calibrated Urea Dosage: {soil.get('urea_bags')} bags (45kg/acre)
            - Calibrated DAP Dosage: {soil.get('dap_bags')} bags (50kg/acre)
            - Calibrated MOP Dosage: {soil.get('mop_bags')} bags (50kg/acre)

            RULES:
            1. Language instruction: {instr}
            2. Ground your answer in the farmer's actual soil report data above. Never invent fake nutrient values.
            3. If Nitrogen is low, recommend Neem-Coated Urea in 3 splits and organic manure, reminding that DAP already supplies starter N.
            4. If Potassium is high, advise reducing MOP by 50% to save input cost.
            5. Mandatory Precaution: Never mix Zinc Sulphate and DAP together.
            6. Keep the response concise (2-3 short paragraphs), warm, actionable, and suitable for text-to-speech voice playback.
            """

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=f"{system_context}\n\nFarmer Query: {query}"
            )
            if response and response.text and len(response.text.strip()) > 15:
                return response.text.strip()
        except Exception as e:
            print(f"Gemini API generation error (using domain agronomy fallback): {e}")

    # Fallback to domain agronomy engine
    return generate_multilingual_fallback_response(query, farmer, soil, lang=lang)


# ==============================================================================
# ROUTE HANDLERS
# ==============================================================================

@router.get("/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    limit: int = 50,
    current_farmer: Dict[str, Any] = Depends(get_current_farmer)
):
    """Retrieve chat conversation history strictly belonging to the authenticated farmer."""
    return db.get_chat_history_by_farmer(current_farmer["id"], limit=limit)


@router.post("/send", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_chat_message(
    chat_input: ChatMessageCreate,
    current_farmer: Dict[str, Any] = Depends(get_current_farmer)
):
    """
    Process farmer query in Telugu, Hindi, or English.
    Detects language accurately from speech recognition or text, integrates actual
    soil health report values, and returns authentic regional advice.
    """
    msg = chat_input.message.strip()
    if not msg:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    # Accurately detect language from input script/phonetics or farmer's selected preference
    preferred_lang = chat_input.language or current_farmer.get("preferred_language")
    detected_lang = detect_language(msg, preferred_lang=preferred_lang)

    # Fetch farmer's soil context
    soil_context = get_farmer_soil_context(current_farmer["id"])

    # Generate response strictly in the detected language
    response_text = generate_agricultural_ai_response(
        query=msg,
        farmer=current_farmer,
        soil=soil_context,
        lang=detected_lang
    )

    # Persist in database with the matched language
    created_chat = db.create_chat_message(
        farmer_id=current_farmer["id"],
        message=msg,
        response=response_text,
        language=detected_lang
    )

    return created_chat


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
def clear_chat_history(current_farmer: Dict[str, Any] = Depends(get_current_farmer)):
    """Clear conversation history for the current farmer."""
    db.clear_chat_history_by_farmer(current_farmer["id"])
    return None
