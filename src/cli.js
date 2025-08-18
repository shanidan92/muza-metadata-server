#!/usr/bin/env node

const { Command } = require('commander');
const Config = require('./config');
const Database = require('./database');

const program = new Command();

program
  .name('muza-metadata-server')
  .description('Music metadata server for Muza')
  .version('0.1.0');

program
  .command('start')
  .description('Start the metadata server')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('--db-path <path>', 'Path to SQLite database file')
  .option('--database-url <url>', 'Database URL')
  .option('--debug', 'Enable debug mode')
  .option('--hook-command <command>', 'Command to run after successful track insertion')
  .action(async (options) => {
    try {
      // Create config from command line arguments
      const config = Config.fromArgs(options);
      
      // Set port in environment
      process.env.PORT = options.port;
      
      // Start the server
      const { createApp } = require('./app');
      const app = await createApp(config);
      
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`🚀 Muza Metadata Server running on http://localhost:${PORT}`);
        console.log(`🚀 GraphQL endpoint: http://localhost:${PORT}/graphql`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  });

program
  .command('init-db')
  .description('Initialize the database')
  .option('--db-path <path>', 'Path to SQLite database file')
  .option('--database-url <url>', 'Database URL')
  .action(async (options) => {
    try {
      const config = Config.fromArgs(options);
      const db = new Database(config.databaseUrl);
      await db.initDb();
      console.log('Database initialized successfully');
      process.exit(0);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    }
  });

program
  .command('add-track')
  .description('Add a track to the database')
  .requiredOption('--title <title>', 'Track title')
  .option('--uuid <uuid>', 'Track UUID')
  .option('--artist <artist>', 'Artist name')
  .option('--album <album>', 'Album title')
  .option('--composer <composer>', 'Composer')
  .option('--year <year>', 'Year recorded')
  .option('--duration <duration>', 'Duration in seconds')
  .option('--db-path <path>', 'Path to SQLite database file')
  .option('--database-url <url>', 'Database URL')
  .action(async (options) => {
    try {
      const config = Config.fromArgs(options);
      const db = new Database(config.databaseUrl);
      await db.initDb();
      
      const trackData = {
        uuid: options.uuid,
        songTitle: options.title,
        artistMain: options.artist,
        albumTitle: options.album,
        composer: options.composer,
        yearRecorded: options.year ? parseInt(options.year) : null,
        durationSeconds: options.duration ? parseInt(options.duration) : null
      };
      
      const track = await db.insertTrack(trackData);
      console.log('Track added successfully:', track);
      process.exit(0);
    } catch (error) {
      console.error('Failed to add track:', error);
      process.exit(1);
    }
  });

program.parse(); 