const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const session = require('express-session');
const crypto = require('crypto');
const axios = require('axios');

const config = require('./config');
const { extractMetadata } = require('./utils');
const MusicBrainzClient = require('./musicbrainz-client');

class FileHandler {
  constructor(audioUploadDir, imageUploadDir, options = {}) {
    this.audioUploadDir = audioUploadDir;
    this.imageUploadDir = imageUploadDir;
    this.s3BucketRaw = options.s3BucketRaw;
    this.s3BucketImages = options.s3BucketImages;
    this.cdnDomain = options.cdnDomain?.replace(/\/$/, '');
    this.awsRegion = options.awsRegion;

    if (this.s3BucketRaw || this.s3BucketImages) {
      this.s3 = new AWS.S3({ region: this.awsRegion });
    }

    this.allowedExtensions = ['.flac'];
    this.imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    // Ensure directories exist
    fs.ensureDirSync(audioUploadDir);
    fs.ensureDirSync(imageUploadDir);
  }

  async saveUploadedFile(file, originalFilename) {
    if (!this.isAllowedFile(originalFilename)) {
      throw new Error(`File type not allowed: ${originalFilename}`);
    }

    const fileExt = path.extname(originalFilename).toLowerCase();
    const uniqueFilename = `${uuidv4()}${fileExt}`;

    // Always save locally for metadata extraction
    const filePath = path.join(this.audioUploadDir, uniqueFilename);
    await fs.writeFile(filePath, file.buffer);
    const relativePath = `audio/${uniqueFilename}`;

    // Optionally upload to S3
    if (this.s3 && this.s3BucketRaw) {
      const key = `audio/raw/${uniqueFilename}`;
      await this.s3.upload({
        Bucket: this.s3BucketRaw,
        Key: key,
        Body: file.buffer,
        ContentType: 'audio/flac'
      }).promise();
      console.log(`Uploaded audio to s3://${this.s3BucketRaw}/${key}`);
    }

    console.log(`Saved uploaded file: ${filePath}`);
    return { filePath, relativePath };
  }

  async downloadAlbumCover(coverUrl, albumTitle) {
    try {
      const response = await axios.get(coverUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      // Determine file extension from content type
      const contentType = response.headers['content-type']?.toLowerCase() || '';
      let ext = '.jpg';
      if (contentType.includes('png')) ext = '.png';
      else if (contentType.includes('webp')) ext = '.webp';

      const safeAlbumTitle = albumTitle.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown_album';
      const filename = `cover_${safeAlbumTitle}_${uuidv4()}${ext}`;

      // Upload to S3 if configured, else save locally
      if (this.s3 && this.s3BucketImages) {
        const key = `cover-art/${filename}`;
        await this.s3.upload({
          Bucket: this.s3BucketImages,
          Key: key,
          Body: response.data,
          ContentType: `image/${ext.slice(1)}`
        }).promise();
        console.log(`Uploaded cover art to s3://${this.s3BucketImages}/${key}`);
        return key;
      } else {
        const filePath = path.join(this.imageUploadDir, filename);
        await fs.writeFile(filePath, response.data);

        if (await fs.pathExists(filePath) && (await fs.stat(filePath)).size > 1024) {
          console.log(`Downloaded album cover: ${filename}`);
          return `images/${filename}`;
        } else {
          console.error('Downloaded file is too small or doesn\'t exist');
          if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
          }
          return null;
        }
      }
    } catch (error) {
      console.error(`Error downloading album cover: ${error.message}`);
      return null;
    }
  }

  isAllowedFile(filename) {
    if (!filename) return false;
    const ext = path.extname(filename).toLowerCase();
    return this.allowedExtensions.includes(ext);
  }

  getFileUrl(relativePath, baseUrl) {
    if (this.cdnDomain && (
      relativePath.startsWith('audio/hls/') ||
      relativePath.startsWith('cover-art/') ||
      relativePath.startsWith('images/')
    )) {
      if (relativePath.startsWith('audio/hls/') || relativePath.startsWith('cover-art/')) {
        return `https://${this.cdnDomain}/${relativePath}`;
      }
      if (relativePath.startsWith('images/')) {
        return `https://${this.cdnDomain}/cover-art/${relativePath.split('/').slice(1).join('/')}`;
      }
    }
    return `${baseUrl.replace(/\/$/, '')}/files/${relativePath}`;
  }
}

class MuzaClient {
  constructor() {
    const { Artist, Album, MusicTrack } = require('./db/models');
    this.Artist = Artist;
    this.Album = Album;
    this.MusicTrack = MusicTrack;
  }

  async init() {
    // No initialization needed for models
  }

  async createTrack(trackData) {
    try {
      const track = await this.MusicTrack.create({
        uuid: trackData.uuid,
        title: trackData.songTitle,
        duration: trackData.durationSeconds,
        trackNumber: trackData.songOrder,
        yearRecorded: trackData.yearRecorded,
        filePath: trackData.songFile,
        artistId: trackData.artistId,
        albumId: trackData.albumId
      });
      return { ok: true, track };
    } catch (error) {
      console.error('Error creating track:', error.message);
      return { ok: false, track: null };
    }
  }

  async findOrCreateArtist(metadata) {
    if (!metadata.artistMain) return null;

    try {
      // Try to find existing artist
      let artist = await this.Artist.findByName(metadata.artistMain);

      if (artist) {
        return artist;
      }

      // Create new artist
      artist = await this.Artist.create({
        name: metadata.artistMain,
        bandName: metadata.bandName,
        image: metadata.artistPhoto
      });

      return artist;
    } catch (error) {
      console.error('Error finding/creating artist:', error.message);
      return null;
    }
  }

  async findExistingAlbum(metadata, artistId) {
    if (!metadata.albumTitle) return null;

    try {
      const album = await this.Album.findByTitleAndArtist(metadata.albumTitle, artistId);
      return album;
    } catch (error) {
      console.error('Error finding existing album:', error.message);
      return null;
    }
  }

  async createAlbum(metadata, artistId) {
    if (!metadata.albumTitle) return null;

    try {
      const album = await this.Album.create({
        title: metadata.albumTitle,
        artistId: artistId,
        coverArt: metadata.albumCover,
        releaseDate: metadata.yearReleased ,
        originalReleaseDate: metadata.yearRecorded,
        label: metadata.label
      });

      return album;
    } catch (error) {
      console.error('Error creating album:', error.message);
      return null;
    }
  }
}

async function createUploaderApp(uploaderConfig = null , options) {
  const app = express();
  const { testConnection, query } = require('./db/connection');

  // Test database connection
  console.log('Testing database connection...');
  await testConnection();
  console.log('Database connection successful.');

   // Configure session
  app.use(session({
    secret: uploaderConfig.secretKey,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
  }));

  app.use(require('cors')({
    origin: ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true
  }));
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));
  app.use(express.static(path.join(__dirname, '../utils/static'), { prefix: '/admin/static' }));

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
  });

  // Initialize components
  const fileHandler = new FileHandler(
    uploaderConfig.audioUploadDir,
    uploaderConfig.imageUploadDir,
    {
      s3BucketRaw: uploaderConfig.s3AudioRawBucket,
      s3BucketImages: uploaderConfig.s3CoverArtBucket,
      cdnDomain: uploaderConfig.cdnDomainName,
      awsRegion: uploaderConfig.awsRegion
    }
  );


  const muzaClient = new MuzaClient();
  await muzaClient.init();
  
  const mbClient = new MusicBrainzClient();

  // Middleware to require login
  function requireLogin(req, res, next) {
    if (!req.session.user) {
      return res.redirect('/admin/signin');
    }
    next();
  }

  // Routes
  app.get('/', (req, res) => res.redirect('/admin/'));
  app.get('/admin/', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, '../utils/templates/index.html'));
  });
  app.get('/upload', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, '../utils/templates/index.html'));
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'Muza Utils API' });
  });

  app.get('/admin/signin', (req, res) => {
    res.sendFile(path.join(__dirname, '../utils/templates/login.html'));
  });

  // Presigned URL endpoints for S3 uploads
  app.post('/admin/presign/audio', requireLogin, async (req, res) => {
    const { filename = 'upload.flac', content_type = 'audio/flac' } = req.body;
    const fileExt = path.extname(filename) || '.flac';
    const key = `audio/raw/${crypto.randomBytes(16).toString('hex')}${fileExt}`;

    try {
      if (!fileHandler.s3 || !uploaderConfig.s3AudioRawBucket) {
        return res.status(500).json({ error: 'S3 not configured' });
      }

      const url = fileHandler.s3.getSignedUrl('putObject', {
        Bucket: uploaderConfig.s3AudioRawBucket,
        Key: key,
        ContentType: content_type,
        Expires: 3600
      });

      res.json({
        upload_url: url,
        key,
        bucket: uploaderConfig.s3AudioRawBucket,
        content_type
      });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });

  app.post('/admin/presign/cover', requireLogin, async (req, res) => {
    const { filename = 'cover.jpg', content_type = 'image/jpeg' } = req.body;
    const fileExt = path.extname(filename) || '.jpg';
    const key = `cover-art/${crypto.randomBytes(16).toString('hex')}${fileExt}`;

    try {
      if (!fileHandler.s3 || !uploaderConfig.s3CoverArtBucket) {
        return res.status(500).json({ error: 'S3 not configured' });
      }

      const url = fileHandler.s3.getSignedUrl('putObject', {
        Bucket: uploaderConfig.s3CoverArtBucket,
        Key: key,
        ContentType: content_type,
        Expires: 3600
      });

      const cdnUrl = uploaderConfig.cdnDomainName ?
        `https://${uploaderConfig.cdnDomainName}/${key}` : null;

      res.json({
        upload_url: url,
        key,
        bucket: uploaderConfig.s3CoverArtBucket,
        content_type,
        cdn_url: cdnUrl
      });
    } catch (error) {
      console.error('Error generating presigned URL for cover:', error);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });

  // File upload endpoint
  app.post('/admin/upload', requireLogin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Save uploaded file
      const { filePath, relativePath } = await fileHandler.saveUploadedFile(req.file, req.file.originalname);

      // Extract metadata from FLAC
      const flacMetadata = await extractMetadata(filePath);
      if (!flacMetadata) {
        return res.status(400).json({ error: 'Could not extract metadata from FLAC file' });
      }

      // Enhance with MusicBrainz data
      const enhancedMetadata = await enhanceWithMusicBrainz(flacMetadata, mbClient, fileHandler, req);

      // Set playback URL
      const relBase = path.basename(relativePath, path.extname(relativePath));
      const expectedHlsRelative = `audio/hls/${relBase}/${relBase}.m3u8`;
      enhancedMetadata.songFile = fileHandler.getFileUrl(expectedHlsRelative, `${req.protocol}://${req.get('host')}/`);

      // Find or create artist
      let artistId = null;
      if (flacMetadata.artist) {
        const artist = await muzaClient.findOrCreateArtist({ artistMain: flacMetadata.artist });
        if (artist) {
          artistId = artist.id;
        }
      }

      // Find or create album
      let albumId = null;
      if (flacMetadata.album) {
        const existingAlbum = await muzaClient.findExistingAlbum({ albumTitle: flacMetadata.album }, artistId);
        if (existingAlbum) {
          albumId = existingAlbum.id;
          console.log(`Using existing album: ${existingAlbum.title} (ID: ${albumId})`);
        } else {
          const album = await muzaClient.createAlbum({
            albumTitle: flacMetadata.album,
            yearRecorded: flacMetadata.year,
            yearReleased: flacMetadata.year
          }, artistId);
          if (album) {
            albumId = album.id;
            console.log(`Created new album: ${album.title} (ID: ${albumId})`);
          }
        }
      }

      // Prepare track data
      const trackData = {
        uuid: uuidv4(),
        songTitle: flacMetadata.title,
        artistMain: flacMetadata.artist,
        durationSeconds: flacMetadata.duration,
        songOrder: flacMetadata.trackNumber,
        yearRecorded: flacMetadata.year,
        songFile: flacMetadata.songFile,
        artistId,
        albumId
      };

      // Insert track into database
      const result = await muzaClient.createTrack(trackData);
      if (!result || !result.ok) {
        return res.status(500).json({ error: 'Failed to insert track into database' });
      }

      res.json({
        success: true,
        message: 'File processed successfully',
        track: result.track,
        metadata: trackData
      });

    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  // File serving endpoint
  app.get('/files/:type/:filename', (req, res) => {
    try {
      const { type, filename } = req.params;
      let filePath;

      if (type === 'audio') {
        filePath = path.join(uploaderConfig.audioUploadDir, filename);
      } else if (type === 'images') {
        filePath = path.join(uploaderConfig.imageUploadDir, filename);
      } else {
        return res.status(400).json({ error: 'Invalid file type' });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/admin/files/:type/:filename', (req, res) => {
    // Redirect to main files endpoint
    res.redirect(`/files/${req.params.type}/${req.params.filename}`);
  });

  // Simple login for development (replace with proper OAuth in production)
  app.post('/admin/login', (req, res) => {
    // For development only - implement proper authentication
    req.session.user = { id: 'dev-user' };
    res.redirect('/admin/');
  });

  app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/signin');
  });

  app.listen(uploaderConfig.port, options.host, () => {
    console.log(`🚀 Muza Utils API ready at http://${options.host}:${uploaderConfig.port}`);
  });

  return app;

}
 
async function enhanceWithMusicBrainz(flacMetadata, mbClient, fileHandler, req) {
  const enhanced = { ...flacMetadata };
  
  console.log(`Enhancing metadata with MusicBrainz for: ${flacMetadata.title || 'unknown'} by ${flacMetadata.artist || 'unknown'}`);

  try {
    let mbData = null;
    
    // Try to lookup by MusicBrainz ID first
    if (flacMetadata.musicbrainzTrackId) {
      mbData = await mbClient.lookupTrackById(flacMetadata.musicbrainzTrackId);
    }
    
    // If no ID or lookup failed, try search
    if (!mbData && flacMetadata.title && flacMetadata.artist) {
      mbData = await mbClient.searchTrack(
        flacMetadata.title,
        flacMetadata.artist,
        flacMetadata.album
      );

      
    }
    
    console.log(`MusicBrainz data found: ${mbData !== null}`);
    
    // Merge MusicBrainz data (prefer FLAC data when available)
    if (mbData) {
      // Extract relevant data from MusicBrainz response
      if (mbData.title && !enhanced.title) enhanced.title = mbData.title;
      if (mbData['artist-credit'] && mbData['artist-credit'][0] && !enhanced.artist) {
        enhanced.artist = mbData['artist-credit'][0].name;
      }
      if (mbData.releases && mbData.releases[0] && !enhanced.album) {
        enhanced.album = mbData.releases[0].title;
      }
      if (mbData.id) enhanced.musicbrainzTrackId = mbData.id;
      if (mbData.releases && mbData.releases[0] && mbData.releases[0].id) {
        enhanced.musicbrainzAlbumId = mbData.releases[0].id;
      }
    }
    
    // Download album cover if we have album ID
    const albumId = enhanced.musicbrainzAlbumId;
    if (albumId && !enhanced.albumCover) {
      const coverUrl = await mbClient.getAlbumCoverUrl(albumId);
      
      if (coverUrl) {
        const coverPath = await fileHandler.downloadAlbumCover(
          coverUrl,
          enhanced.album || 'unknown'
        );
        if (coverPath) {
          enhanced.albumCover = fileHandler.getFileUrl(
            coverPath,
            `${req.protocol}://${req.get('host')}/`
          );
        }
      }
    }
    
  } catch (error) {
    console.error(`Error enhancing metadata with MusicBrainz: ${error.message}`);
  }
  
  return enhanced;
}

module.exports = {
  FileHandler,
  MuzaClient,
  createUploaderApp
};