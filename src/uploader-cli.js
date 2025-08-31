#!/usr/bin/env node

const { Command } = require('commander');
const { createUploaderApp } = require('./uploader');
const config = require('./config');
const axios = require('axios');

const program = new Command();

// Initialize database connection
program
  .name('uploader-cli')
  .description('Muza Uploader CLI')
  .version('1.0.0');

program
  .command('start')
  .description('Start the uploader server')
  .option('-p, --port <port>', 'Port to run on', config.uploader.port)
  .option('-h, --host <host>', 'Host to bind to', '0.0.0.0')
  .action((options) => {
    const uploaderConfig = {
      ...config.uploader,
      ...config.aws,
      muzaServerUrl: config.muza.baseUrl,
      port: parseInt(options.port) || config.uploader.port,

    };

    const app = createUploaderApp(uploaderConfig, options);

    console.log(`Starting Muza Utils API on ${options.host}:${uploaderConfig.port}`);
    console.log(`Audio upload directory: ${uploaderConfig.audioUploadDir}`);
    console.log(`Image upload directory: ${uploaderConfig.imageUploadDir}`);
    console.log(`Muza server URL: ${uploaderConfig.muzaServerUrl}`);

  });

program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    console.log('Uploader Configuration:');
    console.log('======================');
    console.log(`Port: ${config.uploader.port}`);
    console.log(`Audio Upload Dir: ${config.uploader.audioUploadDir}`);
    console.log(`Image Upload Dir: ${config.uploader.imageUploadDir}`);
    console.log(`Muza Server URL: ${config.muza.baseUrl}`);
    console.log(`AWS Region: ${config.aws.region}`);
    console.log(`S3 Audio Bucket: ${config.aws.s3AudioRawBucket || 'Not configured'}`);
    console.log(`S3 Cover Art Bucket: ${config.aws.s3CoverArtBucket || 'Not configured'}`);
    console.log(`CDN Domain: ${config.aws.cdnDomainName || 'Not configured'}`);
    console.log(`Cognito Base URL: ${config.auth.cognitoBaseUrl || 'Not configured'}`);
  });

program
  .command('health')
  .description('Check uploader server health')
  .option('-u, --url <url>', 'Uploader server URL', `http://localhost:${config.uploader.port}`)
  .action(async (options) => {
    try {
      const response = await axios.get(`${options.url}/health`);
      console.log('✅ Uploader server is healthy');
      console.log(`Status: ${response.data.status}`);
      console.log(`Service: ${response.data.service}`);
    } catch (error) {
      console.error('❌ Uploader server is not responding');
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('test-upload')
  .description('Test file upload functionality')
  .option('-f, --file <file>', 'FLAC file to upload')
  .option('-u, --url <url>', 'Uploader server URL', `http://localhost:${config.uploader.port}`)
  .action(async (options) => {
    if (!options.file) {
      console.error('Please specify a FLAC file with -f option');
      process.exit(1);
    }

    try {
      const fs = require('fs');
      const FormData = require('form-data');

      if (!fs.existsSync(options.file)) {
        console.error(`File not found: ${options.file}`);
        process.exit(1);
      }

      const form = new FormData();
      form.append('file', fs.createReadStream(options.file));

      console.log(`Uploading ${options.file}...`);

      const response = await axios.post(`${options.url}/upload`, form, {
        headers: form.getHeaders(),
        timeout: 60000
      });

      console.log('✅ Upload successful');
      console.log(`Track ID: ${response.data.track?.id}`);
      console.log(`Track Title: ${response.data.track?.title || response.data.metadata?.songTitle}`);
    } catch (error) {
      console.error('❌ Upload failed');
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Error: ${error.response.data?.error || error.message}`);
      } else {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}