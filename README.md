# Muza Metadata Server (Node.js)

A modern, high-performance metadata server for the Muza music application, built with Node.js, Express, GraphQL, and Sequelize.

## Features

- GraphQL API for querying and managing music track metadata
- CQRS pattern (append-only) API to simplify conflict resolution and concurrency issues
- Multiple database support (SQLite, PostgreSQL, MySQL) with RDS optimization
- SSL support for secure communication
- Post-insert hooks for event-driven integrations and data synchronization
- S3 integration for audio and cover art storage
- CDN support for optimized content delivery
- Web-based admin interface for file uploads
- Legacy API compatibility for backward compatibility

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

- `PORT`: Server port (default: 5000)
- `DATABASE_URL`: Database connection URL (see Database Configuration below)
- `DB_PATH`: SQLite database path (default: music.db) - deprecated, use DATABASE_URL
- `DEBUG`: Enable debug mode (default: false)
- `HOOK_COMMAND`: Command to execute after successful track insertion (optional)

### Database Configuration

#### SQLite (Development)

```bash
export DATABASE_URL="sqlite:///music.db"
# OR
export DB_DIALECT=sqlite
export DB_STORAGE=./data/database.sqlite
```

#### PostgreSQL RDS (Production)

```bash
export DATABASE_URL="postgresql://username:password@rds-endpoint:5432/database_name"
# OR
export DB_DIALECT=postgres
export DB_HOST=rds-endpoint
export DB_PORT=5432
export DB_USERNAME=username
export DB_PASSWORD=password
export DB_NAME=database_name
export DB_SSL=true
```

#### MySQL RDS (Production)

```bash
export DATABASE_URL="mysql://username:password@rds-endpoint:3306/database_name"
# OR
export DB_DIALECT=mysql
export DB_HOST=rds-endpoint
export DB_PORT=3306
export DB_USERNAME=username
export DB_PASSWORD=password
export DB_NAME=database_name
export DB_SSL=true
```

## Hooks

```bash
# Build the container
docker build -t muza-metadata-server .

# Run the container
docker run -p 3000:3000 -v $(pwd)/data:/app/data muza-metadata-server
```

## API Usage

### GraphQL Endpoints

- **GraphQL API**: `http://localhost:3000/graphql`
- **GraphQL API (ALB)**: `http://localhost:3000/api/metadata/graphql`
- **GraphQL Playground**: Available in development mode
- **Health Check**: `http://localhost:3000/health`
- **Health Check (ALB)**: `http://localhost:3000/api/metadata/health`

### Admin Interface

- **Upload Interface**: `http://localhost:8080/admin/`
- **Admin Health Check**: `http://localhost:8080/health`
  

## CLI Usage

The CLI provides powerful tools for managing your metadata database:

### Main Server CLI

```bash
# Initialize database
npm run cli db init

# Reset database (delete all data)
npm run cli db reset --yes

# Seed with sample data
npm run cli db seed

# Show statistics
npm run cli stats

# Import single file
npm run cli import file /path/to/song.flac

# Import entire directory
npm run cli import directory /path/to/music --recursive

# Start server with custom port
npm run cli server --port 8080 --host 0.0.0.0
```

### Uploader CLI

```bash
# Start uploader server
npm run uploader:start

# Show uploader configuration
npm run uploader:config

# Check uploader health
npm run uploader:health

# Test file upload
npm run uploader-cli test-upload -f /path/to/song.flac
```

## Configuration

Configuration is managed through environment variables. Copy `.env.example` to `.env` and customize:

### Database Configuration
```env
# Use DATABASE_URL (recommended)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# OR use individual settings
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=user
DB_PASSWORD=password
DB_NAME=muza_metadata
DB_SSL=true
```

### Server Configuration
```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### AWS/S3 Configuration
```env
AWS_REGION=us-east-1
S3_AUDIO_RAW_BUCKET=my-audio-bucket
S3_COVER_ART_BUCKET=my-images-bucket
CDN_DOMAIN_NAME=cdn.example.com
```

### Uploader Configuration
```env
AUDIO_UPLOAD_DIR=./uploads/audio
IMAGE_UPLOAD_DIR=./uploads/images
UPLOADER_PORT=8080
SECRET_KEY=your-secret-key
```

### Authentication (Optional)
```env
COGNITO_BASE_URL=https://your-domain.auth.region.amazoncognito.com
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_URI=http://localhost:8080/admin/oauth2/callback
OAUTH_LOGOUT_REDIRECT_URI=http://localhost:8080/admin/signin
```

### Hooks Configuration
```env
HOOK_COMMAND=/path/to/your/hook/script.sh
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

- `PORT`: Server port (default: 5000)
- `DB_PATH`: Database path (default: /data/music.db)
- `WORKERS`: Number of Gunicorn workers (default: 4)
- `HOOK_COMMAND`: Command to execute after successful track insertion (optional)

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
npm start                    # Start production server
npm run dev                  # Start development server with auto-reload
npm run cli                  # Run CLI commands
npm run uploader             # Start uploader server
npm run uploader:cli         # Run uploader CLI commands
npm test                     # Run test suite
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
