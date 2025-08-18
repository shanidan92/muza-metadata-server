const { DataTypes } = require('sequelize');

const MusicTrack = (sequelize) => {
  const MusicTrackModel = sequelize.define('MusicTrack', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    sortTitle: {
      type: DataTypes.STRING,
      field: 'sort_title',
    },
    disambiguation: {
      type: DataTypes.STRING,
    },
    artistId: {
      type: DataTypes.UUID,
      field: 'artist_id',
      allowNull: false,
      references: {
        model: 'artists',
        key: 'id',
      },
    },
    albumId: {
      type: DataTypes.UUID,
      field: 'album_id',
      references: {
        model: 'albums',
        key: 'id',
      },
    },
    trackNumber: {
      type: DataTypes.INTEGER,
      field: 'track_number',
      validate: {
        min: 1,
      },
    },
    discNumber: {
      type: DataTypes.INTEGER,
      field: 'disc_number',
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    duration: {
      type: DataTypes.INTEGER,
      comment: 'Duration in seconds',
      validate: {
        min: 0,
      },
    },
    isrc: {
      type: DataTypes.STRING,
      comment: 'International Standard Recording Code',
      validate: {
        is: /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/,
      },
    },
    musicbrainzId: {
      type: DataTypes.UUID,
      field: 'musicbrainz_id',
      unique: true,
      validate: {
        isUUID: 4,
      },
    },
    musicbrainzRecordingId: {
      type: DataTypes.UUID,
      field: 'musicbrainz_recording_id',
      validate: {
        isUUID: 4,
      },
    },
    filePath: {
      type: DataTypes.STRING,
      field: 'file_path',
    },
    fileName: {
      type: DataTypes.STRING,
      field: 'file_name',
    },
    fileSize: {
      type: DataTypes.BIGINT,
      field: 'file_size',
      comment: 'File size in bytes',
      validate: {
        min: 0,
      },
    },
    format: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['MP3', 'FLAC', 'AAC', 'OGG', 'WAV', 'M4A', 'WMA', 'Other']],
      },
    },
    bitrate: {
      type: DataTypes.INTEGER,
      comment: 'Bitrate in kbps',
      validate: {
        min: 0,
      },
    },
    sampleRate: {
      type: DataTypes.INTEGER,
      field: 'sample_rate',
      comment: 'Sample rate in Hz',
      validate: {
        min: 0,
      },
    },
    channels: {
      type: DataTypes.INTEGER,
      comment: 'Number of audio channels',
      validate: {
        min: 1,
        max: 32,
      },
    },
    bitDepth: {
      type: DataTypes.INTEGER,
      field: 'bit_depth',
      comment: 'Bit depth in bits',
      validate: {
        isIn: [[8, 16, 24, 32]],
      },
    },
    encoding: {
      type: DataTypes.STRING,
      comment: 'Audio encoding format',
    },
    lyrics: {
      type: DataTypes.TEXT,
    },
    language: {
      type: DataTypes.STRING,
    },
    genres: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    mood: {
      type: DataTypes.STRING,
    },
    energy: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 100,
      },
    },
    danceability: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 100,
      },
    },
    valence: {
      type: DataTypes.INTEGER,
      comment: 'Musical positivity/mood',
      validate: {
        min: 0,
        max: 100,
      },
    },
    tempo: {
      type: DataTypes.FLOAT,
      comment: 'Beats per minute',
      validate: {
        min: 0,
      },
    },
    key: {
      type: DataTypes.STRING,
      comment: 'Musical key',
    },
    timeSignature: {
      type: DataTypes.STRING,
      field: 'time_signature',
      comment: 'Time signature (e.g., 4/4)',
    },
    acousticness: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 100,
      },
    },
    instrumentalness: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 100,
      },
    },
    liveness: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 100,
      },
    },
    speechiness: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 100,
      },
    },
    explicit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    playCount: {
      type: DataTypes.INTEGER,
      field: 'play_count',
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    rating: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 5,
      },
    },
    popularity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastPlayed: {
      type: DataTypes.DATE,
      field: 'last_played',
    },
    lastUpdated: {
      type: DataTypes.DATE,
      field: 'last_updated',
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'music_tracks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['title'],
      },
      {
        fields: ['sort_title'],
      },
      {
        fields: ['artist_id'],
      },
      {
        fields: ['album_id'],
      },
      {
        fields: ['track_number', 'disc_number'],
      },
      {
        fields: ['musicbrainz_id'],
        unique: true,
      },
      {
        fields: ['file_path'],
        unique: true,
      },
      {
        fields: ['isrc'],
      },
      {
        fields: ['format'],
      },
    ],
    hooks: {
      beforeValidate: (track) => {
        // Auto-generate sort title if not provided
        if (!track.sortTitle && track.title) {
          track.sortTitle = track.title;
        }
        
        // Update last_updated timestamp
        track.lastUpdated = new Date();
      },
    },
  });

  // Class methods
  MusicTrackModel.findByTitle = function(title) {
    return this.findOne({
      where: {
        title: {
          [sequelize.Sequelize.Op.iLike]: `%${title}%`,
        },
      },
    });
  };

  MusicTrackModel.findByMusicbrainzId = function(mbid) {
    return this.findOne({
      where: {
        musicbrainzId: mbid,
      },
    });
  };

  MusicTrackModel.findByISRC = function(isrc) {
    return this.findOne({
      where: {
        isrc,
      },
    });
  };

  MusicTrackModel.searchByTitle = function(title, limit = 10) {
    return this.findAll({
      where: {
        title: {
          [sequelize.Sequelize.Op.iLike]: `%${title}%`,
        },
      },
      limit,
      order: [['popularity', 'DESC'], ['title', 'ASC']],
      include: ['artist', 'album'],
    });
  };

  MusicTrackModel.findByArtist = function(artistId, limit = 50) {
    return this.findAll({
      where: {
        artistId,
      },
      limit,
      order: [['albumId', 'ASC'], ['discNumber', 'ASC'], ['trackNumber', 'ASC']],
    });
  };

  MusicTrackModel.findByAlbum = function(albumId) {
    return this.findAll({
      where: {
        albumId,
      },
      order: [['discNumber', 'ASC'], ['trackNumber', 'ASC']],
    });
  };

  MusicTrackModel.findByGenre = function(genre, limit = 20) {
    return this.findAll({
      where: {
        genres: {
          [sequelize.Sequelize.Op.contains]: [genre],
        },
      },
      limit,
      order: [['popularity', 'DESC']],
    });
  };

  // Instance methods
  MusicTrackModel.prototype.getFullTitle = function() {
    return this.disambiguation 
      ? `${this.title} (${this.disambiguation})`
      : this.title;
  };

  MusicTrackModel.prototype.getDurationFormatted = function() {
    if (!this.duration) return '0:00';
    
    const minutes = Math.floor(this.duration / 60);
    const seconds = this.duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  MusicTrackModel.prototype.getFileExtension = function() {
    if (!this.fileName) return null;
    return this.fileName.split('.').pop().toLowerCase();
  };

  MusicTrackModel.prototype.incrementPlayCount = function() {
    this.playCount = (this.playCount || 0) + 1;
    this.lastPlayed = new Date();
    return this.save();
  };

  MusicTrackModel.prototype.getQualityScore = function() {
    let score = 0;
    
    // Format scoring
    const formatScores = {
      'FLAC': 100,
      'WAV': 95,
      'M4A': 80,
      'AAC': 75,
      'MP3': 70,
      'OGG': 65,
      'WMA': 50,
    };
    score += formatScores[this.format] || 0;
    
    // Bitrate scoring (for lossy formats)
    if (this.bitrate && !['FLAC', 'WAV'].includes(this.format)) {
      if (this.bitrate >= 320) score += 20;
      else if (this.bitrate >= 256) score += 15;
      else if (this.bitrate >= 192) score += 10;
      else if (this.bitrate >= 128) score += 5;
    }
    
    return Math.min(score, 100);
  };

  // Associations will be defined in database.js
  MusicTrackModel.associate = function(models) {
    // These associations are handled in database.js
  };

  return MusicTrackModel;
};

module.exports = { MusicTrack }; 