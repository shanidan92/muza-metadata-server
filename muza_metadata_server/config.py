import os
from dataclasses import dataclass


@dataclass
class Config:
    db_path: str
    debug: bool = False
    hook_command: str = ""  # Command to run after successful insertion

    @classmethod
    def from_env(cls):
        """Create Config from environment variables"""
        return cls(
            db_path=os.getenv("DB_PATH", "music.db"),
            debug=os.getenv("DEBUG", "").lower() == "true",
            hook_command=os.getenv("HOOK_COMMAND", ""),
        )

    @classmethod
    def from_args(cls, args):
        """Create Config from command line arguments"""
        config = cls.from_env()
        config.db_path = args.db_path
        config.debug = args.debug if hasattr(args, "debug") else config.debug
        config.hook_command = (
            args.hook_command if hasattr(args, "hook_command") else config.hook_command
        )
        return config
