import logging
import time
import requests
from typing import Dict, Optional, List
import musicbrainzngs as mb
from urllib.parse import urljoin

logger = logging.getLogger(__name__)


class MusicBrainzClient:
    """Client for MusicBrainz API"""
    
    def __init__(self, app_name: str, app_version: str, contact: str):
        """
        Initialize MusicBrainz client
        
        Args:
            app_name: Application name for API identification
            app_version: Application version
            contact: Contact information
        """
        mb.set_useragent(app_name, app_version, contact)
        self.rate_limit_delay = 1.0  # MusicBrainz rate limit
    
    def lookup_track_by_id(self, track_id: str) -> Optional[Dict]:
        """
        Lookup track by MusicBrainz ID
        
        Args:
            track_id: MusicBrainz track ID
            
        Returns:
            Track information or None if not found
        """
        try:
            time.sleep(self.rate_limit_delay)
            result = mb.get_recording_by_id(
                track_id, 
                includes=["artists", "releases", "artist-credits"]
            )
            return self._process_track_result(result)
        except mb.WebServiceError as e:
            logger.error(f"MusicBrainz API error for track {track_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error looking up track: {e}")
            return None
    
    def search_track(self, title: str, artist: str, album: str = None) -> Optional[Dict]:
        """
        Search for track by title and artist
        
        Args:
            title: Track title
            artist: Artist name
            album: Album name (optional)
            
        Returns:
            Best matching track information or None
        """
        try:
            time.sleep(self.rate_limit_delay)
            query = f'recording:"{title}" AND artist:"{artist}"'
            if album:
                query += f' AND release:"{album}"'
            
            result = mb.search_recordings(query, limit=10)
            
            if result["recording-list"]:
                # Return the first result (best match)
                return self._process_track_result({"recording": result["recording-list"][0]})
            
            return None
            
        except mb.WebServiceError as e:
            logger.error(f"MusicBrainz search error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error searching track: {e}")
            return None
    
    def get_album_cover_url(self, album_id: str) -> Optional[str]:
        """
        Get album cover URL from Cover Art Archive
        
        Args:
            album_id: MusicBrainz release ID
            
        Returns:
            URL to album cover or None
        """
        try:
            time.sleep(self.rate_limit_delay)
            cover_url = f"https://coverartarchive.org/release/{album_id}/front"
            
            # Try GET request instead of HEAD as some servers don't support HEAD
            response = requests.get(cover_url, timeout=10, allow_redirects=True)
            logger.info(f"Cover art response status: {response.status_code}")
            
            if response.status_code == 200:
                logger.info(f"Cover art found for album {album_id}")
                return cover_url
            elif response.status_code == 404:
                logger.info(f"No cover art found for album {album_id}")
                return None
            else:
                logger.warning(f"Unexpected status code {response.status_code} for cover art: {album_id}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Error checking cover art for album {album_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting cover URL for album {album_id}: {e}")
            return None
    
    def _process_track_result(self, result: Dict) -> Dict:
        """Process MusicBrainz track result into our format"""
        recording = result.get("recording", {})
        
        # Get primary artist
        artist_credits = recording.get("artist-credit", [])
        artist_main = artist_credits[0]["name"] if artist_credits else None
        
        # Get release information
        releases = recording.get("release-list", [])
        release_info = releases[0] if releases else {}
        
        processed = {
            "musicbrainz_track_id": recording.get("id"),
            "song_title": recording.get("title"),
            "artist_main": artist_main,
            "album_title": release_info.get("title"),
            "musicbrainz_album_id": release_info.get("id"),
            "year_released": self._extract_year(release_info.get("date")),
        }
        
        # Get label information
        label_info = release_info.get("label-info-list", [])
        if label_info:
            processed["label"] = label_info[0].get("label", {}).get("name")
        
        return {k: v for k, v in processed.items() if v is not None}
    
    def _extract_year(self, date_str: str) -> Optional[int]:
        """Extract year from MusicBrainz date string"""
        if date_str:
            try:
                return int(date_str.split("-")[0])
            except (ValueError, IndexError):
                pass
        return None
