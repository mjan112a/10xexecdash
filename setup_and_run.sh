#!/bin/bash
# Setup and run script for Monthly Report Generator

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js v14 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm."
    exit 1
fi

# Check for API key in .env.local or create .env file if needed
if [ -f .env.local ]; then
    echo "Found .env.local file, will use API key from there."
else
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            echo "Created .env file from .env.example"
            echo "Please edit .env and add your Anthropic API key before running the script."
            exit 0
        else
            echo "ERROR: Neither .env.local nor .env.example found. Please create a .env file with your Anthropic API key."
            echo "ANTHROPIC_API_KEY=your_api_key_here"
            exit 1
        fi
    fi
fi

# Install dependencies
echo "Installing dependencies..."
npm install axios dotenv

# Check if required files exist
required_files=("monthlyrptsysprompt.txt" "Monthly Report Outline - 03-14-2025.docx.txt" "10X Business Metrics - 03-06-2025e.csv")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "ERROR: The following required files are missing:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    echo "Please ensure all required files are in the current directory."
    exit 1
fi

# Run the report generator
echo "Running Monthly Report Generator..."
node generate_monthly_report.js

# Check if the report was generated
if [ -f "Monthly Report - March 2025.md" ]; then
    echo "Report generated successfully: Monthly Report - March 2025.md"
else
    echo "ERROR: Report generation failed. Check the console output for errors."
    exit 1
fi

echo "Done!"
