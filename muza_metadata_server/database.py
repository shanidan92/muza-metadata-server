import sqlite3
import logging
from typing import Dict

logger = logging.getLogger(__name__)


class Database:
    """
    Database handler class for music tracks metadata.
    """

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """
        Initialize the database schema.

        Reads the schema from 'schema.sql' file and executes it to create
        the necessary tables if they don't exist.

        Raises:
            FileNotFoundError: If schema.sql is not found
            sqlite3.Error: If there's an error executing the schema
        """
        with open("schema.sql") as f:
            schema = f.read()
            with self.get_connection() as conn:
                conn.executescript(schema)

    def insert_track(self, track_data: Dict) -> Dict:
        """
        Insert a new track into the database.

        Args:
            track_data (Dict): Dictionary containing track information including:
                - uuid (str): Unique identifier for the track
                - song_title (str): Title of the song
                - Optional fields: band_name, album_title, label, etc.

        Returns:
            Dict: The inserted track data including the generated database ID

        Raises:
            ValueError: If required fields are missing or if UUID already exists
            sqlite3.Error: If there's a database error
        """
        required_fields = ["uuid", "song_title"]

        missing_fields = [
            field for field in required_fields if not track_data.get(field)
        ]
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        conn = self.get_connection()
        cursor = conn.cursor()

        sanitized_data = track_data.copy()
        sanitized_data.pop("id", None)

        try:
            # Check if track with UUID already exists
            cursor.execute(
                "SELECT id FROM music_tracks WHERE uuid = ?", (sanitized_data["uuid"],)
            )
            if cursor.fetchone():
                error_msg = f"Track with UUID {sanitized_data['uuid']} already exists"
                logger.error(error_msg)
                raise ValueError(error_msg)

            columns = ", ".join(sanitized_data.keys())
            placeholders = ", ".join(["?"] * len(sanitized_data))
            values = list(sanitized_data.values())

            query = f"INSERT INTO music_tracks ({columns}) VALUES ({placeholders})"
            cursor.execute(query, values)
            conn.commit()

            row_id = cursor.lastrowid
            cursor.execute("SELECT * FROM music_tracks WHERE id = ?", (row_id,))
            row = cursor.fetchone()
            return dict(row)

        except (sqlite3.Error, ValueError) as e:
            logger.error(f"Error in insert_track: {str(e)}")
            conn.rollback()
            raise
        finally:
            conn.close()

    def search_tracks(
        self,
        title_contains=None,
        band_name_contains=None,
        album_title_contains=None,
        label_contains=None,
        artist_main_contains=None,
        other_artist_contains=None,
        composer_contains=None,
        min_year_recorded=None,
        max_year_recorded=None,
        min_year_released=None,
        max_year_released=None,
    ):
        """
        Search for tracks based on multiple criteria.

        Args:
            title_contains (str, optional): Partial match for song title
            band_name_contains (str, optional): Partial match for band name
            album_title_contains (str, optional): Partial match for album title
            label_contains (str, optional): Partial match for label name
            artist_main_contains (str, optional): Partial match for main artist
            other_artist_contains (str, optional): Partial match for other artists
            composer_contains (str, optional): Partial match for composer name
            min_year_recorded (int, optional): Minimum year recorded
            max_year_recorded (int, optional): Maximum year recorded
            min_year_released (int, optional): Minimum year released
            max_year_released (int, optional): Maximum year released

        Returns:
            List[Dict]: List of tracks matching the search criteria

        Raises:
            sqlite3.Error: If there's a database error
        """
        query = "SELECT * FROM music_tracks"
        conditions = []
        params = []

        if title_contains:
            conditions.append("LOWER(song_title) LIKE ?")
            params.append(f"%{title_contains.lower()}%")

        if band_name_contains:
            conditions.append("LOWER(band_name) LIKE ?")
            params.append(f"%{band_name_contains.lower()}%")

        if album_title_contains:
            conditions.append("LOWER(album_title) LIKE ?")
            params.append(f"%{album_title_contains.lower()}%")

        if label_contains:
            conditions.append("LOWER(label) LIKE ?")
            params.append(f"%{label_contains.lower()}%")

        if artist_main_contains:
            conditions.append("LOWER(artist_main) LIKE ?")
            params.append(f"%{artist_main_contains.lower()}%")

        if other_artist_contains:
            conditions.append("LOWER(other_artist_playing) LIKE ?")
            params.append(f"%{other_artist_contains.lower()}%")

        if composer_contains:
            conditions.append("LOWER(composer) LIKE ?")
            params.append(f"%{composer_contains.lower()}%")

        if min_year_recorded is not None:
            conditions.append("year_recorded >= ?")
            params.append(min_year_recorded)

        if max_year_recorded is not None:
            conditions.append("year_recorded <= ?")
            params.append(max_year_recorded)

        if min_year_released is not None:
            conditions.append("year_released >= ?")
            params.append(min_year_released)

        if max_year_released is not None:
            conditions.append("year_released <= ?")
            params.append(max_year_released)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except sqlite3.Error as e:
            logger.error(f"Database error in search_tracks: {str(e)}")
            raise
        finally:
            conn.close()

    def fetch_all_tracks(self):
        """
        Retrieve all tracks from the database.

        Returns:
            List[Dict]: List of all tracks in the database

        Raises:
            sqlite3.Error: If there's a database error
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT * FROM music_tracks")
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except sqlite3.Error as e:
            logger.error(f"Database error in fetch_all_tracks: {str(e)}")
            raise
        finally:
            conn.close()

    def fetch_track_by_id(self, track_id):
        """
        Retrieve a specific track by its ID.

        Args:
            track_id (int): The ID of the track to retrieve

        Returns:
            Dict: Track data if found, None otherwise

        Raises:
            sqlite3.Error: If there's a database error
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT * FROM music_tracks WHERE id = ?", (track_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        except sqlite3.Error as e:
            logger.error(f"Database error in fetch_track_by_id: {str(e)}")
            raise
        finally:
            conn.close()
