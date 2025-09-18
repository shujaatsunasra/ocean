# FloatChat Ocean AI MCP Server Startup Script
Write-Host "Starting FloatChat Ocean AI MCP Server..." -ForegroundColor Green
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.7+ and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install requirements
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Set environment variables
$env:PYTHONPATH = "."
$env:ARGOVIS_API_KEY = "748fbfd67cd8556d064a0dd54351ce0ef89d4f08"
$env:POSTGRES_HOST = "localhost"
$env:POSTGRES_PORT = "5432"
$env:POSTGRES_USER = "ocean_ai"
$env:POSTGRES_PASSWORD = "ocean_ai_password"
$env:POSTGRES_DB = "ocean_ai_db"
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"

Write-Host ""
Write-Host "Starting MCP Server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the MCP server
Write-Host "Starting MCP server on http://localhost:5001" -ForegroundColor Cyan
python ai_ocean_mcp_server_postgres.py
