# Muza Metadata Server

A GraphQL server for managing music track metadata.

## Features

- GraphQL API for querying and managing music track metadata
- SQLite database for data storage
- SSL support for secure communication

## Installation

1. Create a virtual environment:
```bash
# Init venv
make venv
# Activate venv
source venv/bin/activate
```

2. Install dependencies:
```bash
make install
```

## Usage

### Development Server
```bash
make run-dev
```

### Production Server
```bash
# Without SSL
make run

# With SSL
make certs  # Generate self-signed certificates first
make run-ssl
```

## Configuration

The server can be configured using environment variables or command-line arguments:

- `PORT`: Server port (default: 5000)
- `DB_PATH`: SQLite database path (default: music.db)
- `DEBUG`: Enable debug mode (default: false)

## GraphQL API

Access the GraphQL playground at `http://localhost:5000/graphql`

### Mutation Examples

1. Create a basic track:
```graphql
mutation {
  createMusicTrack(
    songTitle: "Hey Jude"
    artistMain: "Paul McCartney"
    bandName: "The Beatles"
    albumTitle: "The Beatles (White Album)"
    yearReleased: 1968
  ) {
    ok
    track {
      id
      uuid
      songTitle
    }
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation { createMusicTrack(songTitle: \"Hey Jude\", artistMain: \"Paul McCartney\", bandName: \"The Beatles\", albumTitle: \"The Beatles (White Album)\", yearReleased: 1968) { ok track { id uuid songTitle } } }"
  }'
```

2. Create a detailed track with all fields:
```graphql
mutation {
  createMusicTrack(
    uuid: "custom-uuid-123"
    albumCover: "https://example.com/covers/album.jpg"
    albumTitle: "Abbey Road"
    label: "Apple Records"
    labelLogo: "https://example.com/logos/apple.png"
    bandName: "The Beatles"
    artistPhoto: "https://example.com/photos/paul.jpg"
    artistMain: "Paul McCartney"
    instrument: "Bass, Vocals"
    otherArtistPlaying: "John Lennon"
    otherInstrument: "Guitar, Vocals"
    yearRecorded: 1969
    yearReleased: 1969
    songOrder: 1
    songTitle: "Come Together"
    composer: "Lennon-McCartney"
    songFile: "https://example.com/songs/come_together.mp3"
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
    "query": "mutation { createMusicTrack(uuid: \"custom-uuid-123\", albumCover: \"https://example.com/covers/album.jpg\", albumTitle: \"Abbey Road\", label: \"Apple Records\", labelLogo: \"https://example.com/logos/apple.png\", bandName: \"The Beatles\", artistPhoto: \"https://example.com/photos/paul.jpg\", artistMain: \"Paul McCartney\", instrument: \"Bass, Vocals\", otherArtistPlaying: \"John Lennon\", otherInstrument: \"Guitar, Vocals\", yearRecorded: 1969, yearReleased: 1969, songOrder: 1, songTitle: \"Come Together\", composer: \"Lennon-McCartney\", songFile: \"https://example.com/songs/come_together.mp3\") { ok track { id uuid songTitle createdAt } } }"
  }'
```

### Complex Queries

1. Search tracks with multiple criteria:
```graphql
{
  searchTracks(
    bandNameContains: "Beatles"
    minYearReleased: 1965
    maxYearReleased: 1970
    artistMainContains: "lennon"
  ) {
    id
    songTitle
    artistMain
    bandName
    albumTitle
    yearReleased
    composer
    songOrder
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(bandNameContains: \"Beatles\", minYearReleased: 1965, maxYearReleased: 1970, artistMainContains: \"lennon\") { id songTitle artistMain bandName albumTitle yearReleased composer songOrder } }"
  }'
```

2. Full track details query:
```graphql
{
  allTracks {
    id
    uuid
    albumCover
    albumTitle
    label
    labelLogo
    bandName
    artistPhoto
    artistMain
    instrument
    otherArtistPlaying
    otherInstrument
    yearRecorded
    yearReleased
    songOrder
    songTitle
    composer
    songFile
    createdAt
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ allTracks { id uuid albumCover albumTitle label labelLogo bandName artistPhoto artistMain instrument otherArtistPlaying otherInstrument yearRecorded yearReleased songOrder songTitle composer songFile createdAt } }"
  }'
```

3. Complex search with multiple filters:
```graphql
{
  searchTracks(
    titleContains: "love"
    composerContains: "lennon"
    otherArtistContains: "starr"
    minYearRecorded: 1960
    maxYearRecorded: 1969
    labelContains: "apple"
  ) {
    songTitle
    composer
    otherArtistPlaying
    yearRecorded
    label
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(titleContains: \"love\", composerContains: \"lennon\", otherArtistContains: \"starr\", minYearRecorded: 1960, maxYearRecorded: 1969, labelContains: \"apple\") { songTitle composer otherArtistPlaying yearRecorded label } }"
  }'
```

### Search Examples for Demo Data

1. Search for "Hey Jude":
```graphql
{
  searchTracks(
    titleContains: "Hey Jude"
    artistMainContains: "McCartney"
  ) {
    songTitle
    artistMain
    bandName
    albumTitle
    yearReleased
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(titleContains: \"Hey Jude\", artistMainContains: \"McCartney\") { songTitle artistMain bandName albumTitle yearReleased } }"
  }'
```

2. Find all songs from Abbey Road:
```graphql
{
  searchTracks(
    albumTitleContains: "Abbey Road"
    yearReleased: 1969
  ) {
    songTitle
    artistMain
    otherArtistPlaying
    instrument
    otherInstrument
    composer
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(albumTitleContains: \"Abbey Road\", minYearReleased: 1969) { songTitle artistMain otherArtistPlaying instrument otherInstrument composer } }"
  }'
```

3. Find all Paul McCartney songs:
```graphql
{
  searchTracks(
    artistMainContains: "McCartney"
  ) {
    songTitle
    albumTitle
    yearReleased
    yearRecorded
  }
}
```
```bash
curl -X POST http://localhost:5000/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ searchTracks(artistMainContains: \"McCartney\") { songTitle albumTitle yearReleased yearRecorded } }"
  }'
```

4. Search for tracks recorded in 1969:
```graphql
{
  searchTracks(
    yearRecorded: 1969
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
    "query": "{ searchTracks(yearRecorded: 1969) { songTitle bandName composer yearRecorded yearReleased } }"
  }'
```

## Containerization

### Building the Container

Using Podman:
```bash
make container
```

### Running the Container

Standard HTTP mode:
```bash
mkdir data # create a directory for percistant data

make container-run
```

With SSL enabled:
```bash
make certs  # Generate self-signed certificates first
mkdir data # create a directory for percistant data

make container-ssl
```

### Container Configuration

The container accepts the following environment variables:

- `PORT`: Server port (default: 5000)
- `DB_PATH`: Database path (default: /data/music.db)
- `SSL_ENABLE`: Enable SSL (default: false)
- `SSL_CERT`: SSL certificate path (default: /app/certs/server.crt)
- `SSL_KEY`: SSL private key path (default: /app/certs/server.key)
- `WORKERS`: Number of Gunicorn workers (default: 4)

### Persistent Storage

Mount a volume to `/data` to persist the database:
```bash
mkdir data # create a directory for percistant data

podman run -v $(pwd)/data:/data:Z quay.io/yaacov/muza-metadata-server:latest
```

### Registry

Push to registry:
```bash
make container-push
```

Pull from registry:
```bash
podman pull quay.io/yaacov/muza-metadata-server:latest
```
````
