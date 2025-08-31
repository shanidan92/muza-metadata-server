import { query, testConnection } from './connection.js';

// Database schema for the music library
const createTables = async () => {
  try {
    // Create albums table
    await query(`
      CREATE TABLE IF NOT EXISTS albums (
        id SERIAL PRIMARY KEY,
        album_title VARCHAR(255) NOT NULL,
        album_cover TEXT,
        label VARCHAR(255),
        label_logo TEXT,
        band_name VARCHAR(255),
        artist_photo TEXT,
        artist_main VARCHAR(255),
        instrument VARCHAR(255),
        other_artist_playing VARCHAR(255),
        other_instrument VARCHAR(255),
        year_recorded INTEGER,
        year_released INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tracks table
    await query(`
      CREATE TABLE IF NOT EXISTS tracks (
        id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT gen_random_uuid(),
        song_title VARCHAR(255) NOT NULL,
        artist_main VARCHAR(255),
        band_name VARCHAR(255),
        album_title VARCHAR(255),
        year_recorded INTEGER,
        year_released INTEGER,
        instrument VARCHAR(255),
        other_artist_playing VARCHAR(255),
        other_instrument VARCHAR(255),
        song_file TEXT,
        composer VARCHAR(255),
        label VARCHAR(255),
        album_cover TEXT,
        album_id INTEGER REFERENCES albums(id) ON DELETE CASCADE,
        track_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create artists table (for better artist management)
    await query(`
      CREATE TABLE IF NOT EXISTS artists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        photo TEXT,
        bio TEXT,
        instrument VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create playlists table
    await query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cover_image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create playlist_tracks junction table
    await query(`
      CREATE TABLE IF NOT EXISTS playlist_tracks (
        id SERIAL PRIMARY KEY,
        playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
        track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(playlist_id, track_id)
      )
    `);

    // Create indexes for better performance
    await query('CREATE INDEX IF NOT EXISTS idx_tracks_artist_main ON tracks(artist_main)');
    await query('CREATE INDEX IF NOT EXISTS idx_tracks_album_title ON tracks(album_title)');
    await query('CREATE INDEX IF NOT EXISTS idx_tracks_song_title ON tracks(song_title)');
    await query('CREATE INDEX IF NOT EXISTS idx_albums_band_name ON albums(band_name)');
    await query('CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id)');

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

// Function to initialize the database
export const initializeDatabase = async () => {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Create tables
    await createTables();
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
};

// Function to reset the database (drop all tables)
export const resetDatabase = async () => {
  try {
    await query('DROP TABLE IF EXISTS playlist_tracks CASCADE');
    await query('DROP TABLE IF EXISTS playlists CASCADE');
    await query('DROP TABLE IF EXISTS tracks CASCADE');
    await query('DROP TABLE IF EXISTS albums CASCADE');
    await query('DROP TABLE IF EXISTS artists CASCADE');
    
    console.log('Database reset successfully');
    return true;
  } catch (error) {
    console.error('Database reset failed:', error);
    return false;
  }
};

// Function to seed the database with sample data
export const seedDatabase = async () => {
  try {
    // Sample album data
    const albumData = {
      album_title: 'Sample Album',
      album_cover: 'https://picsum.photos/400',
      label: 'Sample Label',
      band_name: 'Sample Band',
      artist_main: 'Sample Artist',
      instrument: 'Guitar',
      year_recorded: 2023,
      year_released: 2024
    };

    // Insert sample album
    const albumResult = await query(`
      INSERT INTO albums (album_title, album_cover, label, band_name, artist_main, instrument, year_recorded, year_released)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [albumData.album_title, albumData.album_cover, albumData.label, albumData.band_name, 
        albumData.artist_main, albumData.instrument, albumData.year_recorded, albumData.year_released]);

    const albumId = albumResult.rows[0].id;

    // Sample track data
    const trackData = {
      song_title: 'Sample Song',
      artist_main: 'Sample Artist',
      band_name: 'Sample Band',
      album_title: 'Sample Album',
      year_recorded: 2023,
      year_released: 2024,
      instrument: 'Guitar',
      composer: 'Sample Composer',
      label: 'Sample Label',
      album_cover: 'https://picsum.photos/400',
      album_id: albumId,
      track_number: 1
    };

    // Insert sample track
    await query(`
      INSERT INTO tracks (song_title, artist_main, band_name, album_title, year_recorded, year_released, 
                         instrument, composer, label, album_cover, album_id, track_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [trackData.song_title, trackData.artist_main, trackData.band_name, trackData.album_title,
        trackData.year_recorded, trackData.year_released, trackData.instrument, trackData.composer,
        trackData.label, trackData.album_cover, trackData.album_id, trackData.track_number]);

    console.log('Database seeded with sample data');
    return true;
  } catch (error) {
    console.error('Database seeding failed:', error);
    return false;
  }
};

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => seedDatabase())
    .then(() => {
      console.log('Database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
} 