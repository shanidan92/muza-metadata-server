const { gql } = require('apollo-server-express');
const { models } = require('./database');

// Type definitions
const typeDefs = gql`
  scalar Date
  scalar JSON

  type Artist {
    id: ID!
    name: String!
    sortName: String
    disambiguation: String
    type: String
    gender: String
    area: String
    beginDate: Date
    endDate: Date
    ended: Boolean!
    musicbrainzId: String
    biography: String
    tags: [String!]!
    image: String
    links: JSON
    isni: String
    ipis: [String!]!
    popularity: Int!
    verified: Boolean!
    lastUpdated: Date!
    createdAt: Date!
    updatedAt: Date!
    albums: [Album!]!
    tracks: [MusicTrack!]!
  }

  type Album {
    id: ID!
    title: String!
    sortTitle: String
    disambiguation: String
    artistId: ID!
    artist: Artist!
    releaseDate: Date
    originalReleaseDate: Date
    albumType: String
    status: String
    packaging: String
    country: String
    language: String
    script: String
    musicbrainzId: String
    musicbrainzReleaseGroupId: String
    barcode: String
    catalogNumber: String
    label: String
    coverArt: String
    trackCount: Int!
    discCount: Int!
    duration: Int
    genres: [String!]!
    tags: [String!]!
    credits: JSON
    notes: String
    quality: Int!
    popularity: Int!
    verified: Boolean!
    lastUpdated: Date!
    createdAt: Date!
    updatedAt: Date!
    tracks: [MusicTrack!]!
  }

  type MusicTrack {
    id: ID!
    title: String!
    sortTitle: String
    disambiguation: String
    artistId: ID!
    artist: Artist!
    albumId: ID
    album: Album
    trackNumber: Int
    discNumber: Int!
    duration: Int
    isrc: String
    musicbrainzId: String
    musicbrainzRecordingId: String
    filePath: String
    fileName: String
    fileSize: String
    format: String
    bitrate: Int
    sampleRate: Int
    channels: Int
    bitDepth: Int
    encoding: String
    lyrics: String
    language: String
    genres: [String!]!
    tags: [String!]!
    mood: String
    energy: Int
    danceability: Int
    valence: Int
    tempo: Float
    key: String
    timeSignature: String
    acousticness: Int
    instrumentalness: Int
    liveness: Int
    speechiness: Int
    explicit: Boolean!
    playCount: Int!
    rating: Int
    popularity: Int!
    verified: Boolean!
    lastPlayed: Date
    lastUpdated: Date!
    createdAt: Date!
    updatedAt: Date!
  }

  input ArtistInput {
    name: String!
    sortName: String
    disambiguation: String
    type: String
    gender: String
    area: String
    beginDate: Date
    endDate: Date
    ended: Boolean
    musicbrainzId: String
    biography: String
    tags: [String!]
    image: String
    links: JSON
    isni: String
    ipis: [String!]
  }

  input AlbumInput {
    title: String!
    sortTitle: String
    disambiguation: String
    artistId: ID!
    releaseDate: Date
    originalReleaseDate: Date
    albumType: String
    status: String
    packaging: String
    country: String
    language: String
    script: String
    musicbrainzId: String
    musicbrainzReleaseGroupId: String
    barcode: String
    catalogNumber: String
    label: String
    coverArt: String
    discCount: Int
    genres: [String!]
    tags: [String!]
    credits: JSON
    notes: String
  }

  input MusicTrackInput {
    title: String!
    sortTitle: String
    disambiguation: String
    artistId: ID!
    albumId: ID
    trackNumber: Int
    discNumber: Int
    duration: Int
    isrc: String
    musicbrainzId: String
    musicbrainzRecordingId: String
    filePath: String
    fileName: String
    fileSize: String
    format: String
    bitrate: Int
    sampleRate: Int
    channels: Int
    bitDepth: Int
    encoding: String
    lyrics: String
    language: String
    genres: [String!]
    tags: [String!]
    mood: String
    energy: Int
    danceability: Int
    valence: Int
    tempo: Float
    key: String
    timeSignature: String
    acousticness: Int
    instrumentalness: Int
    liveness: Int
    speechiness: Int
    explicit: Boolean
    rating: Int
  }

  type Query {
    # Artist queries
    artist(id: ID!): Artist
    artists(limit: Int = 20, offset: Int = 0): [Artist!]!
    searchArtists(query: String!, limit: Int = 10): [Artist!]!
    artistByMusicbrainzId(musicbrainzId: String!): Artist

    # Album queries
    album(id: ID!): Album
    albums(limit: Int = 20, offset: Int = 0): [Album!]!
    searchAlbums(query: String!, limit: Int = 10): [Album!]!
    albumsByArtist(artistId: ID!, limit: Int = 20): [Album!]!
    albumsByYear(year: Int!): [Album!]!
    albumByMusicbrainzId(musicbrainzId: String!): Album

    # Track queries
    track(id: ID!): MusicTrack
    tracks(limit: Int = 50, offset: Int = 0): [MusicTrack!]!
    searchTracks(query: String!, limit: Int = 10): [MusicTrack!]!
    tracksByArtist(artistId: ID!, limit: Int = 50): [MusicTrack!]!
    tracksByAlbum(albumId: ID!): [MusicTrack!]!
    tracksByGenre(genre: String!, limit: Int = 20): [MusicTrack!]!
    trackByMusicbrainzId(musicbrainzId: String!): MusicTrack
    trackByISRC(isrc: String!): MusicTrack

    # Statistics
    totalArtists: Int!
    totalAlbums: Int!
    totalTracks: Int!
  }

  type Mutation {
    # Artist mutations
    createArtist(input: ArtistInput!): Artist!
    updateArtist(id: ID!, input: ArtistInput!): Artist!
    deleteArtist(id: ID!): Boolean!

    # Album mutations
    createAlbum(input: AlbumInput!): Album!
    updateAlbum(id: ID!, input: AlbumInput!): Album!
    deleteAlbum(id: ID!): Boolean!

    # Track mutations
    createTrack(input: MusicTrackInput!): MusicTrack!
    updateTrack(id: ID!, input: MusicTrackInput!): MusicTrack!
    deleteTrack(id: ID!): Boolean!
    incrementPlayCount(id: ID!): MusicTrack!
  }
`;

// Resolvers
const resolvers = {
  Date: {
    serialize: (date) => date ? date.toISOString() : null,
    parseValue: (value) => value ? new Date(value) : null,
    parseLiteral: (ast) => ast.value ? new Date(ast.value) : null,
  },

  JSON: {
    serialize: (value) => value,
    parseValue: (value) => value,
    parseLiteral: (ast) => ast.value,
  },

  Query: {
    // Artist queries
    artist: async (_, { id }) => {
      return await models.Artist.findByPk(id, {
        include: ['albums', 'tracks'],
      });
    },

    artists: async (_, { limit, offset }) => {
      return await models.Artist.findAll({
        limit,
        offset,
        order: [['name', 'ASC']],
      });
    },

    searchArtists: async (_, { query, limit }) => {
      return await models.Artist.searchByName(query, limit);
    },

    artistByMusicbrainzId: async (_, { musicbrainzId }) => {
      return await models.Artist.findByMusicbrainzId(musicbrainzId);
    },

    // Album queries
    album: async (_, { id }) => {
      return await models.Album.findByPk(id, {
        include: ['artist', 'tracks'],
      });
    },

    albums: async (_, { limit, offset }) => {
      return await models.Album.findAll({
        limit,
        offset,
        order: [['title', 'ASC']],
        include: ['artist'],
      });
    },

    searchAlbums: async (_, { query, limit }) => {
      return await models.Album.searchByTitle(query, limit);
    },

    albumsByArtist: async (_, { artistId, limit }) => {
      return await models.Album.findByArtist(artistId, limit);
    },

    albumsByYear: async (_, { year }) => {
      return await models.Album.findByYear(year);
    },

    albumByMusicbrainzId: async (_, { musicbrainzId }) => {
      return await models.Album.findByMusicbrainzId(musicbrainzId);
    },

    // Track queries
    track: async (_, { id }) => {
      return await models.MusicTrack.findByPk(id, {
        include: ['artist', 'album'],
      });
    },

    tracks: async (_, { limit, offset }) => {
      return await models.MusicTrack.findAll({
        limit,
        offset,
        order: [['title', 'ASC']],
        include: ['artist', 'album'],
      });
    },

    searchTracks: async (_, { query, limit }) => {
      return await models.MusicTrack.searchByTitle(query, limit);
    },

    tracksByArtist: async (_, { artistId, limit }) => {
      return await models.MusicTrack.findByArtist(artistId, limit);
    },

    tracksByAlbum: async (_, { albumId }) => {
      return await models.MusicTrack.findByAlbum(albumId);
    },

    tracksByGenre: async (_, { genre, limit }) => {
      return await models.MusicTrack.findByGenre(genre, limit);
    },

    trackByMusicbrainzId: async (_, { musicbrainzId }) => {
      return await models.MusicTrack.findByMusicbrainzId(musicbrainzId);
    },

    trackByISRC: async (_, { isrc }) => {
      return await models.MusicTrack.findByISRC(isrc);
    },

    // Statistics
    totalArtists: async () => {
      return await models.Artist.count();
    },

    totalAlbums: async () => {
      return await models.Album.count();
    },

    totalTracks: async () => {
      return await models.MusicTrack.count();
    },
  },

  Mutation: {
    // Artist mutations
    createArtist: async (_, { input }) => {
      return await models.Artist.create(input);
    },

    updateArtist: async (_, { id, input }) => {
      const artist = await models.Artist.findByPk(id);
      if (!artist) throw new Error('Artist not found');
      return await artist.update(input);
    },

    deleteArtist: async (_, { id }) => {
      const artist = await models.Artist.findByPk(id);
      if (!artist) throw new Error('Artist not found');
      await artist.destroy();
      return true;
    },

    // Album mutations
    createAlbum: async (_, { input }) => {
      return await models.Album.create(input);
    },

    updateAlbum: async (_, { id, input }) => {
      const album = await models.Album.findByPk(id);
      if (!album) throw new Error('Album not found');
      return await album.update(input);
    },

    deleteAlbum: async (_, { id }) => {
      const album = await models.Album.findByPk(id);
      if (!album) throw new Error('Album not found');
      await album.destroy();
      return true;
    },

    // Track mutations
    createTrack: async (_, { input }) => {
      return await models.MusicTrack.create(input);
    },

    updateTrack: async (_, { id, input }) => {
      const track = await models.MusicTrack.findByPk(id);
      if (!track) throw new Error('Track not found');
      return await track.update(input);
    },

    deleteTrack: async (_, { id }) => {
      const track = await models.MusicTrack.findByPk(id);
      if (!track) throw new Error('Track not found');
      await track.destroy();
      return true;
    },

    incrementPlayCount: async (_, { id }) => {
      const track = await models.MusicTrack.findByPk(id);
      if (!track) throw new Error('Track not found');
      return await track.incrementPlayCount();
    },
  },

  // Nested resolvers
  Artist: {
    albums: async (artist) => {
      return await artist.getAlbums();
    },
    tracks: async (artist) => {
      return await artist.getTracks();
    },
  },

  Album: {
    artist: async (album) => {
      return await album.getArtist();
    },
    tracks: async (album) => {
      return await album.getTracks();
    },
  },

  MusicTrack: {
    artist: async (track) => {
      return await track.getArtist();
    },
    album: async (track) => {
      return await track.getAlbum();
    },
  },
};

module.exports = { typeDefs, resolvers }; 