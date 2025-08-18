const path = require('path');

class UploaderConfig {
    constructor() {
        this.uploadDir = process.env.UPLOAD_DIR || 'downloads';
        this.muzaServerUrl = process.env.MUZA_SERVER_URL || 'http://localhost:5000/graphql';
        this.musicbrainzAppName = process.env.MUSICBRAINZ_APP_NAME || 'MuzaUtils';
        this.musicbrainzAppVersion = process.env.MUSICBRAINZ_APP_VERSION || '1.0';
        this.musicbrainzContact = process.env.MUSICBRAINZ_CONTACT || 'admin@example.com';
        this.port = parseInt(process.env.PORT) || 5002;
        this.debug = process.env.DEBUG === 'true';
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
    }

    static fromEnv() {
        return new UploaderConfig();
    }

    getConfig() {
        return {
            uploadDir: this.uploadDir,
            muzaServerUrl: this.muzaServerUrl,
            musicbrainzAppName: this.musicbrainzAppName,
            musicbrainzAppVersion: this.musicbrainzAppVersion,
            musicbrainzContact: this.musicbrainzContact,
            port: this.port,
            debug: this.debug,
            maxFileSize: this.maxFileSize
        };
    }
}

module.exports = UploaderConfig;


