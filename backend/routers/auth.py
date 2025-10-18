from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas.auth import LoginRequest, RegisterRequest, AuthResponse, RegisterResponse
from backend.schemas.user import User as UserSchema, UserUpdate, UserResponse
from backend.auth import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user
)
from backend.services.email_service import email_service

router = APIRouter()

@router.post("/register", response_model=RegisterResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    # Validate email domain
    if not request.email.endswith('@zewailcity.edu.eg'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only @zewailcity.edu.eg email addresses are allowed for registration"
        )
    
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
    
    # Generate verification token and expiration
    verification_token = email_service.generate_verification_token()
    verification_expires = datetime.utcnow() + timedelta(hours=24)
    
    # Create new user (Player-only) with pending verification
    hashed_password = get_password_hash(request.password)
    user = models.User(
        email=request.email,
        passwordhash=hashed_password,
        firstname=request.firstname,
        lastname=request.lastname,
        role="Player",
        status="pending",  # Changed to pending until email verification
        profileimage="https://res.cloudinary.com/dns6zhmc2/image/upload/v1760475598/defaultPlayer_vnbpfb.png",  # Set default profile image from Cloudinary
        is_email_verified=False,
        email_verification_token=verification_token,
        email_verification_expires=verification_expires
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create Player record immediately with optional onboarding fields (once)
    existing_player = db.query(models.Player).filter(models.Player.userid == user.userid).first()
    if not existing_player:
        player = models.Player(
            userid=user.userid,
            teamid=None,
        )
        # Set provided optional fields on initial create
        if request.position:
            player.position = request.position
        if request.jerseynumber is not None:
            player.jerseynumber = request.jerseynumber
        if request.preferredfoot:
            player.preferredfoot = request.preferredfoot
        if request.height is not None:
            player.height = request.height
        if request.weight is not None:
            player.weight = request.weight
        db.add(player)
        db.commit()
    else:
        # If a player already exists, update fields only if provided in this registration
        player = existing_player
        updated = False
        if request.position:
            player.position = request.position; updated = True
        if request.jerseynumber is not None:
            player.jerseynumber = request.jerseynumber; updated = True
        if request.preferredfoot:
            player.preferredfoot = request.preferredfoot; updated = True
        if request.height is not None:
            player.height = request.height; updated = True
        if request.weight is not None:
            player.weight = request.weight; updated = True
        if updated:
            db.add(player)
            db.commit()
    
    # Send verification email
    email_sent = email_service.send_verification_email(
        recipient_email=user.email,
        verification_token=verification_token,
        firstname=user.firstname
    )
    
    # Update timestamp for initial verification email
    if email_sent:
        user.last_verification_email_sent = datetime.utcnow()
        db.commit()
    
    if not email_sent:
        # If email fails, we should still create the user but log the error
        print(f"Warning: Failed to send verification email to {user.email}")
    
    # Return response without access token (user needs to verify email first)
    return {
        "message": "Registration successful! Please check your email to verify your account.",
        "email_sent": email_sent,
        "user": {
            "userid": user.userid,
            "email": user.email,
            "firstname": user.firstname,
            "lastname": user.lastname,
            "role": user.role,
            "status": user.status,
            "profileimage": user.profileimage,
            "is_email_verified": user.is_email_verified
        }
    }

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
    
    if user.status == "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please verify your email address before logging in. Check your inbox for a verification email."
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
            # Determine captain flag and include playerid
            is_captain = bool(team and team.teamcaptainid == player.playerid)
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
                "teamlogo": team.logourl if team else None,
                "teamcaptainid": team.teamcaptainid if team else None,
                # Player-specific fields
                "playerid": player.playerid,
                "position": player.position,
                "jerseynumber": player.jerseynumber,
                "preferredfoot": player.preferredfoot,
                "height": player.height,
                "weight": player.weight,
                "isTeamCaptain": is_captain
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
            is_captain = bool(team and team.teamcaptainid == player.playerid)
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
                "teamlogo": team.logourl if team else None,
                # Player-specific fields
                "playerid": player.playerid,
                "position": player.position,
                "jerseynumber": player.jerseynumber,
                "preferredfoot": player.preferredfoot,
                "height": player.height,
                "weight": player.weight,
                "isTeamCaptain": is_captain
            }
            return user_data
    
    return current_user

@router.post("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify user email with token"""
    # Find user by verification token
    user = db.query(models.User).filter(
        models.User.email_verification_token == token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )
    
    # Check if token is expired
    if user.email_verification_expires and user.email_verification_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired. Please request a new verification email."
        )
    
    # Check if already verified
    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already verified"
        )
    
    # Update user status
    user.is_email_verified = True
    user.status = "active"
    user.email_verification_token = None  # Clear the token
    user.email_verification_expires = None  # Clear the expiration
    
    db.commit()
    db.refresh(user)
    
    # Note: Welcome email removed to reduce email volume
    
    return {
        "message": "Email verified successfully! You can now log in to your account.",
        "user": {
            "userid": user.userid,
            "email": user.email,
            "firstname": user.firstname,
            "lastname": user.lastname,
            "role": user.role,
            "status": user.status,
            "is_email_verified": user.is_email_verified
        }
    }

@router.post("/resend-verification")
def resend_verification_email(email: str, db: Session = Depends(get_db)):
    """Resend verification email with 1-minute cooldown"""
    # Find user by email
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists and is not verified, a verification email has been sent."}
    
    # Check if already verified
    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already verified"
        )
    
    # Check cooldown period (1 minute)
    current_time = datetime.utcnow()
    if user.last_verification_email_sent:
        time_since_last_email = current_time - user.last_verification_email_sent
        if time_since_last_email.total_seconds() < 60:  # 1 minute cooldown
            remaining_seconds = 60 - int(time_since_last_email.total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining_seconds} seconds before requesting another verification email."
            )
    
    # Generate new verification token and expiration
    verification_token = email_service.generate_verification_token()
    verification_expires = current_time + timedelta(hours=24)
    
    # Update user with new token and timestamp
    user.email_verification_token = verification_token
    user.email_verification_expires = verification_expires
    user.last_verification_email_sent = current_time
    
    db.commit()
    
    # Send verification email
    email_sent = email_service.send_verification_email(
        recipient_email=user.email,
        verification_token=verification_token,
        firstname=user.firstname
    )
    
    if not email_sent:
        print(f"Warning: Failed to resend verification email to {user.email}")
    
    return {"message": "If the email exists and is not verified, a verification email has been sent."}

@router.post("/logout")
def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}

@router.delete("/me", status_code=204)
def delete_account(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Soft-delete the current account. Players must not be team captains. Removes team membership and marks account deleted."""
    # If Player, ensure not a team captain
    if current_user.role == "Player":
        player = db.query(models.Player).filter(models.Player.userid == current_user.userid).first()
        if player:
            if player.teamid:
                team = db.query(models.Team).filter(models.Team.teamid == player.teamid).first()
                if team and team.teamcaptainid == player.playerid:
                    raise HTTPException(status_code=400, detail="Disband or transfer captaincy before deleting your account.")
                # Remove team membership
                player.teamid = None
                db.add(player)

    # Soft delete user to avoid FK issues and anonymize credentials
    try:
        current_user.status = "deleted"
        # Anonymize email uniquely so the original can be reused
        if current_user.email and "@" in current_user.email:
            local, domain = current_user.email.split("@", 1)
            current_user.email = f"{local}+deleted_{current_user.userid}@{domain}"
        else:
            current_user.email = f"deleted_{current_user.userid}@example.local"
        # Invalidate password
        current_user.passwordhash = get_password_hash("deleted_account_placeholder_password")
        db.add(current_user)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete account")
    return None