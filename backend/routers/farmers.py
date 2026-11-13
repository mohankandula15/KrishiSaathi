from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from ..models import FarmerResponse, FarmerUpdate
from ..database import db
from ..dependencies import get_current_farmer

router = APIRouter(prefix="/api/farmers", tags=["Farmer Profile"])

@router.get("/profile", response_model=FarmerResponse)
def get_profile(current_farmer: Dict[str, Any] = Depends(get_current_farmer)):
    """Get profile of current logged-in farmer."""
    return current_farmer

@router.put("/profile", response_model=FarmerResponse)
def update_profile(
    update_data: FarmerUpdate, 
    current_farmer: Dict[str, Any] = Depends(get_current_farmer)
):
    """Update profile fields (location, village, district, state, preferred language)."""
    updated = db.update_farmer_profile(current_farmer["id"], update_data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmer profile not found")
    return updated
