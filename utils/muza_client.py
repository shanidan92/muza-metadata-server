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
                logger.error(f"Track creation failed. Response: {result}")
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
            "artist_main": "artistMain",
            "instrument": "instrument",
            "other_artist_playing": "otherArtistPlaying",
            "other_instrument": "otherInstrument",
            "year_recorded": "yearRecorded",
            "song_order": "songOrder",
            "song_title": "songTitle",
            "duration_seconds": "durationSeconds",
            "composer": "composer",
            "song_file": "songFile",
            "comments": "comments",
            "musicbrainz_track_id": "musicbrainzTrackId",
            "artist_id": "artistId",
            "album_id": "albumId"
        }
        
        args = []
        
        # String fields
        string_fields = [
            "uuid", "original_uuid", "artist_main", "instrument", 
            "other_artist_playing", "other_instrument", "song_title", 
            "composer", "song_file", "comments", "musicbrainz_track_id"
        ]
        
        for field in string_fields:
            if field in metadata and metadata[field]:
                graphql_field = field_mapping[field]
                # Escape quotes, newlines, and other special characters
                escaped_value = str(metadata[field])
                escaped_value = escaped_value.replace('\\', '\\\\')
                escaped_value = escaped_value.replace('"', '\\"')
                escaped_value = escaped_value.replace('\n', ' ')
                escaped_value = escaped_value.replace('\r', ' ')
                escaped_value = escaped_value.replace('\t', ' ')
                args.append(f'{graphql_field}: "{escaped_value}"')
        
        # Integer fields
        int_fields = ["year_recorded", "song_order", "duration_seconds", "artist_id", "album_id"]
        
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
                    artistId
                    albumId
                    createdAt
                }}
            }}
        }}
        """
        
        return mutation
    
    def find_or_create_artist(self, metadata: Dict) -> Optional[Dict]:
        """Find existing artist or create new one"""
        # First try to find existing artist by name
        artist_name = metadata.get('artist_main', '').strip()
        if not artist_name:
            return None
            
        # Query for existing artist
        query = f'''
        {{
            artists {{
                id
                uuid
                name
                bandName
            }}
        }}
        '''
        
        try:
            response = requests.post(
                self.server_url,
                json={"query": query},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            if "data" in result and "artists" in result["data"]:
                for artist in result["data"]["artists"]:
                    if artist["name"].lower() == artist_name.lower():
                        logger.info(f"Found existing artist: {artist['name']} (ID: {artist['id']})")
                        return artist
            
            # Artist not found, create new one
            return self.create_artist(metadata)
            
        except Exception as e:
            logger.error(f"Error finding artist: {e}")
            return self.create_artist(metadata)
    
    def create_artist(self, metadata: Dict) -> Optional[Dict]:
        """Create a new artist in Muza metadata server"""
        name = metadata.get('artist_main', '').replace('"', '\\"')
        band_name = metadata.get('band_name', '').replace('"', '\\"')
        mb_id = metadata.get('musicbrainz_artist_id', '')
        
        mutation = f'''
        mutation {{
            createArtist(
                name: "{name}"
                bandName: "{band_name}"
                musicbrainzArtistId: "{mb_id}"
            ) {{
                ok
                artist {{
                    id
                    uuid
                    name
                }}
            }}
        }}
        '''
        
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
                logger.error(f"GraphQL errors creating artist: {result['errors']}")
                return None
            
            artist_data = result.get("data", {}).get("createArtist")
            if artist_data and artist_data.get("ok"):
                return artist_data.get("artist")
            return None
            
        except Exception as e:
            logger.error(f"Error creating artist: {e}")
            return None
    
    def find_existing_album(self, metadata: Dict, artist_id: int = None) -> Optional[Dict]:
        """Find existing album without creating new one"""
        album_title = metadata.get('album_title', '').strip()
        if not album_title:
            return None
            
        query = f'''
        {{
            albums {{
                id
                uuid
                title
                artistId
            }}
        }}
        '''
        
        try:
            response = requests.post(
                self.server_url,
                json={"query": query},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            if "data" in result and "albums" in result["data"]:
                for album in result["data"]["albums"]:
                    if (album["title"].lower() == album_title.lower() and 
                        album.get("artistId") == artist_id):
                        return album
            return None
            
        except Exception as e:
            logger.error(f"Error finding existing album: {e}")
            return None
    
    def find_or_create_album(self, metadata: Dict, artist_id: int = None) -> Optional[Dict]:
        """Find existing album or create new one"""
        album_title = metadata.get('album_title', '').strip()
        if not album_title:
            return None
            
        # Query for existing album
        query = f'''
        {{
            albums {{
                id
                uuid
                title
                artistId
            }}
        }}
        '''
        
        try:
            response = requests.post(
                self.server_url,
                json={"query": query},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            if "data" in result and "albums" in result["data"]:
                for album in result["data"]["albums"]:
                    if (album["title"].lower() == album_title.lower() and 
                        album.get("artistId") == artist_id):
                        logger.info(f"Found existing album: {album['title']} (ID: {album['id']})")
                        return album
            
            # Album not found, create new one
            return self.create_album(metadata, artist_id)
            
        except Exception as e:
            logger.error(f"Error finding album: {e}")
            return self.create_album(metadata, artist_id)
    
    def create_album(self, metadata: Dict, artist_id: int = None) -> Optional[Dict]:
        """Create a new album in Muza metadata server"""
        args = []
        if metadata.get('album_title'):
            title = metadata["album_title"].replace('"', '\\"')
            args.append(f'title: "{title}"')
        if metadata.get('album_cover'):
            cover = metadata["album_cover"].replace('"', '\\"')
            args.append(f'cover: "{cover}"')
        if metadata.get('year_recorded'):
            args.append(f'yearRecorded: {metadata["year_recorded"]}')
        if metadata.get('year_released'):
            args.append(f'yearReleased: {metadata["year_released"]}')
        if metadata.get('label'):
            label = metadata["label"].replace('"', '\\"')
            args.append(f'label: "{label}"')
        if metadata.get('musicbrainz_album_id'):
            args.append(f'musicbrainzAlbumId: "{metadata["musicbrainz_album_id"]}"')
        if artist_id:
            args.append(f'artistId: {artist_id}')
        
        args_str = ", ".join(args)
        
        mutation = f'''
        mutation {{
            createAlbum({args_str}) {{
                ok
                album {{
                    id
                    uuid
                    title
                }}
            }}
        }}
        '''
        
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
                logger.error(f"GraphQL errors creating album: {result['errors']}")
                return None
            
            album_data = result.get("data", {}).get("createAlbum")
            if album_data and album_data.get("ok"):
                return album_data.get("album")
            return None
            
        except Exception as e:
            logger.error(f"Error creating album: {e}")
            return None
