const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const musicMetadata = require('music-metadata');
const config = require('./config');

/**
 * Extract metadata from audio file
 * @param {string} filePath - Path to audio file
 * @returns {Object} Extracted metadata
 */
async function extractMetadata(filePath) {
  try {
    const metadata = await musicMetadata.parseFile(filePath);
    const { common, format } = metadata;
    
    return {
      title: common.title || null,
      artist: common.artist || 'Unknown Artist',
      album: common.album || null,
      albumArtist: common.albumartist || common.artist || null,
      trackNumber: common.track?.no || null,
      trackTotal: common.track?.of || null,
      discNumber: common.disk?.no || 1,
      discTotal: common.disk?.of || 1,
      year: common.year || null,
      date: common.date || null,
      genres: common.genre || [],
      duration: Math.round(format.duration || 0),
      bitrate: format.bitrate || null,
      sampleRate: format.sampleRate || null,
      channels: format.numberOfChannels || null,
      format: format.container?.toUpperCase() || path.extname(filePath).slice(1).toUpperCase(),
      codecProfile: format.codecProfile || null,
      lossless: format.lossless || false,
      comment: common.comment || null,
      isrc: common.isrc || null,
      musicbrainzTrackId: common.musicbrainz_trackid || null,
      musicbrainzRecordingId: common.musicbrainz_recordingid || null,
      musicbrainzAlbumId: common.musicbrainz_albumid || null,
      musicbrainzArtistId: common.musicbrainz_artistid || null,
      acoustid: common.acoustid_id || null,
    };
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human readable file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Sanitize filename for safe storage
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing spaces
}

/**
 * Generate unique filename to avoid conflicts
 * @param {string} originalPath - Original file path
 * @param {string} targetDir - Target directory
 * @returns {string} Unique filename
 */
async function generateUniqueFilename(originalPath, targetDir) {
  const ext = path.extname(originalPath);
  const basename = path.basename(originalPath, ext);
  const sanitizedBasename = sanitizeFilename(basename);
  
  let counter = 0;
  let filename = `${sanitizedBasename}${ext}`;
  let fullPath = path.join(targetDir, filename);
  
  while (await fs.pathExists(fullPath)) {
    counter++;
    filename = `${sanitizedBasename}_${counter}${ext}`;
    fullPath = path.join(targetDir, filename);
  }
  
  return filename;
}

/**
 * Get supported audio file extensions
 * @returns {Array<string>} Array of supported extensions
 */
function getSupportedExtensions() {
  return [
    '.mp3', '.flac', '.m4a', '.aac', '.ogg', '.wav', '.wma', '.opus', '.mp4'
  ];
}

/**
 * Check if file is a supported audio format
 * @param {string} filePath - File path to check
 * @returns {boolean} True if supported
 */
function isSupportedAudioFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return getSupportedExtensions().includes(ext);
}

/**
 * Recursive directory scan for audio files
 * @param {string} dirPath - Directory to scan
 * @param {Object} options - Scan options
 * @returns {Array<string>} Array of audio file paths
 */
async function scanForAudioFiles(dirPath, options = {}) {
  const {
    recursive = true,
    extensions = getSupportedExtensions(),
    maxDepth = 10,
    currentDepth = 0
  } = options;
  
  if (currentDepth >= maxDepth) {
    return [];
  }
  
  const audioFiles = [];
  
  try {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory() && recursive) {
        const subFiles = await scanForAudioFiles(itemPath, {
          ...options,
          currentDepth: currentDepth + 1
        });
        audioFiles.push(...subFiles);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (extensions.includes(ext)) {
          audioFiles.push(itemPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
  
  return audioFiles;
}

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Directory path to create
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error.message);
    throw error;
  }
}

/**
 * Get file hash for duplicate detection
 * @param {string} filePath - File path
 * @returns {string} File hash
 */
async function getFileHash(filePath) {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5');
  const stream = fs.createReadStream(filePath);
  
  return new Promise((resolve, reject) => {
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Validate audio file integrity
 * @param {string} filePath - File path to validate
 * @returns {boolean} True if file is valid
 */
async function validateAudioFile(filePath) {
  try {
    await musicMetadata.parseFile(filePath);
    return true;
  } catch (error) {
    console.error(`Invalid audio file ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Clean up string for comparison (remove special chars, normalize case)
 * @param {string} str - String to clean
 * @returns {string} Cleaned string
 */
function cleanString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Calculate string similarity using Levenshtein distance
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(a, b) {
  if (!a || !b) return 0;
  
  const cleanA = cleanString(a);
  const cleanB = cleanString(b);
  
  if (cleanA === cleanB) return 1;
  
  const matrix = [];
  const aLength = cleanA.length;
  const bLength = cleanB.length;
  
  for (let i = 0; i <= bLength; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= aLength; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= bLength; i++) {
    for (let j = 1; j <= aLength; j++) {
      if (cleanB.charAt(i - 1) === cleanA.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const maxLength = Math.max(aLength, bLength);
  return maxLength === 0 ? 1 : (maxLength - matrix[bLength][aLength]) / maxLength;
}

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of function execution
 */
async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delayTime = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      console.log(`Attempt ${attempt} failed, retrying in ${delayTime}ms...`);
      await delay(delayTime);
    }
  }
  
  throw lastError;
}

/**
 * Make HTTP request with retry logic
 * @param {string} url - URL to request
 * @param {Object} options - Request options
 * @returns {Promise} Response data
 */
async function httpRequest(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    data = null,
    timeout = config.muza?.timeout || 30000,
    retryOptions = {}
  } = options;
  
  return await retry(async () => {
    const response = await axios({
      method,
      url,
      headers: {
        'User-Agent': config.musicbrainz?.userAgent || 'Muza-Metadata-Server/1.0',
        ...headers
      },
      data,
      timeout,
    });
    
    return response.data;
  }, retryOptions);
}

/**
 * Run post-insert hook command
 * @param {string} hookCommand - Command to execute
 * @param {Object} trackData - Track data to pass to hook
 */
function runHook(hookCommand, trackData) {
  if (!hookCommand) {
    return;
  }

  try {
    const { spawn } = require('child_process');
    
    console.log(`Running hook command: ${hookCommand}`);
    
    // Parse command and arguments
    const parts = hookCommand.split(' ');
    const command = parts[0];
    const args = parts.slice(1);
    
    // Spawn the process
    const child = spawn(command, args, {
      stdio: 'pipe',
      env: {
        ...process.env,
        TRACK_DATA: JSON.stringify(trackData)
      }
    });
    
    // Send track data to stdin
    if (child.stdin) {
      child.stdin.write(JSON.stringify(trackData));
      child.stdin.end();
    }
    
    child.stdout?.on('data', (data) => {
      console.log(`Hook stdout: ${data}`);
    });
    
    child.stderr?.on('data', (data) => {
      console.error(`Hook stderr: ${data}`);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('Hook command executed successfully');
      } else {
        console.error(`Hook command exited with code ${code}`);
      }
    });
    
    child.on('error', (error) => {
      console.error(`Hook command error: ${error.message}`);
    });
    
  } catch (error) {
    console.error(`Error running hook command: ${error.message}`);
  }
}

module.exports = {
  extractMetadata,
  formatFileSize,
  formatDuration,
  sanitizeFilename,
  generateUniqueFilename,
  getSupportedExtensions,
  isSupportedAudioFile,
  scanForAudioFiles,
  ensureDirectory,
  getFileHash,
  validateAudioFile,
  cleanString,
  calculateSimilarity,
  delay,
  retry,
  httpRequest,
  runHook,
}; 