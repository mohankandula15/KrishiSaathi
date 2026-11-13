from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

# ==============================================================================
# FARMER MODELS
# ==============================================================================

class FarmerRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    mobile_number: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=4, max_length=100)
    village: Optional[str] = None
    district: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    preferred_language: str = Field(default="en", max_length=10)

class FarmerLogin(BaseModel):
    mobile_number: str
    password: str

class FarmerResponse(BaseModel):
    id: str
    name: str
    mobile_number: str
    village: Optional[str] = None
    district: str
    state: str
    preferred_language: str
    created_at: Optional[str] = None

class FarmerUpdate(BaseModel):
    name: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    preferred_language: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    farmer: FarmerResponse

# ==============================================================================
# SOIL REPORT MODELS
# ==============================================================================

class SoilReportCreate(BaseModel):
    report_name: str
    file_url: Optional[str] = None
    extracted_soil_data: Dict[str, Any] = Field(default_factory=dict)

class SoilExtractionResponse(BaseModel):
    file_url: Optional[str] = None
    report_name: str
    extracted_soil_data: Dict[str, Any]
    avg_confidence: float
    requires_confirmation: bool
    missing_core: List[str]

class SoilReportResponse(BaseModel):
    id: str
    farmer_id: str
    report_name: str
    file_url: Optional[str] = None
    upload_date: str
    extracted_soil_data: Dict[str, Any]

# ==============================================================================
# RECOMMENDATION MODELS
# ==============================================================================

class RecommendationCreate(BaseModel):
    soil_report_id: Optional[str] = None
    fertilizer_details: Dict[str, Any] = Field(default_factory=dict)
    crop_details: List[Dict[str, Any]] = Field(default_factory=list)

class RecommendationResponse(BaseModel):
    id: str
    farmer_id: str
    soil_report_id: Optional[str] = None
    fertilizer_details: Dict[str, Any]
    crop_details: List[Dict[str, Any]]
    created_at: str

# ------------------------------------------------------------------------------
# Precision Fertilizer & Crop Calculation Payloads
# ------------------------------------------------------------------------------

class FertilizerCalculationRequest(BaseModel):
    soil_report_id: Optional[str] = None
    crop_name: str = "Wheat"
    acreage: float = 1.0
    area_unit: str = "acre"
    soil_data: Optional[Dict[str, Any]] = None
    language: str = "en"

class FertilizerCalculationResponse(BaseModel):
    crop_name: str
    crop_display: str
    acreage: float
    hectares: float
    area_unit: str
    stcr_summary: Dict[str, Any]
    fertilizer_plan: List[Dict[str, Any]]
    application_schedule: List[Dict[str, Any]]
    warnings: List[str]
    totals: Dict[str, Any]
    ai_explanation: str

class CropRecommendationRequest(BaseModel):
    soil_report_id: Optional[str] = None
    state: Optional[str] = "Andhra Pradesh"
    district: Optional[str] = "Guntur"
    water_availability: Optional[str] = "Medium"
    season: Optional[str] = "All"
    soil_data: Optional[Dict[str, Any]] = None

class CropRecommendationResponse(BaseModel):
    location: Dict[str, str]
    soil_context: Dict[str, Any]
    recommended_crops: List[Dict[str, Any]]
    total_analyzed: int

# ==============================================================================
# CHAT HISTORY MODELS
# ==============================================================================

class ChatMessageCreate(BaseModel):
    message: str
    language: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: str
    farmer_id: str
    message: str
    response: str
    language: str
    timestamp: str
