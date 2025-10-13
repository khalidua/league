from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas.auth import LoginRequest, RegisterRequest, AuthResponse
from backend.schemas.user import User as UserSchema, UserUpdate, UserResponse
from backend.auth import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user
)

router = APIRouter()

@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    # Validate password length to prevent bcrypt errors
    password_bytes = request.password.encode('utf-8')
    if len(password_bytes) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password too long (maximum 72 bytes)"
        )
    
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(request.password)
    user = models.User(
        email=request.email,
        passwordhash=hashed_password,
        firstname=request.firstname,
        lastname=request.lastname,
        role=request.role or "Player",
        status="active",
        profileimage="/assets/defaultPlayer.png"  # Set default profile image
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Note: Player records are created during onboarding, not during registration
    # This prevents duplicate player creation and allows for proper onboarding flow
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.userid), "email": user.email},
        expires_delta=access_token_expires
    )
    
    return AuthResponse(
        access_token=access_token,
        user={
            "userid": user.userid,
            "email": user.email,
            "firstname": user.firstname,
            "lastname": user.lastname,
            "role": user.role,
            "status": user.status,
            "profileimage": user.profileimage
        }
    )

@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login user"""
    # Validate password length to prevent bcrypt errors
    password_bytes = request.password.encode('utf-8')
    if len(password_bytes) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password too long (maximum 72 bytes)"
        )
    
    # Find user by email
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.passwordhash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.userid), "email": user.email},
        expires_delta=access_token_expires
    )
    
    return AuthResponse(
        access_token=access_token,
        user={
            "userid": user.userid,
            "email": user.email,
            "firstname": user.firstname,
            "lastname": user.lastname,
            "role": user.role,
            "status": user.status,
            "profileimage": user.profileimage
        }
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get current user information"""
    # Get user's team information if they are a player
    if current_user.role == "Player":
        player = db.query(models.Player).filter(models.Player.userid == current_user.userid).first()
        if player:
            team = None
            if player.teamid:
                team = db.query(models.Team).filter(models.Team.teamid == player.teamid).first()
            
            # Add team and player information to user data
            user_data = {
                "userid": current_user.userid,
                "email": current_user.email,
                "firstname": current_user.firstname,
                "lastname": current_user.lastname,
                "role": current_user.role,
                "status": current_user.status,
                "profileimage": current_user.profileimage,
                "teamid": team.teamid if team else None,
                "teamname": team.teamname if team else None,
                # Player-specific fields
                "position": player.position,
                "jerseynumber": player.jerseynumber,
                "preferredfoot": player.preferredfoot,
                "height": player.height,
                "weight": player.weight
            }
            return user_data
    
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_current_user_profile(
    user_update: UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    # Update user fields
    for field, value in user_update.model_dump(exclude_unset=True).items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)
    
    # Update player-specific fields if user is a player
    if current_user.role == "Player":
        player = db.query(models.Player).filter(models.Player.userid == current_user.userid).first()
        if player:
            # Update player fields
            player_fields = ['position', 'jerseynumber', 'preferredfoot', 'height', 'weight']
            for field in player_fields:
                if field in user_update.model_dump(exclude_unset=True):
                    setattr(player, field, user_update.model_dump(exclude_unset=True)[field])
    
    db.commit()
    db.refresh(current_user)
    
    # Get user's team information if they are a player
    if current_user.role == "Player":
        player = db.query(models.Player).filter(models.Player.userid == current_user.userid).first()
        if player:
            team = None
            if player.teamid:
                team = db.query(models.Team).filter(models.Team.teamid == player.teamid).first()
            
            # Add team and player information to user data
            user_data = {
                "userid": current_user.userid,
                "email": current_user.email,
                "firstname": current_user.firstname,
                "lastname": current_user.lastname,
                "role": current_user.role,
                "status": current_user.status,
                "profileimage": current_user.profileimage,
                "teamid": team.teamid if team else None,
                "teamname": team.teamname if team else None,
                # Player-specific fields
                "position": player.position,
                "jerseynumber": player.jerseynumber,
                "preferredfoot": player.preferredfoot,
                "height": player.height,
                "weight": player.weight
            }
            return user_data
    
    return current_user

@router.post("/logout")
def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}
