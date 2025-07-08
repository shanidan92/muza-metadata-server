from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class MusicTrack(Base):
    """
    SQLAlchemy model for music track metadata.
    """

    __tablename__ = "music_tracks"

    # Primary key - auto-incrementing integer
    id = Column(Integer, primary_key=True, autoincrement=True)

    # UUID fields
    uuid = Column(String(36), unique=True, nullable=False, index=True)
    original_uuid = Column(String(36), nullable=True)

    # Album and label information
    album_cover = Column(Text, nullable=True)
    album_title = Column(String(255), nullable=True, index=True)
    label = Column(String(255), nullable=True, index=True)
    label_logo = Column(Text, nullable=True)

    # Artist and band information
    band_name = Column(String(255), nullable=True, index=True)
    artist_photo = Column(Text, nullable=True)
    artist_main = Column(String(255), nullable=True, index=True)
    instrument = Column(String(255), nullable=True)
    other_artist_playing = Column(Text, nullable=True)
    other_instrument = Column(Text, nullable=True)

    # Year information
    year_recorded = Column(Integer, nullable=True, index=True)
    year_released = Column(Integer, nullable=True, index=True)

    # Song information
    song_order = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    song_title = Column(String(255), nullable=False, index=True)
    composer = Column(String(255), nullable=True, index=True)
    song_file = Column(Text, nullable=True)
    comments = Column(String(255) , nullable=True)

    # MusicBrainz integration
    musicbrainz_track_id = Column(String(36), nullable=True, index=True)
    
    # Foreign key relationships
    artist_id = Column(Integer, ForeignKey('artists.id'), nullable=True)
    album_id = Column(Integer, ForeignKey('albums.id'), nullable=True)

    # Timestamp
    created_at = Column(String(32), nullable=True)
    
    # Relationships
    artist = relationship("Artist", back_populates="tracks")
    album = relationship("Album", back_populates="tracks")

    def to_dict(self):
        """
        Convert the model instance to a dictionary for serialization.
        """
        return {
            "id": self.id,
            "uuid": self.uuid,
            "original_uuid": self.original_uuid,
            "album_cover": self.album_cover,
            "album_title": self.album_title,
            "label": self.label,
            "label_logo": self.label_logo,
            "band_name": self.band_name,
            "artist_photo": self.artist_photo,
            "artist_main": self.artist_main,
            "instrument": self.instrument,
            "other_artist_playing": self.other_artist_playing,
            "other_instrument": self.other_instrument,
            "year_recorded": self.year_recorded,
            "year_released": self.year_released,
            "song_order": self.song_order,
            "song_title": self.song_title,
            "duration_seconds": self.duration_seconds,
            "composer": self.composer,
            "song_file": self.song_file,
            "comments": self.comments,
            "musicbrainz_track_id": self.musicbrainz_track_id,
            "artist_id": self.artist_id,
            "album_id": self.album_id,
            "created_at": self.created_at,
        }

    def __repr__(self):
        return f"<MusicTrack(id={self.id}, title='{self.song_title}', artist='{self.artist_main}')>"
