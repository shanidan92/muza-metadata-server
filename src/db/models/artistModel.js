import { query } from '../connection.js';

// Artist operations
export const ArtistModel = {
  // Get all artists
  async getAll() {
    const result = await query('SELECT DISTINCT artist_main FROM tracks WHERE artist_main IS NOT NULL ORDER BY artist_main');
    return result.rows;
  },

  // Get artist details
  async getByName(name) {
    const result = await query(`
      SELECT DISTINCT 
        artist_main,
        band_name,
        instrument,
        other_instrument,
        label
      FROM tracks 
      WHERE artist_main = $1
    `, [name]);
    return result.rows;
  },

  // Get artist's albums
  async getAlbums(artistName) {
    const result = await query(`
      SELECT DISTINCT 
        album_title,
        album_cover,
        year_released,
        label
      FROM tracks 
      WHERE artist_main = $1
      ORDER BY year_released DESC
    `, [artistName]);
    return result.rows;
  }
};

