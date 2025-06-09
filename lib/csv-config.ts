// Centralized CSV file configuration
// Update this single location when new data arrives

export const CSV_CONFIG = {
  // Current latest CSV file
  LATEST_CSV_FILENAME: '10X Business Metrics Through Apr 2025 - 06-04-2025candp1.csv',
  
  // Description for documentation
  DESCRIPTION: 'Latest business metrics data file',
  
  // Last updated timestamp for tracking
  LAST_UPDATED: '2025-06-09',
  
  // Version for reference
  VERSION: 'April 2025 - Clean Data'
};

// Helper function to get the full path to the latest CSV
export function getLatestCSVPath(): string {
  const path = require('path');
  return path.join(process.cwd(), CSV_CONFIG.LATEST_CSV_FILENAME);
}

// Helper function to get just the filename
export function getLatestCSVFilename(): string {
  return CSV_CONFIG.LATEST_CSV_FILENAME;
}
