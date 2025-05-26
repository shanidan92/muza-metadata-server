# Playground Examples

This directory contains examples and test data for the Muza Metadata Server.

## Prerequisites

- jq installed (for JSON processing in the hook script)
- curl installed

## Quick Start

1. Start the server:
```bash
cd ..
make run-dev
```

2. Load test data:
```bash
./fill_db.sh
```

## Example Queries

### Insert a new track
```graphql
mutation {
  createMusicTrack(
    albumTitle: "NEW HORIZONS"
    artistMain: "John Smith"
    instrument: "Piano"
    songTitle: "Morning Light"
    yearRecorded: 2023
    yearReleased: 2023
    bandName: "The Trio"
    otherArtistPlaying: "Jane Doe, Bob Wilson"
    otherInstrument: "Bass, Drums"
    composer: "John Smith"
    label: "Jazz Records"
  ) {
    ok
    track {
      id
      uuid
      songTitle
      createdAt
    }
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation { createMusicTrack(albumTitle: \"NEW HORIZONS\", artistMain: \"John Smith\", instrument: \"Piano\", songTitle: \"Morning Light\", yearRecorded: 2023, yearReleased: 2023, bandName: \"The Trio\", otherArtistPlaying: \"Jane Doe, Bob Wilson\", otherInstrument: \"Bass, Drums\", composer: \"John Smith\", label: \"Jazz Records\") { ok track { id uuid songTitle createdAt } } }"
  }' | jq
```

### Find all tracks from Lost Brother album
```graphql
{
  searchTracks(
    albumTitleContains: "LOST BROTHER"
  ) {
    songTitle
    artistMain
    instrument
    otherArtistPlaying
    otherInstrument
    composer
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(albumTitleContains: \"LOST BROTHER\") { songTitle artistMain instrument otherArtistPlaying otherInstrument composer } }"
  }' | jq
```

### Find tracks by year range and artist
```graphql
{
  searchTracks(
    minYearRecorded: 2000
    maxYearRecorded: 2005
    artistMainContains: "Assif"
  ) {
    songTitle
    artistMain
    yearRecorded
    yearReleased
    bandName
    label
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(minYearRecorded: 2000, maxYearRecorded: 2005, artistMainContains: \"Assif\") { songTitle artistMain yearRecorded yearReleased bandName label } }"
  }' | jq
```

### Search for collaborations
```graphql
{
  searchTracks(
    otherArtistContains: "Cooper-Moore"
    artistMainContains: "Assif"
  ) {
    songTitle
    artistMain
    instrument
    otherArtistPlaying
    otherInstrument
    composer
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(otherArtistContains: \"Cooper-Moore\", artistMainContains: \"Assif\") { songTitle artistMain instrument otherArtistPlaying otherInstrument composer } }"
  }' | jq
```

### Multi-criteria search
```graphql
{
  searchTracks(
    labelContains: "HOPSCOTCH"
    composerContains: "Drake"
    minYearReleased: 2005
    maxYearReleased: 2005
  ) {
    songTitle
    albumTitle
    label
    composer
    yearReleased
    artistMain
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(labelContains: \"HOPSCOTCH\", composerContains: \"Drake\", minYearReleased: 2005, maxYearReleased: 2005) { songTitle albumTitle label composer yearReleased artistMain } }"
  }' | jq
```

### Find tracks recorded in 2005
```graphql
{
  searchTracks(
    yearRecorded: 2005
  ) {
    songTitle
    bandName
    composer
    yearRecorded
    yearReleased
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(yearRecorded: 2005) { songTitle bandName composer yearRecorded yearReleased } }"
  }' | jq
```

### Get specific track details
```graphql
{
  searchTracks(
    titleContains: "Breaking The Water"
  ) {
    id
    songTitle
    artistMain
    instrument
    otherArtistPlaying
    otherInstrument
    label
    yearRecorded
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(titleContains: \"Breaking The Water\") { id songTitle artistMain instrument otherArtistPlaying otherInstrument label yearRecorded } }"
  }' | jq
```

### Search by band and release year range
```graphql
{
  searchTracks(
    bandNameContains: "Trio"
    minYearReleased: 2000
    maxYearReleased: 2023
  ) {
    songTitle
    bandName
    yearReleased
    artistMain
    otherArtistPlaying
    label
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(bandNameContains: \"Trio\", minYearReleased: 2000, maxYearReleased: 2023) { songTitle bandName yearReleased artistMain otherArtistPlaying label } }"
  }' | jq
```

### List all musicians and their instruments
```graphql
{
  searchTracks(
    albumTitleContains: "LOST BROTHER"
  ) {
    artistMain
    instrument
    otherArtistPlaying
    otherInstrument
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(albumTitleContains: \"LOST BROTHER\") { artistMain instrument otherArtistPlaying otherInstrument } }"
  }' | jq
```

# Album Queries Documentation

This document describes the new album-related GraphQL queries available in the Muza Metadata Server.

## Overview

The album queries allow you to retrieve unique albums with complete metadata from the first track of each album. This provides a consolidated view of your music collection at the album level.

## Available Queries

### 1. `albums` - Get All Unique Albums

Retrieves all unique albums with complete information from the first track of each album.

#### Query Structure
```graphql
query {
  albums {
    id
    uuid
    original_uuid
    album_title
    album_cover
    label
    label_logo
    band_name
    artist_photo
    artist_main
    instrument
    other_artist_playing
    other_instrument
    year_recorded
    year_released
    song_order
    song_title
    composer
    song_file
    created_at
  }
}
```

#### Example Response
```json
{
  "data": {
    "albums": [
      {
        "id": 1,
        "uuid": "123e4567-e89b-12d3-a456-426614174000",
        "album_title": "Abbey Road",
        "album_cover": "https://example.com/abbey_road.jpg",
        "label": "Apple Records",
        "label_logo": "https://example.com/apple_logo.png",
        "band_name": "The Beatles",
        "artist_main": "The Beatles",
        "year_recorded": 1969,
        "year_released": 1969,
        "song_title": "Come Together",
        "composer": "Lennon-McCartney"
      }
    ]
  }
}
```

### 2. `search_albums` - Search Albums with Filters

Search for albums using various filter criteria. All filters are optional and can be combined.

#### Available Filters
- `album_title_contains`: Partial match on album title
- `label_contains`: Partial match on record label
- `artist_main_contains`: Partial match on main artist
- `band_name_contains`: Partial match on band name
- `min_year_recorded`: Minimum recording year
- `max_year_recorded`: Maximum recording year
- `min_year_released`: Minimum release year
- `max_year_released`: Maximum release year

#### Query Structure
```graphql
query SearchAlbums(
  $albumTitle: String
  $label: String
  $artist: String
  $bandName: String
  $minYearRecorded: Int
  $maxYearRecorded: Int
  $minYearReleased: Int
  $maxYearReleased: Int
) {
  search_albums(
    album_title_contains: $albumTitle
    label_contains: $label
    artist_main_contains: $artist
    band_name_contains: $bandName
    min_year_recorded: $minYearRecorded
    max_year_recorded: $maxYearRecorded
    min_year_released: $minYearReleased
    max_year_released: $maxYearReleased
  ) {
    album_title
    album_cover
    label
    artist_main
    band_name
    year_recorded
    year_released
  }
}
```

#### Example: Search for Beatles Albums
```graphql
query {
  search_albums(band_name_contains: "Beatles") {
    album_title
    album_cover
    label
    band_name
    year_released
  }
}
```

#### Example: Search by Year Range
```graphql
query {
  search_albums(
    min_year_released: 1960
    max_year_released: 1970
  ) {
    album_title
    band_name
    year_released
    label
  }
}
```

#### Example: Search by Label
```graphql
query {
  search_albums(label_contains: "Apple") {
    album_title
    band_name
    label
    label_logo
  }
}
```

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Database ID of the first track |
| `uuid` | String | Unique identifier of the first track |
| `original_uuid` | String | Original UUID if track was updated |
| `album_title` | String | Title of the album |
| `album_cover` | String | URL to album cover image |
| `label` | String | Record label name |
| `label_logo` | String | URL to label logo image |
| `band_name` | String | Name of the band/group |
| `artist_photo` | String | URL to artist photo |
| `artist_main` | String | Main artist name |
| `instrument` | String | Primary instrument |
| `other_artist_playing` | String | Other contributing artists |
| `other_instrument` | String | Other instruments used |
| `year_recorded` | Int | Year the album was recorded |
| `year_released` | Int | Year the album was released |
| `song_order` | Int | Track order of the first song |
| `song_title` | String | Title of the first track |
| `composer` | String | Composer of the first track |
| `song_file` | String | File path/URL of the first track |
| `created_at` | String | Timestamp when first track was added |

## Notes

- The album queries return information from the **first track** of each album (determined by the lowest database ID)
- All text search filters use case-insensitive partial matching
- Year filters can be used independently or combined for range searches
- Albums with null `album_title` are excluded from results
- Results are ordered alphabetically by album title
