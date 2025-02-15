CREATE TABLE IF NOT EXISTS music_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE,          -- field for global uniqueness
    original_uuid TEXT,        -- optional reference to an original track's UUID
    album_cover TEXT,          -- e.g. URL or file path for album cover
    album_title TEXT,          -- e.g. "Revolver"
    label TEXT,                -- e.g. "Parlophone"
    label_logo TEXT,           -- e.g. URL or path for label logo
    band_name TEXT,            -- e.g. "The Beatles"
    artist_photo TEXT,         -- e.g. URL/path for main artist's photo
    artist_main TEXT,          -- e.g. "John Lennon"
    instrument TEXT,           -- e.g. "Guitar"
    other_artist_playing TEXT, -- e.g. "Paul McCartney"
    other_instrument TEXT,     -- e.g. "Bass"
    year_recorded INTEGER,     -- e.g. 1965
    year_released INTEGER,     -- e.g. 1966
    song_order INTEGER,        -- e.g. 1, 2, 3... within an album
    song_title TEXT,           -- e.g. "Taxman"
    composer TEXT,             -- e.g. "George Harrison"
    song_file TEXT,            -- e.g. URL/path to audio file (MP3, WAV, etc.)
    created_at TEXT            -- timestamp column
);