#!/usr/bin/env node

const { createUploaderApp } = require('./uploader');
const config = require('./config');

async function main() {
  const uploaderConfig = {
    audioUploadDir: config.uploader.audioUploadDir,
    imageUploadDir: config.uploader.imageUploadDir,
    s3AudioRawBucket: config.aws.s3AudioRawBucket,
    s3CoverArtBucket: config.aws.s3CoverArtBucket,
    cdnDomainName: config.aws.cdnDomainName,
    awsRegion: config.aws.region,
    secretKey: config.uploader.secretKey,
    port: config.uploader.port,
  };

  const app = await createUploaderApp(uploaderConfig);

  console.log(`Starting Muza Utils API on port ${uploaderConfig.port}`);
  console.log(`Audio upload directory: ${uploaderConfig.audioUploadDir}`);
  console.log(`Image upload directory: ${uploaderConfig.imageUploadDir}`);

  app.listen(uploaderConfig.port, '0.0.0.0', () => {
    console.log(`🚀 Muza Utils API ready at http://0.0.0.0:${uploaderConfig.port}`);
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error('Failed to start uploader server:', error);
    process.exit(1);
  });
}

module.exports = { main };