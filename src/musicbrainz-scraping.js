const axios = require("axios");
const cheerio = require("cheerio");


async function scrapeReleasePage(releaseId, trackTitle) {
  const url = `https://musicbrainz.org/release/${releaseId}/disc/1`;
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "MyScraper/1.0 (me@example.com)" }
  });

  const $ = cheerio.load(data);

  try{
  let result = null;

  $("table.tbl .title").each((i, row) => {
    const titleCell = $(row).find('a bdi').first();
    if (!titleCell.length) return;

    const trackName = titleCell.text().trim();

    if (trackName.toLowerCase() === trackTitle.toLowerCase()) {
      const expandRow = $(row).find('dl.ars');
      const credits = [];

      if (expandRow.length) {
        expandRow.each((j, li) => {
          //TODO seperate to artist each  - save and connect  artist id 
          credits.push($(li).text());
        });
      }

      result = { title: trackName, credits };
    }
  });
  return result;
}
catch(ex){
  console.error("Error scraping release page:", ex.message);
  return null;
} 
}

async function getTrackCredits(artistName, releaseTitle, trackTitle) {
  const query = `artist:"${artistName}" AND release:"${releaseTitle}"`;
  const searchUrl = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json`;

  const searchResp = await axios.get(searchUrl, {
    headers: { "User-Agent": "MyScraper/1.0 (me@example.com)" }
  });

  if (!searchResp.data.releases || !searchResp.data.releases.length) {
    throw new Error("Release not found");
  }

  for (const release of searchResp.data.releases) {
    const result = await scrapeReleasePage(release.id, trackTitle);
    if (result && result.credits.length) {
      return result; // found a release with personnel
    }
  }

  throw new Error(`Track "${trackTitle}" found, but no performer data available in these releases.`);
}

module.exports = { getTrackCredits , scrapeReleasePage }; 
