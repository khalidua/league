from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.schemas.auth import TokenData
from backend.deps import get_db
from sqlalchemy.orm import Session
from backend import models

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# JWT settings
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security scheme
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        # Ensure password is properly encoded and within bcrypt limits
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            # Truncate to 72 bytes, but try to avoid cutting in the middle of a multi-byte character
            truncated = password_bytes[:72]
            # Find the last complete character boundary
            while truncated and truncated[-1] & 0x80 and not (truncated[-1] & 0x40):
                truncated = truncated[:-1]
            plain_password = truncated.decode('utf-8', errors='ignore')
        
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        # Log the error for debugging but don't expose it to the user
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Hash a password"""
    try:
        # Ensure password is properly encoded and within bcrypt limits
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            # Truncate to 72 bytes, but try to avoid cutting in the middle of a multi-byte character
            truncated = password_bytes[:72]
            # Find the last complete character boundary
            while truncated and truncated[-1] & 0x80 and not (truncated[-1] & 0x40):
                truncated = truncated[:-1]
            password = truncated.decode('utf-8', errors='ignore')
        
        return pwd_context.hash(password)
    except Exception as e:
        # Log the error for debugging
        print(f"Password hashing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password hashing failed"
        )

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> TokenData:
    """Verify and decode a JWT token"""
    print(f"=== VERIFY_TOKEN CALLED ===")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        print(f"Decoding token with SECRET_KEY: {SECRET_KEY[:10]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Token payload: {payload}")
        userid_str: str = payload.get("sub")
        email: str = payload.get("email")
        
        if userid_str is None or email is None:
            print(f"Missing userid or email in token: userid={userid_str}, email={email}")
            raise credentials_exception
            
        # Convert string userid back to integer
        try:
            userid = int(userid_str)
        except (ValueError, TypeError):
            print(f"Invalid userid format: {userid_str}")
            raise credentials_exception
            
        token_data = TokenData(userid=userid, email=email)
        print(f"Token data created: {token_data}")
        return token_data
    except JWTError as e:
        print(f"JWT Error: {str(e)}")
        raise credentials_exception

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    """Get the current authenticated user"""
    print(f"=== GET_CURRENT_USER CALLED ===")
    try:
        token = credentials.credentials
        print(f"Token received: {token[:20]}...")
        token_data = verify_token(token)
        print(f"Token verified for user: {token_data.userid}")
        
        user = db.query(models.User).filter(models.User.userid == token_data.userid).first()
        if user is None:
            print(f"User {token_data.userid} not found in database")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"User found: {user.userid}, status: {user.status}")
        return user
    except Exception as e:
        print(f"Error in get_current_user: {str(e)}")
        raise

def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Get the current active user"""
    print(f"Checking user status: user_id={current_user.userid}, status='{current_user.status}'")
    if current_user.status != "active":
        print(f"User {current_user.userid} is not active (status: '{current_user.status}')")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    print(f"User {current_user.userid} is active, proceeding...")
    return current_user

def require_role(allowed_roles: list[str]):
    """Dependency to require specific roles"""
    def role_checker(current_user: models.User = Depends(get_current_active_user)) -> models.User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

def require_admin(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    """Require admin role"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_organizer_or_admin(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    """Require organizer or admin role"""
    if current_user.role not in ["Admin", "Organizer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organizer or Admin access required"
        )
    return current_user

def require_authenticated_user(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    """Require any authenticated user"""
    return current_user