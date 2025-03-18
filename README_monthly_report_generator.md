# Monthly Report Generator

This tool generates a comprehensive monthly business report for 10X Engineered Materials using Claude 3.7 Sonnet Extended. It combines the system prompt, outline, and metrics data to create a detailed report based on actual data.

## Features

- Automatically extracts and formats metrics data from CSV
- Organizes metrics by report section for easier analysis
- Provides clear instructions for month-over-month and year-over-year comparisons
- Generates a complete monthly report in Markdown format
- Uses Claude 3.7 Sonnet Extended for high-quality report generation

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Anthropic API key for Claude 3.7 Sonnet Extended

## Quick Start

### For Linux/macOS Users

1. Run the setup script:

```bash
chmod +x setup_and_run.sh
./setup_and_run.sh
```

2. The script will:
   - Check for Node.js and npm
   - Check for API key in .env.local or create a .env file from .env.example if needed
   - Install required dependencies
   - Verify all required files are present
   - Run the report generator

### For Windows Users

1. Run the setup script by double-clicking `setup_and_run.bat` or running it from the command prompt:

```
setup_and_run.bat
```

2. The script will perform the same checks and setup as the Linux/macOS version.

## Manual Setup

If you prefer to set up manually:

1. Install the required dependencies:

```bash
npm install axios dotenv
```

2. The script will look for the Anthropic API key in the following locations:
   - `.env.local` file (already exists in the project)
   - `.env` file

   If you need to create a new .env file:

```bash
cp .env.example .env
```

3. Add your Anthropic API key to the `.env` file if it's not already in `.env.local`:

```
ANTHROPIC_API_KEY=your_actual_api_key_here
```

You can obtain an API key from the [Anthropic Console](https://console.anthropic.com/).

## Usage

1. Ensure the following files are in the same directory as the script:
   - `monthlyrptsysprompt.txt` - The system prompt for the report
   - `Monthly Report Outline - 03-14-2025.docx.txt` - The outline structure
   - `10X Business Metrics - 03-06-2025e.csv` - The metrics data

2. Run the script:

```bash
node generate_monthly_report.js
```

3. The script will:
   - Read and parse the input files
   - Format the metrics data for analysis
   - Call the Anthropic API with Claude 3.7 Sonnet Extended
   - Save the generated report as `Monthly Report - March 2025.md`

## Customization

You can modify the script to:

- Change the target month for the report
- Add or remove sections from the analysis
- Adjust the formatting of the metrics data
- Change the output format or filename

## Troubleshooting

If you encounter any issues:

1. Check that your API key is correctly set in the `.env` file
2. Verify that all required files are in the correct location
3. Check the console output for any error messages
4. Ensure you have a stable internet connection for API calls

## Notes

- The script uses the Claude 3.7 Sonnet Extended model, which has a 200K token context window
- The generated report is saved in Markdown format, which can be converted to other formats as needed
- The script includes detailed analysis instructions for each section of the report
