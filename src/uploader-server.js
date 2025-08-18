#!/usr/bin/env node

const NodeUploader = require('./uploader');
const UploaderConfig = require('./uploader-config');

async function main() {
    try {
        // Load configuration from environment variables
        const config = UploaderConfig.fromEnv();
        const configObj = config.getConfig();
        
        console.log('Starting Muza Utils API...');
        console.log('Configuration:', configObj);
        
        // Create and start the uploader
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
}

// Run the main function if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = { main };


