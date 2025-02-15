# Use an official Python base image
FROM python:3.12-slim

# Create a working directory
WORKDIR /app

# Copy the package files first
COPY setup.py .
COPY requirements.txt .
COPY README.md .

# Copy the application code
COPY muza_metadata_server/ muza_metadata_server/
COPY schema.sql .

# Copy and make the run script executable
COPY run.sh .
COPY wsgi.py .
RUN chmod +x run.sh

# Install the package and dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose both HTTP and HTTPS ports
EXPOSE 5000 5443

# Set environment variables
# PYTHONUNBUFFERED=1 ensures Python output is sent straight to terminal without buffering
# good for log handling in containerized environments
ENV PYTHONUNBUFFERED=1 \
    DB_PATH=/data/music.db \
    PORT=5000 \
    WORKERS=4 \
    SSL_ENABLE=false \
    SSL_CERT=/app/certs/server.crt \
    SSL_KEY=/app/certs/server.key \
    DEBUG=false

# Default command using Gunicorn with config
ENTRYPOINT ["./run.sh"]
