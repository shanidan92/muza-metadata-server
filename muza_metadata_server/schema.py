import uuid
import logging
from datetime import datetime, timezone
import graphene

class MusicTrackType(graphene.ObjectType):
    id = graphene.Int()
    uuid = graphene.String()
    original_uuid = graphene.String()
    album_cover = graphene.String()
    album_title = graphene.String()
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
    created_at = graphene.String()

class CreateMusicTrack(graphene.Mutation):
    """
    Create a new track (append-only). 
    """
    class Arguments:
        # Note: 'id' is intentionally not included here as it's managed by the database
        uuid = graphene.String()
        original_uuid = graphene.String()
        album_cover = graphene.String()
        album_title = graphene.String()
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

    ok = graphene.Boolean()
    track = graphene.Field(MusicTrackType)

    def mutate(self, info, **kwargs):
        db = info.context.get('db')

        if "uuid" not in kwargs or not kwargs["uuid"]:
            kwargs["uuid"] = str(uuid.uuid4())
        
        # Set created_at to the current time (UTC) in ISO8601
        kwargs["created_at"] = datetime.now(timezone.utc).isoformat() + "Z"

        track_data = db.insert_track(kwargs)
        if track_data is None:
            logging.error("Failed to insert track into database")
            return CreateMusicTrack(ok=False, track=None)
            
        return CreateMusicTrack(ok=True, track=track_data)

class Query(graphene.ObjectType):
    all_tracks = graphene.List(MusicTrackType)
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
        description="Search by optional fields: partial text fields and year ranges."
    )

    def resolve_all_tracks(self, info):
        db = info.context.get('db')
        return db.fetch_all_tracks()

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
        max_year_released=None
    ):
        db = info.context.get('db')
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
            max_year_released=max_year_released
        )

class Mutation(graphene.ObjectType):
    create_music_track = CreateMusicTrack.Field()
