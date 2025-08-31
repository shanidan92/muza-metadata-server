require('dotenv').config();

const config = {
  // Server configuration
  server: {
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL, // New: Support for DATABASE_URL
    dialect: process.env.DB_DIALECT || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'muza_metadata',
    storage: process.env.DB_STORAGE || './data/database.sqlite',
    sync: process.env.DB_SYNC === 'true' || false,
    forceSync: process.env.DB_FORCE_SYNC === 'true' || false,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    ssl: process.env.DB_SSL === 'true' || false, // New: SSL support
  },

  // GraphQL configuration
  graphql: {
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production',
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
  },

  // File storage configuration
  storage: {
    uploadsDir: process.env.UPLOADS_DIR || './data/uploads',
    downloadsDir: process.env.DOWNLOADS_DIR || './downloads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
  },

  // MusicBrainz API configuration
  musicbrainz: {
    baseUrl: process.env.MUSICBRAINZ_BASE_URL || 'https://musicbrainz.org/ws/2',
    userAgent: process.env.MUSICBRAINZ_USER_AGENT || 'MuzaMetadataServer/1.0.0',
    rateLimit: parseInt(process.env.MUSICBRAINZ_RATE_LIMIT) || 1000, // ms between requests
  },

  // Muza client configuration
  muza: {
    baseUrl: process.env.MUZA_BASE_URL || 'http://localhost:8000',
    apiKey: process.env.MUZA_API_KEY || '',
    timeout: parseInt(process.env.MUZA_TIMEOUT) || 30000,
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },

  // AWS/S3 configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    s3AudioRawBucket: process.env.S3_AUDIO_RAW_BUCKET,
    s3CoverArtBucket: process.env.S3_COVER_ART_BUCKET,
    cdnDomainName: process.env.CDN_DOMAIN_NAME,
    
      audioUploadDir: process.env.AUDIO_UPLOAD_DIR || './uploads/audio',
      imageUploadDir: process.env.IMAGE_UPLOAD_DIR || './uploads/images',
      s3AudioRawBucket: process.env.S3_AUDIO_RAW_BUCKET,
      s3CoverArtBucket: process.env.S3_COVER_ART_BUCKET,
      cdnDomainName: process.env.CDN_DOMAIN_NAME,
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      secretKey: process.env.SECRET_KEY || 'dev-secret-key',
      port: parseInt(process.env.PORT) || 8080
  },

  // Hook configuration
  hooks: {
    command: process.env.HOOK_COMMAND,
  },

  // Uploader configuration
  uploader: {
    audioUploadDir: process.env.AUDIO_UPLOAD_DIR || './uploads/audio',
    imageUploadDir: process.env.IMAGE_UPLOAD_DIR || './uploads/images',
    secretKey: process.env.SECRET_KEY || 'dev-secret-key',
    port: parseInt(process.env.UPLOADER_PORT) || 8080,
  },

  // Cognito/OAuth configuration
  auth: {
    cognitoBaseUrl: process.env.COGNITO_BASE_URL,
    cognitoClientId: process.env.COGNITO_CLIENT_ID,
    cognitoClientSecret: process.env.COGNITO_CLIENT_SECRET,
    oauthRedirectUri: process.env.OAUTH_REDIRECT_URI,
    oauthLogoutRedirectUri: process.env.OAUTH_LOGOUT_REDIRECT_URI,
  },

  // Development/Debug flags
  debug: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development',
};

// Validation function
function validateConfig() {
  const required = [];
  
  if (config.database.dialect === 'postgres' && !config.database.host) {
    required.push('DB_HOST for PostgreSQL');
  }
  
  if (config.database.dialect === 'mysql' && !config.database.host) {
    required.push('DB_HOST for MySQL');
  }

  if (required.length > 0) {
    throw new Error(`Missing required configuration: ${required.join(', ')}`);
  }
}

// Validate configuration on load
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

module.exports = config; 