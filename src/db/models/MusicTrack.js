const { query } = require('../connection');
const { v4: uuidv4 } = require('uuid');

class MusicTrack {
  static async create(data) {
    const result = await query(
      `INSERT INTO music_tracks (uuid, song_title, main_artist_id, duration, track_number, year_recorded, file_path, album_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        data.uuid || uuidv4(),
        data.title,
        data.artistId,
        data.duration,
        data.trackNumber,
        data.yearRecorded,
        data.filePath,
        data.albumId
      ]
    );
    return result.rows[0];
  }
}

module.exports = MusicTrack;