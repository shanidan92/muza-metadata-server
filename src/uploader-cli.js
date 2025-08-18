#!/usr/bin/env node

const { Command } = require('commander');
const NodeUploader = require('./uploader');
const UploaderConfig = require('./uploader-config');

const program = new Command();

program
    .name('muza-uploader')
    .description('Muza Utils FLAC Uploader - Node.js version')
    .version('1.0.0');

program
    .command('start')
    .description('Start the uploader server')
    .option('-p, --port <port>', 'Port to run on', '5002')
    .option('-d, --upload-dir <dir>', 'Upload directory', 'downloads')
    .option('-m, --muza-url <url>', 'Muza server URL', 'http://localhost:5000/graphql')
    .option('--debug', 'Enable debug mode')
    .action(async (options) => {
        try {
            // Override environment variables with CLI options
            if (options.port) process.env.PORT = options.port;
            if (options.uploadDir) process.env.UPLOAD_DIR = options.uploadDir;
            if (options.muzaUrl) process.env.MUZA_SERVER_URL = options.muzaUrl;
            if (options.debug) process.env.DEBUG = 'true';
            
            const config = UploaderConfig.fromEnv();
            const configObj = config.getConfig();
            
            console.log('Starting Muza Utils API...');
            console.log('Configuration:', configObj);
            
            const uploader = new NodeUploader(configObj);
            uploader.start();
            
            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log('\nReceived SIGINT, shutting down gracefully...');
                process.exit(0);
            });
            
            process.on('SIGTERM', () => {
                console.log('\nReceived SIGTERM, shutting down gracefully...');
                process.exit(0);
            });
            
        } catch (error) {
            console.error('Failed to start uploader:', error);
            process.exit(1);
        }
    });

program
    .command('config')
    .description('Show current configuration')
    .action(() => {
        const config = UploaderConfig.fromEnv();
        const configObj = config.getConfig();
        
        console.log('Current Configuration:');
        console.log(JSON.stringify(configObj, null, 2));
    });

program
    .command('health')
    .description('Check uploader health')
    .option('-u, --url <url>', 'Uploader URL', 'http://localhost:5002')
    .action(async (options) => {
        try {
            const axios = require('axios');
            const response = await axios.get(`${options.url}/health`);
            console.log('Health Check Result:');
            console.log(JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.error('Health check failed:', error.message);
            process.exit(1);
        }
    });

program.parse();


