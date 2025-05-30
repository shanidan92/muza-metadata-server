import argparse
import logging
from .app import create_app
from .config import Config


def parse_args():
    parser = argparse.ArgumentParser(description="Muza metadata server.")
    parser.add_argument(
        "--port",
        type=int,
        default=5000,
        help="Port to run the Flask server on (default: 5000)",
    )
    parser.add_argument(
        "--db-path",
        type=str,
        default="music.db",
        help="Path to the local SQLite DB file (default: music.db)",
    )
    parser.add_argument(
        "--database-url",
        type=str,
        help="Database URL (e.g., sqlite:///music.db, postgresql://user:pass@host/db)",
    )
    parser.add_argument(
        "--debug", action="store_true", help="Enable debug mode", default=False
    )
    parser.add_argument(
        "--hook-command",
        type=str,
        default="",
        help="Command to run after successful insertion (receives JSON string as argument)",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.debug else logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    config = Config.from_args(args)

    app = create_app(config)
    app.run(port=args.port, debug=args.debug)


if __name__ == "__main__":
    main()
