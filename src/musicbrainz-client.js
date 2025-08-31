const axios = require('axios');
const cheerio = require("cheerio");
const { getTrackCredits, scrapeReleasePage } = require('./musicbrainz-scraping');

class MusicBrainzClient {
  constructor(appName = 'MuzaMetadataServer', appVersion = '1.0.0', contact = 'contact@example.com') {
    this.baseUrl = 'https://musicbrainz.org/ws/2';
    this.userAgent = `${appName}/${appVersion} (${contact})`;
    this.rateLimit = 1000; // 1 second between requests
    this.lastRequest = 0;
  }

  async _makeRequest(url) {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.rateLimit) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimit - timeSinceLastRequest));
    }
    this.lastRequest = Date.now();

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('MusicBrainz API error:', error.message);
      return null;
    }
  }

  async lookupTrackById(trackId) {
    const url = `${this.baseUrl}/recording/${trackId}?inc=artist-credits+releases&fmt=json`;
    return await this._makeRequest(url);
  }

  async searchTrack(title, artist, album) {
    let query = `recording:"${title}" AND artist:"${artist}"`;
    // if (album) {
    //   query += ` AND release:"${album}"`;
    // }

    const url = `${this.baseUrl}/recording?query=${encodeURIComponent(query)}&limit=1&fmt=json`;
    const data = await this._makeRequest(url);

    if (data && data.recordings && data.recordings.length > 0) {
      for (let release of data.recordings[0].releases) {
        if (release.title.toLowerCase() === album?.toLowerCase()) {
          data.recordings[0].credits = await scrapeReleasePage(release.id, title);
          if (data.recordings[0].credits) {
            data.recordings[0].release = release;
            //TODO : get more data from release
            return data.recordings[0];
          }
        }
      }
    }
    return null;
  }

  async getAlbumCoverUrl(albumId) {
    try {
      const url = `https://coverartarchive.org/release/${albumId}`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000
      });

      if (response.data && response.data.images && response.data.images.length > 0) {
        // Return the first image URL
        return response.data.images[0].image;
      }
    } catch (error) {
      console.error('Cover Art Archive error:', error.message);
    }
    return null;
  }

}

module.exports = MusicBrainzClient;