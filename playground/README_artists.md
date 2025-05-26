# Artist Queries Documentation

This document provides curl examples for artist-related GraphQL queries in the Muza Metadata Server.

## Overview

The artist queries allow you to retrieve unique artists with complete metadata from the first track of each artist. This provides a consolidated view of your music collection at the artist level.

## Prerequisites

- jq installed (for JSON processing)
- curl installed
- Server running on localhost:5000

## Available Queries

### 1. Get All Artists

Retrieve all unique artists with complete information from the first track of each artist.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ allArtists { id uuid artistMain artistPhoto bandName albumTitle albumCover label yearRecorded yearReleased songTitle composer } }"
  }' | jq
```

### 2. Get Artists with Full Details

Get all artists with complete metadata including instruments and other artists.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ allArtists { artistMain artistPhoto bandName albumTitle albumCover label labelLogo instrument otherArtistPlaying otherInstrument yearRecorded yearReleased songTitle composer songFile createdAt } }"
  }' | jq
```

### 3. Search Artists by Name

Find artists by their main artist name.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchArtists(artistMainContains: \"Assif\") { artistMain bandName albumTitle yearReleased label instrument } }"
  }' | jq
```

### 4. Search Artists by Band Name

Find artists by their band or group name.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchArtists(bandNameContains: \"Trio\") { artistMain bandName albumTitle yearReleased label } }"
  }' | jq
```

### 5. Search Artists by Label

Find artists from a specific record label.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchArtists(labelContains: \"HOPSCOTCH\") { artistMain label bandName albumTitle yearReleased } }"
  }' | jq
```

### 6. Search Artists by Year Range

Find artists with releases in a specific year range.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchArtists(minYearReleased: 2000, maxYearReleased: 2010) { artistMain bandName albumTitle yearRecorded yearReleased label } }"
  }' | jq
```

### 7. Search Artists by Album

Find artists who have tracks on albums with specific titles.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchArtists(albumTitleContains: \"LOST BROTHER\") { artistMain bandName albumTitle songTitle instrument } }"
  }' | jq
```

### 8. Complex Artist Search

Search artists using multiple criteria (name, label, and year range).

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchArtists(artistMainContains: \"Smith\", labelContains: \"Jazz\", minYearReleased: 2000, maxYearReleased: 2020) { artistMain label bandName albumTitle yearReleased } }"
  }' | jq
```

### 9. Get Artist Photos and Visual Elements

Retrieve artists with focus on visual elements and metadata.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ allArtists { artistMain artistPhoto bandName albumCover labelLogo label yearReleased } }"
  }' | jq
```

### 10. Search Contemporary Artists

Find artists with recent releases.

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchArtists(minYearReleased: 2020) { artistMain bandName albumTitle yearReleased label } }"
  }' | jq
```

### 11. Search Artists by Instrument

Find artists who play specific instruments (through band name or album search).

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ allArtists { artistMain instrument otherArtistPlaying otherInstrument bandName albumTitle } }"
  }' | jq
```

### 12. Search Jazz Artists

Find artists in the jazz genre (by label or album patterns).

```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchArtists(labelContains: \"Jazz\") { artistMain bandName label albumTitle instrument yearReleased } }"
  }' | jq
```

## Field Descriptions

- `artistMain` - Main artist name
- `artistPhoto` - URL to artist photo
- `bandName` - Name of the band/group
- `albumTitle` - Title of the album from first track
- `albumCover` - URL to album cover image
- `label` - Record label name
- `labelLogo` - URL to label logo image
- `instrument` - Primary instrument played
- `otherArtistPlaying` - Other contributing artists
- `otherInstrument` - Other instruments used
- `yearRecorded` - Year the track was recorded
- `yearReleased` - Year the track was released
- `songTitle` - Title of the first track
- `composer` - Composer of the first track
- `songFile` - File path/URL of the first track
- `createdAt` - Timestamp when first track was added

## Notes

- Artist queries return information from the **first track** of each unique artist
- All text searches use case-insensitive partial matching
- Year filters can be combined for range searches
- Results are ordered alphabetically by artist name
- Use `jq` to pretty-print JSON responses
- Each artist appears only once, showing their earliest track in the database
