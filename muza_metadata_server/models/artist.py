from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .music_track import Base


class Artist(Base):
    """SQLAlchemy model for artist metadata."""

    __tablename__ = "artists"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), unique=True, nullable=False, index=True)
    
    # Artist information
    name = Column(String(255), nullable=False, index=True)
    band_name = Column(String(255), nullable=True, index=True)
    photo = Column(Text, nullable=True)
    
    # MusicBrainz integration
    musicbrainz_artist_id = Column(String(36), nullable=True, index=True)
    
    # Timestamp
    created_at = Column(String(32), nullable=True)
    
    # Relationships
    tracks = relationship("MusicTrack", back_populates="artist")
    albums = relationship("Album", back_populates="artist")

    def to_dict(self):
        """Convert the model instance to a dictionary for serialization."""
        return {
            "id": self.id,
            "uuid": self.uuid,
            "name": self.name,
            "band_name": self.band_name,
            "photo": self.photo,
            "musicbrainz_artist_id": self.musicbrainz_artist_id,
            "created_at": self.created_at,
        }

    def __repr__(self):
        return f"<Artist(id={self.id}, name='{self.name}')>"