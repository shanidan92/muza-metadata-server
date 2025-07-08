from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .music_track import Base


class Album(Base):
    """SQLAlchemy model for album metadata."""

    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), unique=True, nullable=False, index=True)
    
    # Album information
    title = Column(String(255), nullable=False, index=True)
    cover = Column(Text, nullable=True)
    year_recorded = Column(Integer, nullable=True, index=True)
    year_released = Column(Integer, nullable=True, index=True)
    
    # Label information
    label = Column(String(255), nullable=True, index=True)
    label_logo = Column(Text, nullable=True)
    
    # Artist relationship
    artist_id = Column(Integer, ForeignKey('artists.id'), nullable=True)
    
    # MusicBrainz integration
    musicbrainz_album_id = Column(String(36), nullable=True, index=True)
    
    # Timestamp
    created_at = Column(String(32), nullable=True)
    
    # Relationships
    artist = relationship("Artist", back_populates="albums")
    tracks = relationship("MusicTrack", back_populates="album")

    def to_dict(self):
        """Convert the model instance to a dictionary for serialization."""
        return {
            "id": self.id,
            "uuid": self.uuid,
            "title": self.title,
            "cover": self.cover,
            "year_recorded": self.year_recorded,
            "year_released": self.year_released,
            "label": self.label,
            "label_logo": self.label_logo,
            "artist_id": self.artist_id,
            "musicbrainz_album_id": self.musicbrainz_album_id,
            "created_at": self.created_at,
        }

    def __repr__(self):
        return f"<Album(id={self.id}, title='{self.title}')>"