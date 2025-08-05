# Muza Metadata Server

A GraphQL server for managing music track metadata.

## Features

- GraphQL API for querying and managing music track metadata
- CQRS pattern (append-only) API to simplify conflict resolution and concurrency issues
- SQLite database for data storage
- SSL support for secure communication
- Post-insert hooks for event-driven integrations and data synchronization

## Installation

1. Create a virtual environment:

```bash
# Init venv
make venv
# Activate venv
source venv/bin/activate
```

2. Install dependencies:

```bash
make install
```

## Usage

### Development Server

```bash
make run-dev
```

### Production Server

```bash
# Without SSL
make run

# With SSL
make certs  # Generate self-signed certificates first
make run-ssl
```

## Configuration

The server can be configured using environment variables or command-line arguments:

- `PORT`: Server port (default: 5000)
- `DATABASE_URL`: Database connection URL (see Database Configuration below)
- `DB_PATH`: SQLite database path (default: music.db) - deprecated, use DATABASE_URL
- `DEBUG`: Enable debug mode (default: false)
- `HOOK_COMMAND`: Command to execute after successful track insertion (optional)

### Database Configuration

#### SQLite (Development)

```bash
export DATABASE_URL="sqlite:///music.db"
```

#### PostgreSQL RDS (Production)

```bash
export DATABASE_URL="postgresql://username:password@rds-endpoint:5432/database_name"
```

## Hooks

The server supports post-insert hooks that are executed after a track is successfully added to the database. This can be useful for:

- Forwarding data to other servers
- Triggering external processes
- Implementing event-driven architectures
- Synchronizing multiple Muza instances

For examples and more information about hooks, check out the [playground directory](playground/README_hooks.md).

## GraphQL API

Access the GraphQL playground at `http://localhost:5000/graphql`

### Basic Examples

1. Create a basic track:

```graphql
mutation {
  createMusicTrack(
    songTitle: "Hey Jude"
    artistMain: "Paul McCartney"
    bandName: "The Beatles"
    albumTitle: "The Beatles (White Album)"
    yearReleased: 1968
  ) {
    ok
    track {
      id
      uuid
      songTitle
    }
  }
}
```

2. Search tracks:

```graphql
{
  searchTracks(
    bandNameContains: "Beatles"
    minYearReleased: 1965
    maxYearReleased: 1970
  ) {
    songTitle
    artistMain
    bandName
    yearReleased
  }
}
```

For more complex examples and test data, check out the [playground directory](playground/).

## Containerization

### Building the Container

Using Podman:

```bash
make container
```

### Running the Container

Standard HTTP mode:

```bash
mkdir data # create a directory for percistant data

make container-run
```

With SSL enabled:

```bash
make certs  # Generate self-signed certificates first
mkdir data # create a directory for percistant data

make container-run-ssl
```

### Container Configuration

The container accepts the following environment variables:

- `PORT`: Server port (default: 5000)
- `DB_PATH`: Database path (default: /data/music.db)
- `WORKERS`: Number of Gunicorn workers (default: 4)
- `HOOK_COMMAND`: Command to execute after successful track insertion (optional)

### Persistent Storage

Mount a volume to `/data` to persist the database:

```bash
mkdir data # create a directory for percistant data

podman run -p 5000:5000 -v $(pwd)/data:/data:Z quay.io/yaacov/muza-metadata-server:latest
```
