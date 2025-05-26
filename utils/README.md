# Muza Utils API

A Flask API server for processing FLAC files and integrating with the Muza Metadata Server.

## Features

- Upload FLAC files via HTTP POST
- Extract metadata from FLAC tags using Mutagen
- Enhance metadata using MusicBrainz API
- Download album covers from Cover Art Archive
- Automatically insert tracks into Muza Metadata Server
- Serve uploaded files and covers

## Installation

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set environment variables (optional):

```bash
export UPLOAD_DIR=downloads
export MUZA_SERVER_URL=http://localhost:5000/graphql
export PORT=5002
export DEBUG=false
```

## Usage

### Start the server

```bash
make run-uploader
```

### Upload a FLAC file

```bash
curl -X POST http://localhost:5002/upload \
  -F "file=@/path/to/your/song.flac"
```

### Example response

```json
{
  "success": true,
  "message": "File processed successfully",
  "track": {
    "id": 1,
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "songTitle": "Hey Jude",
    "artistMain": "The Beatles",
    "albumTitle": "The Beatles (White Album)",
    "createdAt": "2023-12-01T10:00:00Z"
  },
  "metadata": {
    "song_title": "Hey Jude",
    "artist_main": "The Beatles",
    "album_title": "The Beatles (White Album)",
    "year_released": 1968,
    "album_cover": "http://localhost:5002/files/cover_the_beatles_white_album_uuid.jpg",
    "song_file": "http://localhost:5002/files/uuid.flac"
  }
}
```

## API Endpoints

### POST /upload

Upload and process a FLAC file.

**Request:**

- Method: POST
- Content-Type: multipart/form-data
- Body: file (FLAC file)

**Response:**

- 200: Success with track data
- 400: Invalid file or processing error
- 413: File too large
- 500: Server error

### GET /files/{filename}

Serve uploaded files and album covers.

### GET /health

Health check endpoint.

## Configuration

Environment variables:

- `UPLOAD_DIR`: Directory for uploaded files (default: downloads)
- `MUZA_SERVER_URL`: Muza Metadata Server GraphQL endpoint (default: <http://localhost:5000/graphql>)
- `MUSICBRAINZ_APP_NAME`: App name for MusicBrainz API (default: MuzaUtils)
- `MUSICBRAINZ_APP_VERSION`: App version for MusicBrainz API (default: 1.0)
- `MUSICBRAINZ_CONTACT`: Contact email for MusicBrainz API (default: <admin@example.com>)
- `PORT`: Server port (default: 5002)
- `DEBUG`: Enable debug mode (default: false)

## Processing Flow

1. **File Upload**: FLAC file is uploaded and saved to upload directory
2. **Metadata Extraction**: Extract tags from FLAC using Mutagen
3. **MusicBrainz Enhancement**:
   - Lookup by MusicBrainz ID if present in tags
   - Search by title/artist if no ID
   - Merge additional metadata
4. **Album Cover Download**: Download cover art if MusicBrainz release ID found
5. **Database Insert**: Create track in Muza Metadata Server via GraphQL
6. **Response**: Return success with track data and metadata

## Error Handling

- Invalid file types are rejected
- Large files (>100MB) are rejected
- MusicBrainz API errors are logged but don't fail the process
- Database insertion failures return error response
- All uploaded files are preserved even if processing fails

## Rate Limiting

The server respects MusicBrainz API rate limits (1 request per second).

## File Storage

- Uploaded FLAC files are stored with UUID filenames
- Album covers are downloaded and stored locally
- Files are served via HTTP from `/files/` endpoint
- File URLs are included in track metadata
