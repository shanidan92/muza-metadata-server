const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const musicMetadata = require('music-metadata');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');

class NodeUploader {
    constructor(config = {}) {
        this.config = {
            uploadDir: config.uploadDir || 'downloads',
            muzaServerUrl: config.muzaServerUrl || 'http://localhost:5000/graphql',
            musicbrainzAppName: config.musicbrainzAppName || 'MuzaUtils',
            musicbrainzAppVersion: config.musicbrainzAppVersion || '1.0',
            musicbrainzContact: config.musicbrainzContact || 'admin@example.com',
            port: config.port || 5002,
            debug: config.debug || false,
            maxFileSize: 100 * 1024 * 1024 // 100MB
        };

        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.ensureUploadDir();
    }

    setupMiddleware() {
        // Security middleware with secure CSP (no unsafe-inline)
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"]
                }
            }
        }));
        this.app.use(cors());
        
        // Body parsing
        this.app.use(express.json({ limit: '100mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '100mb' }));
        
        // Static file serving
        this.app.use('/files', express.static(this.config.uploadDir));
        this.app.use('/js', express.static(path.join(__dirname, '../utils/templates')));
        
        // Logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', service: 'Muza Utils API' });
        });

        // Serve upload interface
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../utils/templates/index.html'));
        });

        // Serve test interface
        this.app.get('/test', (req, res) => {
            res.sendFile(path.join(__dirname, '../utils/templates/test.html'));
        });

        // File upload endpoint
        this.app.post('/upload', this.handleUpload.bind(this));

        // Serve uploaded files
        this.app.get('/files/:filename', this.serveFile.bind(this));

        // Error handling
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({ error: 'File too large' });
                }
            }
            res.status(500).json({ error: 'Internal server error' });
        });
    }

    async handleUpload(req, res) {
        try {
            // Configure multer for file upload
            const upload = multer({
                dest: this.config.uploadDir,
                limits: {
                    fileSize: this.config.maxFileSize
                },
                fileFilter: (req, file, cb) => {
                    if (file.mimetype === 'audio/flac' || file.originalname.toLowerCase().endsWith('.flac')) {
                        cb(null, true);
                    } else {
                        cb(new Error('Only FLAC files are allowed'));
                    }
                }
            }).single('file');

            upload(req, res, async (err) => {
                if (err) {
                    console.error('Upload error:', err);
                    return res.status(400).json({ error: err.message });
                }

                if (!req.file) {
                    return res.status(400).json({ error: 'No file provided' });
                }

                try {
                    // Process the uploaded file
                    const result = await this.processFile(req.file, req);
                    res.json(result);
                } catch (error) {
                    console.error('Processing error:', error);
                    res.status(500).json({ error: error.message });
                }
            });
        } catch (error) {
            console.error('Upload handler error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async processFile(file, req) {
        console.log(`Processing file: ${file.originalname}`);

        // Extract metadata from FLAC
        const flacMetadata = await this.extractMetadata(file.path);
        if (!flacMetadata) {
            throw new Error('Could not extract metadata from FLAC file');
        }

        // Enhance with MusicBrainz data
        const enhancedMetadata = await this.enhanceWithMusicBrainz(flacMetadata);

        // Set file path in metadata
        const relativePath = path.relative(this.config.uploadDir, file.path);
        enhancedMetadata.song_file = this.getFileUrl(relativePath, req);

        // Find or create artist
        let artistId = null;
        if (enhancedMetadata.artist_main) {
            const artist = await this.findOrCreateArtist(enhancedMetadata);
            if (artist) {
                artistId = artist.id;
            }
        }

        // Find or create album
        let albumId = null;
        let albumExisted = false;
        if (enhancedMetadata.album_title) {
            const existingAlbum = await this.findExistingAlbum(enhancedMetadata, artistId);
            if (existingAlbum) {
                albumId = existingAlbum.id;
                albumExisted = true;
                console.log(`Using existing album: ${existingAlbum.title} (ID: ${albumId})`);
            } else {
                const album = await this.createAlbum(enhancedMetadata, artistId);
                if (album) {
                    albumId = album.id;
                    console.log(`Created new album: ${album.title} (ID: ${albumId})`);
                }
            }
        }

        // Remove album cover from track metadata if album already existed
        if (albumExisted && enhancedMetadata.album_cover) {
            delete enhancedMetadata.album_cover;
        }

        // Add foreign key references
        if (artistId) {
            enhancedMetadata.artist_id = artistId;
        }
        if (albumId) {
            enhancedMetadata.album_id = albumId;
        }

        // Remove fields that are now in Artist/Album tables
        const fieldsToRemove = [
            'album_title', 'album_cover', 'band_name', 'artist_photo',
            'label', 'label_logo', 'year_released'
        ];
        fieldsToRemove.forEach(field => {
            delete enhancedMetadata[field];
        });

        // Insert track into Muza database
        const trackResult = await this.createTrack(enhancedMetadata);
        if (!trackResult) {
            throw new Error('Failed to insert track into database');
        }

        return {
            success: true,
            message: 'File processed successfully',
            track: trackResult.track,
            metadata: enhancedMetadata
        };
    }

    async extractMetadata(filePath) {
        try {
            const metadata = await musicMetadata.parseFile(filePath);
            
            // Extract cover art
            const coverPath = await this.extractCoverArt(metadata);
            
            const extractedMetadata = {
                duration_seconds: Math.floor(metadata.format.duration || 0),
                song_title: metadata.common.title,
                artist_main: metadata.common.artist,
                album_title: metadata.common.album,
                song_order: metadata.common.track?.no,                
                disc_number: metadata.common.disk.no,
                total_discs: metadata.common.disk.of,
                composer: metadata.common.composer?.[0],
                band_name: metadata.common.albumartist,
                label: metadata.common.label?.[0],
                year_recorded: metadata.common.date ? parseInt(metadata.common.date.split('-')[0]) : null,
                year_released: metadata.common.originaldate ? parseInt(metadata.common.originaldate.split('-')[0]) : metadata.common.year,
                  genre: metadata.common.genre?.join(', '),
                duration: Math.round(metadata.format.duration),
                bitrate: metadata.format.bitrate,
                sample_rate: metadata.format.sampleRate,
                channels: metadata.format.numberOfChannels,
                total_tracks: metadata.common.track.of,
                instrument: metadata.common.instrument?.[0],
                comments: metadata.common.comment?.[0],
                other_artist_playing: metadata.common.performer?.[0],
                musicbrainz_track_id: metadata.common.musicbrainz_recordingid,
                musicbrainz_album_id: metadata.common.musicbrainz_albumid,
                musicbrainz_artist_id: metadata.common.musicbrainz_artistid,
                album_cover: coverPath,
                lyrics: metadata.common.lyrics?.[0]?.text

            };
            
            // Clean up null/undefined values
            return Object.fromEntries(
                Object.entries(extractedMetadata).filter(([_, v]) => v != null)
            );
        } catch (error) {
            console.error('Error extracting metadata:', error);
            return null;
        }
    }
    
    async extractCoverArt(metadata) {
        try {
            const pictures = metadata.common?.picture;
            if (!pictures || pictures.length === 0) {
                return null;
            }

            const picture = pictures[0];
            const artist = metadata.common.artist || 'unknown';
            const album = metadata.common.album || 'unknown';
            
            const fileName = `cover_${artist}_${album}`.replace(/\s+/g, '_').replace(/[^\w-]/g, '') + '.jpg';
            const filePath = path.join(this.config.uploadDir, fileName);
            
            await fs.writeFile(filePath, picture.data);
            console.log(`Downloaded album cover: ${fileName}`);
            
            return fileName;
        } catch (error) {
            console.error(`Error extracting cover art: ${error.message}`);
            return null;
        }
    }

    async enhanceWithMusicBrainz(flacMetadata) {
        const enhanced = { ...flacMetadata };
        
        console.log(`Enhancing metadata with MusicBrainz for: ${flacMetadata.song_title || 'unknown'} by ${flacMetadata.artist_main || 'unknown'}`);

        try {
            // Try to lookup by MusicBrainz ID first
            let mbData = null;
            if (flacMetadata.musicbrainz_track_id) {
                mbData = await this.lookupTrackById(flacMetadata.musicbrainz_track_id);
            }

            // If no ID or lookup failed, try search
            if (!mbData && flacMetadata.song_title && flacMetadata.artist_main) {
                mbData = await this.searchTrack(
                    flacMetadata.song_title,
                    flacMetadata.artist_main,
                    flacMetadata.album_title
                );
            }

            console.log(`MusicBrainz data found: ${mbData !== null}`);
            if (mbData) {
                console.log(`MusicBrainz data:`, mbData);
            }

            // Merge MusicBrainz data (prefer FLAC data when available)
            if (mbData) {
                Object.keys(mbData).forEach(key => {
                    if (!enhanced[key] || !enhanced[key]) {
                        enhanced[key] = mbData[key];
                    }
                });
            }

            // Download album cover if we have album ID
            const albumId = enhanced.musicbrainz_album_id;
            if (albumId && !enhanced.album_cover) {
                const coverUrl = await this.getAlbumCoverUrl(albumId);
                console.log(`Cover URL found: ${coverUrl}`);
                
                if (coverUrl) {
                    const coverPath = await this.downloadAlbumCover(
                        coverUrl,
                        enhanced.album_title || 'unknown'
                    );
                    console.log(`Downloaded cover path: ${coverPath}`);
                    if (coverPath) {
                        enhanced.album_cover = this.getFileUrl(coverPath);
                        console.log(`Album cover URL: ${enhanced.album_cover}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error enhancing metadata with MusicBrainz:', error);
        }

        return enhanced;
    }

    async lookupTrackById(trackId) {
        try {
            const response = await axios.get(`https://musicbrainz.org/ws/2/recording/${trackId}`, {
                params: {
                    fmt: 'json',
                    inc: 'artists+releases+tags'
                },
                headers: {
                    'User-Agent': `${this.config.musicbrainzAppName}/${this.config.musicbrainzAppVersion} (${this.config.musicbrainzContact})`
                }
            });

            if (response.data) {
                return this.parseMusicBrainzTrack(response.data);
            }
        } catch (error) {
            console.error('Error looking up track by ID:', error);
        }
        return null;
    }

    async searchTrack(title, artist, album) {
        try {
            const query = `recording:"${title}" AND artist:"${artist}"${album ? ` AND release:"${album}"` : ''}`;
            const response = await axios.get('https://musicbrainz.org/ws/2/recording/', {
                params: {
                    query: query,
                    fmt: 'json',
                    limit: 1
                },
                headers: {
                    'User-Agent': `${this.config.musicbrainzAppName}/${this.config.musicbrainzAppVersion} (${this.config.musicbrainzContact})`
                }
            });

            if (response.data && response.data.recordings && response.data.recordings.length > 0) {
                return this.parseMusicBrainzTrack(response.data.recordings[0]);
            }
        } catch (error) {
            console.error('Error searching track:', error);
        }
        return null;
    }

    parseMusicBrainzTrack(trackData) {
        return {
            song_title: trackData.title,
            artist_main: trackData['artist-credit']?.[0]?.name,
            album_title: trackData.releases?.[0]?.title,
            year_released: trackData.releases?.[0]?.date?.substring(0, 4),
            genre: trackData.tags?.[0]?.name,
            musicbrainz_track_id: trackData.id,
            musicbrainz_album_id: trackData.releases?.[0]?.id,
            musicbrainz_artist_id: trackData['artist-credit']?.[0]?.artist?.id
        };
    }

    async getAlbumCoverUrl(albumId) {
        try {
            const response = await axios.get(`https://coverartarchive.org/release/${albumId}`);
            if (response.data && response.data.images && response.data.images.length > 0) {
                // Find front cover
                const frontCover = response.data.images.find(img => img.front === true);
                if (frontCover) {
                    return frontCover.image;
                }
                // Fallback to first image
                return response.data.images[0].image;
            }
        } catch (error) {
            console.error('Error getting album cover URL:', error);
        }
        return null;
    }

    async downloadAlbumCover(coverUrl, albumTitle) {
        try {
            const response = await axios.get(coverUrl, { responseType: 'stream' });
            const filename = `cover_${albumTitle.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
            const filePath = path.join(this.config.uploadDir, filename);
            
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            
            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(filename));
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('Error downloading album cover:', error);
            return null;
        }
    }

    async findOrCreateArtist(metadata) {
        // This would integrate with your Muza GraphQL server
        // For now, return a mock artist
        return { id: 'mock-artist-id' };
    }

    async findExistingAlbum(metadata, artistId) {
        // This would integrate with your Muza GraphQL server
        // For now, return null (no existing album)
        return null;
    }

    async createAlbum(metadata, artistId) {
        // This would integrate with your Muza GraphQL server
        // For now, return a mock album
        return { id: 'mock-album-id', title: metadata.album_title };
    }

    async createTrack(metadata) {
        // This would integrate with your Muza GraphQL server
        // For now, return a mock track
        return { track: { id: 'mock-track-id', title: metadata.song_title } };
    }

    getFileUrl(relativePath, req) {
        const baseUrl = req?.url ? `${req.protocol}://${req.get('host')}` : `http://localhost:${this.config.port}`;
        return `${baseUrl}/files/${relativePath}`;
    }

    serveFile(req, res) {
        const filename = req.params.filename;
        const filePath = path.join(this.config.uploadDir, filename);
        
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            console.error(`File not found: ${filename} in directory: ${this.config.uploadDir}`);
            res.status(404).json({ error: 'File not found' });
        }
    }

    async ensureUploadDir() {
        try {
            await fs.ensureDir(this.config.uploadDir);
            console.log(`Upload directory ensured: ${this.config.uploadDir}`);
        } catch (error) {
            console.error('Error ensuring upload directory:', error);
        }
    }

    start() {
        this.app.listen(this.config.port, () => {
            console.log(`Muza Utils API started on port ${this.config.port}`);
            console.log(`Upload directory: ${this.config.uploadDir}`);
            console.log(`Muza server URL: ${this.config.muzaServerUrl}`);
        });
    }
}

module.exports = NodeUploader;
