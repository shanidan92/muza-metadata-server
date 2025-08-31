# Use Node.js official runtime as base image
FROM node:18-alpine

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a working directory
WORKDIR /app

# Copy the package files first for better caching
COPY setup.py .
COPY requirements.txt .
COPY README.md .

# Install the package and dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY muza_metadata_server/ muza_metadata_server/
COPY utils/ utils/

# Install Node.js dependencies
RUN npm ci --only=production

# Create data directory for uploads
RUN mkdir -p /data/audio /data/images

# Expose main API port (8000) and admin UI port (5002)
EXPOSE 8000 5002

# Set environment variables
# PYTHONUNBUFFERED=1 ensures Python output is sent straight to terminal without buffering
# good for log handling in containerized environments
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    ADMIN_UI_PORT=5002 \
    WORKERS=4 \
    DEBUG=false \
    HOOK_COMMAND="" \
    AUDIO_UPLOAD_DIR=/data/audio \
    IMAGE_UPLOAD_DIR=/data/images

# Health check for the main API
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Default command using Gunicorn with config
ENTRYPOINT ["./run.sh"]
