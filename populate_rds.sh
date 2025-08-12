#!/bin/bash

# Script to populate the Muza Metadata Server RDS database with demo data
# This script sets up the environment and runs the Python population script

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if virtual environment exists
check_venv() {
    if [ -d "venv" ]; then
        return 0
    else
        return 1
    fi
}

# Function to activate virtual environment
activate_venv() {
    if check_venv; then
        print_status "Activating virtual environment..."
        source venv/bin/activate
        print_success "Virtual environment activated"
    else
        print_warning "Virtual environment not found. Creating one..."
        python3 -m venv venv
        source venv/bin/activate
        print_status "Installing dependencies..."
        pip install -r requirements.txt
        print_success "Virtual environment created and dependencies installed"
    fi
}

# Function to check required environment variables
check_environment() {
    local missing_vars=()
    
    if [ -z "$DATABASE_URL" ]; then
        missing_vars+=("DATABASE_URL")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables: ${missing_vars[*]}"
        echo ""
        echo "Please set the following environment variables:"
        echo "  DATABASE_URL - PostgreSQL connection string (e.g., postgresql://user:pass@host:port/db)"
        echo ""
        echo "Example:"
        echo "  export DATABASE_URL=\"postgresql://username:password@your-rds-endpoint:5432/muza_db\""
        echo ""
        exit 1
    fi
    
    print_success "Environment variables validated"
}

# Function to check if demo data file exists
check_demo_data() {
    local demo_data_path="../muza-lit-library/public/staticData/allData.json"
    
    if [ ! -f "$demo_data_path" ]; then
        print_error "Demo data file not found: $demo_data_path"
        echo ""
        echo "Please ensure the demo data file exists at the expected location."
        echo "You can specify a different path using the --demo-data-path argument."
        echo ""
        exit 1
    fi
    
    print_success "Demo data file found: $demo_data_path"
}

# Function to run the population script
run_population() {
    local demo_data_path="../muza-lit-library/public/staticData/allData.json"
    local debug_flag=""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --demo-data-path)
                demo_data_path="$2"
                shift 2
            ;;
            --debug)
                debug_flag="--debug"
                shift
            ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --demo-data-path PATH  Path to the demo data JSON file"
                echo "  --debug                Enable debug logging"
                echo "  --help                 Show this help message"
                echo ""
                echo "Environment Variables:"
                echo "  DATABASE_URL           PostgreSQL connection string"
                echo ""
                echo "Example:"
                echo "  DATABASE_URL=\"postgresql://user:pass@host:port/db\" $0"
                echo ""
                exit 0
            ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
            ;;
        esac
    done
    
    print_status "Starting database population..."
    print_status "Database URL: ${DATABASE_URL//:*/:****@*}"  # Hide password in output
    print_status "Demo data path: $demo_data_path"
    
    # Run the Python script
    python populate_rds.py \
    --database-url "postgresql://postgres:}!*DX56zXflWJRvu@muza-staging-db.c1kui2ygoruk.eu-west-1.rds.amazonaws.com:5432/muza" \
    --demo-data-path "$demo_data_path" \
    $debug_flag
    
    if [ $? -eq 0 ]; then
        print_success "Database population completed successfully!"
    else
        print_error "Database population failed!"
        exit 1
    fi
}

# Main execution
main() {
    print_status "Muza Metadata Server - RDS Population Script"
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "populate_rds.py" ]; then
        print_error "This script must be run from the muza-metadata-server directory"
        exit 1
    fi
    
    # Check for Python
    if ! command_exists python3; then
        print_error "Python 3 is required but not installed"
        exit 1
    fi
    
    # Check environment variables
    check_environment
    
    # Check demo data file
    check_demo_data
    
    # Activate virtual environment
    activate_venv
    
    # Run the population script
    run_population "$@"
}

# Run main function with all arguments
main "$@"
