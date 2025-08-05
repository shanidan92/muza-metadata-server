#!/bin/bash

# Admin UI entry point script
# This script runs the Muza admin UI (uploader) service

# Default values for admin UI
ADMIN_UI_PORT=${ADMIN_UI_PORT:-5002}
DEBUG=${DEBUG:-false}
MUZA_SERVER_URL=${MUZA_SERVER_URL:-"http://localhost:8000/graphql"}
AUDIO_UPLOAD_DIR=${AUDIO_UPLOAD_DIR:-"/data/audio"}
IMAGE_UPLOAD_DIR=${IMAGE_UPLOAD_DIR:-"/data/images"}

echo "🔐 Starting Muza Admin UI (VPN-only access)"
echo "Port: $ADMIN_UI_PORT"
echo "Debug: $DEBUG"
echo "Muza Server: $MUZA_SERVER_URL"
echo "Audio Upload Dir: $AUDIO_UPLOAD_DIR"
echo "Image Upload Dir: $IMAGE_UPLOAD_DIR"

# Ensure upload directories exist
mkdir -p "$AUDIO_UPLOAD_DIR" "$IMAGE_UPLOAD_DIR"

# Set environment variables for the admin UI
export PORT="$ADMIN_UI_PORT"
export DEBUG="$DEBUG"
export MUZA_SERVER_URL="$MUZA_SERVER_URL"
export AUDIO_UPLOAD_DIR="$AUDIO_UPLOAD_DIR"
export IMAGE_UPLOAD_DIR="$IMAGE_UPLOAD_DIR"

# Check connectivity to main API server
echo "🔗 Checking connectivity to main API server..."
python -c "
import requests
import sys
try:
    response = requests.get('$MUZA_SERVER_URL'.replace('/graphql', '/'), timeout=10)
    if response.status_code == 200:
        print('✅ Main API server is reachable')
    else:
        print(f'⚠️  Main API server returned status: {response.status_code}')
except Exception as e:
    print(f'❌ Cannot reach main API server: {e}')
    print('ℹ️  Admin UI will start anyway, but uploads may fail')
"

echo "🚀 Starting admin UI server on port $ADMIN_UI_PORT..."

# Start the admin UI using the utils/uploader.py main function
python -m utils.uploader