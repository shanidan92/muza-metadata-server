import { query } from '../connection.js';

// Track/Song operations
export const TrackModel = {
  // Get all tracks
  async getAll() {
    const result = await query('SELECT * FROM tracks ORDER BY created_at DESC');
    return result.rows;
  },

  // Get track by ID
  async getById(id) {
    const result = await query('SELECT * FROM tracks WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Get tracks by album ID
  async getByAlbumId(albumId) {
    const result = await query('SELECT * FROM tracks WHERE album_id = $1 ORDER BY track_number', [albumId]);
    return result.rows;
  },

  // Create new track
  async create(trackData) {
    const {
      song_title,
      artist_main,
      band_name,
      album_title,
      year_recorded,
      year_released,
      instrument,
      other_artist_playing,
      other_instrument,
      song_file,
      composer,
      label,
      album_cover,
      album_id,
      track_number
    } = trackData;

    const result = await query(`
      INSERT INTO tracks (
        song_title, artist_main, band_name, album_title, year_recorded,
        year_released, instrument, other_artist_playing, other_instrument,
        song_file, composer, label, album_cover, album_id, track_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      song_title, artist_main, band_name, album_title, year_recorded,
      year_released, instrument, other_artist_playing, other_instrument,
      song_file, composer, label, album_cover, album_id, track_number
    ]);

    return result.rows[0];
  },

  // Update track
  async update(id, trackData) {
    const {
      song_title,
      artist_main,
      band_name,
      album_title,
      year_recorded,
      year_released,
      instrument,
      other_artist_playing,
      other_instrument,
      song_file,
      composer,
      label,
      album_cover,
      album_id,
      track_number
    } = trackData;

    const result = await query(`
      UPDATE tracks SET 
        song_title = $1, artist_main = $2, band_name = $3, album_title = $4,
        year_recorded = $5, year_released = $6, instrument = $7, other_artist_playing = $8,
        other_instrument = $9, song_file = $10, composer = $11, label = $12,
        album_cover = $13, album_id = $14, track_number = $15, updated_at = NOW()
      WHERE id = $16
      RETURNING *
    `, [
      song_title, artist_main, band_name, album_title, year_recorded,
      year_released, instrument, other_artist_playing, other_instrument,
      song_file, composer, label, album_cover, album_id, track_number, id
    ]);

    return result.rows[0];
  },

  // Delete track
  async delete(id) {
    const result = await query('DELETE FROM tracks WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

