# Muza Metadata Server (Node.js)

A modern, high-performance metadata server for the Muza music application, built with Node.js, Express, GraphQL, and Sequelize.

## Features

- **GraphQL API**: Comprehensive GraphQL API for music metadata operations
- **Multi-Database Support**: SQLite, PostgreSQL, and MySQL support via Sequelize
- **Audio Metadata Extraction**: Automatic extraction of metadata from audio files
- **MusicBrainz Integration**: Integration with MusicBrainz for enhanced metadata
- **File Management**: Robust file handling and storage management
- **CLI Tools**: Command-line interface for database management and imports
- **Container Support**: Docker/Podman ready with optimized containerization
- **Production Ready**: Built with security, performance, and scalability in mind

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- SQLite (included) or PostgreSQL/MySQL (for production)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd muza-metadata-server
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database**
```bash
npm run cli db init
```

5. **Start the development server**
```bash
npm run dev
```

The server will start at http://localhost:3000 with GraphQL playground at http://localhost:3000/graphql

### Docker Deployment

```bash
# Build the container
docker build -t muza-metadata-server .

# Run the container
docker run -p 3000:3000 -v $(pwd)/data:/app/data muza-metadata-server
```

## API Usage

### GraphQL Endpoints

- **GraphQL API**: `http://localhost:3000/graphql`
- **GraphQL Playground**: Available in development mode
- **Health Check**: `http://localhost:3000/health`

### Example Queries

#### Get all artists
```graphql
query {
  artists(limit: 10) {
    id
    name
    musicbrainzId
    albums {
      id
      title
      releaseDate
    }
  }
}
```

#### Search for tracks
```graphql
query {
  searchTracks(query: "rock", limit: 5) {
    id
    title
    artist {
      name
    }
    album {
      title
    }
    duration
    genres
  }
}
```

#### Create a new artist
```graphql
mutation {
  createArtist(input: {
    name: "New Artist"
    type: "Person"
    area: "United States"
  }) {
    id
    name
    createdAt
  }
}
```

## CLI Usage

The CLI provides powerful tools for managing your metadata database:

### Database Management
```bash
# Initialize database
npm run cli db init

# Reset database (delete all data)
npm run cli db reset --yes

# Seed with sample data
npm run cli db seed

# Show statistics
npm run cli stats
```

### Import Audio Files
```bash
# Import single file
npm run cli import file /path/to/song.mp3

# Import entire directory
npm run cli import directory /path/to/music --recursive

# Import with custom extensions
npm run cli import directory /path/to/music --extensions mp3,flac,m4a
```

### Start Server
```bash
# Start server with custom port
npm run cli server --port 8080 --host 0.0.0.0
```

## Configuration

Configuration is managed through environment variables. Copy `.env.example` to `.env` and customize:

### Database Configuration
```env
# Use SQLite (default)
DB_DIALECT=sqlite
DB_STORAGE=./data/database.sqlite

# Use PostgreSQL
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=user
DB_PASSWORD=password
DB_NAME=muza_metadata

# Use MySQL
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=user
DB_PASSWORD=password
DB_NAME=muza_metadata
```

### Server Configuration
```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## Data Models

### Artist
- Comprehensive artist information
- MusicBrainz integration
- Biographical data and metadata
- Support for persons, groups, orchestras, etc.

### Album
- Album/release information
- Multi-format support (Album, Single, EP, etc.)
- Release dates and catalog information
- Cover art and credits

### MusicTrack
- Individual track metadata
- Audio format and quality information
- Musical analysis data (tempo, key, etc.)
- File management and integrity

## Architecture

### Core Components

- **Express.js**: Web framework and HTTP server
- **Apollo Server**: GraphQL API server
- **Sequelize**: Database ORM with migrations
- **music-metadata**: Audio file metadata extraction
- **Commander.js**: CLI framework

### Directory Structure
```
src/
├── app.js              # Main application server
├── cli.js              # Command-line interface
├── config.js           # Configuration management
├── database.js         # Database connection and setup
├── schema.js           # GraphQL schema and resolvers
├── utils.js            # Utility functions
└── models/             # Sequelize models
    ├── artist.js       # Artist model
    ├── album.js        # Album model
    ├── musicTrack.js   # Music track model
    └── index.js        # Model exports
```

## Development

### Scripts
```bash
npm start           # Start production server
npm run dev         # Start development server with auto-reload
npm run cli         # Run CLI commands
npm test            # Run test suite
```

### Database Migrations
```bash
# Auto-sync database schema (development)
DB_SYNC=true npm run dev

# Force recreate tables (development only)
DB_FORCE_SYNC=true npm run dev
```

## Production Deployment

### Environment Setup
```env
NODE_ENV=production
DB_DIALECT=postgres
DB_LOGGING=false
DB_SYNC=false
DEBUG=false
```

### Performance Optimization
- Use PostgreSQL or MySQL for production
- Enable connection pooling
- Configure proper indexes
- Use a reverse proxy (nginx)
- Set up monitoring and logging

### Security Considerations
- Use environment variables for secrets
- Enable CORS restrictions
- Use HTTPS in production
- Regular security updates
- Database connection encryption

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For questions, issues, or contributions, please:
- Open an issue on GitHub
- Check the documentation
- Review the CLI help: `npm run cli --help`
