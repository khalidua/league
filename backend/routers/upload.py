from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import cloudinary
import cloudinary.uploader
from backend.config import settings

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

@router.post("/", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
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
async def delete_image(public_id: str):
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
