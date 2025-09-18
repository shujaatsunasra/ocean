@echo off
echo Starting FloatChat Ocean AI MCP Server...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

REM Install requirements if needed
echo Installing Python dependencies...
pip install -r requirements.txt

REM Set environment variables
set PYTHONPATH=.
set ARGOVIS_API_KEY=748fbfd67cd8556d064a0dd54351ce0ef89d4f08
set POSTGRES_HOST=localhost
set POSTGRES_PORT=5432
set POSTGRES_USER=ocean_ai
set POSTGRES_PASSWORD=ocean_ai_password
set POSTGRES_DB=ocean_ai_db
set REDIS_HOST=localhost
set REDIS_PORT=6379

echo.
echo Starting MCP Server...
echo Press Ctrl+C to stop the server
echo.

REM Start the MCP server
echo Starting MCP server on http://localhost:5001
python ai_ocean_mcp_server_postgres.py

pause
