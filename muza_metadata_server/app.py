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
    db = Database(config.db_path)
    
    # Create schema instance
    app.schema = graphene.Schema(query=Query, mutation=Mutation)
    app.db = db

    # GraphQL endpoint
    @app.route("/graphql", methods=['GET', 'POST'])
    def graphql():
        return handle_graphql_request(app.schema, app.db)

    # Health check endpoint
    @app.route("/")
    def index():
        return jsonify({
            "status": "healthy",
            "service": "Muza Metadata Server",
            "version": "0.1.0",
        })

    return app
