const { query } = require('../connection');
const { v4: uuidv4 } = require('uuid');

class Artist {
  static async findByName(name) {
    const result = await query('SELECT * FROM artists WHERE name = $1', [name]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async create(data) {
    const result = await query(
      `INSERT INTO artists (name, photo, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING *`,
      [  data.name, data.image]
    );
    return result.rows[0];
  }
}

module.exports = Artist;