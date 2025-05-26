# Album Queries Documentation

This document provides curl examples for album-related GraphQL queries in the Muza Metadata Server.

## Overview

The album queries allow you to retrieve unique albums with complete metadata from the first track of each album. This provides a consolidated view of your music collection at the album level.

## Prerequisites

- jq installed (for JSON processing)
- curl installed
- Server running on localhost:5000

## Available Queries

### 1. Get All Albums

Retrieve all unique albums with complete information from the first track of each album.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ allAlbums { id uuid albumTitle albumCover label labelLogo bandName artistMain yearRecorded yearReleased songTitle composer } }"
  }' | jq
```

### 2. Get Albums with Full Details

Get all albums with complete metadata including instruments and other artists.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ allAlbums { albumTitle albumCover label labelLogo bandName artistPhoto artistMain instrument otherArtistPlaying otherInstrument yearRecorded yearReleased songTitle composer songFile createdAt } }"
  }' | jq
```

### 3. Search Albums by Band Name

Find albums by a specific band or artist.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchAlbums(bandNameContains: \"Trio\") { albumTitle bandName artistMain yearReleased label } }"
  }' | jq
```

### 4. Search Albums by Label

Find albums from a specific record label.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchAlbums(labelContains: \"HOPSCOTCH\") { albumTitle label bandName yearReleased artistMain } }"
  }' | jq
```

### 5. Search Albums by Year Range

Find albums recorded or released within a specific year range.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchAlbums(minYearReleased: 2000, maxYearReleased: 2010) { albumTitle bandName yearRecorded yearReleased label artistMain } }"
  }' | jq
```

### 6. Search Albums by Artist

Find albums by a specific main artist.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchAlbums(artistMainContains: \"Assif\") { albumTitle artistMain bandName yearReleased label } }"
  }' | jq
```

### 7. Search Albums by Title

Find albums with specific titles or title patterns.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchAlbums(albumTitleContains: \"LOST BROTHER\") { albumTitle bandName artistMain yearReleased label songTitle } }"
  }' | jq
```

### 8. Complex Album Search

Search albums using multiple criteria (label, year range, and artist).

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchAlbums(labelContains: \"Jazz\", minYearReleased: 2000, maxYearReleased: 2020, artistMainContains: \"Smith\") { albumTitle label bandName artistMain yearReleased } }"
  }' | jq
```

### 9. Get Album Artwork and Metadata

Retrieve albums with focus on visual elements and metadata.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ allAlbums { albumTitle albumCover labelLogo artistPhoto bandName label yearReleased } }"
  }' | jq
```

### 10. Search Recent Albums

Find albums released in recent years.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchAlbums(minYearReleased: 2020) { albumTitle bandName yearReleased label artistMain } }"
  }' | jq
```

## Field Descriptions

- `albumTitle` - Title of the album
- `albumCover` - URL to album cover image
- `label` - Record label name
- `labelLogo` - URL to label logo image
- `bandName` - Name of the band/group
- `artistPhoto` - URL to artist photo
- `artistMain` - Main artist name
- `instrument` - Primary instrument
- `otherArtistPlaying` - Other contributing artists
- `otherInstrument` - Other instruments used
- `yearRecorded` - Year the album was recorded
- `yearReleased` - Year the album was released
- `songTitle` - Title of the first track
- `composer` - Composer of the first track
- `songFile` - File path/URL of the first track
- `createdAt` - Timestamp when first track was added

## Notes

- Album queries return information from the **first track** of each album
- All text searches use case-insensitive partial matching
- Year filters can be combined for range searches
- Results are ordered alphabetically by album title
- Use `jq` to pretty-print JSON responses
