import { query, getClient } from './connection.js';

// Utility functions for database operations

// Pagination helper
export const paginateResults = async (baseQuery, page = 1, limit = 10, params = []) => {
  const offset = (page - 1) * limit;
  const countQuery = baseQuery.replace(/SELECT .* FROM/, 'SELECT COUNT(*) FROM');
  
  try {
    const [dataResult, countResult] = await Promise.all([
      query(`${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]),
      query(countQuery, params)
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Pagination error:', error);
    throw error;
  }
};

// Search helper with multiple fields
export const searchInMultipleFields = async (table, searchTerm, fields, additionalConditions = '') => {
  const searchConditions = fields.map(field => `${field} ILIKE $1`).join(' OR ');
  const query = `
    SELECT * FROM ${table} 
    WHERE (${searchConditions}) ${additionalConditions ? `AND ${additionalConditions}` : ''}
    ORDER BY created_at DESC
  `;
  
  const result = await query(query, [`%${searchTerm}%`]);
  return result.rows;
};

// Batch insert helper
export const batchInsert = async (table, dataArray, columns) => {
  if (dataArray.length === 0) return [];
  
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const placeholders = dataArray.map((_, rowIndex) => {
      const rowPlaceholders = columns.map((_, colIndex) => 
        `$${rowIndex * columns.length + colIndex + 1}`
      ).join(', ');
      return `(${rowPlaceholders})`;
    }).join(', ');

    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${placeholders}
      RETURNING *
    `;

    const values = dataArray.flatMap(row => columns.map(col => row[col]));
    const result = await client.query(query, values);
    
    await client.query('COMMIT');
    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Transaction helper
export const withTransaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Data validation helpers
export const validateAlbumData = (data) => {
  const errors = [];
  
  if (!data.album_title || data.album_title.trim().length === 0) {
    errors.push('Album title is required');
  }
  
  if (data.year_released && (data.year_released < 1900 || data.year_released > new Date().getFullYear() + 1)) {
    errors.push('Invalid release year');
  }
  
  if (data.year_recorded && (data.year_recorded < 1900 || data.year_recorded > new Date().getFullYear() + 1)) {
    errors.push('Invalid recording year');
  }
  
  return errors;
};

export const validateTrackData = (data) => {
  const errors = [];
  
  if (!data.song_title || data.song_title.trim().length === 0) {
    errors.push('Song title is required');
  }
  
  if (data.year_released && (data.year_released < 1900 || data.year_released > new Date().getFullYear() + 1)) {
    errors.push('Invalid release year');
  }
  
  if (data.year_recorded && (data.year_recorded < 1900 || data.year_recorded > new Date().getFullYear() + 1)) {
    errors.push('Invalid recording year');
  }
  
  return errors;
};

// Data transformation helpers
export const transformAlbumForResponse = (album) => {
  return {
    id: album.id,
    albumTitle: album.album_title,
    albumCover: album.album_cover,
    label: album.label,
    labelLogo: album.label_logo,
    bandName: album.band_name,
    artistPhoto: album.artist_photo,
    artistMain: album.artist_main,
    instrument: album.instrument,
    otherArtistPlaying: album.other_artist_playing,
    otherInstrument: album.other_instrument,
    yearRecorded: album.year_recorded,
    yearReleased: album.year_released,
    createdAt: album.created_at,
    updatedAt: album.updated_at
  };
};

export const transformTrackForResponse = (track) => {
  return {
    id: track.id,
    uuid: track.uuid,
    songTitle: track.song_title,
    artistMain: track.artist_main,
    bandName: track.band_name,
    albumTitle: track.album_title,
    yearRecorded: track.year_recorded,
    yearReleased: track.year_released,
    instrument: track.instrument,
    otherArtistPlaying: track.other_artist_playing,
    otherInstrument: track.other_instrument,
    songFile: track.song_file,
    composer: track.composer,
    label: track.label,
    albumCover: track.album_cover,
    albumId: track.album_id,
    trackNumber: track.track_number,
    createdAt: track.created_at,
    updatedAt: track.updated_at
  };
};

// Error handling helper
export const handleDatabaseError = (error) => {
  console.error('Database error:', error);
  
  // Handle specific PostgreSQL errors
  if (error.code === '23505') { // Unique violation
    return { error: 'Duplicate entry found', code: 'DUPLICATE_ENTRY' };
  }
  
  if (error.code === '23503') { // Foreign key violation
    return { error: 'Referenced record not found', code: 'FOREIGN_KEY_VIOLATION' };
  }
  
  if (error.code === '23502') { // Not null violation
    return { error: 'Required field missing', code: 'NULL_VIOLATION' };
  }
  
  return { error: 'Database operation failed', code: 'DATABASE_ERROR' };
};

// Connection health check
export const checkDatabaseHealth = async () => {
  try {
    const result = await query('SELECT 1 as health_check');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      response: result.rows[0]
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}; 