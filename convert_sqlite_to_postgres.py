#!/usr/bin/env python3
"""
Script to convert SQLite music.db to PostgreSQL format for RDS migration.

This script reads the SQLite database and generates PostgreSQL INSERT statements
or directly inserts the data into a PostgreSQL database.
"""

import argparse
import json
import logging
import os
import sqlite3
import sys
from datetime import datetime, timezone
from typing import Dict, List, Optional

# Add the current directory to the Python path
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
            logging.FileHandler("convert_sqlite.log")
        ]
    )


def read_sqlite_data(sqlite_path: str) -> List[Dict]:
    """
    Read all data from SQLite database.
    
    Args:
        sqlite_path: Path to the SQLite database file
        
    Returns:
        List of dictionaries containing track data
    """
    if not os.path.exists(sqlite_path):
        raise FileNotFoundError(f"SQLite database not found: {sqlite_path}")
    
    logging.info(f"Reading SQLite database: {sqlite_path}")
    
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row  # This allows accessing columns by name
    
    try:
        cursor = conn.cursor()
        
        # Get table info
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        logging.info(f"Found tables: {[table[0] for table in tables]}")
        
        # Read all data from music_tracks table
        cursor.execute("SELECT * FROM music_tracks")
        rows = cursor.fetchall()
        
        tracks = []
        for row in rows:
            track_dict = dict(row)
            tracks.append(track_dict)
        
        logging.info(f"Read {len(tracks)} tracks from SQLite database")
        return tracks
        
    finally:
        conn.close()


def convert_track_data(track: Dict) -> Dict:
    """
    Convert SQLite track data to PostgreSQL format.
    
    Args:
        track: Track data from SQLite
        
    Returns:
        Converted track data for PostgreSQL
    """
    # Create a new track data dictionary with proper field mapping
    converted_track = {
        'uuid': track.get('uuid'),
        'original_uuid': track.get('original_uuid'),
        'album_cover': track.get('album_cover'),
        'album_title': track.get('album_title'),
        'label': track.get('label'),
        'label_logo': track.get('label_logo'),
        'band_name': track.get('band_name'),
        'artist_photo': track.get('artist_photo'),
        'artist_main': track.get('artist_main'),
        'instrument': track.get('instrument'),
        'other_artist_playing': track.get('other_artist_playing'),
        'other_instrument': track.get('other_instrument'),
        'year_recorded': track.get('year_recorded'),
        'year_released': track.get('year_released'),
        'song_order': track.get('song_order'),
        'song_title': track.get('song_title'),
        'composer': track.get('composer'),
        'song_file': track.get('song_file'),
        'musicbrainz_track_id': track.get('musicbrainz_track_id'),
        'created_at': track.get('created_at')
    }
    
    # Handle data type conversions
    if converted_track['year_recorded'] is not None:
        try:
            converted_track['year_recorded'] = int(converted_track['year_recorded'])
        except (ValueError, TypeError):
            converted_track['year_recorded'] = None
    
    if converted_track['year_released'] is not None:
        try:
            converted_track['year_released'] = int(converted_track['year_released'])
        except (ValueError, TypeError):
            converted_track['year_released'] = None
    
    if converted_track['song_order'] is not None:
        try:
            converted_track['song_order'] = int(converted_track['song_order'])
        except (ValueError, TypeError):
            converted_track['song_order'] = None
    
    return converted_track


def generate_sql_statements(tracks: List[Dict], output_file: str) -> None:
    """
    Generate PostgreSQL INSERT statements and save to file.
    
    Args:
        tracks: List of track data
        output_file: Output file path for SQL statements
    """
    logging.info(f"Generating SQL statements for {len(tracks)} tracks")
    
    with open(output_file, 'w') as f:
        f.write("-- PostgreSQL INSERT statements for Muza music tracks\n")
        f.write("-- Generated from SQLite database\n")
        f.write(f"-- Generated on: {datetime.now().isoformat()}\n\n")
        
        for i, track in enumerate(tracks):
            converted_track = convert_track_data(track)
            
            # Build the INSERT statement
            columns = list(converted_track.keys())
            values = []
            
            for value in converted_track.values():
                if value is None:
                    values.append('NULL')
                elif isinstance(value, str):
                    # Escape single quotes in strings
                    escaped_value = value.replace("'", "''")
                    values.append(f"'{escaped_value}'")
                elif isinstance(value, (int, float)):
                    values.append(str(value))
                else:
                    values.append(f"'{str(value)}'")
            
            sql = f"INSERT INTO music_tracks ({', '.join(columns)}) VALUES ({', '.join(values)});\n"
            f.write(sql)
            
            if (i + 1) % 100 == 0:
                logging.info(f"Generated SQL for {i + 1} tracks...")
    
    logging.info(f"SQL statements saved to: {output_file}")


def insert_into_postgres(tracks: List[Dict], database_url: str) -> None:
    """
    Insert tracks directly into PostgreSQL database.
    
    Args:
        tracks: List of track data
        database_url: PostgreSQL connection string
    """
    logging.info(f"Inserting {len(tracks)} tracks into PostgreSQL database")
    
    db = Database(database_url)
    
    successful_inserts = 0
    failed_inserts = 0
    
    for i, track in enumerate(tracks):
        try:
            converted_track = convert_track_data(track)
            
            # Insert the track
            inserted_track = db.insert_track(converted_track)
            successful_inserts += 1
            
            if (i + 1) % 10 == 0:
                logging.info(f"Inserted {i + 1}/{len(tracks)} tracks...")
                
        except Exception as e:
            failed_inserts += 1
            logging.error(f"Failed to insert track {i + 1} ({track.get('song_title', 'Unknown')}): {e}")
    
    logging.info(f"PostgreSQL insertion completed!")
    logging.info(f"Successful inserts: {successful_inserts}")
    logging.info(f"Failed inserts: {failed_inserts}")


def analyze_sqlite_data(tracks: List[Dict]) -> None:
    """
    Analyze the SQLite data and show statistics.
    
    Args:
        tracks: List of track data
    """
    logging.info("Analyzing SQLite data...")
    
    if not tracks:
        logging.warning("No tracks found in SQLite database")
        return
    
    # Basic statistics
    total_tracks = len(tracks)
    
    # Count non-null values for each field
    field_stats = {}
    for track in tracks:
        for field, value in track.items():
            if field not in field_stats:
                field_stats[field] = {'total': 0, 'non_null': 0}
            field_stats[field]['total'] += 1
            if value is not None:
                field_stats[field]['non_null'] += 1
    
    # Show statistics
    print("\nSQLite Database Analysis:")
    print("=" * 50)
    print(f"Total Tracks: {total_tracks}")
    print("\nField Statistics:")
    print("-" * 30)
    
    for field, stats in field_stats.items():
        non_null_count = stats['non_null']
        total_count = stats['total']
        percentage = (non_null_count / total_count * 100) if total_count > 0 else 0
        print(f"{field:25} {non_null_count:5}/{total_count:5} ({percentage:5.1f}%)")
    
    # Show sample data
    print(f"\nSample Track Data:")
    print("-" * 30)
    sample_track = tracks[0]
    for field, value in sample_track.items():
        if value is not None:
            display_value = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
            print(f"{field:20}: {display_value}")
    
    print("\n" + "=" * 50)


def main():
    """Main function to run the SQLite to PostgreSQL conversion."""
    parser = argparse.ArgumentParser(
        description="Convert SQLite music.db to PostgreSQL format"
    )
    parser.add_argument(
        "--sqlite-path",
        type=str,
        default="music.db",
        help="Path to SQLite database file (default: music.db)"
    )
    parser.add_argument(
        "--database-url",
        type=str,
        help="PostgreSQL connection string for direct insertion"
    )
    parser.add_argument(
        "--output-sql",
        type=str,
        help="Output file for SQL INSERT statements"
    )
    parser.add_argument(
        "--analyze-only",
        action="store_true",
        help="Only analyze the SQLite data, don't convert"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.debug)
    
    # Validate arguments
    if not args.analyze_only and not args.database_url and not args.output_sql:
        logging.error("Must specify either --database-url for direct insertion or --output-sql for SQL file generation")
        sys.exit(1)
    
    try:
        # Read SQLite data
        tracks = read_sqlite_data(args.sqlite_path)
        
        if not tracks:
            logging.error("No tracks found in SQLite database")
            sys.exit(1)
        
        # Analyze data
        analyze_sqlite_data(tracks)
        
        if args.analyze_only:
            logging.info("Analysis complete. Exiting.")
            return
        
        # Convert and insert/generate SQL
        if args.database_url:
            logging.info("Inserting data directly into PostgreSQL database...")
            insert_into_postgres(tracks, args.database_url)
        
        if args.output_sql:
            logging.info("Generating SQL INSERT statements...")
            generate_sql_statements(tracks, args.output_sql)
        
        logging.info("Conversion completed successfully!")
        
    except Exception as e:
        logging.error(f"Conversion failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
