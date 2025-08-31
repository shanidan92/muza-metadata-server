const { query } = require('../connection');
const { v4: uuidv4 } = require('uuid');

class Album {
  static async findByTitleAndArtist(title, artistId) {
    const result = await query(
      'SELECT * FROM albums WHERE title = $1 AND main_artist_id = $2',
      [title, artistId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async create(data) {
    const result = await query(
      `INSERT INTO albums (uuid, title, main_artist_id, album_cover, year_released, original_release_date, label, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        data.uuid || uuidv4(),
        data.title,
        data.artistId,
        data.coverArt,
        data.releaseDate,
        data.originalReleaseDate,
        data.label
      ]
    );
    return result.rows[0];
  }
}

module.exports = Album;