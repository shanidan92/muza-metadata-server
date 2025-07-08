import logging
from typing import Dict, Optional
from mutagen.flac import FLAC
from mutagen import MutagenError 
from file_handler import FileHandler

logger = logging.getLogger(__name__)


class MetadataExtractor:
    """Extract metadata from FLAC files"""
    
    def extract_from_flac(self, file_path: str , file_handler: FileHandler) -> Dict[str, Optional[str]]:
        """
        Extract metadata from FLAC file
        
        Args:
            file_path: Path to the FLAC file
            
        Returns:
            Dictionary containing extracted metadata
        """
        try:
            audio = FLAC(file_path)
            if audio is None:
                logger.error(f"Could not read FLAC file: {file_path}")
                return {}
             
            cover_path = self.extract_flac_cover_art(audio , file_handler)

            metadata = {
                "duration_seconds": int(audio.info.length),
                "song_title": self._get_tag(audio, "TITLE"),
                "artist_main": self._get_tag(audio, "ARTIST"),
                "album_title": self._get_tag(audio, "ALBUM"),
                "composer": self._get_tag(audio, "COMPOSER"),
                "band_name": self._get_tag(audio, "ALBUMARTIST"),
                "label": self._get_tag(audio, "LABEL"),
                "year_recorded": self._get_year(audio, "DATE"),
                "year_released": self._get_year(audio, "ORIGINALDATE"),
                "song_order": self._get_track_number(audio),
                "instrument": self._get_tag(audio, "INSTRUMENT"),
                "comments": self._get_tag(audio, "COMMENT"),
                "other_artist_playing": self._get_tag(audio, "PERFORMER"),
                "musicbrainz_track_id": self._get_tag(audio, "MUSICBRAINZ_TRACKID"),
                "musicbrainz_album_id": self._get_tag(audio, "MUSICBRAINZ_ALBUMID"),
                "musicbrainz_artist_id": self._get_tag(audio, "MUSICBRAINZ_ARTISTID"),
            }
            logger.info(metadata)
            
            # Clean up None values
            return {k: v for k, v in metadata.items() if v is not None}
            
        except MutagenError as e:
            logger.error(f"Error reading FLAC metadata: {e}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error extracting metadata: {e}")
            return {}
    
    def _get_tag(self, audio: FLAC, tag: str) -> Optional[str]:
        """Get a single tag value"""
        values = audio.get(tag)
        if values and len(values) > 0:
            return str(values[0]).strip()
        return None
    
    def extract_flac_cover_art(self, audio: FLAC, file_handler: FileHandler):
        """
        Extracts the front cover art from a FLAC file and saves it as an image.

        Args:
            file_path (str): The path to the FLAC file.
            output_image_path (str): The path where the extracted image will be saved.
        """
        try:  
            # Iterate through embedded pictures
            for pic in audio.pictures: 
                file_name = 'cover_' + self._get_tag(audio, "ARTIST")+'_'+self._get_tag(audio, "ALBUM")
                file_name= file_name.replace(' ' , '_') +'.jpg'
                relative_path = file_handler.save_album_cover_from_flac(pic.data, file_name)
                return relative_path
                     
            print("No front cover art found in the FLAC file.")

        except Exception as e:
            print(f"Error extracting cover art: {e}")

    def _get_year(self, audio: FLAC, tag: str) -> Optional[int]:
        """Extract year from date tag"""
        date_str = self._get_tag(audio, tag)
        if date_str:
            try:
                # Handle various date formats (YYYY, YYYY-MM-DD, etc.)
                year = int(date_str.split("-")[0])
                return year if 1900 <= year <= 2100 else None
            except (ValueError, IndexError):
                logger.warning(f"Could not parse year from: {date_str}")
        return None
    
    def _get_track_number(self, audio: FLAC) -> Optional[int]:
        """Extract track number"""
        track_str = self._get_tag(audio, "TRACKNUMBER")
        if track_str:
            try:
                # Handle "1/12" format
                return int(track_str.split("/")[0])
            except (ValueError, IndexError):
                logger.warning(f"Could not parse track number from: {track_str}")
        return None
