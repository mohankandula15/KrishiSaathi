"""
KrishiSaathi Agronomy Module.
Precision Fertilizer Prescriptions & Regional Crop Suitability Recommendation Engines.
"""

from .fertilizer_engine import (
    calculate_fertilizer_prescription,
    generate_gemini_fertilizer_explanation,
    CROP_RDF_DATABASE,
    FERTILIZER_PROPERTIES
)
from .crop_engine import (
    recommend_crops_for_farm,
    CROPS_DATABASE
)

__all__ = [
    "calculate_fertilizer_prescription",
    "generate_gemini_fertilizer_explanation",
    "recommend_crops_for_farm",
    "CROP_RDF_DATABASE",
    "FERTILIZER_PROPERTIES",
    "CROPS_DATABASE"
]
