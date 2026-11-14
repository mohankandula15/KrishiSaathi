from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
from .security import decode_access_token
from .database import db

security_scheme = HTTPBearer(auto_error=False)

def get_optional_farmer(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> Optional[Dict[str, Any]]:
    """
    Optionally extract and validate the current authenticated farmer from the Bearer token.
    Returns None if no token or invalid token, without raising HTTP 401.
    """
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload or "sub" not in payload:
        return None

    farmer_id = payload["sub"]
    return db.get_farmer_by_id(farmer_id)

def get_current_farmer(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> Dict[str, Any]:
    """
    Extract and validate the current authenticated farmer from the Bearer token.
    Raises HTTP 401 if token is missing or invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    farmer_id = payload["sub"]
    farmer = db.get_farmer_by_id(farmer_id)

    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Farmer account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return farmer
