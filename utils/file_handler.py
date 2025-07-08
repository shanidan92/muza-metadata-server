import os
import logging
import uuid
import requests
from typing import Optional, Tuple
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)


class FileHandler:
    """Handle file uploads and downloads"""
    
    def __init__(self, upload_dir: str):
        """
        Initialize file handler
        
        Args:
            upload_dir: Directory for storing uploaded files
        """
        self.upload_dir = upload_dir
        self.allowed_extensions = {'.flac'}
        self.image_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        
        # Create upload directory if it doesn't exist
        os.makedirs(upload_dir, exist_ok=True)
    
    def save_uploaded_file(self, file, original_filename: str) -> Tuple[str, str]:
        """
        Save uploaded file to upload directory
        
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
        
        # Save file
        file_path = os.path.join(self.upload_dir, unique_filename)
        file.save(file_path)
        
        logger.info(f"Saved uploaded file: {file_path}")
        return file_path, unique_filename
    
    def save_album_cover_from_flac(self , file , filename):
        file_path = os.path.join(self.upload_dir, filename)

        with open(file_path, 'wb') as f:
            f.write(file)
        
        # Basic validation
        if os.path.exists(file_path): 
            logger.info(f"Downloaded album cover: {filename}")
            return filename 

    def download_album_cover(self, cover_url: str, album_title: str) -> Optional[str]:
        """
        Download album cover from URL
        
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
            file_path = os.path.join(self.upload_dir, filename)
            
            # Save file
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            # Basic validation - check if file was written and has reasonable size
            if os.path.exists(file_path) and os.path.getsize(file_path) > 1024:  # At least 1KB
                logger.info(f"Downloaded album cover: {filename}")
                return filename
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
        logger.info(ext in self.allowed_extensions)
        return ext in self.allowed_extensions
    
    def get_file_url(self, relative_path: str, base_url: str) -> str:
        """Generate URL for accessing uploaded file"""
        return f"{base_url.rstrip('/')}/files/{relative_path}"
