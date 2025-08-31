// Database module exports
export { default as pool, testConnection, query, getClient, closePool } from './connection.js';
export { 
  AlbumModel, 
  TrackModel, 
  ArtistModel, 
  SearchModel, 
  StatsModel 
} from './models/index.js';
export { 
  initializeDatabase, 
  resetDatabase, 
  seedDatabase 
} from './init.js';
export {
  paginateResults,
  searchInMultipleFields,
  batchInsert,
  withTransaction,
  validateAlbumData,
  validateTrackData,
  transformAlbumForResponse,
  transformTrackForResponse,
  handleDatabaseError,
  checkDatabaseHealth
} from './utils.js';

// Re-export everything for convenience
export * from './connection.js';
export * from './models/index.js';
export * from './init.js';
export * from './utils.js'; 