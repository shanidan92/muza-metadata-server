const { DataTypes } = require('sequelize');

const Album = (sequelize) => {
  const AlbumModel = sequelize.define('Album', {
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
    releaseDate: {
      type: DataTypes.DATEONLY,
      field: 'release_date',
    },
    originalReleaseDate: {
      type: DataTypes.DATEONLY,
      field: 'original_release_date',
    },
    albumType: {
      type: DataTypes.STRING,
      field: 'album_type',
      validate: {
        isIn: [['Album', 'Single', 'EP', 'Compilation', 'Soundtrack', 'Live', 'Remix', 'Other']],
      },
    },
    status: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['Official', 'Promotion', 'Bootleg', 'Pseudo-Release']],
      },
    },
    packaging: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['Jewel Case', 'Slim Jewel Case', 'Digipak', 'Cardboard/Paper Sleeve', 'Other']],
      },
    },
    country: {
      type: DataTypes.STRING,
    },
    language: {
      type: DataTypes.STRING,
    },
    script: {
      type: DataTypes.STRING,
    },
    musicbrainzId: {
      type: DataTypes.UUID,
      field: 'musicbrainz_id',
      unique: true,
      validate: {
        isUUID: 4,
      },
    },
    musicbrainzReleaseGroupId: {
      type: DataTypes.UUID,
      field: 'musicbrainz_release_group_id',
      validate: {
        isUUID: 4,
      },
    },
    barcode: {
      type: DataTypes.STRING,
    },
    catalogNumber: {
      type: DataTypes.STRING,
      field: 'catalog_number',
    },
    label: {
      type: DataTypes.STRING,
    },
    coverArt: {
      type: DataTypes.STRING,
      field: 'cover_art',
      validate: {
        isUrl: {
          protocols: ['http', 'https'],
        },
      },
    },
    trackCount: {
      type: DataTypes.INTEGER,
      field: 'track_count',
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    discCount: {
      type: DataTypes.INTEGER,
      field: 'disc_count',
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    duration: {
      type: DataTypes.INTEGER,
      comment: 'Total duration in seconds',
      validate: {
        min: 0,
      },
    },
    genres: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    credits: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Producer, engineer, etc.',
    },
    notes: {
      type: DataTypes.TEXT,
    },
    quality: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
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
    lastUpdated: {
      type: DataTypes.DATE,
      field: 'last_updated',
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'albums',
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
        fields: ['musicbrainz_id'],
        unique: true,
      },
      {
        fields: ['album_type'],
      },
      {
        fields: ['release_date'],
      },
      {
        fields: ['country'],
      },
    ],
    hooks: {
      beforeValidate: (album) => {
        // Auto-generate sort title if not provided
        if (!album.sortTitle && album.title) {
          album.sortTitle = album.title;
        }
        
        // Update last_updated timestamp
        album.lastUpdated = new Date();
      },
    },
  });

  // Class methods
  AlbumModel.findByTitle = function(title) {
    return this.findOne({
      where: {
        title: {
          [sequelize.Sequelize.Op.iLike]: `%${title}%`,
        },
      },
    });
  };

  AlbumModel.findByMusicbrainzId = function(mbid) {
    return this.findOne({
      where: {
        musicbrainzId: mbid,
      },
    });
  };

  AlbumModel.searchByTitle = function(title, limit = 10) {
    return this.findAll({
      where: {
        title: {
          [sequelize.Sequelize.Op.iLike]: `%${title}%`,
        },
      },
      limit,
      order: [['popularity', 'DESC'], ['title', 'ASC']],
      include: ['artist'],
    });
  };

  AlbumModel.findByArtist = function(artistId, limit = 20) {
    return this.findAll({
      where: {
        artistId,
      },
      limit,
      order: [['releaseDate', 'DESC'], ['title', 'ASC']],
    });
  };

  AlbumModel.findByYear = function(year) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    return this.findAll({
      where: {
        releaseDate: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate],
        },
      },
      order: [['releaseDate', 'ASC'], ['title', 'ASC']],
    });
  };

  // Instance methods
  AlbumModel.prototype.getFullTitle = function() {
    return this.disambiguation 
      ? `${this.title} (${this.disambiguation})`
      : this.title;
  };

  AlbumModel.prototype.getReleaseYear = function() {
    return this.releaseDate ? new Date(this.releaseDate).getFullYear() : null;
  };

  AlbumModel.prototype.updateTrackCount = async function() {
    const trackCount = await this.countTracks();
    this.trackCount = trackCount;
    return this.save();
  };

  AlbumModel.prototype.calculateDuration = async function() {
    const tracks = await this.getTracks();
    const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    this.duration = totalDuration;
    return this.save();
  };

  // Associations will be defined in database.js
  AlbumModel.associate = function(models) {
    // These associations are handled in database.js
  };

  return AlbumModel;
};

module.exports = { Album }; 