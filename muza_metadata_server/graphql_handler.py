from flask import request, jsonify
import json

def handle_graphql_request(schema, db):
    """Handle both GET and POST GraphQL requests"""
    try:
        # Get query and variables based on request method
        if request.method == 'GET':
            query = request.args.get('query')
            variables = _parse_variables(request.args.get('variables'))
            operation_name = request.args.get('operationName')
        else:  # POST
            data = request.get_json(silent=True) or {}
            query = data.get('query')
            variables = data.get('variables')
            operation_name = data.get('operationName')

        # Validate query presence
        if not query:
            return error_response("Query is required")

        # Execute GraphQL query using schema.execute
        result = schema.execute(
            query,
            variable_values=variables,
            operation_name=operation_name,
            context_value={'db': db}
        )
        
        if result.errors:
            return jsonify({"errors": [{"message": str(e)} for e in result.errors]})
            
        return jsonify({"data": result.data})

    except Exception as e:
        return error_response(str(e))

def _parse_variables(variables_str):
    """Parse variables string to dict if needed"""
    if not variables_str:
        return None
        
    if isinstance(variables_str, str):
        try:
            return json.loads(variables_str)
        except json.JSONDecodeError:
            raise ValueError("Variables must be valid JSON")
    
    return variables_str

def error_response(message, status_code=400):
    """Create consistent error response"""
    return jsonify({"errors": [{"message": message}]}), status_code
