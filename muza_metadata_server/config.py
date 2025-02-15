import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class Config:
    db_path: str
    debug: bool = False

    @classmethod
    def from_env(cls):
        """Create Config from environment variables"""
        return cls(
            db_path=os.getenv("DB_PATH", "music.db"),
            debug=os.getenv("DEBUG", "").lower() == "true",
        )

    @classmethod
    def from_args(cls, args):
        """Create Config from command line arguments"""
        config = cls.from_env()
        config.db_path = args.db_path
        config.debug = args.debug if hasattr(args, "debug") else config.debug
        return config
