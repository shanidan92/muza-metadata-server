#!/bin/bash

# Default values
PORT=${PORT:-8000}
ADMIN_UI_PORT=${ADMIN_UI_PORT:-5002}
WORKERS=${WORKERS:-4}
HOOK_COMMAND=${HOOK_COMMAND:-""}
RUN_MODE=${RUN_MODE:-"api"}

echo "🚀 Starting Muza Metadata Server"
echo "Mode: $RUN_MODE"
echo "Main API Port: $PORT"
echo "Admin UI Port: $ADMIN_UI_PORT"

# Base Gunicorn options
GUNICORN_OPTS="--workers $WORKERS --bind 0.0.0.0:$PORT --timeout 120 --worker-class sync"

# Show hook status
if [[ -n "$HOOK_COMMAND" ]]; then
    echo "🔗 Hook command enabled: $HOOK_COMMAND"
else
    echo "ℹ️  No hook command configured"
fi

# Check database connectivity
echo "🔗 Checking database connectivity..."
python -c "
from muza_metadata_server.config import Config
from muza_metadata_server.database import Database
try:
    config = Config.from_env()
    db = Database(config.database_url)
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    print(f'Database URL: {config.database_url}')

    exit(1)
"

echo "🚀 Starting main API server on port $PORT..."
# Start the main GraphQL API server
exec gunicorn $GUNICORN_OPTS wsgi:app
