import re

text = """GOVERNMENTOF INDIA - OIL HEALTH CARD Lamratory District S)il Testing Lab Ludhiana Farmer Kumar I Village: Kila I Dist Ludhiana Na SHC>PB-202S0821 1 Tested: 15-ccV2025 PARAMETRIC ANALYSIS æaction (pHh 7.20 Electrical Conductivity 0.38 dS'm (OC): 0.48 % Available Nitrogen 185.0 kg/ha Available Phcsphorus (n 18.4 kg/ha Available Potasium (0:295.0 kg/ha Available Zinc (Zn): 0.45 ppm Available Sulphur (S: 12.5 ppm Available Iron (Fe): 5.4 ppm Available æron (B: 0.62 ppm Status Low Nitrcqen, Low Zinc Hlgh Potash"""

def extract_smart_param(patterns, min_val, max_val, txt):
    # Find all occurrences of any pattern
    for pat in patterns:
        for m in re.finditer(pat, txt, re.IGNORECASE):
            # Inspect the 40 characters following the match
            start_pos = m.end()
            window = txt[start_pos:start_pos+45]
            # Find all numbers in this window
            nums = re.findall(r"\b\d+(?:\.\d+)?\b", window)
            for num_str in nums:
                val = float(num_str)
                # Check directly
                if min_val <= val <= max_val:
                    return val
                # Check division for OCR missing decimal
                for div in [100.0, 10.0, 1000.0]:
                    cand = round(val / div, 2)
                    if min_val <= cand <= max_val:
                        return cand
    return None

k_patterns = [r'(?:Available\s+)?Pota[s]{1,2}ium', r'Potash', r'K2O', r'\bK\b']
print("K:", extract_smart_param(k_patterns, 40.0, 800.0, text))
