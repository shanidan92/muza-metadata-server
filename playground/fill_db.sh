#!/usr/bin/env bash

# GraphQL endpoint
GRAPHQL_ENDPOINT="http://localhost:5000/graphql"

read -r -d '' TRACKS_JSON << 'EOF'
[
  {
    "albumCover": "",
    "albumTitle": "LOST BROTHER",
    "label": "HOPSCOTCH RECORDS",
    "labelLogo": "",
    "bandName": "",
    "artistPhoto": "",
    "artistMain": "Assif Tsahar",
    "instrument": "Tenor Sax, Bass Clarinet",
    "otherArtistPlaying": "Cooper-Moore, Hamid Drake",
    "otherInstrument": "Ashimba, Twanger, Diddley-Bo, Drum Set, Tabla, Frame Drum",
    "yearRecorded": 2005,
    "yearReleased": 2005,
    "songOrder": 1,
    "songTitle": "Breaking The Water",
    "composer": "Assif Tsahar, Cooper-Moore, Hamid Drake",
    "songFile": ""
  },
  {
    "albumCover": "",
    "albumTitle": "LOST BROTHER",
    "label": "HOPSCOTCH RECORDS",
    "labelLogo": "",
    "bandName": "",
    "artistPhoto": "",
    "artistMain": "Assif Tsahar",
    "instrument": "Tenor Sax, Bass Clarinet",
    "otherArtistPlaying": "Cooper-Moore, Hamid Drake",
    "otherInstrument": "Ashimba, Twanger, Diddley-Bo, Drum Set, Tabla, Frame Drum",
    "yearRecorded": 2005,
    "yearReleased": 2005,
    "songOrder": 2,
    "songTitle": "A Falling Leaf",
    "composer": "Assif Tsahar, Cooper-Moore, Hamid Drake",
    "songFile": ""
  },
  {
    "albumCover": "",
    "albumTitle": "LOST BROTHER",
    "label": "HOPSCOTCH RECORDS",
    "labelLogo": "",
    "bandName": "",
    "artistPhoto": "",
    "artistMain": "Assif Tsahar",
    "instrument": "Tenor Sax, Bass Clarinet",
    "otherArtistPlaying": "Cooper-Moore, Hamid Drake",
    "otherInstrument": "Ashimba, Twanger, Diddley-Bo, Drum Set, Tabla, Frame Drum",
    "yearRecorded": 2005,
    "yearReleased": 2005,
    "songOrder": 3,
    "songTitle": "Departure",
    "composer": "Assif Tsahar, Cooper-Moore, Hamid Drake",
    "songFile": ""
  },
  {
    "albumCover": "",
    "albumTitle": "LOST BROTHER",
    "label": "HOPSCOTCH RECORDS",
    "labelLogo": "",
    "bandName": "",
    "artistPhoto": "",
    "artistMain": "Assif Tsahar",
    "instrument": "Tenor Sax, Bass Clarinet",
    "otherArtistPlaying": "Cooper-Moore, Hamid Drake",
    "otherInstrument": "Ashimba, Twanger, Diddley-Bo, Drum Set, Tabla, Frame Drum",
    "yearRecorded": 2005,
    "yearReleased": 2005,
    "songOrder": 4,
    "songTitle": "DuGong The Sea Cow",
    "composer": "Assif Tsahar, Cooper-Moore, Hamid Drake",
    "songFile": ""
  },
  {
    "albumCover": "",
    "albumTitle": "LOST BROTHER",
    "label": "HOPSCOTCH RECORDS",
    "labelLogo": "",
    "bandName": "",
    "artistPhoto": "",
    "artistMain": "Assif Tsahar",
    "instrument": "Tenor Sax, Bass Clarinet",
    "otherArtistPlaying": "Cooper-Moore, Hamid Drake",
    "otherInstrument": "Ashimba, Twanger, Diddley-Bo, Drum Set, Tabla, Frame Drum",
    "yearRecorded": 2005,
    "yearReleased": 2005,
    "songOrder": 5,
    "songTitle": "Seeking the Punto Fijo",
    "composer": "Assif Tsahar, Cooper-Moore, Hamid Drake",
    "songFile": ""
  },
  {
    "albumCover": "",
    "albumTitle": "LOST BROTHER",
    "label": "HOPSCOTCH RECORDS",
    "labelLogo": "",
    "bandName": "",
    "artistPhoto": "",
    "artistMain": "Assif Tsahar",
    "instrument": "Tenor Sax, Bass Clarinet",
    "otherArtistPlaying": "Cooper-Moore, Hamid Drake",
    "otherInstrument": "Ashimba, Twanger, Diddley-Bo, Drum Set, Tabla, Frame Drum",
    "yearRecorded": 2005,
    "yearReleased": 2005,
    "songOrder": 6,
    "songTitle": "Confessions",
    "composer": "Assif Tsahar, Cooper-Moore, Hamid Drake",
    "songFile": ""
  },
  {
    "albumCover": "",
    "albumTitle": "LOST BROTHER",
    "label": "HOPSCOTCH RECORDS",
    "labelLogo": "",
    "bandName": "",
    "artistPhoto": "",
    "artistMain": "Assif Tsahar",
    "instrument": "Tenor Sax, Bass Clarinet",
    "otherArtistPlaying": "Cooper-Moore, Hamid Drake",
    "otherInstrument": "Ashimba, Twanger, Diddley-Bo, Drum Set, Tabla, Frame Drum",
    "yearRecorded": 2005,
    "yearReleased": 2005,
    "songOrder": 7,
    "songTitle": "The Coming of the Ship",
    "composer": "Assif Tsahar, Cooper-Moore, Hamid Drake",
    "songFile": ""
  },
  {
    "albumCover": "",
    "albumTitle": "LOST BROTHER",
    "label": "HOPSCOTCH RECORDS",
    "labelLogo": "",
    "bandName": "",
    "artistPhoto": "",
    "artistMain": "Assif Tsahar",
    "instrument": "Tenor Sax, Bass Clarinet",
    "otherArtistPlaying": "Cooper-Moore, Hamid Drake",
    "otherInstrument": "Ashimba, Twanger, Diddley-Bo, Drum Set, Tabla, Frame Drum",
    "yearRecorded": 2005,
    "yearReleased": 2005,
    "songOrder": 8,
    "songTitle": "The Shepherd",
    "composer": "Assif Tsahar, Cooper-Moore, Hamid Drake",
    "songFile": ""
  },
  {
    "albumCover": "",
    "albumTitle": "LOST BROTHER",
    "label": "HOPSCOTCH RECORDS",
    "labelLogo": "",
    "bandName": "",
    "artistPhoto": "",
    "artistMain": "Assif Tsahar",
    "instrument": "Tenor Sax, Bass Clarinet",
    "otherArtistPlaying": "Cooper-Moore, Hamid Drake",
    "otherInstrument": "Ashimba, Twanger, Diddley-Bo, Drum Set, Tabla, Frame Drum",
    "yearRecorded": 2005,
    "yearReleased": 2005,
    "songOrder": 9,
    "songTitle": "Goin' Home",
    "composer": "Assif Tsahar, Cooper-Moore, Hamid Drake",
    "songFile": ""
  }
]
EOF

# Loop through each JSON object
echo "$TRACKS_JSON" | jq -c '.[]' | while read -r track; do

  # Extract fields from JSON using jq
  albumCover=$(echo "$track"            | jq -r '.albumCover')
  albumTitle=$(echo "$track"            | jq -r '.albumTitle')
  label=$(echo "$track"                 | jq -r '.label')
  labelLogo=$(echo "$track"             | jq -r '.labelLogo')
  bandName=$(echo "$track"              | jq -r '.bandName')
  artistPhoto=$(echo "$track"           | jq -r '.artistPhoto')
  artistMain=$(echo "$track"            | jq -r '.artistMain')
  instrument=$(echo "$track"            | jq -r '.instrument')
  otherArtistPlaying=$(echo "$track"    | jq -r '.otherArtistPlaying')
  otherInstrument=$(echo "$track"       | jq -r '.otherInstrument')
  yearRecorded=$(echo "$track"          | jq -r '.yearRecorded')
  yearReleased=$(echo "$track"          | jq -r '.yearReleased')
  songOrder=$(echo "$track"             | jq -r '.songOrder')
  songTitle=$(echo "$track"             | jq -r '.songTitle')
  composer=$(echo "$track"              | jq -r '.composer')
  songFile=$(echo "$track"              | jq -r '.songFile')

  # Construct GraphQL mutation and remove newlines
  read -r -d '' GRAPHQL_MUTATION <<EOF
mutation {
  createMusicTrack(
    albumCover: \"$albumCover\",
    albumTitle: \"$albumTitle\",
    label: \"$label\",
    labelLogo: \"$labelLogo\",
    bandName: \"$bandName\",
    artistPhoto: \"$artistPhoto\",
    artistMain: \"$artistMain\",
    instrument: \"$instrument\",
    otherArtistPlaying: \"$otherArtistPlaying\",
    otherInstrument: \"$otherInstrument\",
    yearRecorded: $yearRecorded,
    yearReleased: $yearReleased,
    songOrder: $songOrder,
    songTitle: \"$songTitle\",
    composer: \"$composer\",
    songFile: \"$songFile\"
  ) {
    ok
    track {
      id
      uuid
      songTitle
      createdAt
    }
  }
}
EOF

  # Remove newlines from the mutation
  GRAPHQL_MUTATION=$(echo "$GRAPHQL_MUTATION" | tr -d '\n')

  # Make the curl POST request
  echo "Creating track: $songTitle"
  curl -s -X POST "$GRAPHQL_ENDPOINT" \
    -H 'Content-Type: application/json' \
    -d "{\"query\": \"$GRAPHQL_MUTATION\"}"

  echo # newline for readability between calls
done

echo "Done!"
