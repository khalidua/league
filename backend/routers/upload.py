from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import cloudinary
import cloudinary.uploader
from backend.config import settings
from backend.auth import require_authenticated_user
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
async def upload_image(file: UploadFile = File(...), current_user: models.User = Depends(require_authenticated_user)):
	"""
	Upload an image file (including SVG) to Cloudinary.
	Supports: JPG, PNG, GIF, WebP, SVG, and other image formats.
	"""
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

@router.delete("/profile")
async def delete_profile_image(current_user: models.User = Depends(require_authenticated_user), db: Session = Depends(get_db)):
	"""
	Delete the current user's profile image and restore to default.
	"""
	try:
		# If user has a Cloudinary image, delete it from Cloudinary first
		if current_user.profileimage and current_user.profileimage.startswith('http'):
			# Extract public_id from Cloudinary URL
			# Cloudinary URLs format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
			# We need to extract the part after the last slash before the file extension
			import re
			url_parts = current_user.profileimage.split('/')
			if len(url_parts) > 0:
				# Find the last part that looks like a filename
				filename = url_parts[-1]
				# Remove file extension to get public_id
				public_id = filename.split('.')[0]
				# Try to delete from Cloudinary (ignore errors if it's not a Cloudinary image)
				try:
					cloudinary.uploader.destroy(public_id)
				except:
					pass  # Ignore errors if it's not a valid Cloudinary image
		
		# Restore to default profile image
		current_user.profileimage = "https://res.cloudinary.com/dns6zhmc2/image/upload/v1760475598/defaultPlayer_vnbpfb.png"
		db.commit()
		db.refresh(current_user)
		
		return {"message": "Profile image deleted and restored to default"}
	except Exception as e:
		raise HTTPException(500, f"Delete profile image failed: {str(e)}")
