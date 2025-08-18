# Muza Utils - Node.js Uploader

A Node.js implementation of the Muza Utils FLAC uploader, providing the same functionality as the Python version but built with modern JavaScript.

## Features

- **FLAC File Upload**: Accepts and processes FLAC audio files
- **Metadata Extraction**: Extracts comprehensive metadata from FLAC files using `music-metadata`
- **MusicBrainz Integration**: Enhances metadata with MusicBrainz database lookups
- **Album Cover Download**: Automatically downloads album covers from Cover Art Archive
- **File Management**: Organizes uploaded files and serves them via HTTP
- **RESTful API**: Provides endpoints for file upload and retrieval
- **Web Interface**: Includes a modern HTML upload interface

## Prerequisites

- Node.js 16+ 
- npm or yarn package manager

## Installation

The uploader is already included in the project. All dependencies are listed in `package.json`.

## Configuration

The uploader can be configured using environment variables:

```bash
# Upload settings
UPLOAD_DIR=downloads                    # Directory for uploaded files
PORT=5002                               # Port to run the server on

# Muza server integration
MUZA_SERVER_URL=http://localhost:5000/graphql

# MusicBrainz settings
MUSICBRAINZ_APP_NAME=MuzaUtils         # Application name for API calls
MUSICBRAINZ_APP_VERSION=1.0            # Application version
MUSICBRAINZ_CONTACT=admin@example.com  # Contact email

# Debug mode
DEBUG=false                             # Enable debug logging
```

## Usage

### Starting the Uploader Server

#### Option 1: Direct server start
```bash
npm run uploader
```

#### Option 2: Using CLI with options
```bash
npm run uploader:start -- --port 5002 --upload-dir ./uploads --debug
```

#### Option 3: Using CLI directly
```bash
node src/uploader-cli.js start --port 5002 --upload-dir ./uploads
```

### CLI Commands

```bash
# Show help
npm run uploader:cli -- --help

# Show current configuration
npm run uploader:config

# Check server health
npm run uploader:health

# Start server with custom options
npm run uploader:start -- --port 5003 --debug
```

### CLI Options

- `-p, --port <port>`: Port to run on (default: 5002)
- `-d, --upload-dir <dir>`: Upload directory (default: downloads)
- `-m, --muza-url <url>`: Muza server URL (default: http://localhost:5000/graphql)
- `--debug`: Enable debug mode

## API Endpoints

### GET /
Serves the HTML upload interface.

### POST /upload
Uploads and processes a FLAC file.

**Request**: Multipart form data with `file` field containing FLAC file.

**Response**:
```json
{
  "success": true,
  "message": "File processed successfully",
  "track": { "id": "track-id", "title": "Song Title" },
  "metadata": { /* extracted metadata */ }
}
```

### GET /health
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "service": "Muza Utils API"
}
```

### GET /files/:filename
Serves uploaded files.

## File Processing Flow

1. **File Upload**: Accepts FLAC file via multipart form data
2. **Metadata Extraction**: Uses `music-metadata` to extract FLAC metadata
3. **MusicBrainz Enhancement**: Looks up additional metadata from MusicBrainz
4. **Cover Download**: Downloads album cover if available
5. **Database Integration**: Creates/updates artist, album, and track records
6. **File Storage**: Saves file and serves via HTTP

## Integration Points

The uploader is designed to integrate with your Muza GraphQL server. Currently, the following methods return mock data but can be extended:

- `findOrCreateArtist()`: Find or create artist in Muza database
- `findExistingAlbum()`: Check if album already exists
- `createAlbum()`: Create new album record
- `createTrack()`: Insert track into database

## Development

### Project Structure

```
src/
├── uploader.js           # Main uploader class
├── uploader-config.js    # Configuration management
├── uploader-server.js    # Server entry point
└── uploader-cli.js       # CLI interface
```

### Adding New Features

1. Extend the `NodeUploader` class in `uploader.js`
2. Add new routes in the `setupRoutes()` method
3. Update configuration in `uploader-config.js` if needed
4. Add CLI commands in `uploader-cli.js`

### Testing

```bash
# Start the uploader in development mode

npm run uploader:start -- --debug

# Test health endpoint
npm run uploader:health

# Test with a FLAC file
curl -X POST -F "file=@song.flac" http://localhost:5002/upload
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port using `--port` option
2. **Permission denied**: Ensure upload directory is writable
3. **File too large**: Check `maxFileSize` configuration
4. **MusicBrainz rate limiting**: Respect API limits and use proper User-Agent

### Logs

Enable debug mode to see detailed logs:
```bash
npm run uploader:start -- --debug
```

## Comparison with Python Version

| Feature | Python | Node.js |
|---------|--------|---------|
| Framework | Flask | Express |
| File handling | Werkzeug | Multer |
| Metadata extraction | mutagen | music-metadata |
| HTTP client | requests | axios |
| Configuration | dataclass | class-based |
| CLI | argparse | commander |

The Node.js version provides the same functionality with modern JavaScript patterns and better performance characteristics.

## License

ISC (same as main project)


