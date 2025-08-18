import uuid
import logging
from datetime import datetime, timezone
import graphene
from sqlalchemy.exc import SQLAlchemyError
from .utils import run_hook


class AlbumType(graphene.ObjectType):
    id = graphene.Int()
    uuid = graphene.String()
    title = graphene.String()
    cover = graphene.String()
    year_recorded = graphene.Int()
    year_released = graphene.Int()
    label = graphene.String()
    label_logo = graphene.String()
    artist_id = graphene.Int()
    musicbrainz_album_id = graphene.String()
    created_at = graphene.String()

class LegacyAlbumType(graphene.ObjectType):
    id = graphene.Int()
    uuid = graphene.String()
    original_uuid = graphene.String()
    artist_main = graphene.String()
    instrument = graphene.String()
    other_artist_playing = graphene.String()
    other_instrument = graphene.String()
    year_recorded = graphene.Int()
    song_order = graphene.Int()
    song_title = graphene.String()
    duration_seconds = graphene.Int()
    composer = graphene.String()
    song_file = graphene.String()
    comments = graphene.String()
    musicbrainz_track_id = graphene.String()
    artist_id = graphene.Int()
    album_id = graphene.Int()
    created_at = graphene.String()


class MusicTrackType(graphene.ObjectType):
    id = graphene.Int()
    uuid = graphene.String()
    original_uuid = graphene.String()
    artist_main = graphene.String()  # Keep for backward compatibility
    instrument = graphene.String()
    other_artist_playing = graphene.String()
    other_instrument = graphene.String()
    year_recorded = graphene.Int()
    song_order = graphene.Int()
    song_title = graphene.String()
    duration_seconds = graphene.Int()
    composer = graphene.String()
    song_file = graphene.String()
    comments = graphene.String()
    musicbrainz_track_id = graphene.String()
    artist_id = graphene.Int()
    album_id = graphene.Int()
    created_at = graphene.String()


class ArtistType(graphene.ObjectType):
    id = graphene.Int()
    uuid = graphene.String()
    name = graphene.String()
    band_name = graphene.String()
    photo = graphene.String()
    musicbrainz_artist_id = graphene.String()
    created_at = graphene.String()

class LegacyArtistType(graphene.ObjectType):
    id = graphene.Int()
    uuid = graphene.String()
    original_uuid = graphene.String()
    album_title = graphene.String()
    album_cover = graphene.String()
    label = graphene.String()
    label_logo = graphene.String()
    band_name = graphene.String()
    artist_photo = graphene.String()
    artist_main = graphene.String()
    instrument = graphene.String()
    other_artist_playing = graphene.String()
    other_instrument = graphene.String()
    year_recorded = graphene.Int()
    year_released = graphene.Int()
    song_order = graphene.Int()
    song_title = graphene.String()
    composer = graphene.String()
    song_file = graphene.String()
    musicbrainz_track_id = graphene.String()
    created_at = graphene.String()


class CreateArtist(graphene.Mutation):
    """Create a new artist."""
    
    class Arguments:
        uuid = graphene.String()
        name = graphene.String(required=True)
        band_name = graphene.String()
        photo = graphene.String()
        musicbrainz_artist_id = graphene.String()
    
    ok = graphene.Boolean()
    artist = graphene.Field(ArtistType)
    
    def mutate(self, info, **kwargs):
        db = info.context.get("db")
        
        if "uuid" not in kwargs or not kwargs["uuid"]:
            kwargs["uuid"] = str(uuid.uuid4())
        
        kwargs["created_at"] = datetime.now(timezone.utc).isoformat() + "Z"
        
        try:
            artist_data = db.insert_artist(kwargs)
            return CreateArtist(ok=True, artist=artist_data)
        except (ValueError, SQLAlchemyError) as e:
            logging.error(f"Failed to create artist: {str(e)}")
            return CreateArtist(ok=False, artist=None)

class CreateAlbum(graphene.Mutation):
    """Create a new album."""
    
    class Arguments:
        uuid = graphene.String()
        title = graphene.String(required=True)
        cover = graphene.String()
        year_recorded = graphene.Int()
        year_released = graphene.Int()
        label = graphene.String()
        label_logo = graphene.String()
        artist_id = graphene.Int()
        musicbrainz_album_id = graphene.String()
    
    ok = graphene.Boolean()
    album = graphene.Field(AlbumType)
    
    def mutate(self, info, **kwargs):
        db = info.context.get("db")
        
        if "uuid" not in kwargs or not kwargs["uuid"]:
            kwargs["uuid"] = str(uuid.uuid4())
        
        kwargs["created_at"] = datetime.now(timezone.utc).isoformat() + "Z"
        
        try:
            album_data = db.insert_album(kwargs)
            return CreateAlbum(ok=True, album=album_data)
        except (ValueError, SQLAlchemyError) as e:
            logging.error(f"Failed to create album: {str(e)}")
            return CreateAlbum(ok=False, album=None)

class CreateMusicTrack(graphene.Mutation):
    """
    Create a new track (append-only).
    """

    class Arguments:
        uuid = graphene.String()
        original_uuid = graphene.String()
        artist_main = graphene.String()  # Keep for backward compatibility
        instrument = graphene.String()
        other_artist_playing = graphene.String()
        other_instrument = graphene.String()
        year_recorded = graphene.Int()
        song_order = graphene.Int()
        song_title = graphene.String()
        duration_seconds = graphene.Int()
        composer = graphene.String()
        song_file = graphene.String()
        comments = graphene.String()
        musicbrainz_track_id = graphene.String()
        artist_id = graphene.Int()
        album_id = graphene.Int()

    ok = graphene.Boolean()
    track = graphene.Field(MusicTrackType)

    def mutate(self, info, **kwargs):
        db = info.context.get("db")
        config = info.context.get("config")

        if "uuid" not in kwargs or not kwargs["uuid"]:
            kwargs["uuid"] = str(uuid.uuid4())

        kwargs["created_at"] = datetime.now(timezone.utc).isoformat() + "Z"

        try:
            track_data = db.insert_track(kwargs)
            if track_data:
                # Run the hook if insertion was successful
                run_hook(config.hook_command, track_data)
            return CreateMusicTrack(ok=True, track=track_data)
        except (ValueError, SQLAlchemyError) as e:
            logging.error(f"Failed to create track: {str(e)}")
            return CreateMusicTrack(ok=False, track=None)


class Query(graphene.ObjectType):
    """
    Query for music tracks.
    """

    all_tracks = graphene.List(MusicTrackType)
    # New dedicated models
    artists = graphene.List(ArtistType, description="Get all artists from dedicated artist table")
    albums = graphene.List(AlbumType, description="Get all albums from dedicated album table")
    
    # Legacy queries (from track data)
    all_albums = graphene.List(
        LegacyAlbumType,
        description="Get all unique albums with all information from the first track",
    )
    all_artists = graphene.List(
        LegacyArtistType,
        description="Get all unique artists with all information from the first track",
    )
    search_albums = graphene.List(
        LegacyAlbumType,
        album_title_contains=graphene.String(),
        label_contains=graphene.String(),
        artist_main_contains=graphene.String(),
        band_name_contains=graphene.String(),
        min_year_recorded=graphene.Int(),
        max_year_recorded=graphene.Int(),
        min_year_released=graphene.Int(),
        max_year_released=graphene.Int(),
        description="Search albums by optional fields: partial text fields and year ranges.",
    )
    search_artists = graphene.List(
        LegacyArtistType,
        artist_main_contains=graphene.String(),
        band_name_contains=graphene.String(),
        album_title_contains=graphene.String(),
        label_contains=graphene.String(),
        min_year_recorded=graphene.Int(),
        max_year_recorded=graphene.Int(),
        min_year_released=graphene.Int(),
        max_year_released=graphene.Int(),
        description="Search artists by optional fields: partial text fields and year ranges.",
    )
    search_tracks = graphene.List(
        MusicTrackType,
        title_contains=graphene.String(),
        band_name_contains=graphene.String(),
        album_title_contains=graphene.String(),
        label_contains=graphene.String(),
        artist_main_contains=graphene.String(),
        other_artist_contains=graphene.String(),
        composer_contains=graphene.String(),
        min_year_recorded=graphene.Int(),
        max_year_recorded=graphene.Int(),
        min_year_released=graphene.Int(),
        max_year_released=graphene.Int(),
        description="Search by optional fields: partial text fields and year ranges.",
    )

    def resolve_artists(self, info):
        db = info.context.get("db")
        try:
            return db.fetch_all_artists()
        except SQLAlchemyError as e:
            logging.error(f"Database error in resolve_artists: {str(e)}")
            return []
    
    def resolve_albums(self, info):
        db = info.context.get("db")
        try:
            return db.fetch_all_albums()
        except SQLAlchemyError as e:
            logging.error(f"Database error in resolve_albums: {str(e)}")
            return []
    
    def resolve_all_tracks(self, info):
        db = info.context.get("db")
        try:
            return db.fetch_all_tracks()
        except SQLAlchemyError as e:
            logging.error(f"Database error in resolve_all_tracks: {str(e)}")
            return []

    def resolve_all_albums(self, info):
        db = info.context.get("db")
        try:
            return db.fetch_unique_albums()
        except SQLAlchemyError as e:
            logging.error(f"Database error in resolve_albums: {str(e)}")
            return []

    def resolve_all_artists(self, info):
        db = info.context.get("db")
        try:
            return db.fetch_unique_artists()
        except SQLAlchemyError as e:
            logging.error(f"Database error in resolve_all_artists: {str(e)}")
            return []

    def resolve_search_albums(
        self,
        info,
        album_title_contains=None,
        label_contains=None,
        artist_main_contains=None,
        band_name_contains=None,
        min_year_recorded=None,
        max_year_recorded=None,
        min_year_released=None,
        max_year_released=None,
    ):
        db = info.context.get("db")
        try:
            return db.search_albums(
                album_title_contains=album_title_contains,
                label_contains=label_contains,
                artist_main_contains=artist_main_contains,
                band_name_contains=band_name_contains,
                min_year_recorded=min_year_recorded,
                max_year_recorded=max_year_recorded,
                min_year_released=min_year_released,
                max_year_released=max_year_released,
            )
        except SQLAlchemyError as e:
            logging.error(f"Database error in resolve_search_albums: {str(e)}")
            return []

    def resolve_search_artists(
        self,
        info,
        artist_main_contains=None,
        band_name_contains=None,
        album_title_contains=None,
        label_contains=None,
        min_year_recorded=None,
        max_year_recorded=None,
        min_year_released=None,
        max_year_released=None,
    ):
        db = info.context.get("db")
        try:
            return db.search_artists(
                artist_main_contains=artist_main_contains,
                band_name_contains=band_name_contains,
                album_title_contains=album_title_contains,
                label_contains=label_contains,
                min_year_recorded=min_year_recorded,
                max_year_recorded=max_year_recorded,
                min_year_released=min_year_released,
                max_year_released=max_year_released,
            )
        except SQLAlchemyError as e:
            logging.error(f"Database error in resolve_search_artists: {str(e)}")
            return []

    def resolve_search_tracks(
        self,
        info,
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
        year_recorded=None,
    ):
        db = info.context.get("db")
        try:
            return db.search_tracks(
                title_contains=title_contains,
                band_name_contains=band_name_contains,
                album_title_contains=album_title_contains,
                label_contains=label_contains,
                artist_main_contains=artist_main_contains,
                other_artist_contains=other_artist_contains,
                composer_contains=composer_contains,
                min_year_recorded=min_year_recorded,
                max_year_recorded=max_year_recorded,
                min_year_released=min_year_released,
                max_year_released=max_year_released,
                year_recorded=year_recorded,
            )
        except SQLAlchemyError as e:
            logging.error(f"Database error in resolve_search_tracks: {str(e)}")
            return []


class Mutation(graphene.ObjectType):
    create_artist = CreateArtist.Field()
    create_album = CreateAlbum.Field()
    create_music_track = CreateMusicTrack.Field()
