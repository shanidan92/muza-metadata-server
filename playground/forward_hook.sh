#!/bin/bash

# This hook receives a JSON string as its first argument and forwards it to another Muza server
# Usage: forward_hook.sh '{"songTitle": "Hey Jude", ...}'

TARGET_URL=${TARGET_URL:-"http://localhost:5001/graphql"}

# Get the JSON data from the first argument
DATA="$1"

# Extract required fields from the input JSON using jq
MUTATION_DATA=$(echo "$DATA" | jq -r '{
    songTitle: .song_title,
    artistMain: .artist_main,
    bandName: .band_name,
    albumTitle: .album_title,
    yearReleased: .year_released,
    uuid: .uuid
}')

# Construct the GraphQL mutation with proper formatting
QUERY=$(cat <<EOF | tr '\n' ' '
mutation {
  createMusicTrack(
    songTitle: \"$(echo "$MUTATION_DATA" | jq -r .songTitle)\",
    artistMain: \"$(echo "$MUTATION_DATA" | jq -r .artistMain)\",
    bandName: \"$(echo "$MUTATION_DATA" | jq -r .bandName)\",
    albumTitle: \"$(echo "$MUTATION_DATA" | jq -r .albumTitle)\",
    yearReleased: $(echo "$MUTATION_DATA" | jq -r .yearReleased),
    uuid: \"$(echo "$MUTATION_DATA" | jq -r .uuid)\"
  ) {
    ok
  }
}
EOF
)

# Send the mutation to the target server
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$QUERY\"}" \
  "$TARGET_URL"
