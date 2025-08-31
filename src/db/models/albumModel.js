import { query } from '../connection.js';

// Album operations
export const AlbumModel = {
  // Get all albums
  async getAll() {
    const result = await query('SELECT * FROM albums ORDER BY created_at DESC');
    return result.rows;
  },

  // Get album by ID
  async getById(id) {
    const result = await query('SELECT * FROM albums WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Create new album
  async create(albumData) {
    const {
      album_title,
      album_cover,
      label,
      label_logo,
      band_name,
      artist_photo,
      artist_main,
      instrument,
      other_artist_playing,
      other_instrument,
      year_recorded,
      year_released
    } = albumData;

    const result = await query(`
      INSERT INTO albums (
        album_title, album_cover, label, label_logo, band_name, 
        artist_photo, artist_main, instrument, other_artist_playing, 
        other_instrument, year_recorded, year_released
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      album_title, album_cover, label, label_logo, band_name,
      artist_photo, artist_main, instrument, other_artist_playing,
      other_instrument, year_recorded, year_released
    ]);

    return result.rows[0];
  },

  // Update album
  async update(id, albumData) {
    const {
      album_title,
      album_cover,
      label,
      label_logo,
      band_name,
      artist_photo,
      artist_main,
      instrument,
      other_artist_playing,
      other_instrument,
      year_recorded,
      year_released
    } = albumData;

    const result = await query(`
      UPDATE albums SET 
        album_title = $1, album_cover = $2, label = $3, label_logo = $4,
        band_name = $5, artist_photo = $6, artist_main = $7, instrument = $8,
        other_artist_playing = $9, other_instrument = $10, year_recorded = $11,
        year_released = $12, updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `, [
      album_title, album_cover, label, label_logo, band_name,
      artist_photo, artist_main, instrument, other_artist_playing,
      other_instrument, year_recorded, year_released, id
    ]);

    return result.rows[0];
  },

  // Delete album
  async delete(id) {
    const result = await query('DELETE FROM albums WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

