from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List, Optional
from ..models import (
    RecommendationResponse, 
    RecommendationCreate,
    FertilizerCalculationRequest,
    FertilizerCalculationResponse,
    CropRecommendationRequest,
    CropRecommendationResponse
)
from ..database import db
from ..dependencies import get_current_farmer
from ..agronomy import (
    calculate_fertilizer_prescription,
    generate_gemini_fertilizer_explanation,
    recommend_crops_for_farm,
    CROP_RDF_DATABASE,
    CROPS_DATABASE
)

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("/", response_model=List[RecommendationResponse])
def get_my_recommendations(current_farmer: Dict[str, Any] = Depends(get_current_farmer)):
    """Retrieve all recommendations generated for the current farmer."""
    return db.get_recommendations_by_farmer(current_farmer["id"])


@router.get("/report/{soil_report_id}", response_model=RecommendationResponse)
def get_recommendations_for_report(
    soil_report_id: str,
    current_farmer: Dict[str, Any] = Depends(get_current_farmer)
):
    """
    Retrieve recommendations for a specific soil report.
    AUTHORIZATION: Enforces that the soil report belongs to the current farmer.
    """
    report = db.get_soil_report_by_id(soil_report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Soil report not found")

    if str(report["farmer_id"]) != str(current_farmer["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot access recommendations for another farmer's report."
        )

    rec = db.get_recommendation_by_report(soil_report_id, current_farmer["id"])
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendations not found for this report")

    return rec


@router.post("/", response_model=RecommendationResponse, status_code=status.HTTP_201_CREATED)
def create_recommendation(
    rec_input: RecommendationCreate,
    current_farmer: Dict[str, Any] = Depends(get_current_farmer)
):
    """Save or update custom recommendations for a farmer's report."""
    if rec_input.soil_report_id:
        report = db.get_soil_report_by_id(rec_input.soil_report_id)
        if report and str(report["farmer_id"]) != str(current_farmer["id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Cannot attach recommendation to another farmer's report."
            )

    return db.create_recommendation(current_farmer["id"], rec_input.model_dump())


# ==============================================================================
# INTELLIGENT FERTILIZER RECOMMENDATION ENDPOINT
# ==============================================================================

@router.post("/calculate-fertilizer", response_model=FertilizerCalculationResponse)
def calculate_fertilizer_endpoint(
    req: FertilizerCalculationRequest,
    current_farmer: Dict[str, Any] = Depends(get_current_farmer)
):
    """
    Calculates precise, non-arbitrary fertilizer requirements using:
    - Actual soil test results (pH, N, P, K, micronutrients).
    - Crop-specific Recommended Dose of Fertilizer (RDF).
    - Soil Test Crop Response (STCR) adjustment.
    - Deduction of duplicate Nitrogen contributed by DAP.
    - Liming / Gypsum calculations based on pH.
    - Gemini AI / Agronomic explanation in simple language.
    Persists recommendation in database.
    """
    soil_data = req.soil_data or {}

    # If soil_report_id is provided, fetch actual data from database
    if req.soil_report_id:
        report = db.get_soil_report_by_id(req.soil_report_id)
        if report:
            if str(report["farmer_id"]) != str(current_farmer["id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: Cannot access another farmer's soil report."
                )
            extracted = report.get("extracted_soil_data", {})
            if isinstance(extracted, dict) and extracted:
                soil_data = extracted

    # Farmer location context
    location = {
        "state": current_farmer.get("state", "Andhra Pradesh"),
        "district": current_farmer.get("district", "Guntur")
    }

    # Run calculation engine
    prescription = calculate_fertilizer_prescription(
        soil_data=soil_data,
        crop_name=req.crop_name,
        acreage=req.acreage,
        area_unit=req.area_unit,
        farmer_location=location
    )

    # Generate Gemini AI conversational explanation
    farmer_name = current_farmer.get("name", "Farmer")
    ai_expl = generate_gemini_fertilizer_explanation(
        prescription=prescription,
        farmer_name=farmer_name,
        language=req.language or current_farmer.get("preferred_language", "en")
    )
    prescription["ai_explanation"] = ai_expl

    # Persist or update in database
    try:
        fertilizer_payload = {
            "crop": prescription["crop_name"],
            "acreage": prescription["acreage"],
            "plan": prescription["fertilizer_plan"],
            "schedule": prescription["application_schedule"],
            "totals": prescription["totals"],
            "ai_explanation": ai_expl,
            "warnings": prescription["warnings"]
        }
        
        # Check if recommendation already exists for this report
        if req.soil_report_id:
            existing = db.get_recommendation_by_report(req.soil_report_id, current_farmer["id"])
            if existing:
                # Update existing
                db.create_recommendation(current_farmer["id"], {
                    "soil_report_id": req.soil_report_id,
                    "fertilizer_details": fertilizer_payload,
                    "crop_details": existing.get("crop_details", [])
                })
            else:
                db.create_recommendation(current_farmer["id"], {
                    "soil_report_id": req.soil_report_id,
                    "fertilizer_details": fertilizer_payload,
                    "crop_details": []
                })
    except Exception as e:
        print(f"Database recommendation persistence notice: {e}")

    return prescription


# ==============================================================================
# INTELLIGENT CROP RECOMMENDATION ENDPOINT
# ==============================================================================

@router.post("/calculate-crops", response_model=CropRecommendationResponse)
def calculate_crops_endpoint(
    req: CropRecommendationRequest,
    current_farmer: Dict[str, Any] = Depends(get_current_farmer)
):
    """
    Suggests suitable crops based on:
    - Soil parameters (pH, N, P, K, soil type, organic carbon).
    - Location (State and District, prioritizing Andhra Pradesh).
    - Water availability (Low / Medium / High).
    - Current season (Kharif / Rabi / Summer / All).
    Returns ranked crops with suitability score, why recommended,
    varieties, potential yield, indicative return, and precautions.
    Persists recommendation in database.
    """
    soil_data = req.soil_data or {}

    # If soil_report_id is provided, fetch actual data from database
    if req.soil_report_id:
        report = db.get_soil_report_by_id(req.soil_report_id)
        if report:
            if str(report["farmer_id"]) != str(current_farmer["id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: Cannot access another farmer's soil report."
                )
            extracted = report.get("extracted_soil_data", {})
            if isinstance(extracted, dict) and extracted:
                soil_data = extracted

    state = req.state or current_farmer.get("state") or "Andhra Pradesh"
    district = req.district or current_farmer.get("district") or "Guntur"
    water_avail = req.water_availability or "Medium"
    season = req.season or "All"

    crop_recs = recommend_crops_for_farm(
        soil_data=soil_data,
        location_state=state,
        location_district=district,
        water_availability=water_avail,
        season=season
    )

    # Persist in database
    try:
        if req.soil_report_id:
            existing = db.get_recommendation_by_report(req.soil_report_id, current_farmer["id"])
            fert_details = existing.get("fertilizer_details", {}) if existing else {}
            db.create_recommendation(current_farmer["id"], {
                "soil_report_id": req.soil_report_id,
                "fertilizer_details": fert_details,
                "crop_details": crop_recs["recommended_crops"]
            })
    except Exception as e:
        print(f"Crop recommendations database persistence notice: {e}")

    return crop_recs


# ==============================================================================
# SUPPORTED CROPS CATALOG
# ==============================================================================

@router.get("/supported-crops")
def get_supported_crops():
    """Returns all supported crops with regional suitability tags."""
    catalog = []
    for k, v in CROP_RDF_DATABASE.items():
        catalog.append({
            "key": k,
            "name": v["displayName"],
            "season": v["season"],
            "category": v["category"],
            "rdf": f"{int(v['rdf_n'])}:{int(v['rdf_p'])}:{int(v['rdf_k'])} N-P-K kg/ha"
        })
    return catalog
