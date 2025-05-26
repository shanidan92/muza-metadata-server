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

### Fetch all tracks
```graphql
{
  allTracks {
    id
    uuid
    songTitle
    artistMain
    bandName
    albumTitle
    yearRecorded
    yearReleased
    instrument
    otherArtistPlaying
    otherInstrument
    composer
    label
    createdAt
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ allTracks { id uuid songTitle artistMain bandName albumTitle yearRecorded yearReleased instrument otherArtistPlaying otherInstrument composer label createdAt } }"
  }' | jq
```

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