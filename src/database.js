const { Sequelize } = require('sequelize');
const config = require('./config');

// Import models
const { Artist } = require('./models/artist');
const { Album } = require('./models/album');
const { MusicTrack } = require('./models/musicTrack');

// Create Sequelize instance based on configuration
let sequelize;

if (config.database.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.database.storage,
    logging: config.database.logging,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (config.database.dialect === 'postgres') {
  sequelize = new Sequelize(
    config.database.database,
    config.database.username,
    config.database.password,
    {
      host: config.database.host,
      port: config.database.port,
      dialect: 'postgres',
      logging: config.database.logging,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else if (config.database.dialect === 'mysql') {
  sequelize = new Sequelize(
    config.database.database,
    config.database.username,
    config.database.password,
    {
      host: config.database.host,
      port: config.database.port,
      dialect: 'mysql',
      logging: config.database.logging,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else {
  throw new Error(`Unsupported database dialect: ${config.database.dialect}`);
}

// Initialize models with sequelize instance
const models = {
  Artist: Artist(sequelize),
  Album: Album(sequelize),
  MusicTrack: MusicTrack(sequelize),
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Set up model associations
models.Artist.hasMany(models.Album, {
  foreignKey: 'artistId',
  as: 'albums'
});

models.Album.belongsTo(models.Artist, {
  foreignKey: 'artistId',
  as: 'artist'
});

models.Album.hasMany(models.MusicTrack, {
  foreignKey: 'albumId',
  as: 'tracks'
});

models.MusicTrack.belongsTo(models.Album, {
  foreignKey: 'albumId',
  as: 'album'
});

models.MusicTrack.belongsTo(models.Artist, {
  foreignKey: 'artistId',
  as: 'artist'
});

models.Artist.hasMany(models.MusicTrack, {
  foreignKey: 'artistId',
  as: 'tracks'
});

// Database utility functions
const database = {
  sequelize,
  models,
  
  // Initialize database
  async init() {
    try {
      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
      
      if (config.database.sync) {
        await sequelize.sync({ force: config.database.forceSync });
        console.log('Database synchronized.');
      }
      
      return true;
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  },
  
  // Close database connection
  async close() {
    try {
      await sequelize.close();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw error;
    }
  },
  
  // Health check
  async healthCheck() {
    try {
      await sequelize.authenticate();
      return { status: 'healthy', database: config.database.dialect };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
};

module.exports = database; 