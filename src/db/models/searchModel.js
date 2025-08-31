import { query } from '../connection.js';

// Search operations
export const SearchModel = {
  // Search tracks by title or artist
  async searchTracks(searchTerm) {
    const result = await query(`
      SELECT * FROM tracks 
      WHERE 
        song_title ILIKE $1 OR 
        artist_main ILIKE $1 OR 
        band_name ILIKE $1 OR
        composer ILIKE $1
      ORDER BY created_at DESC
    `, [`%${searchTerm}%`]);
    return result.rows;
  },

  // Search albums by title
  async searchAlbums(searchTerm) {
    const result = await query(`
      SELECT * FROM albums 
      WHERE album_title ILIKE $1 OR band_name ILIKE $1
      ORDER BY created_at DESC
    `, [`%${searchTerm}%`]);
    return result.rows;
  }
};

