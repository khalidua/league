from typing import Optional
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    # Player-only registration; optional onboarding fields
    position: Optional[str] = None
    jerseynumber: Optional[int] = None
    preferredfoot: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class TokenData(BaseModel):
    userid: Optional[int] = None
    email: Optional[str] = None
