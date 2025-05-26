import os
from dataclasses import dataclass


@dataclass
class Config:
    database_url: str
    debug: bool = False
    hook_command: str = ""  # Command to run after successful insertion

    @classmethod
    def from_env(cls):
        """Create Config from environment variables"""
        # Support both DB_PATH (for backwards compatibility) and DATABASE_URL
        db_path = os.getenv("DB_PATH", "music.db")
        database_url = os.getenv("DATABASE_URL")

        if not database_url:
            # Convert file path to SQLite URL if DATABASE_URL not provided
            database_url = f"sqlite:///{db_path}"

        return cls(
            database_url=database_url,
            debug=os.getenv("DEBUG", "").lower() == "true",
            hook_command=os.getenv("HOOK_COMMAND", ""),
        )

    @classmethod
    def from_args(cls, args):
        """Create Config from command line arguments"""
        config = cls.from_env()

        # Handle db_path argument
        if hasattr(args, "db_path") and args.db_path:
            config.database_url = f"sqlite:///{args.db_path}"

        config.debug = args.debug if hasattr(args, "debug") else config.debug
        config.hook_command = (
            args.hook_command if hasattr(args, "hook_command") else config.hook_command
        )
        return config
