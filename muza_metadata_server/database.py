import logging
from typing import Dict, List, Optional
from sqlalchemy import create_engine, and_, or_
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from .models import Base, MusicTrack

logger = logging.getLogger(__name__)


class Database:
    """
    Database handler class for music tracks metadata using SQLAlchemy.
    """

    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )
        self.init_db()

    def init_db(self):
        """
        Initialize the database schema.
        Creates all tables defined in the models.
        """
        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("Database tables created successfully")
        except SQLAlchemyError as e:
            logger.error(f"Error creating database tables: {str(e)}")
            raise

    def get_session(self) -> Session:
        """Get a new database session"""
        return self.SessionLocal()

    def insert_track(self, track_data: Dict) -> Dict:
        """
        Insert a new track into the database.

        Args:
            track_data (Dict): Dictionary containing track information

        Returns:
            Dict: The inserted track data including the generated database ID

        Raises:
            ValueError: If required fields are missing or if UUID already exists
            SQLAlchemyError: If there's a database error
        """
        required_fields = ["uuid", "song_title"]

        missing_fields = [
            field for field in required_fields if not track_data.get(field)
        ]
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        session = self.get_session()
        try:
            # Check if track with UUID already exists
            existing_track = (
                session.query(MusicTrack)
                .filter(MusicTrack.uuid == track_data["uuid"])
                .first()
            )

            if existing_track:
                error_msg = f"Track with UUID {track_data['uuid']} already exists"
                logger.error(error_msg)
                raise ValueError(error_msg)

            # Create new track instance
            track = MusicTrack(**track_data)
            session.add(track)
            session.commit()
            session.refresh(track)

            return track.to_dict()

        except (SQLAlchemyError, ValueError) as e:
            logger.error(f"Error in insert_track: {str(e)}")
            session.rollback()
            raise
        finally:
            session.close()

    def search_tracks(
        self,
        title_contains: Optional[str] = None,
        band_name_contains: Optional[str] = None,
        album_title_contains: Optional[str] = None,
        label_contains: Optional[str] = None,
        artist_main_contains: Optional[str] = None,
        other_artist_contains: Optional[str] = None,
        composer_contains: Optional[str] = None,
        min_year_recorded: Optional[int] = None,
        max_year_recorded: Optional[int] = None,
        min_year_released: Optional[int] = None,
        max_year_released: Optional[int] = None,
        year_recorded: Optional[int] = None,
    ) -> List[Dict]:
        """
        Search for tracks based on multiple criteria.

        Returns:
            List[Dict]: List of tracks matching the search criteria

        Raises:
            SQLAlchemyError: If there's a database error
        """
        session = self.get_session()
        try:
            query = session.query(MusicTrack)
            conditions = []

            if title_contains:
                conditions.append(MusicTrack.song_title.ilike(f"%{title_contains}%"))

            if band_name_contains:
                conditions.append(MusicTrack.band_name.ilike(f"%{band_name_contains}%"))

            if album_title_contains:
                conditions.append(
                    MusicTrack.album_title.ilike(f"%{album_title_contains}%")
                )

            if label_contains:
                conditions.append(MusicTrack.label.ilike(f"%{label_contains}%"))

            if artist_main_contains:
                conditions.append(
                    MusicTrack.artist_main.ilike(f"%{artist_main_contains}%")
                )

            if other_artist_contains:
                conditions.append(
                    MusicTrack.other_artist_playing.ilike(f"%{other_artist_contains}%")
                )

            if composer_contains:
                conditions.append(MusicTrack.composer.ilike(f"%{composer_contains}%"))

            if year_recorded is not None:
                conditions.append(MusicTrack.year_recorded == year_recorded)

            if min_year_recorded is not None:
                conditions.append(MusicTrack.year_recorded >= min_year_recorded)

            if max_year_recorded is not None:
                conditions.append(MusicTrack.year_recorded <= max_year_recorded)

            if min_year_released is not None:
                conditions.append(MusicTrack.year_released >= min_year_released)

            if max_year_released is not None:
                conditions.append(MusicTrack.year_released <= max_year_released)

            if conditions:
                query = query.filter(and_(*conditions))

            tracks = query.all()
            return [track.to_dict() for track in tracks]

        except SQLAlchemyError as e:
            logger.error(f"Database error in search_tracks: {str(e)}")
            raise
        finally:
            session.close()

    def fetch_all_tracks(self) -> List[Dict]:
        """
        Retrieve all tracks from the database.

        Returns:
            List[Dict]: List of all tracks in the database

        Raises:
            SQLAlchemyError: If there's a database error
        """
        session = self.get_session()
        try:
            tracks = session.query(MusicTrack).all()
            return [track.to_dict() for track in tracks]
        except SQLAlchemyError as e:
            logger.error(f"Database error in fetch_all_tracks: {str(e)}")
            raise
        finally:
            session.close()

    def fetch_track_by_id(self, track_id: int) -> Optional[Dict]:
        """
        Retrieve a specific track by its ID.

        Args:
            track_id (int): The ID of the track to retrieve

        Returns:
            Dict: Track data if found, None otherwise

        Raises:
            SQLAlchemyError: If there's a database error
        """
        session = self.get_session()
        try:
            track = session.query(MusicTrack).filter(MusicTrack.id == track_id).first()
            return track.to_dict() if track else None
        except SQLAlchemyError as e:
            logger.error(f"Database error in fetch_track_by_id: {str(e)}")
            raise
        finally:
            session.close()
