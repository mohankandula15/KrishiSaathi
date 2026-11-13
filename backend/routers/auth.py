from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any
from ..models import FarmerRegister, FarmerLogin, TokenResponse, FarmerResponse
from ..security import hash_password, verify_password, create_access_token
from ..database import db
from ..dependencies import get_current_farmer

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(farmer_data: FarmerRegister):
    """Register a new farmer with secure bcrypt password hashing."""
    # Check if mobile already exists
    existing = db.get_farmer_by_mobile(farmer_data.mobile_number)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="यह मोबाइल नंबर पहले से पंजीकृत है (Mobile number already registered)"
        )

    # Securely hash password
    hashed_pwd = hash_password(farmer_data.password)

    new_farmer_payload = {
        "name": farmer_data.name,
        "mobile_number": farmer_data.mobile_number,
        "password_hash": hashed_pwd,
        "village": farmer_data.village,
        "district": farmer_data.district,
        "state": farmer_data.state,
        "preferred_language": farmer_data.preferred_language or "en"
    }

    farmer = db.create_farmer(new_farmer_payload)

    # Create JWT access token
    access_token = create_access_token({"sub": str(farmer["id"]), "mobile": farmer["mobile_number"]})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "farmer": farmer
    }

@router.post("/login", response_model=TokenResponse)
def login(credentials: FarmerLogin):
    """Authenticate farmer by mobile number and password."""
    farmer = db.get_farmer_by_mobile(credentials.mobile_number)
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="अमान्य मोबाइल नंबर या पासवर्ड (Invalid mobile number or password)"
        )

    if not verify_password(credentials.password, farmer["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="अमान्य मोबाइल नंबर या पासवर्ड (Invalid mobile number or password)"
        )

    access_token = create_access_token({"sub": str(farmer["id"]), "mobile": farmer["mobile_number"]})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "farmer": farmer
    }

@router.get("/me", response_model=FarmerResponse)
def get_me(current_farmer: Dict[str, Any] = Depends(get_current_farmer)):
    """Retrieve profile of the currently authenticated farmer."""
    return current_farmer
