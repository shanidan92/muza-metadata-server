import logging
import os
import base64
import hashlib
import hmac
import json
import secrets
from urllib.parse import urlencode
from flask import Flask, request, jsonify, send_from_directory, render_template, redirect, session, url_for
from werkzeug.exceptions import RequestEntityTooLarge
from .config import Config
from .file_handler import FileHandler
from .metadata_extractor import MetadataExtractor
from .musicbrainz_client import MusicBrainzClient
from .muza_client import MuzaClient
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Filter to suppress noisy /health access logs from werkzeug
class _IgnoreHealthFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            message = str(record.getMessage())
        except Exception:
            message = str(record.msg)
        return '/health' not in message

werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.addFilter(_IgnoreHealthFilter())


def create_app(config: Config = None) -> Flask:
    """Create and configure Flask application"""
    app = Flask(__name__, template_folder='templates', static_folder='static', static_url_path='/admin/static')
    
    # Load configuration
    if config is None:
        config = Config.from_env()
    
    # Configure Flask
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
    if config.secret_key:
        app.secret_key = config.secret_key
    
    # Initialize components
    file_handler = FileHandler(
        config.audio_upload_dir,
        config.image_upload_dir,
        s3_bucket_raw=config.s3_audio_raw_bucket or None,
        s3_bucket_images=config.s3_cover_art_bucket or None,
        cdn_domain=config.cdn_domain_name or None,
        aws_region=config.aws_region,
    )
    metadata_extractor = MetadataExtractor()
    mb_client = MusicBrainzClient(
        config.musicbrainz_app_name,
        config.musicbrainz_app_version,
        config.musicbrainz_contact
    )
    muza_client = MuzaClient(config.muza_server_url)
    
    def _require_login():
        if not session.get('user'):
            return redirect('/admin/signin')
        return None

    @app.route('/', methods=['GET'])
    @app.route('/admin', methods=['GET'])
    def index():
        """Serve the upload interface"""
        auth_redirect = _require_login()
        if auth_redirect:
            return auth_redirect
        return render_template('index.html')

    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({"status": "healthy", "service": "Muza Utils API"})

    @app.route('/admin/signin', methods=['GET'])
    def signin():
        return render_template('login.html')

    @app.route('/admin/presign/audio', methods=['POST'])
    def presign_audio():
        auth_redirect = _require_login()
        if auth_redirect:
            return auth_redirect
        body = request.get_json(silent=True) or {}
        filename = body.get('filename', 'upload.flac')
        content_type = body.get('content_type', 'audio/flac')
        file_ext = os.path.splitext(filename)[1] or '.flac'
        key = f"audio/raw/{secrets.token_urlsafe(16)}{file_ext}"
        try:
            import boto3
            s3 = boto3.client('s3', region_name=config.aws_region)
            url = s3.generate_presigned_url(
                'put_object',
                Params={'Bucket': config.s3_audio_raw_bucket, 'Key': key, 'ContentType': content_type},
                ExpiresIn=3600,
            )
            return jsonify({'upload_url': url, 'key': key, 'bucket': config.s3_audio_raw_bucket, 'content_type': content_type})
        except Exception as e:
            logger.error(f"Error generating presigned URL: {e}")
            return jsonify({"error": "Failed to generate upload URL"}), 500

    @app.route('/admin/presign/cover', methods=['POST'])
    def presign_cover():
        auth_redirect = _require_login()
        if auth_redirect:
            return auth_redirect
        body = request.get_json(silent=True) or {}
        filename = body.get('filename', 'cover.jpg')
        content_type = body.get('content_type', 'image/jpeg')
        file_ext = os.path.splitext(filename)[1] or '.jpg'
        key = f"cover-art/{secrets.token_urlsafe(16)}{file_ext}"
        try:
            import boto3
            s3 = boto3.client('s3', region_name=config.aws_region)
            url = s3.generate_presigned_url(
                'put_object',
                Params={'Bucket': config.s3_cover_art_bucket, 'Key': key, 'ContentType': content_type},
                ExpiresIn=3600,
            )
            cdn_url = f"https://{config.cdn_domain_name}/{key}" if config.cdn_domain_name else None
            return jsonify({'upload_url': url, 'key': key, 'bucket': config.s3_cover_art_bucket, 'content_type': content_type, 'cdn_url': cdn_url})
        except Exception as e:
            logger.error(f"Error generating presigned URL for cover: {e}")
            return jsonify({"error": "Failed to generate upload URL"}), 500

    @app.route('/login', methods=['GET'])
    @app.route('/admin/login', methods=['GET'])
    def login():
        """Start Cognito Authorization Code flow"""
        state = secrets.token_urlsafe(16)
        nonce = secrets.token_urlsafe(16)
        session['oauth_state'] = state
        session['oauth_nonce'] = nonce
        if not config.cognito_base_url or not config.cognito_client_id or not config.oauth_redirect_uri:
            return jsonify({"error": "Cognito not configured"}), 500
        params = {
            'client_id': config.cognito_client_id,
            'response_type': 'code',
            'scope': 'openid email profile',
            'redirect_uri': config.oauth_redirect_uri,
            'state': state,
        }
        authorize_url = f"{config.cognito_base_url}/oauth2/authorize?{urlencode(params)}"
        return redirect(authorize_url)

    def _cognito_client_secret_hash(username: str) -> str:
        if not config.cognito_client_secret:
            return ""
        key = bytes(config.cognito_client_secret, 'utf-8')
        msg = bytes(username + config.cognito_client_id, 'utf-8')
        digest = hmac.new(key, msg, digestmod=hashlib.sha256).digest()
        return base64.b64encode(digest).decode()

    @app.route('/oauth2/callback', methods=['GET'])
    @app.route('/admin/oauth2/callback', methods=['GET'])
    def oauth_callback():
        """Exchange code for tokens and store user session"""
        error = request.args.get('error')
        if error:
            return jsonify({"error": error, "error_description": request.args.get('error_description')}), 400
        code = request.args.get('code')
        state = request.args.get('state')
        if not code or not state or state != session.get('oauth_state'):
            return jsonify({"error": "Invalid OAuth state or missing code"}), 400
        token_url = f"{config.cognito_base_url}/oauth2/token"
        data = {
            'grant_type': 'authorization_code',
            'client_id': config.cognito_client_id,
            'code': code,
            'redirect_uri': config.oauth_redirect_uri,
        }
        auth = None
        headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
        if config.cognito_client_secret:
            # Basic auth with client credentials
            auth = (config.cognito_client_id, config.cognito_client_secret)
        resp = requests.post(token_url, data=data, headers=headers, auth=auth, timeout=10)
        if resp.status_code != 200:
            return jsonify({"error": "Token exchange failed", "details": resp.text}), 400
        tokens = resp.json()
        id_token = tokens.get('id_token')
        access_token = tokens.get('access_token')
        if not id_token or not access_token:
            return jsonify({"error": "Missing tokens in response"}), 400
        # Optionally decode id_token without verifying signature just for claims display
        session['user'] = {
            'id_token': id_token,
            'access_token': access_token,
        }
        # Clear state/nonce
        session.pop('oauth_state', None)
        session.pop('oauth_nonce', None)
        return redirect(url_for('index'))

    @app.route('/admin/logout', methods=['GET'])
    def logout():
        session.clear()
        if config.cognito_base_url and config.oauth_logout_redirect_uri and config.cognito_client_id:
            params = {
                'client_id': config.cognito_client_id,
                'logout_uri': config.oauth_logout_redirect_uri,
            }
            return redirect(f"{config.cognito_base_url}/logout?{urlencode(params)}")
        return redirect('/admin/signin')
    
    @app.route('/upload', methods=['POST'])
    @app.route('/admin/upload', methods=['POST'])
    def upload_file():
        """Upload and process FLAC file"""
        auth_redirect = _require_login()
        if auth_redirect:
            return auth_redirect
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
            
            # Set playback URL. If CDN is configured, point to expected HLS manifest.
            rel_base = os.path.splitext(os.path.basename(relative_path))[0]
            expected_hls_relative = f"audio/hls/{rel_base}/index.m3u8"
            enhanced_metadata['song_file'] = file_handler.get_file_url(
                expected_hls_relative, request.url_root
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
    @app.route('/admin/files/<path:filename>', methods=['GET'])
    def serve_file(filename):
        """Serve uploaded files from appropriate directory"""
        try:
            # Determine which directory to serve from based on path
            if filename.startswith('audio/'):
                # Serve from audio directory
                actual_filename = filename[6:]  # Remove 'audio/' prefix
                return send_from_directory(config.audio_upload_dir, actual_filename)
            elif filename.startswith('images/'):
                # Serve from image directory
                actual_filename = filename[7:]  # Remove 'images/' prefix
                return send_from_directory(config.image_upload_dir, actual_filename)
            else:
                # Invalid path format
                logger.error(f"Invalid file path format: {filename}")
                return jsonify({"error": "Invalid file path format"}), 400
                    
        except FileNotFoundError:
            logger.error(f"File not found: {filename}")
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
    logger.info(f"Audio upload directory: {config.audio_upload_dir}")
    logger.info(f"Image upload directory: {config.image_upload_dir}")
    logger.info(f"Muza server URL: {config.muza_server_url}")

    app.run(host='0.0.0.0', port=config.port, debug=config.debug)


if __name__ == '__main__':
    main()
