# Database Management Module

This module provides PostgreSQL database connectivity and management for the Muza music library application.

## Setup

### Prerequisites
- PostgreSQL database server
- Node.js with ES modules support
- Required npm packages: `pg`, `dotenv`

### Installation
```bash
npm install pg dotenv
```

### Environment Configuration
Create a `.env` file in the server directory with the following variables:

```env
# PostgreSQL Database Configuration
DB_NAME=muza
DB_HOST=muza-staging-db.c1kui2ygoruk.eu-west-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DATABASE_URL=postgresql://postgres:password@host:port/database
```

## Database Schema

### Tables

#### albums
- `id` (SERIAL PRIMARY KEY)
- `album_title` (VARCHAR(255) NOT NULL)
- `album_cover` (TEXT)
- `label` (VARCHAR(255))
- `label_logo` (TEXT)
- `band_name` (VARCHAR(255))
- `artist_photo` (TEXT)
- `artist_main` (VARCHAR(255))
- `instrument` (VARCHAR(255))
- `other_artist_playing` (VARCHAR(255))
- `other_instrument` (VARCHAR(255))
- `year_recorded` (INTEGER)
- `year_released` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### tracks
- `id` (SERIAL PRIMARY KEY)
- `uuid` (UUID DEFAULT gen_random_uuid())
- `song_title` (VARCHAR(255) NOT NULL)
- `artist_main` (VARCHAR(255))
- `band_name` (VARCHAR(255))
- `album_title` (VARCHAR(255))
- `year_recorded` (INTEGER)
- `year_released` (INTEGER)
- `instrument` (VARCHAR(255))
- `other_artist_playing` (VARCHAR(255))
- `other_instrument` (VARCHAR(255))
- `song_file` (TEXT)
- `composer` (VARCHAR(255))
- `label` (VARCHAR(255))
- `album_cover` (TEXT)
- `album_id` (INTEGER REFERENCES albums(id))
- `track_number` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### artists
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(255) UNIQUE NOT NULL)
- `photo` (TEXT)
- `bio` (TEXT)
- `instrument` (VARCHAR(255))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### playlists
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(255) NOT NULL)
- `description` (TEXT)
- `cover_image` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### playlist_tracks
- `id` (SERIAL PRIMARY KEY)
- `playlist_id` (INTEGER REFERENCES playlists(id))
- `track_id` (INTEGER REFERENCES tracks(id))
- `position` (INTEGER NOT NULL)
- `added_at` (TIMESTAMP)

## Usage

### Basic Connection
```javascript
import { testConnection, query } from './db/index.js';

// Test database connection
const isConnected = await testConnection();
if (isConnected) {
  console.log('Database connected successfully');
}

// Execute a simple query
const result = await query('SELECT * FROM albums LIMIT 5');
console.log(result.rows);
```

### Using Models
```javascript
import { AlbumModel, TrackModel, ArtistModel } from './db/index.js';

// Get all albums
const albums = await AlbumModel.getAll();

// Get album by ID
const album = await AlbumModel.getById(1);

// Create new album
const newAlbum = await AlbumModel.create({
  album_title: 'New Album',
  band_name: 'New Band',
  artist_main: 'New Artist',
  year_released: 2024
});

// Get tracks by album
const tracks = await TrackModel.getByAlbumId(1);

// Get all artists
const artists = await ArtistModel.getAll();
```

### Search Operations
```javascript
import { SearchModel } from './db/index.js';

// Search tracks
const searchResults = await SearchModel.searchTracks('jazz');

// Search albums
const albumResults = await SearchModel.searchAlbums('rock');
```

### Pagination
```javascript
import { paginateResults } from './db/index.js';

const result = await paginateResults(
  'SELECT * FROM tracks ORDER BY created_at DESC',
  1, // page
  10, // limit
  [] // parameters
);

console.log(result.data); // tracks
console.log(result.pagination); // pagination info
```

### Transactions
```javascript
import { withTransaction } from './db/index.js';

const result = await withTransaction(async (client) => {
  // Create album
  const albumResult = await client.query(
    'INSERT INTO albums (album_title, band_name) VALUES ($1, $2) RETURNING id',
    ['Album Title', 'Band Name']
  );
  
  // Create track
  const trackResult = await client.query(
    'INSERT INTO tracks (song_title, album_id) VALUES ($1, $2) RETURNING *',
    ['Song Title', albumResult.rows[0].id]
  );
  
  return { album: albumResult.rows[0], track: trackResult.rows[0] };
});
```

### Data Validation
```javascript
import { validateAlbumData, validateTrackData } from './db/index.js';

const albumErrors = validateAlbumData({
  album_title: '',
  year_released: 1800
});

const trackErrors = validateTrackData({
  song_title: 'Valid Song',
  year_released: 2024
});
```

### Error Handling
```javascript
import { handleDatabaseError } from './db/index.js';

try {
  const result = await AlbumModel.create(albumData);
} catch (error) {
  const errorInfo = handleDatabaseError(error);
  console.log(errorInfo.error, errorInfo.code);
}
```

## Database Initialization

### Initialize Database
```javascript
import { initializeDatabase, seedDatabase } from './db/index.js';

// Initialize tables
await initializeDatabase();

// Seed with sample data
await seedDatabase();
```

### Reset Database
```javascript
import { resetDatabase } from './db/index.js';

// Drop all tables (use with caution!)
await resetDatabase();
```

## Health Check
```javascript
import { checkDatabaseHealth } from './db/index.js';

const health = await checkDatabaseHealth();
console.log(health.status); // 'healthy' or 'unhealthy'
```

## File Structure

```
server/db/
├── connection.js    # Database connection and pool management
├── models.js        # Data models and CRUD operations
├── init.js          # Database initialization and schema
├── utils.js         # Utility functions and helpers
├── index.js         # Module exports
└── README.md        # This documentation
```

## Best Practices

1. **Connection Pooling**: Use the provided connection pool for better performance
2. **Error Handling**: Always wrap database operations in try-catch blocks
3. **Validation**: Validate data before inserting/updating
4. **Transactions**: Use transactions for operations that modify multiple tables
5. **Parameterized Queries**: Always use parameterized queries to prevent SQL injection
6. **Indexes**: The schema includes indexes for common query patterns

## Troubleshooting

### Connection Issues
- Verify database credentials in `.env` file
- Check if PostgreSQL server is running
- Ensure network connectivity to database host
- Verify database exists and user has proper permissions

### Performance Issues
- Monitor connection pool usage
- Check query execution times in logs
- Consider adding indexes for frequently queried columns
- Use pagination for large result sets

### Data Integrity
- Use transactions for related operations
- Validate data before database operations
- Handle foreign key constraints properly
- Use appropriate data types for columns 