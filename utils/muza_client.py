import logging
import requests
import json
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class MuzaClient:
    """Client for Muza metadata server GraphQL API"""
    
    def __init__(self, server_url: str):
        """
        Initialize Muza client
        
        Args:
            server_url: URL to Muza GraphQL endpoint
        """
        self.server_url = server_url
    
    def create_track(self, metadata: Dict) -> Optional[Dict]:
        """
        Create a new track in Muza metadata server
        
        Args:
            metadata: Track metadata dictionary
            
        Returns:
            Response data or None if failed
        """
        mutation = self._build_create_mutation(metadata)
        
        try:
            response = requests.post(
                self.server_url,
                json={"query": mutation},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            
            if "errors" in result:
                logger.error(f"GraphQL errors: {result['errors']}")
                return None
            
            track_data = result.get("data", {}).get("createMusicTrack")
            if track_data and track_data.get("ok"):
                logger.info(f"Successfully created track: {track_data.get('track', {}).get('songTitle')}")
                return track_data
            else:
                logger.error("Track creation failed")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Error communicating with Muza server: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing response: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error creating track: {e}")
            return None
    
    def _build_create_mutation(self, metadata: Dict) -> str:
        """Build GraphQL mutation for creating track"""
        # Map our metadata keys to GraphQL argument names (camelCase)
        field_mapping = {
            "uuid": "uuid",
            "original_uuid": "originalUuid",
            "album_cover": "albumCover",
            "album_title": "albumTitle",
            "label": "label",
            "label_logo": "labelLogo",
            "band_name": "bandName",
            "artist_photo": "artistPhoto",
            "artist_main": "artistMain",
            "instrument": "instrument",
            "other_artist_playing": "otherArtistPlaying",
            "other_instrument": "otherInstrument",
            "year_recorded": "yearRecorded",
            "year_released": "yearReleased",
            "song_order": "songOrder",
            "song_title": "songTitle",
            "composer": "composer",
            "song_file": "songFile",
            "musicbrainz_track_id": "musicbrainzTrackId"
        }
        
        args = []
        
        # String fields
        string_fields = [
            "uuid", "original_uuid", "album_cover", "album_title", "label", 
            "label_logo", "band_name", "artist_photo", "artist_main", 
            "instrument", "other_artist_playing", "other_instrument", 
            "song_title", "composer", "song_file", "musicbrainz_track_id"
        ]
        
        for field in string_fields:
            if field in metadata and metadata[field]:
                graphql_field = field_mapping[field]
                # Escape quotes in string values
                escaped_value = str(metadata[field]).replace('"', '\\"')
                args.append(f'{graphql_field}: "{escaped_value}"')
        
        # Integer fields
        int_fields = ["year_recorded", "year_released", "song_order"]
        
        for field in int_fields:
            if field in metadata and metadata[field] is not None:
                graphql_field = field_mapping[field]
                args.append(f'{graphql_field}: {int(metadata[field])}')
        
        args_str = ", ".join(args)
        
        mutation = f"""
        mutation {{
            createMusicTrack({args_str}) {{
                ok
                track {{
                    id
                    uuid
                    songTitle
                    artistMain
                    albumTitle
                    createdAt
                }}
            }}
        }}
        """
        
        return mutation
