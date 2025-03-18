@echo off
REM Setup and run script for Monthly Report Generator (Windows version)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Please install Node.js v14 or higher.
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo npm is not installed. Please install npm.
    exit /b 1
)

REM Check for API key in .env.local or create .env file if needed
if exist .env.local (
    echo Found .env.local file, will use API key from there.
) else (
    if not exist .env (
        if exist .env.example (
            copy .env.example .env
            echo Created .env file from .env.example
            echo Please edit .env and add your Anthropic API key before running the script.
            exit /b 0
        ) else (
            echo ERROR: Neither .env.local nor .env.example found. Please create a .env file with your Anthropic API key.
            echo ANTHROPIC_API_KEY=your_api_key_here
            exit /b 1
        )
    )
)

REM Install dependencies
echo Installing dependencies...
call npm install axios dotenv

REM Check if required files exist
set MISSING_FILES=0
set REQUIRED_FILES=monthlyrptsysprompt.txt "Monthly Report Outline - 03-14-2025.docx.txt" "10X Business Metrics - 03-06-2025e.csv"

for %%F in (%REQUIRED_FILES%) do (
    if not exist %%F (
        echo Missing required file: %%F
        set MISSING_FILES=1
    )
)

if %MISSING_FILES% equ 1 (
    echo ERROR: Some required files are missing. Please ensure all required files are in the current directory.
    exit /b 1
)

REM Run the report generator
echo Running Monthly Report Generator...
node generate_monthly_report.js

REM Check if the report was generated
if exist "Monthly Report - March 2025.md" (
    echo Report generated successfully: Monthly Report - March 2025.md
) else (
    echo ERROR: Report generation failed. Check the console output for errors.
    exit /b 1
)

echo Done!
