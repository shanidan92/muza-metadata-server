# Muza Server Hook Example

This example demonstrates how to set up two Muza servers where one forwards its insertions to the other using hooks.

## Prerequisites

- Podman installed
- jq installed (for JSON processing in the hook script)
- curl installed

## Setup

1. Create data directories for both servers:
```bash
mkdir data1 data2
```

2. Make the hook script executable:
```bash
chmod +x forward_hook.py
```

3. Start two Muza servers on different ports:

Server 1 (Primary with hook):
```bash
podman run -d \
  --network host \
  --name muza1 \
  -v $(pwd)/data1:/data:Z \
  -v $(pwd)/forward_hook.py:/app/forward_hook.py:Z \
  -e HOOK_COMMAND=/app/forward_hook.py \
  quay.io/yaacov/muza-metadata-server:latest
```

Server 2 (Secondary):
```bash
podman run -d \
  --network host \
  --name muza2 \
  -e PORT=5001 \
  -v $(pwd)/data2:/data:Z \
  quay.io/yaacov/muza-metadata-server:latest
```

## Testing the Setup

1. Insert a track into the primary server (port 5000):
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createMusicTrack(songTitle: \"Hey Jude\", artistMain: \"Paul McCartney\", bandName: \"The Beatles\", albumTitle: \"The Beatles (White Album)\", yearReleased: 1968) { ok track { uuid songTitle } } }"
  }' \
  http://localhost:5000/graphql | jq
```

2. Verify the track exists in both servers:

Check primary server (port 5000):
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ allTracks { songTitle bandName } }"}' \
  http://localhost:5000/graphql | jq
```

Check secondary server (port 5001):
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ allTracks { songTitle bandName } }"}' \
  http://localhost:5001/graphql | jq
```

You should see the same track data in both servers!

## Viewing Logs

To view the container logs:

For the primary server:
```bash
podman logs muza1
```

For the secondary server:
```bash
podman logs muza2
```

To follow the logs in real-time (useful for debugging):
```bash
podman logs -f muza1  # For primary server
podman logs -f muza2  # For secondary server
```

## Cleanup

Stop and remove the containers:
```bash
podman stop muza1 muza2
podman rm muza1 muza2
rm -rf data1 data2
```
