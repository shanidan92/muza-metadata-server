from flask import Flask, jsonify
import graphene
from .config import Config
from .database import Database
from .graphql_handler import handle_graphql_request
from .schema import Query, Mutation


def create_app(config_override=None) -> Flask:
    app = Flask(__name__)

    # Initialize core components
    config = config_override if config_override else Config.from_env()
    db = Database(config.database_url)

    # Create schema instance
    app.schema = graphene.Schema(query=Query, mutation=Mutation)
    app.db = db

    # GraphQL endpoint
    @app.route("/graphql", methods=["GET", "POST"])
    def graphql():
        return handle_graphql_request(app.schema, app.db, config)

    # Health check endpoint
    @app.route("/health")
    def index():
        return jsonify(
            {
                "status": "healthy",
                "service": "Muza Metadata Server",
                "version": "0.1.0",
            }
        )

    return app


def create_app_with_prefix(config_override=None) -> Flask:
    """Create Flask app with /api/metadata prefix for ALB routing"""
    app = Flask(__name__)

    # Initialize core components
    config = config_override if config_override else Config.from_env()
    db = Database(config.database_url)

    # Create schema instance
    app.schema = graphene.Schema(query=Query, mutation=Mutation)
    app.db = db

    # GraphQL endpoint with prefix
    @app.route("/api/metadata/graphql", methods=["GET", "POST"])
    def graphql():
        return handle_graphql_request(app.schema, app.db, config)

    # Health check endpoint with prefix
    @app.route("/api/metadata/health")
    def health_check():
        return jsonify(
            {
                "status": "healthy",
                "service": "Muza Metadata Server",
                "version": "0.1.0",
            }
        )

    # Also keep the original endpoints for backward compatibility
    @app.route("/graphql", methods=["GET", "POST"])
    def graphql_legacy():
        return handle_graphql_request(app.schema, app.db, config)

    @app.route("/health")
    def health_legacy():
        return jsonify(
            {
                "status": "healthy",
                "service": "Muza Metadata Server",
                "version": "0.1.0",
            }
        )

    return app
