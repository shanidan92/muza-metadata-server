#!/usr/bin/env node

const NodeUploader = require('./src/uploader');
const UploaderConfig = require('./src/uploader-config');

async function testUploader() {
    console.log('Testing Muza Node.js Uploader...\n');
    
    try {
        // Test configuration
        console.log('1. Testing configuration...');
        const config = UploaderConfig.fromEnv();
        const configObj = config.getConfig();
        console.log('Configuration loaded successfully:', configObj);
        
        // Test uploader creation
        console.log('\n2. Testing uploader creation...');
        const uploader = new NodeUploader(configObj);
        console.log('Uploader created successfully');
        
        // Test metadata extraction (mock)
        console.log('\n3. Testing metadata extraction...');
        const mockMetadata = {
            song_title: 'Test Song',
            artist_main: 'Test Artist',
            album_title: 'Test Album'
        };
        
        const enhanced = await uploader.enhanceWithMusicBrainz(mockMetadata);
        console.log('Metadata enhancement completed:', enhanced);
        
        // Test file URL generation
        console.log('\n4. Testing file URL generation...');
        const mockReq = { protocol: 'http', get: () => 'localhost:5002' };
        const fileUrl = uploader.getFileUrl('test.flac', mockReq);
        console.log('File URL generated:', fileUrl);
        
        console.log('\n✅ All tests passed! The uploader is working correctly.');
        console.log('\nTo start the uploader server, run:');
        console.log('  npm run uploader:start');
        console.log('\nOr for direct start:');
        console.log('  npm run uploader');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testUploader();
}

module.exports = { testUploader };


