import logging
from typing import Dict, List, Optional
from sqlalchemy import create_engine, and_, or_, func
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
        # Configure engine with RDS-appropriate settings
        engine_args = self._get_engine_args(database_url)
        self.engine = create_engine(database_url, **engine_args)
        self.SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )
        self.init_db()

    def _get_engine_args(self, database_url: str) -> dict:
        """Get engine configuration based on database type"""
        engine_args = {}
        
        if database_url.startswith("postgresql://"):
            # PostgreSQL RDS configuration
            engine_args.update({
                "pool_size": 10,
                "max_overflow": 20,
                "pool_timeout": 30,
                "pool_recycle": 1800,  # Recycle connections every 30 minutes
                "pool_pre_ping": True,  # Verify connections before use
                "connect_args": {
                    "sslmode": "require",  # Force SSL for RDS
                    "connect_timeout": 10
                }
            })
        elif database_url.startswith("mysql://"):
            # MySQL RDS configuration
            engine_args.update({
                "pool_size": 10,
                "max_overflow": 20,
                "pool_timeout": 30,
                "pool_recycle": 1800,
                "pool_pre_ping": True,
                "connect_args": {
                    "ssl": {"ssl_disabled": False},
                    "connect_timeout": 10
                }
            })
        elif database_url.startswith("sqlite://"):
            # SQLite configuration (for local development)
            engine_args.update({
                "pool_timeout": 20,
                "pool_recycle": -1,
                "connect_args": {"check_same_thread": False}
            })
        
        return engine_args

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

            # Check if track with MusicBrainz ID already exists
            if track_data.get("musicbrainz_track_id"):
                existing_mb_track = (
                    session.query(MusicTrack)
                    .filter(MusicTrack.musicbrainz_track_id == track_data["musicbrainz_track_id"])
                    .first()
                )

                if existing_mb_track:
                    error_msg = f"Track with MusicBrainz ID {track_data['musicbrainz_track_id']} already exists"
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
        musicbrainz_track_id: Optional[str] = None,
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

            if musicbrainz_track_id:
                conditions.append(MusicTrack.musicbrainz_track_id == musicbrainz_track_id)

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

    def fetch_unique_albums(self) -> List[Dict]:
        """
        Retrieve unique albums with all metadata from the first track of each album.

        Returns:
            List[Dict]: List of unique albums with complete track metadata

        Raises:
            SQLAlchemyError: If there's a database error
        """
        session = self.get_session()
        try:
            # Get the first track per album (by ID) to ensure consistent results
            subquery = (
                session.query(
                    MusicTrack.album_title,
                    func.min(MusicTrack.id).label("first_track_id"),
                )
                .filter(MusicTrack.album_title.isnot(None))
                .group_by(MusicTrack.album_title)
                .subquery()
            )

            tracks = (
                session.query(MusicTrack)
                .join(subquery, MusicTrack.id == subquery.c.first_track_id)
                .order_by(MusicTrack.album_title)
                .all()
            )

            return [track.to_dict() for track in tracks]
        except SQLAlchemyError as e:
            logger.error(f"Database error in fetch_unique_albums: {str(e)}")
            raise
        finally:
            session.close()

    def search_albums(
        self,
        album_title_contains: Optional[str] = None,
        label_contains: Optional[str] = None,
        artist_main_contains: Optional[str] = None,
        band_name_contains: Optional[str] = None,
        min_year_recorded: Optional[int] = None,
        max_year_recorded: Optional[int] = None,
        min_year_released: Optional[int] = None,
        max_year_released: Optional[int] = None,
    ) -> List[Dict]:
        """
        Search for unique albums based on multiple criteria.

        Returns:
            List[Dict]: List of unique albums matching the search criteria

        Raises:
            SQLAlchemyError: If there's a database error
        """
        session = self.get_session()
        try:
            # Get the first track per album (by ID) to ensure consistent results
            subquery = (
                session.query(
                    MusicTrack.album_title,
                    func.min(MusicTrack.id).label("first_track_id"),
                )
                .filter(MusicTrack.album_title.isnot(None))
                .group_by(MusicTrack.album_title)
                .subquery()
            )

            query = session.query(MusicTrack).join(
                subquery, MusicTrack.id == subquery.c.first_track_id
            )

            conditions = []

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

            if band_name_contains:
                conditions.append(MusicTrack.band_name.ilike(f"%{band_name_contains}%"))

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

            tracks = query.order_by(MusicTrack.album_title).all()
            return [track.to_dict() for track in tracks]

        except SQLAlchemyError as e:
            logger.error(f"Database error in search_albums: {str(e)}")
            raise
        finally:
            session.close()

    def fetch_unique_artists(self) -> List[Dict]:
        """
        Retrieve unique artists with all metadata from the first track of each artist.

        Returns:
            List[Dict]: List of unique artists with complete track metadata

        Raises:
            SQLAlchemyError: If there's a database error
        """
        session = self.get_session()
        try:
            # Get the first track per artist (by ID) to ensure consistent results
            subquery = (
                session.query(
                    MusicTrack.artist_main,
                    func.min(MusicTrack.id).label("first_track_id"),
                )
                .filter(MusicTrack.artist_main.isnot(None))
                .group_by(MusicTrack.artist_main)
                .subquery()
            )

            tracks = (
                session.query(MusicTrack)
                .join(subquery, MusicTrack.id == subquery.c.first_track_id)
                .order_by(MusicTrack.artist_main)
                .all()
            )

            return [track.to_dict() for track in tracks]
        except SQLAlchemyError as e:
            logger.error(f"Database error in fetch_unique_artists: {str(e)}")
            raise
        finally:
            session.close()

    def search_artists(
        self,
        artist_main_contains: Optional[str] = None,
        band_name_contains: Optional[str] = None,
        album_title_contains: Optional[str] = None,
        label_contains: Optional[str] = None,
        min_year_recorded: Optional[int] = None,
        max_year_recorded: Optional[int] = None,
        min_year_released: Optional[int] = None,
        max_year_released: Optional[int] = None,
    ) -> List[Dict]:
        """
        Search for unique artists based on multiple criteria.

        Returns:
            List[Dict]: List of unique artists matching the search criteria

        Raises:
            SQLAlchemyError: If there's a database error
        """
        session = self.get_session()
        try:
            # Get the first track per artist (by ID) to ensure consistent results
            subquery = (
                session.query(
                    MusicTrack.artist_main,
                    func.min(MusicTrack.id).label("first_track_id"),
                )
                .filter(MusicTrack.artist_main.isnot(None))
                .group_by(MusicTrack.artist_main)
                .subquery()
            )

            query = session.query(MusicTrack).join(
                subquery, MusicTrack.id == subquery.c.first_track_id
            )

            conditions = []

            if artist_main_contains:
                conditions.append(
                    MusicTrack.artist_main.ilike(f"%{artist_main_contains}%")
                )

            if band_name_contains:
                conditions.append(MusicTrack.band_name.ilike(f"%{band_name_contains}%"))

            if album_title_contains:
                conditions.append(
                    MusicTrack.album_title.ilike(f"%{album_title_contains}%")
                )

            if label_contains:
                conditions.append(MusicTrack.label.ilike(f"%{label_contains}%"))

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

            tracks = query.order_by(MusicTrack.artist_main).all()
            return [track.to_dict() for track in tracks]

        except SQLAlchemyError as e:
            logger.error(f"Database error in search_artists: {str(e)}")
            raise
        finally:
            session.close()
