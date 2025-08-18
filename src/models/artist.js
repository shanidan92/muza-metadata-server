const { DataTypes } = require('sequelize');

const Artist = (sequelize) => {
  const ArtistModel = sequelize.define('Artist', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    sortName: {
      type: DataTypes.STRING,
      field: 'sort_name',
    },
    disambiguation: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['Person', 'Group', 'Orchestra', 'Choir', 'Character', 'Other']],
      },
    },
    gender: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['Male', 'Female', 'Other', 'Not applicable']],
      },
    },
    area: {
      type: DataTypes.STRING,
    },
    beginDate: {
      type: DataTypes.DATEONLY,
      field: 'begin_date',
    },
    endDate: {
      type: DataTypes.DATEONLY,
      field: 'end_date',
    },
    ended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    musicbrainzId: {
      type: DataTypes.UUID,
      field: 'musicbrainz_id',
      unique: true,
      validate: {
        isUUID: 4,
      },
    },
    biography: {
      type: DataTypes.TEXT,
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    image: {
      type: DataTypes.STRING,
      validate: {
        isUrl: {
          protocols: ['http', 'https'],
        },
      },
    },
    links: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'External links (Wikipedia, official website, etc.)',
    },
    isni: {
      type: DataTypes.STRING,
      comment: 'International Standard Name Identifier',
    },
    ipis: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Interested Parties Information codes',
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
    tableName: 'artists',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['sort_name'],
      },
      {
        fields: ['musicbrainz_id'],
        unique: true,
      },
      {
        fields: ['type'],
      },
      {
        fields: ['area'],
      },
    ],
    hooks: {
      beforeValidate: (artist) => {
        // Auto-generate sort name if not provided
        if (!artist.sortName && artist.name) {
          artist.sortName = artist.name;
        }
        
        // Update last_updated timestamp
        artist.lastUpdated = new Date();
      },
    },
  });

  // Class methods
  ArtistModel.findByName = function(name) {
    return this.findOne({
      where: {
        name: {
          [sequelize.Sequelize.Op.iLike]: `%${name}%`,
        },
      },
    });
  };

  ArtistModel.findByMusicbrainzId = function(mbid) {
    return this.findOne({
      where: {
        musicbrainzId: mbid,
      },
    });
  };

  ArtistModel.searchByName = function(name, limit = 10) {
    return this.findAll({
      where: {
        name: {
          [sequelize.Sequelize.Op.iLike]: `%${name}%`,
        },
      },
      limit,
      order: [['popularity', 'DESC'], ['name', 'ASC']],
    });
  };

  // Instance methods
  ArtistModel.prototype.getFullName = function() {
    return this.disambiguation 
      ? `${this.name} (${this.disambiguation})`
      : this.name;
  };

  ArtistModel.prototype.isActive = function() {
    return !this.ended && !this.endDate;
  };

  // Associations will be defined in database.js
  ArtistModel.associate = function(models) {
    // These associations are handled in database.js
  };

  return ArtistModel;
};

module.exports = { Artist }; 