import logging
import os
from flask import Flask, request, jsonify, send_from_directory, render_template, redirect, url_for
from werkzeug.exceptions import RequestEntityTooLarge
from .config import Config
from .file_handler import FileHandler
from .metadata_extractor import MetadataExtractor
from .musicbrainz_client import MusicBrainzClient
from .muza_client import MuzaClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app(config: Config = None) -> Flask:
    """Create and configure Flask application"""
    app = Flask(__name__, template_folder='templates', static_folder='static')
    
    # Load configuration
    if config is None:
        config = Config.from_env()
    
    # Configure Flask
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
    
    # Initialize components
    file_handler = FileHandler(config.upload_dir)
    metadata_extractor = MetadataExtractor()
    mb_client = MusicBrainzClient(
        config.musicbrainz_app_name,
        config.musicbrainz_app_version,
        config.musicbrainz_contact
    )
    muza_client = MuzaClient(config.muza_server_url)
    
    @app.route('/', methods=['GET'])
    def index():
        """Redirect to the upload interface"""
        # Get the current path and ensure it ends with /
        current_path = request.path
        if not current_path.endswith('/'):
            current_path += '/'
        return redirect(current_path + 'index.html')
    
    @app.route('/index.html', methods=['GET'])
    def upload_interface():
        """Serve the upload interface"""
        return render_template('index.html')

    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({"status": "healthy", "service": "Muza Utils API"})
    
    @app.route('/upload', methods=['POST'])
    def upload_file():
        """Upload and process FLAC file"""
        try:
            # Check if file is present
            if 'file' not in request.files:
                return jsonify({"error": "No file provided"}), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "No file selected"}), 400
            
            # Save uploaded file
            try:
                file_path, relative_path = file_handler.save_uploaded_file(file, file.filename)
            except ValueError as e:
                return jsonify({"error": str(e)}), 400
            
            # Extract metadata from FLAC
            flac_metadata = metadata_extractor.extract_from_flac(file_path)
            if not flac_metadata:
                return jsonify({"error": "Could not extract metadata from FLAC file"}), 400
            
            # Enhance with MusicBrainz data
            enhanced_metadata = enhance_with_musicbrainz(
                flac_metadata, mb_client, file_handler, config
            )
            
            # Set file path in metadata
            enhanced_metadata['song_file'] = file_handler.get_file_url(
                relative_path, request.url_root
            )
            
            # Insert into Muza database
            result = muza_client.create_track(enhanced_metadata)
            if not result:
                return jsonify({"error": "Failed to insert track into database"}), 500
            
            return jsonify({
                "success": True,
                "message": "File processed successfully",
                "track": result.get("track"),
                "metadata": enhanced_metadata
            })
            
        except RequestEntityTooLarge:
            return jsonify({"error": "File too large"}), 413
        except Exception as e:
            logger.error(f"Error processing upload: {e}")
            return jsonify({"error": "Internal server error"}), 500
    
    @app.route('/files/<path:filename>', methods=['GET'])
    def serve_file(filename):
        """Serve uploaded files"""
        try:
            file_path = os.path.join(config.upload_dir, filename)            
            return send_from_directory(os.getcwd(), file_path)
        except FileNotFoundError:
            logger.error(f"File not found: {filename} in directory: {config.upload_dir}")
            return jsonify({"error": "File not found"}), 404
    
    @app.errorhandler(413)
    def too_large(e):
        return jsonify({"error": "File too large"}), 413
    
    return app


def enhance_with_musicbrainz(
    flac_metadata: dict, 
    mb_client: MusicBrainzClient, 
    file_handler: FileHandler,
    config: Config
) -> dict:
    """Enhance FLAC metadata with MusicBrainz data"""
    enhanced = flac_metadata.copy()
    
    logger.info(f"Enhancing metadata with MusicBrainz for: {flac_metadata.get('song_title', 'unknown')} by {flac_metadata.get('artist_main', 'unknown')}")

    try:
        # Try to lookup by MusicBrainz ID first
        mb_data = None
        if "musicbrainz_track_id" in flac_metadata:
            mb_data = mb_client.lookup_track_by_id(flac_metadata["musicbrainz_track_id"])
        
        # If no ID or lookup failed, try search
        if not mb_data and "song_title" in flac_metadata and "artist_main" in flac_metadata:
            mb_data = mb_client.search_track(
                flac_metadata["song_title"],
                flac_metadata["artist_main"],
                flac_metadata.get("album_title")
            )
        
        logger.info(f"MusicBrainz data found: {mb_data is not None}")
        if mb_data:
            logger.info(f"MusicBrainz data: {mb_data}")
        
        # Merge MusicBrainz data (prefer FLAC data when available)
        if mb_data:
            for key, value in mb_data.items():
                if key not in enhanced or not enhanced[key]:
                    enhanced[key] = value
        
        # Download album cover if we have album ID
        album_id = enhanced.get("musicbrainz_album_id")
        if album_id and not enhanced.get("album_cover"):
            cover_url = mb_client.get_album_cover_url(album_id)
            logger.info(f"Cover URL found: {cover_url}")
            
            if cover_url:
                cover_path = file_handler.download_album_cover(
                    cover_url, 
                    enhanced.get("album_title", "unknown")
                )
                logger.info(f"Downloaded cover path: {cover_path}")
                if cover_path:
                    # Use request.url_root to get the correct base URL
                    enhanced["album_cover"] = file_handler.get_file_url(
                        cover_path, request.url_root if 'request' in globals() else f"http://localhost:{config.port}/"
                    )
                    logger.info(f"Album cover URL: {enhanced['album_cover']}")
    
    except Exception as e:
        logger.error(f"Error enhancing metadata with MusicBrainz: {e}")
    
    return enhanced


def main():
    """Main entry point"""
    config = Config.from_env()
    app = create_app(config)
    
    logger.info(f"Starting Muza Utils API on port {config.port}")
    logger.info(f"Upload directory: {config.upload_dir}")
    logger.info(f"Muza server URL: {config.muza_server_url}")
    
    app.run(host='0.0.0.0', port=config.port, debug=config.debug)


if __name__ == '__main__':
    main()
