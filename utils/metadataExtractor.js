const fs = require('fs');
const path = require('path');
const { parseBuffer } = require('music-metadata');

class MetadataExtractor {
    /**
     * Extract metadata from FLAC file
     * @param {string} filePath - Path to the FLAC file
     * @param {Object} fileHandler - File handler instance
     * @returns {Object} Dictionary containing extracted metadata
     */
    async extractFromFlac(filePath, fileHandler) {
        try {
            const buffer = fs.readFileSync(filePath);
            const metadata = await parseBuffer(buffer, 'audio/flac');
            
            if (!metadata) {
                console.error(`Could not read FLAC file: ${filePath}`);
                return {};
            }

            // Extract cover art
            const coverPath = await this.extractFlacCoverArt(metadata, fileHandler);

            const extractedMetadata = {
                duration_seconds: Math.floor(metadata.format.duration || 0),
                song_title: this._getTag(metadata, 'title'),
                artist_main: this._getTag(metadata, 'artist'),
                album_title: this._getTag(metadata, 'album'),
                composer: this._getTag(metadata, 'composer'),
                band_name: this._getTag(metadata, 'albumartist'),
                label: this._getTag(metadata, 'label'),
                year_recorded: this._getYear(metadata, 'date'),
                year_released: this._getYear(metadata, 'originaldate'),
                song_order: this._getTrackNumber(metadata),
                instrument: this._getTag(metadata, 'instrument'),
                comments: this._getTag(metadata, 'comment'),
                other_artist_playing: this._getTag(metadata, 'performer'),
                musicbrainz_track_id: this._getTag(metadata, 'musicbrainz_trackid'),
                musicbrainz_album_id: this._getTag(metadata, 'musicbrainz_albumid'),
                musicbrainz_artist_id: this._getTag(metadata, 'musicbrainz_artistid'),
            };

            console.log('Extracted metadata:', extractedMetadata);

            // Clean up null/undefined values
            return Object.fromEntries(
                Object.entries(extractedMetadata).filter(([_, v]) => v != null)
            );

        } catch (error) {
            console.error(`Error reading FLAC metadata: ${error.message}`);
            return {};
        }
    }

    /**
     * Get a single tag value
     * @param {Object} metadata - Parsed metadata object
     * @param {string} tag - Tag name
     * @returns {string|null} Tag value or null
     */
    _getTag(metadata, tag) {
        const common = metadata.common || {};
        const value = common[tag.toLowerCase()];
        
        if (Array.isArray(value) && value.length > 0) {
            return value[0].toString().trim();
        } else if (value) {
            return value.toString().trim();
        }
        return null;
    }

    /**
     * Extract cover art from FLAC file and save it
     * @param {Object} metadata - Parsed metadata object
     * @param {Object} fileHandler - File handler instance
     * @returns {string|null} Relative path to saved cover or null
     */
    async extractFlacCoverArt(metadata, fileHandler) {
        try {
            const pictures = metadata.common?.picture;
            if (!pictures || pictures.length === 0) {
                console.log('No cover art found in the FLAC file.');
                return null;
            }

            // Use the first picture (usually front cover)
            const picture = pictures[0];
            const artist = this._getTag(metadata, 'artist') || 'unknown';
            const album = this._getTag(metadata, 'album') || 'unknown';
            
            const fileName = `cover_${artist}_${album}`.replace(/\s+/g, '_') + '.jpg';
            const relativePath = await fileHandler.saveAlbumCoverFromFlac(picture.data, fileName);
            
            return relativePath;

        } catch (error) {
            console.error(`Error extracting cover art: ${error.message}`);
            return null;
        }
    }

    /**
     * Extract year from date tag
     * @param {Object} metadata - Parsed metadata object
     * @param {string} tag - Tag name
     * @returns {number|null} Year or null
     */
    _getYear(metadata, tag) {
        const dateStr = this._getTag(metadata, tag);
        if (dateStr) {
            try {
                const year = parseInt(dateStr.split('-')[0]);
                return (year >= 1900 && year <= 2100) ? year : null;
            } catch (error) {
                console.warn(`Could not parse year from: ${dateStr}`);
            }
        }
        return null;
    }

    /**
     * Extract track number
     * @param {Object} metadata - Parsed metadata object
     * @returns {number|null} Track number or null
     */
    _getTrackNumber(metadata) {
        const trackStr = this._getTag(metadata, 'track');
        if (trackStr) {
            try {
                // Handle "1/12" format
                return parseInt(trackStr.split('/')[0]);
            } catch (error) {
                console.warn(`Could not parse track number from: ${trackStr}`);
            }
        }
        return null;
    }
}

module.exports = MetadataExtractor;