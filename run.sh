#!/bin/bash

# Default values
PORT=${PORT:-5000}
WORKERS=${WORKERS:-4}
SSL_ENABLE=${SSL_ENABLE:-"false"}
SSL_CERT=${SSL_CERT:-"certs/server.crt"}
SSL_KEY=${SSL_KEY:-"certs/server.key"}
HOOK_COMMAND=${HOOK_COMMAND:-""}

# Base Gunicorn options
GUNICORN_OPTS="--workers $WORKERS --bind 0.0.0.0:$PORT"

# Add SSL if enabled and certificates are provided
if [[ "$SSL_ENABLE" == "true" ]]; then
    echo "Starting with SSL support"
    GUNICORN_OPTS="$GUNICORN_OPTS --certfile=$SSL_CERT --keyfile=$SSL_KEY"
else
    echo "Starting without SSL support"
fi

# Show hook status
if [[ -n "$HOOK_COMMAND" ]]; then
    echo "Hook command enabled: $HOOK_COMMAND"
else
    echo "No hook command configured"
fi

# Change the Gunicorn target from create_app to wsgi:app
exec gunicorn $GUNICORN_OPTS wsgi:app
