from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import cloudinary
import cloudinary.uploader
from backend.config import settings
from backend.auth import require_authenticated_user, get_current_user
from backend.deps import get_db
from backend import models

router = APIRouter()

# Configure Cloudinary
cloudinary.config(
	cloud_name=settings.cloudinary_cloud_name,
	api_key=settings.cloudinary_api_key,
	api_secret=settings.cloudinary_api_secret
)

class UploadResponse(BaseModel):
	image_url: str
	public_id: str

@router.post("", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
	"""
	Upload an image file (including SVG) to Cloudinary.
	Supports: JPG, PNG, GIF, WebP, SVG, and other image formats.
	"""
	print(f"Upload request from user: {current_user.userid}, status: {current_user.status}, role: {current_user.role}")
	# Check if Cloudinary credentials are configured
	missing_creds = []
	if not settings.cloudinary_cloud_name:
		missing_creds.append("CLOUDINARY_CLOUD_NAME")
	if not settings.cloudinary_api_key:
		missing_creds.append("CLOUDINARY_API_KEY")
	if not settings.cloudinary_api_secret:
		missing_creds.append("CLOUDINARY_API_SECRET")
	
	if missing_creds:
		raise HTTPException(500, f"Missing Cloudinary credentials: {', '.join(missing_creds)}. Please set these environment variables in backend/.env file.")
	
	if not file.content_type or not file.content_type.startswith('image/'):
		raise HTTPException(400, "File must be an image")
	
	# Check file size (max 10MB)
	file_content = await file.read()
	if len(file_content) > 10 * 1024 * 1024:  # 10MB
		raise HTTPException(400, "File size must be less than 10MB")
	
	try:
		# Upload to Cloudinary with background removal effect
		# Using PNG format to ensure transparent background instead of white
		# The 'relative' flag preserves positioning and PNG format supports transparency
		result = cloudinary.uploader.upload(
			file_content,
			resource_type="auto",  # Auto-detect image type including SVG
			folder="zc-league",  # Organize uploads in a folder
			transformation=[
				{
					"effect": "background_removal",
					"flags": "relative"  # Preserve relative positioning
				},
				{
					"gravity": "auto",
					"height": 584,
					"width": 600,
					"crop": "auto"
				},
				{
					"format": "png",  # Ensure PNG format for transparency support
					"quality": "auto"  # Optimize quality while preserving transparency
				}
			],
			# Additional parameters to ensure transparency
			format="png",
			quality="auto"
		)
		
		return UploadResponse(
			image_url=result['secure_url'],
			public_id=result['public_id']
		)
	except Exception as e:
		raise HTTPException(500, f"Upload failed: {str(e)}")

@router.delete("/profile")
async def delete_profile_image(
	current_user: models.User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	"""Delete profile image and restore to default"""
	print("=== DELETE PROFILE IMAGE CALLED ===")
	print(f"User ID: {current_user.userid}")
	print(f"Current user object: {current_user}")
	print(f"Database session: {db}")
	
	try:
		# Get the user from the database to ensure we have the latest data
		print("Querying user from database...")
		user = db.query(models.User).filter(models.User.userid == current_user.userid).first()
		print(f"Found user: {user}")
		
		if not user:
			print("User not found in database")
			raise HTTPException(404, "User not found")
		
		print(f"Current profile image: {user.profileimage}")
		
		# Update user's profile image to default
		user.profileimage = "https://res.cloudinary.com/dns6zhmc2/image/upload/v1760475598/defaultPlayer_vnbpfb.png"
		print("Updated profile image, committing to database...")
		db.commit()
		print("Committed, refreshing user object...")
		db.refresh(user)
		print("User object refreshed")
		
		print("Profile image updated to default")
		return {"message": "Profile image restored to default"}
	except Exception as e:
		print(f"Exception occurred: {type(e).__name__}: {str(e)}")
		print(f"Exception details: {e}")
		db.rollback()
		print(f"Error updating profile image: {str(e)}")
		raise HTTPException(500, f"Failed to update profile image: {str(e)}")

@router.delete("/{public_id}")
async def delete_image(public_id: str, current_user: models.User = Depends(require_authenticated_user)):
	"""
	Delete an image from Cloudinary using its public_id.
	"""
	try:
		result = cloudinary.uploader.destroy(public_id)
		if result.get('result') == 'ok':
			return {"message": "Image deleted successfully"}
		else:
			raise HTTPException(404, "Image not found")
	except Exception as e:
		raise HTTPException(500, f"Delete failed: {str(e)}")

@router.get("/test-auth")
async def test_auth(current_user: models.User = Depends(get_current_user)):
	"""Test endpoint to check if authentication is working"""
	return {"message": "Auth working", "user_id": current_user.userid, "status": current_user.status}

@router.get("/test-db")
async def test_db(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
	"""Test endpoint to check if database dependency is working"""
	print("=== TEST DB ENDPOINT CALLED ===")
	print(f"Current user: {current_user.userid}")
	print(f"Database session: {db}")
	return {"message": "DB working", "user_id": current_user.userid}

@router.get("/test-simple")
async def test_simple():
	"""Simple test endpoint without any dependencies"""
	print("=== SIMPLE TEST ENDPOINT CALLED ===")
	return {"message": "Simple test working"}

@router.delete("/test-delete")
async def test_delete():
	"""Simple test DELETE endpoint without any dependencies"""
	print("=== TEST DELETE ENDPOINT CALLED ===")
	return {"message": "Test delete working"}

