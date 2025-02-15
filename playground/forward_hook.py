#!/usr/bin/env python3

import json
import sys
import os
from urllib.request import Request, urlopen
from urllib.error import URLError

def forward_metadata(json_data):
    # Get target URL from environment variable or use default
    target_url = os.environ.get('TARGET_URL', 'http://localhost:5001/graphql')
    
    # Parse the JSON data
    try:
        data = json.loads(json_data)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}", file=sys.stderr)
        sys.exit(1)

    # Construct the GraphQL mutation
    mutation = """
    mutation {
        createMusicTrack(
            songTitle: "%s",
            artistMain: "%s",
            bandName: "%s",
            albumTitle: "%s",
            yearReleased: %s,
            uuid: "%s"
        ) {
            ok
        }
    }
    """ % (
        data.get('song_title', ''),
        data.get('artist_main', ''),
        data.get('band_name', ''),
        data.get('album_title', ''),
        data.get('year_released', 0),
        data.get('uuid', '')
    )

    # Prepare the request
    headers = {'Content-Type': 'application/json'}
    payload = json.dumps({'query': mutation}).encode('utf-8')
    
    try:
        # Create and configure the request
        req = Request(
            target_url,
            data=payload,
            headers=headers,
            method='POST'
        )
        
        # Send the request and get response
        with urlopen(req) as response:
            response_data = response.read().decode('utf-8')
            print(json.loads(response_data))
            
    except URLError as e:
        print(f"Error sending request: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: forward_hook.py '{\"songTitle\": \"Hey Jude\", ...}'", file=sys.stderr)
        sys.exit(1)

    forward_metadata(sys.argv[1])
