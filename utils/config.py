import os
from dataclasses import dataclass


@dataclass
class Config:
    upload_dir: str = "downloads"
    muza_server_url: str = "http://localhost:5000/graphql"
    musicbrainz_app_name: str = "MuzaUtils"
    musicbrainz_app_version: str = "1.0"
    musicbrainz_contact: str = "admin@example.com"
    port: int = 5002
    debug: bool = False

    @classmethod
    def from_env(cls):
        """Create Config from environment variables"""
        return cls(
            upload_dir=os.getenv("UPLOAD_DIR", "downloads"),
            muza_server_url=os.getenv("MUZA_SERVER_URL", "http://localhost:5000/graphql"),
            musicbrainz_app_name=os.getenv("MUSICBRAINZ_APP_NAME", "MuzaUtils"),
            musicbrainz_app_version=os.getenv("MUSICBRAINZ_APP_VERSION", "1.0"),
            musicbrainz_contact=os.getenv("MUSICBRAINZ_CONTACT", "admin@example.com"),
            port=int(os.getenv("PORT", "5002")),
            debug=os.getenv("DEBUG", "").lower() == "true"
        )
