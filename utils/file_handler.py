import os
import logging
import uuid
import requests
from typing import Optional, Tuple
from werkzeug.utils import secure_filename
import boto3

logger = logging.getLogger(__name__)


class FileHandler:
    """Handle file uploads and downloads"""
    
    def __init__(self, audio_upload_dir: str, image_upload_dir: str, *,
                 s3_bucket_raw: Optional[str] = None,
                 s3_bucket_images: Optional[str] = None,
                 cdn_domain: Optional[str] = None,
                 aws_region: Optional[str] = None):
        """
        Initialize file handler
        
        Args:
            audio_upload_dir: Directory for storing audio files
            image_upload_dir: Directory for storing image files
        """
        self.audio_upload_dir = audio_upload_dir
        self.image_upload_dir = image_upload_dir
        self.s3_bucket_raw = s3_bucket_raw
        self.s3_bucket_images = s3_bucket_images
        self.cdn_domain = cdn_domain.rstrip('/') if cdn_domain else None
        self.aws_region = aws_region
        self._s3 = boto3.client("s3", region_name=aws_region) if (s3_bucket_raw or s3_bucket_images) else None
        self.allowed_extensions = {'.flac'}
        self.image_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        
        # Create upload directories if they don't exist
        os.makedirs(audio_upload_dir, exist_ok=True)
        os.makedirs(image_upload_dir, exist_ok=True)
    
    def save_uploaded_file(self, file, original_filename: str) -> Tuple[str, str]:
        """
        Save uploaded file to appropriate upload directory
        
        Args:
            file: Flask file object
            original_filename: Original filename
            
        Returns:
            Tuple of (saved_filepath, relative_path)
            
        Raises:
            ValueError: If file extension is not allowed
        """
        if not self.is_allowed_file(original_filename):
            raise ValueError(f"File type not allowed: {original_filename}")
        
        # Generate unique filename
        file_ext = os.path.splitext(original_filename)[1].lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        # Always save locally for metadata extraction
        file_path = os.path.join(self.audio_upload_dir, unique_filename)
        file.save(file_path)
        relative_path = f"audio/{unique_filename}"

        # Optionally upload to S3 to trigger processing pipeline
        if self._s3 and self.s3_bucket_raw:
            key = f"audio/raw/{unique_filename}"
            with open(file_path, 'rb') as fh:
                self._s3.upload_fileobj(fh, self.s3_bucket_raw, key, ExtraArgs={"ContentType": "audio/flac"})
            logger.info(f"Uploaded audio to s3://{self.s3_bucket_raw}/{key}")

        logger.info(f"Saved uploaded file: {file_path}")
        return file_path, relative_path
    
    def download_album_cover(self, cover_url: str, album_title: str) -> Optional[str]:
        """
        Download album cover from URL to image directory
        
        Args:
            cover_url: URL to download cover from
            album_title: Album title for filename
            
        Returns:
            Relative path to downloaded cover or None
        """
        try:
            response = requests.get(cover_url, timeout=30)
            response.raise_for_status()
            
            # Determine file extension from content type
            content_type = response.headers.get('content-type', '').lower()
            if 'jpeg' in content_type or 'jpg' in content_type:
                ext = '.jpg'
            elif 'png' in content_type:
                ext = '.png'
            elif 'webp' in content_type:
                ext = '.webp'
            else:
                # Default to jpg
                ext = '.jpg'
            
            # Create filename
            safe_album_title = secure_filename(album_title) or "unknown_album"
            filename = f"cover_{safe_album_title}_{uuid.uuid4()}{ext}"
            # Upload to S3 if configured, else save locally
            if self._s3 and self.s3_bucket_images:
                key = f"cover-art/{filename}"
                self._s3.put_object(Bucket=self.s3_bucket_images, Key=key, Body=response.content, ContentType=f"image/{ext.lstrip('.')}")
                logger.info(f"Uploaded cover art to s3://{self.s3_bucket_images}/{key}")
                return key
            else:
                file_path = os.path.join(self.image_upload_dir, filename)
                with open(file_path, 'wb') as f:
                    f.write(response.content)
                if os.path.exists(file_path) and os.path.getsize(file_path) > 1024:
                    logger.info(f"Downloaded album cover: {filename}")
                    return f"images/{filename}"
                else:
                    logger.error("Downloaded file is too small or doesn't exist")
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    return None
            
        except requests.RequestException as e:
            logger.error(f"Error downloading album cover: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error downloading cover: {e}")
            return None
    
    def is_allowed_file(self, filename: str) -> bool:
        """Check if file extension is allowed"""
        if not filename:
            return False
        ext = os.path.splitext(filename)[1].lower()
        return ext in self.allowed_extensions
    
    def get_file_url(self, relative_path: str, base_url: str) -> str:
        """Generate URL for accessing uploaded file.
        If CDN configured and path is an S3 key, rewrite to CDN.
        """
        if self.cdn_domain and (relative_path.startswith("audio/hls/") or relative_path.startswith("cover-art/") or relative_path.startswith("images/")):
            # Map known prefixes to CDN paths
            if relative_path.startswith("audio/hls/"):
                return f"https://{self.cdn_domain}/{relative_path}"
            if relative_path.startswith("cover-art/"):
                return f"https://{self.cdn_domain}/{relative_path}"
            if relative_path.startswith("images/"):
                # Legacy local images path can be mapped under cover-art
                return f"https://{self.cdn_domain}/cover-art/{relative_path.split('/', 1)[1]}"
        return f"{base_url.rstrip('/')}/files/{relative_path}"
