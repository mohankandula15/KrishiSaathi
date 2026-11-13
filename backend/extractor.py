"""
KrishiSaathi Soil Health Report Extraction and Agronomic Analysis Engine.
Extracts macro- and micronutrients from PDF and Image (JPG, JPEG, PNG) reports.
Performs scientific classification against ICAR standards.
"""

import re
import os
import io
from typing import Dict, Any, Optional, Tuple, List
from pathlib import Path

# PDF parsing
import pypdf
import pypdfium2 as pdfium
from PIL import Image

# Windows native OCR via winocr if available
try:
    import winocr
    HAS_WINOCR = True
except Exception:
    HAS_WINOCR = False


# ==============================================================================
# 1. OCR & TEXT EXTRACTION HELPERS
# ==============================================================================

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using pypdf and fallback to pypdfium2."""
    text_content = []

    # Method 1: pypdf native text extraction
    try:
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted and extracted.strip():
                text_content.append(extracted)
    except Exception as e:
        print(f"pypdf extraction error: {e}")

    combined = "\n".join(text_content).strip()
    if len(combined) > 50:
        return combined

    # Method 2: pypdfium2 native text extraction
    try:
        pdf = pdfium.PdfDocument(pdf_path)
        pypdfium_text = []
        for page in pdf:
            textpage = page.get_textpage()
            txt = textpage.get_text_range()
            if txt and txt.strip():
                pypdfium_text.append(txt)
        
        pdfium_combined = "\n".join(pypdfium_text).strip()
        if len(pdfium_combined) > 50:
            return pdfium_combined
    except Exception as e:
        print(f"pypdfium2 extraction error: {e}")

    # Method 3: Scanned PDF -> render pages to images and OCR
    if HAS_WINOCR:
        try:
            pdf = pdfium.PdfDocument(pdf_path)
            ocr_text = []
            for i, page in enumerate(pdf):
                if i >= 3: # scan first 3 pages max
                    break
                pil_image = page.render(scale=2).to_pil()
                txt = run_image_ocr_pil(pil_image)
                if txt:
                    ocr_text.append(txt)
            if ocr_text:
                return "\n".join(ocr_text)
        except Exception as e:
            print(f"PDF OCR rendering error: {e}")

    return combined


def run_image_ocr_pil(image: Image.Image) -> str:
    """Run OCR on a PIL Image using winocr."""
    if not HAS_WINOCR:
        return ""
    try:
        res = winocr.recognize_pil_sync(image, lang="en")
        if isinstance(res, dict) and "text" in res:
            return res["text"]
        return str(res)
    except Exception as e:
        print(f"winocr recognize_pil_sync error: {e}")
        return ""


def extract_text_from_image(image_path: str) -> str:
    """Extract text from JPG/PNG image file using winocr."""
    if not HAS_WINOCR:
        return ""
    try:
        img = Image.open(image_path)
        return run_image_ocr_pil(img)
    except Exception as e:
        print(f"Image OCR error for {image_path}: {e}")
        return ""


def extract_text_from_file(file_path: str) -> str:
    """Unified file text extractor supporting PDF, JPG, JPEG, PNG."""
    path = Path(file_path)
    ext = path.suffix.lower()

    if ext == ".pdf":
        return extract_text_from_pdf(str(path))
    elif ext in [".jpg", ".jpeg", ".png"]:
        return extract_text_from_image(str(path))
    else:
        return extract_text_from_pdf(str(path))


# ==============================================================================
# 2. SCIENTIFIC THRESHOLDS & AGRONOMIC CLASSIFICATIONS (ICAR STANDARDS)
# ==============================================================================

def classify_nitrogen(val: Optional[float]) -> Tuple[Optional[str], str]:
    if val is None:
        return None, "Not Available"
    if val < 280.0:
        return "Low", "Deficient in active root zone. Apply Neem-coated Urea in 3 split doses."
    elif val <= 560.0:
        return "Medium", "Optimal availability. Standard basal & top-dressing recommended."
    else:
        return "High", "High reserves. Reduce Urea application by 20% to avoid lodging."


def classify_phosphorus(val: Optional[float]) -> Tuple[Optional[str], str]:
    if val is None:
        return None, "Not Available"
    if val < 14.0:
        return "Low", "Deficient. Drill 50-60 kg DAP/acre at sowing; use PSB bio-fertilizer."
    elif val <= 28.0:
        return "Medium", "Optimal availability. Standard basal DAP dose (40-45 kg) is adequate."
    else:
        return "High", "High reserves. Reduce phosphatic fertilizer to prevent zinc antagonism."


def classify_potassium(val: Optional[float]) -> Tuple[Optional[str], str]:
    if val is None:
        return None, "Not Available"
    if val < 135.0:
        return "Low", "Deficient. Apply 40 kg MOP (Muriate of Potash) per acre."
    elif val <= 280.0:
        return "Medium", "Optimal potassium levels for sturdy stalks and disease resistance."
    else:
        return "High", "High natural reserves. Cut MOP dose by 50% to save ₹1,000 - ₹1,500/acre."


def classify_ph(val: Optional[float]) -> Tuple[Optional[str], str]:
    if val is None:
        return None, "Not Available"
    if val < 5.5:
        return "Strongly acidic", "Strongly acidic. Apply 1.5 - 2 tonnes agricultural lime/calcite per acre."
    elif val < 6.5:
        return "Moderately acidic", "Moderately acidic. Favor acid-tolerant crops or apply light dolomite."
    elif val <= 7.5:
        return "Neutral", "Ideal neutral range. Optimal availability for macronutrients and micronutrients."
    elif val <= 8.5:
        return "Alkaline", "Moderately alkaline. Incorporate green manure (Dhaincha) and agricultural gypsum."
    else:
        return "Strongly alkaline", "Strongly alkaline/sodic. Mandatory gypsum reclamation and improved drainage required."


def classify_organic_carbon(val: Optional[float]) -> Tuple[Optional[str], str]:
    if val is None:
        return None, "Not Available"
    if val < 0.50:
        return "Low", "Low organic matter. Apply 4 to 5 tonnes FYM or vermicompost per acre."
    elif val <= 0.75:
        return "Medium", "Adequate organic carbon. Maintain with crop residue retention."
    else:
        return "High", "Rich organic matter promoting excellent microbial biodiversity."


def classify_electrical_conductivity(val: Optional[float]) -> Tuple[Optional[str], str]:
    if val is None:
        return None, "Not Available"
    if val < 1.0:
        return "Normal", "Normal non-saline condition. Zero salinity stress on seeds or roots."
    elif val <= 2.0:
        return "Slightly saline", "Slight salinity. Ensure adequate drainage and avoid brackish groundwater."
    else:
        return "Saline", "Saline soil. Leaching with good quality irrigation water required."


def classify_zinc(val: Optional[float]) -> Tuple[Optional[str], str]:
    if val is None:
        return None, "Not Available"
    if val < 0.60:
        return "Low", "Deficient (<0.60 ppm). Apply 10 kg Zinc Sulphate (21%) per acre during final plowing."
    else:
        return "Medium", "Sufficient zinc availability for grain development and enzyme activation."


def classify_sulphur(val: Optional[float]) -> Tuple[Optional[str], str]:
    if val is None:
        return None, "Not Available"
    if val < 10.0:
        return "Low", "Deficient (<10 ppm). Apply 15 kg agricultural Sulphur/SSP to boost oil/protein."
    elif val <= 20.0:
        return "Medium", "Adequate sulphur availability for cereal and oilseed crops."
    else:
        return "High", "High sulphur reserves."


def classify_iron(val: Optional[float]) -> Tuple[Optional[str], str]:
    if val is None:
        return None, "Not Available"
    if val < 4.5:
        return "Low", "Deficient (<4.5 ppm). Foliar spray of 0.5% Ferrous Sulphate recommended."
    else:
        return "Medium", "Sufficient iron reserves for chlorophyll synthesis."


def classify_boron(val: Optional[float]) -> Tuple[Optional[str], str]:
    if val is None:
        return None, "Not Available"
    if val < 0.50:
        return "Low", "Deficient (<0.50 ppm). Apply 2 kg Borax/acre for proper pollen and fruit set."
    else:
        return "Medium", "Sufficient boron levels."


def classify_copper(val: Optional[float]) -> Tuple[Optional[str], str]:
    if val is None:
        return None, "Not Available"
    if val < 0.20:
        return "Low", "Deficient (<0.20 ppm). Apply Copper Sulphate 1 kg/acre."
    else:
        return "Medium", "Sufficient copper reserves."


def classify_manganese(val: Optional[float]) -> Tuple[Optional[str], str]:
    if val is None:
        return None, "Not Available"
    if val < 2.0:
        return "Low", "Deficient (<2.0 ppm). Foliar spray of 0.5% Manganese Sulphate advised."
    else:
        return "Medium", "Sufficient manganese reserves."


# ==============================================================================
# 3. ROBUST PARAMETER EXTRACTION ENGINE
# ==============================================================================

def extract_parameter_from_text(
    text: str, 
    patterns: List[str], 
    min_val: float, 
    max_val: float,
    window_chars: int = 50
) -> Tuple[Optional[float], float, bool]:
    """
    Search text for agricultural parameters using bounded window matching.
    Looks for candidate numbers following keyword matches and normalizes OCR artifacts.
    Returns: (value, confidence, is_missing)
    NEVER invents a value. If not found, returns (None, 0.0, True).
    """
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            start_pos = m.end()
            window = text[start_pos : start_pos + window_chars]
            
            # Find numbers in the immediate window, ignoring date years (e.g. 2024, 2025) and sample numbers
            matches = re.finditer(r"\b(\d+(?:\.\d+)?)\b", window)
            for num_m in matches:
                num_str = num_m.group(1)
                
                # Skip 4-digit years
                if len(num_str) == 4 and (num_str.startswith("20") or num_str.startswith("19")):
                    continue
                
                # Skip date patterns like 15-Oct or 15/10
                end_idx = num_m.end()
                if end_idx < len(window) and window[end_idx] in ['-', '/', '\\']:
                    continue
                start_idx = num_m.start()
                if start_idx > 0 and window[start_idx - 1] in ['-', '/', '\\']:
                    continue

                try:
                    raw_val = float(num_str)
                except Exception:
                    continue
                
                # Direct range check
                if min_val <= raw_val <= max_val:
                    return raw_val, 0.95, False
                
                # Check OCR decimal shift (e.g. 720 for 7.2, 048 for 0.48)
                for div in [100.0, 10.0, 1000.0]:
                    cand = round(raw_val / div, 2)
                    if min_val <= cand <= max_val:
                        return cand, 0.88, False

    return None, 0.0, True


def extract_soil_data_from_raw_text(text: str) -> Dict[str, Any]:
    """
    Main extraction parser identifying all macro and micronutrients.
    Strictly preserves missing status; never invents missing data.
    """
    # 1. Nitrogen (N) (Range: 50 to 900 kg/ha)
    n_val, n_conf, n_miss = extract_parameter_from_text(
        text, 
        [r'(?:Available\s+)?Nitr\w+', r'\(N\)', r'\bN\b\s*[:\-=]', r'N\s*\(kg/ha\)', r'उपलब्ध\s*नाइट्रोजन'], 
        min_val=50.0, 
        max_val=900.0
    )
    n_rating, n_adv = classify_nitrogen(n_val)

    # 2. Phosphorus (P) (Range: 2.0 to 150 kg/ha)
    p_val, p_conf, p_miss = extract_parameter_from_text(
        text, 
        [r'(?:Available\s+)?Ph\w*ph\w*', r'Phosphate', r'P2O5', r'\(P\)', r'\bP\b\s*[:\-=]', r'P\s*\(kg/ha\)', r'फास्फोरस'], 
        min_val=2.0, 
        max_val=150.0
    )
    p_rating, p_adv = classify_phosphorus(p_val)

    # 3. Potassium (K) (Range: 40 to 800 kg/ha)
    k_val, k_conf, k_miss = extract_parameter_from_text(
        text, 
        [r'(?:Available\s+)?Pota\w+', r'Potash', r'K2O', r'\(K\)', r'\bK\b\s*[:\-=]', r'K\s*\(kg/ha\)', r'पोटाश'], 
        min_val=40.0, 
        max_val=800.0
    )
    k_rating, k_adv = classify_potassium(k_val)

    # 4. Soil pH (Range: 4.0 to 10.5)
    ph_val, ph_conf, ph_miss = extract_parameter_from_text(
        text, 
        [r'Soil\s*pH', r'æaction[^\d]{1,10}?pH', r'\bpH\b', r'Reaction\s*\(pH\)', r'पीएच'], 
        min_val=4.0, 
        max_val=10.5
    )
    ph_rating, ph_adv = classify_ph(ph_val)

    # 5. Organic Carbon (OC) (Range: 0.05 to 4.5 %)
    oc_val, oc_conf, oc_miss = extract_parameter_from_text(
        text, 
        [r'Organic\s*Carbon', r'Total\s*Organic\s*Carbon', r'TOC', r'\bOC\b', r'\(OC\)', r'\(CC\)', r'जैविक\s*कार्बन'], 
        min_val=0.05, 
        max_val=4.5
    )
    oc_rating, oc_adv = classify_organic_carbon(oc_val)

    # 6. Electrical Conductivity (EC) (Range: 0.05 to 15.0 dS/m)
    ec_val, ec_conf, ec_miss = extract_parameter_from_text(
        text, 
        [r'Electrical\s*Conductivity', r'Soluble\s*Salts', r'\bEC\b', r'\(EC\)', r'लवणता'], 
        min_val=0.05, 
        max_val=15.0
    )
    ec_rating, ec_adv = classify_electrical_conductivity(ec_val)

    # 7. Zinc (Zn) (Range: 0.05 to 15.0 ppm)
    zn_val, zn_conf, zn_miss = extract_parameter_from_text(
        text, 
        [r'(?:Available\s+)?Zinc', r'\(Zn\)', r'\bZn\b\s*[:\-=]', r'\bZn\b', r'जिंक'], 
        min_val=0.05, 
        max_val=15.0
    )
    zn_rating, zn_adv = classify_zinc(zn_val)

    # 8. Sulphur (S) (Range: 1.0 to 100.0 ppm)
    s_val, s_conf, s_miss = extract_parameter_from_text(
        text, 
        [r'(?:Available\s+)?Sulph\w*', r'(?:Available\s+)?Sulf\w*', r'SO4', r'\(S\)', r'\bS\b\s*[:\-=]', r'सल्फर'], 
        min_val=1.0, 
        max_val=100.0
    )
    s_rating, s_adv = classify_sulphur(s_val)

    # 9. Iron (Fe) (Range: 0.5 to 50.0 ppm)
    fe_val, fe_conf, fe_miss = extract_parameter_from_text(
        text, 
        [r'(?:Available\s+)?Iron', r'\(Fe\)', r'\bFe\b\s*[:\-=]', r'\bFe\b', r'लोहा'], 
        min_val=0.5, 
        max_val=50.0
    )
    fe_rating, fe_adv = classify_iron(fe_val)

    # 10. Boron (B) (Range: 0.05 to 10.0 ppm)
    b_val, b_conf, b_miss = extract_parameter_from_text(
        text, 
        [r'(?:Available\s+)?Boron', r'æron', r'Available\s*\([B38]\)', r'\(B\)', r'\bB\b\s*[:\-=]', r'बोरान'], 
        min_val=0.05, 
        max_val=10.0
    )
    b_rating, b_adv = classify_boron(b_val)

    # 11. Copper (Cu) (Range: 0.05 to 10.0 ppm)
    cu_val, cu_conf, cu_miss = extract_parameter_from_text(
        text, 
        [r'(?:Available\s+)?Copper', r'\(Cu\)', r'\bCu\b\s*[:\-=]', r'\bCu\b', r'तांबा'], 
        min_val=0.05, 
        max_val=10.0
    )
    cu_rating, cu_adv = classify_copper(cu_val)

    # 12. Manganese (Mn) (Range: 0.5 to 40.0 ppm)
    mn_val, mn_conf, mn_miss = extract_parameter_from_text(
        text, 
        [r'(?:Available\s+)?Manganese', r'\(Mn\)', r'\bMn\b\s*[:\-=]', r'\bMn\b', r'मैंगनीज'], 
        min_val=0.5, 
        max_val=40.0
    )
    mn_rating, mn_adv = classify_manganese(mn_val)

    # Calculate overall confidence & missing metrics
    primary_confidences = [n_conf, p_conf, k_conf, ph_conf, oc_conf]
    avg_confidence = sum(primary_confidences) / len(primary_confidences) if primary_confidences else 0.0
    
    # Needs confirmation if any core nutrient is missing or confidence < 0.75
    missing_core = [k for k, miss in [("N", n_miss), ("P", p_miss), ("K", k_miss), ("pH", ph_miss)] if miss]
    requires_confirmation = (len(missing_core) > 0) or (avg_confidence < 0.75)

    # Calculate health score (0 to 100)
    score_components = []
    if n_val is not None:
        score_components.append(min(n_val / 350.0, 1.2) * 20.0)
    else:
        score_components.append(10.0)

    if p_val is not None:
        score_components.append(min(p_val / 22.0, 1.2) * 20.0)
    else:
        score_components.append(10.0)

    if k_val is not None:
        score_components.append(min(k_val / 240.0, 1.1) * 20.0)
    else:
        score_components.append(12.0)

    if ph_val is not None:
        ph_penalty = abs(ph_val - 7.0) * 8.0
        score_components.append(max(20.0 - ph_penalty, 5.0))
    else:
        score_components.append(10.0)

    if oc_val is not None:
        score_components.append(min(oc_val / 0.75, 1.2) * 20.0)
    else:
        score_components.append(10.0)

    health_score = int(min(max(sum(score_components), 30), 98))

    # Overall diagnostic summary text
    status_summary = []
    if n_rating == "Low":
        status_summary.append("Nitrogen Deficient")
    if p_rating == "Low":
        status_summary.append("Phosphorus Deficient")
    if zn_rating == "Low":
        status_summary.append("Zinc Deficient")
    if ph_rating in ["Strongly acidic", "Moderately acidic"]:
        status_summary.append("Acidic Soil")
    elif ph_rating in ["Alkaline", "Strongly alkaline"]:
        status_summary.append("Alkaline Soil")

    if not status_summary:
        overall_status = "Balanced Soil Health - Standard Maintenance"
    else:
        overall_status = f"Action Required: {', '.join(status_summary)}"

    return {
        "healthScore": health_score,
        "overallStatus": overall_status,
        "soilType": "Alluvial Sandy Loam" if (ph_val or 7.0) < 7.6 else "Medium Black Soil",
        "avg_confidence": round(avg_confidence, 2),
        "requires_confirmation": requires_confirmation,
        "missing_core": missing_core,
        "raw_text_snippet": text[:400] if text else "",
        
        # Primary Parameters
        "nitrogen": {
            "symbol": "N",
            "name": "Available Nitrogen",
            "value": n_val,
            "unit": "kg/ha",
            "rating": n_rating,
            "confidence": round(n_conf, 2),
            "is_missing": n_miss,
            "idealRange": "280 - 560 kg/ha",
            "benchmark": 350.0,
            "advisory": n_adv
        },
        "phosphorus": {
            "symbol": "P",
            "name": "Available Phosphorus",
            "value": p_val,
            "unit": "kg/ha",
            "rating": p_rating,
            "confidence": round(p_conf, 2),
            "is_missing": p_miss,
            "idealRange": "14 - 28 kg/ha",
            "benchmark": 22.0,
            "advisory": p_adv
        },
        "potassium": {
            "symbol": "K",
            "name": "Available Potassium",
            "value": k_val,
            "unit": "kg/ha",
            "rating": k_rating,
            "confidence": round(k_conf, 2),
            "is_missing": k_miss,
            "idealRange": "135 - 280 kg/ha",
            "benchmark": 240.0,
            "advisory": k_adv
        },
        "ph": {
            "name": "Soil Reaction (pH)",
            "value": ph_val,
            "unit": "",
            "rating": ph_rating,
            "confidence": round(ph_conf, 2),
            "is_missing": ph_miss,
            "idealRange": "6.5 - 7.5",
            "benchmark": 7.0,
            "advisory": ph_adv
        },
        "organic_carbon": {
            "name": "Organic Carbon (OC)",
            "value": oc_val,
            "unit": "%",
            "rating": oc_rating,
            "confidence": round(oc_conf, 2),
            "is_missing": oc_miss,
            "idealRange": "0.50% - 0.75%",
            "benchmark": 0.65,
            "advisory": oc_adv
        },
        "ec": {
            "name": "Electrical Conductivity",
            "value": ec_val,
            "unit": "dS/m",
            "rating": ec_rating,
            "confidence": round(ec_conf, 2),
            "is_missing": ec_miss,
            "idealRange": "< 1.0 dS/m",
            "benchmark": 0.50,
            "advisory": ec_adv
        },

        # Micronutrients
        "micronutrients": {
            "zinc": {
                "symbol": "Zn",
                "name": "Zinc",
                "value": zn_val,
                "unit": "ppm",
                "rating": zn_rating,
                "confidence": round(zn_conf, 2),
                "is_missing": zn_miss,
                "benchmark": 0.60,
                "advisory": zn_adv
            },
            "sulphur": {
                "symbol": "S",
                "name": "Sulphur",
                "value": s_val,
                "unit": "ppm",
                "rating": s_rating,
                "confidence": round(s_conf, 2),
                "is_missing": s_miss,
                "benchmark": 15.0,
                "advisory": s_adv
            },
            "iron": {
                "symbol": "Fe",
                "name": "Iron",
                "value": fe_val,
                "unit": "ppm",
                "rating": fe_rating,
                "confidence": round(fe_conf, 2),
                "is_missing": fe_miss,
                "benchmark": 4.5,
                "advisory": fe_adv
            },
            "boron": {
                "symbol": "B",
                "name": "Boron",
                "value": b_val,
                "unit": "ppm",
                "rating": b_rating,
                "confidence": round(b_conf, 2),
                "is_missing": b_miss,
                "benchmark": 0.50,
                "advisory": b_adv
            },
            "copper": {
                "symbol": "Cu",
                "name": "Copper",
                "value": cu_val,
                "unit": "ppm",
                "rating": cu_rating,
                "confidence": round(cu_conf, 2),
                "is_missing": cu_miss,
                "benchmark": 0.20,
                "advisory": cu_adv
            },
            "manganese": {
                "symbol": "Mn",
                "name": "Manganese",
                "value": mn_val,
                "unit": "ppm",
                "rating": mn_rating,
                "confidence": round(mn_conf, 2),
                "is_missing": mn_miss,
                "benchmark": 2.0,
                "advisory": mn_adv
            }
        }
    }


def process_soil_file_and_extract(file_path: str) -> Dict[str, Any]:
    """Top-level pipeline processing uploaded file and extracting parameters."""
    raw_text = extract_text_from_file(file_path)
    return extract_soil_data_from_raw_text(raw_text)
