# RDS Database Population Script

This document explains how to use the RDS population script to populate the Muza Metadata Server database with demo data.

## Overview

The population script (`populate_rds.py` and `populate_rds.sh`) reads demo data from `allData.json` and inserts it into the RDS database using the `MusicTrack` model schema. The script automatically maps the JSON structure to the database schema and generates unique UUIDs for each track.

## Prerequisites

1. **RDS Database**: A PostgreSQL RDS instance must be running and accessible
2. **Database URL**: Connection string for the RDS database
3. **Demo Data**: The `allData.json` file from the muza-lit-library project
4. **Python Environment**: Python 3 with required dependencies

## Quick Start

### 1. Set Environment Variables

```bash
# Set your RDS database connection string
export DATABASE_URL="postgresql://postgres:}!*DX56zXflWJRvu@muza-staging-db.c1kui2ygoruk.eu-west-1.rds.amazonaws.com:5432/muza"
```

### 2. Run the Population Script

```bash
# Navigate to the muza-metadata-server directory
cd muza-metadata-server

# Run the shell script (recommended)
./populate_rds.sh

# Or run the Python script directly
python populate_rds.py --database-url "$DATABASE_URL"
```

## Data Mapping

The script maps the demo data structure to the `MusicTrack` model as follows:

| JSON Field           | Database Field  | Notes                     |
| -------------------- | --------------- | ------------------------- |
| `songs[].title`      | `song_title`    | Required field            |
| `songs[].artist`     | `artist_main`   | Artist name               |
| `songs[].album`      | `album_title`   | Album title               |
| `songs[].year`       | `year_released` | Release year              |
| `songs[].index`      | `song_order`    | Track order               |
| `songs[].audioUrl`   | `song_file`     | Audio file URL            |
| `albums[].imageSrc`  | `album_cover`   | Album cover image         |
| `artists[].imageUrl` | `artist_photo`  | Artist photo              |
| `albums[].subTitle`  | `year_released` | Alternative year source   |
| `albums[].artist`    | `artist_main`   | Alternative artist source |

### Generated Fields

- `uuid`: Auto-generated UUID for each track
- `created_at`: Current timestamp in ISO format
- `id`: Auto-incrementing primary key (managed by database)

### Null Fields

The following fields are set to `None` as they're not provided in the demo data:

- `original_uuid`
- `label`
- `label_logo`
- `band_name`
- `instrument`
- `other_artist_playing`
- `other_instrument`
- `year_recorded`
- `composer`
- `musicbrainz_track_id`

## Script Options

### Shell Script Options

```bash
./populate_rds.sh [OPTIONS]

Options:
  --demo-data-path PATH  Path to the demo data JSON file
  --debug                Enable debug logging
  --help                 Show help message
```

### Python Script Options

```bash
python populate_rds.py [OPTIONS]

Options:
  --database-url URL     Database connection string
  --demo-data-path PATH  Path to demo data JSON file
  --debug                Enable debug logging
```

## Environment Variables

| Variable       | Description                  | Example                               |
| -------------- | ---------------------------- | ------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

## Example Usage

### Basic Usage

```bash
# Set database URL
export DATABASE_URL="postgresql://muza_user:password123@muza-rds.cluster-xxxxx.eu-west-1.rds.amazonaws.com:5432/muza_db"

# Run population script
./populate_rds.sh
```

### With Custom Demo Data Path

```bash
# Use a different demo data file
./populate_rds.sh --demo-data-path /path/to/custom/allData.json
```

### With Debug Logging

```bash
# Enable debug logging for troubleshooting
./populate_rds.sh --debug
```

### Direct Python Usage

```bash
# Run Python script directly
python populate_rds.py \
  --database-url "postgresql://user:pass@host:5432/db" \
  --demo-data-path "../muza-lit-library/public/staticData/allData.json" \
  --debug
```

## Expected Output

The script will output progress information and results:

```
[INFO] Muza Metadata Server - RDS Population Script

[SUCCESS] Environment variables validated
[SUCCESS] Demo data file found: ../muza-lit-library/public/staticData/allData.json
[INFO] Activating virtual environment...
[SUCCESS] Virtual environment activated
[INFO] Starting database population...
[INFO] Database URL: postgresql://user:****@host:5432/db
[INFO] Demo data path: ../muza-lit-library/public/staticData/allData.json
[INFO] Loading demo data from: ../muza-lit-library/public/staticData/allData.json
[INFO] Creating album and artist mappings...
[INFO] Found 3 albums and 3 artists
[INFO] Converting songs to tracks...
[INFO] Converted 9 songs to tracks
[INFO] Initializing database connection...
[INFO] Database connection established successfully
[INFO] Starting to populate database with 9 tracks...
[INFO] Inserted 10/9 tracks...
[INFO] Database population completed!
[INFO] Successful inserts: 9
[INFO] Failed inserts: 0
[SUCCESS] Database population completed successfully!
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Verify the `DATABASE_URL` is correct
   - Check that the RDS instance is running and accessible
   - Ensure security groups allow connections from your IP

2. **Demo Data File Not Found**

   - Verify the path to `allData.json` is correct
   - Use `--demo-data-path` to specify a custom path

3. **Permission Denied**

   - Make sure the shell script is executable: `chmod +x populate_rds.sh`

4. **Virtual Environment Issues**
   - The script will automatically create a virtual environment if needed
   - Ensure Python 3 is installed on your system

### Debug Mode

Enable debug logging to get more detailed information:

```bash
./populate_rds.sh --debug
```

This will show:

- Detailed database connection information
- Step-by-step data processing
- Individual track insertion results
- Any errors or warnings

### Log Files

The script creates a log file `populate_rds.log` in the current directory with detailed execution information.

## Data Verification

After running the script, you can verify the data was inserted correctly:

```bash
# Connect to your database and check the records
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM music_tracks;"
psql "$DATABASE_URL" -c "SELECT song_title, artist_main, album_title FROM music_tracks LIMIT 5;"
```

## Cleanup

To remove the populated data (if needed):

```bash
psql "$DATABASE_URL" -c "DELETE FROM music_tracks;"
```

**Note**: This will remove ALL tracks from the database. Use with caution.
