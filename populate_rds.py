#!/usr/bin/env python3
"""
Script to populate the Muza Metadata Server RDS database with demo data.

This script reads the demo data from allData.json and inserts it into the RDS database
using the MusicTrack model schema.

Usage:
    python populate_rds.py [--database-url DATABASE_URL] [--demo-data-path PATH]
"""

import argparse
import json
import logging
import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

# Add the current directory to the Python path to import the modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from muza_metadata_server.database import Database
from muza_metadata_server.config import Config


def setup_logging(debug: bool = False) -> None:
    """Setup logging configuration."""
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("populate_rds.log")
        ]
    )


def load_demo_data(file_path: str) -> Dict:
    """Load demo data from JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logging.error(f"Demo data file not found: {file_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        logging.error(f"Invalid JSON in demo data file: {e}")
        sys.exit(1)


def create_album_mapping(albums_data: Dict) -> Dict[str, Dict]:
    """
    Create a mapping of album IDs to album data from the albums section.
    
    Args:
        albums_data: The albums section from the demo data
        
    Returns:
        Dict mapping album ID to album data
    """
    album_mapping = {}
    
    # Process all album categories (featured, newReleases, recommended)
    for category in ['featured', 'newReleases', 'recommended']:
        if category in albums_data:
            for album in albums_data[category]:
                album_id = album['id']
                album_mapping[album_id] = {
                    'title': album['title'],
                    'artist': album['artist'],
                    'subTitle': album.get('subTitle'),  # Year
                    'imageSrc': album.get('imageSrc'),
                    'songs': album.get('songs', [])
                }
    
    return album_mapping


def create_artist_mapping(artists_data: List[Dict]) -> Dict[str, Dict]:
    """
    Create a mapping of artist names to artist data.
    
    Args:
        artists_data: The artists section from the demo data
        
    Returns:
        Dict mapping artist name to artist data
    """
    artist_mapping = {}
    
    for artist in artists_data:
        artist_name = artist['name']
        artist_mapping[artist_name] = {
            'id': artist['id'],
            'imageUrl': artist.get('imageUrl'),
            'albumsCount': artist.get('albumsCount', 0)
        }
    
    return artist_mapping


def convert_song_to_track(
    song: Dict, 
    album_mapping: Dict[str, Dict], 
    artist_mapping: Dict[str, Dict],
    track_counter: int
) -> Dict:
    """
    Convert a song from the demo data to a MusicTrack record.
    
    Args:
        song: Song data from the demo data
        album_mapping: Mapping of album IDs to album data
        artist_mapping: Mapping of artist names to artist data
        track_counter: Counter for generating unique UUIDs
        
    Returns:
        Dict containing the track data for database insertion
    """
    # Get album data
    album_id = song.get('albumId')
    album_data = album_mapping.get(album_id, {})
    
    # Get artist data
    artist_name = song.get('artist')
    artist_data = artist_mapping.get(artist_name, {})
    
    # Generate UUID for the track
    track_uuid = str(uuid.uuid4())
    
    # Create track data mapping to the MusicTrack model
    track_data = {
        'uuid': track_uuid,
        'original_uuid': None,  # Not provided in demo data
        'album_cover': album_data.get('imageSrc'),
        'album_title': album_data.get('title') or song.get('album'),
        'label': None,  # Not provided in demo data
        'label_logo': None,  # Not provided in demo data
        'band_name': None,  # Not provided in demo data
        'artist_photo': artist_data.get('imageUrl'),
        'artist_main': artist_name,
        'instrument': None,  # Not provided in demo data
        'other_artist_playing': None,  # Not provided in demo data
        'other_instrument': None,  # Not provided in demo data
        'year_recorded': None,  # Not provided in demo data
        'year_released': album_data.get('subTitle') or song.get('year'),
        'song_order': song.get('index'),
        'song_title': song.get('title'),
        'composer': None,  # Not provided in demo data
        'song_file': song.get('audioUrl'),
        'musicbrainz_track_id': None,  # Not provided in demo data
        'created_at': datetime.now(timezone.utc)
    }
    
    return track_data


def populate_database(db: Database, tracks_data: List[Dict]) -> None:
    """
    Populate the database with track data.
    
    Args:
        db: Database instance
        tracks_data: List of track data dictionaries
    """
    logging.info(f"Starting to populate database with {len(tracks_data)} tracks...")
    
    successful_inserts = 0
    failed_inserts = 0
    
    for i, track_data in enumerate(tracks_data, 1):
        try:
            # Insert the track
            inserted_track = db.insert_track(track_data)
            successful_inserts += 1
            
            if i % 10 == 0:  # Log progress every 10 tracks
                logging.info(f"Inserted {i}/{len(tracks_data)} tracks...")
                
        except Exception as e:
            failed_inserts += 1
            logging.error(f"Failed to insert track {i} ({track_data.get('song_title', 'Unknown')}): {e}")
    
    logging.info(f"Database population completed!")
    logging.info(f"Successful inserts: {successful_inserts}")
    logging.info(f"Failed inserts: {failed_inserts}")


def main():
    """Main function to run the database population script."""
    parser = argparse.ArgumentParser(
        description="Populate Muza Metadata Server RDS database with demo data"
    )
    parser.add_argument(
        "--database-url",
        type=str,
        help="Database URL (e.g., postgresql://user:pass@host:port/db)",
        default=os.getenv("DATABASE_URL")
    )
    parser.add_argument(
        "--demo-data-path",
        type=str,
        help="Path to the demo data JSON file",
        default="../muza-lit-library/public/staticData/allData.json"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.debug)
    
    # Validate database URL
    if not args.database_url:
        logging.error("Database URL is required. Set DATABASE_URL environment variable or use --database-url")
        sys.exit(1)
    
    # Load demo data
    logging.info(f"Loading demo data from: {args.demo_data_path}")
    demo_data = load_demo_data(args.demo_data_path)
    
    # Create album and artist mappings
    logging.info("Creating album and artist mappings...")
    album_mapping = create_album_mapping(demo_data.get('albums', {}))
    artist_mapping = create_artist_mapping(demo_data.get('artists', []))
    
    logging.info(f"Found {len(album_mapping)} albums and {len(artist_mapping)} artists")
    
    # Convert songs to tracks
    logging.info("Converting songs to tracks...")
    songs = demo_data.get('songs', [])
    tracks_data = []
    
    for i, song in enumerate(songs):
        track_data = convert_song_to_track(song, album_mapping, artist_mapping, i)
        tracks_data.append(track_data)
    
    logging.info(f"Converted {len(tracks_data)} songs to tracks")
    
    # Initialize database connection
    logging.info("Initializing database connection...")
    try:
        db = Database(args.database_url)
        logging.info("Database connection established successfully")
    except Exception as e:
        logging.error(f"Failed to connect to database: {e}")
        sys.exit(1)
    
    # Populate database
    try:
        populate_database(db, tracks_data)
        logging.info("Database population completed successfully!")
    except Exception as e:
        logging.error(f"Failed to populate database: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
