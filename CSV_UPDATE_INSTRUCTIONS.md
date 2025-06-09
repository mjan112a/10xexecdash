# CSV Data Update Instructions

## Quick Update Guide

When you receive new business metrics data, follow these simple steps:

### 1. Add the New CSV File
- Place the new CSV file in the project root directory (same folder as package.json)
- Keep the existing naming convention: `10X Business Metrics...`

### 2. Update the Configuration
- Open the file: `lib/csv-config.ts`
- Update **only** these three lines:

```typescript
LATEST_CSV_FILENAME: 'YOUR_NEW_CSV_FILENAME.csv',
LAST_UPDATED: '2025-MM-DD',
VERSION: 'Month Year - Description'
```

### 3. That's It!
Both the metrics display and monthly report generation will automatically use the new data.

## Example Update

If you receive a new file called `10X Business Metrics Through May 2025 - 07-01-2025.csv`, update the config like this:

```typescript
export const CSV_CONFIG = {
  // Current latest CSV file
  LATEST_CSV_FILENAME: '10X Business Metrics Through May 2025 - 07-01-2025.csv',
  
  // Description for documentation
  DESCRIPTION: 'Latest business metrics data file',
  
  // Last updated timestamp for tracking
  LAST_UPDATED: '2025-07-01',
  
  // Version for reference
  VERSION: 'May 2025 - Latest Data'
};
```

## What This Fixes

- ✅ **Consistent Data**: Both metrics display and monthly reports use the same data
- ✅ **Single Update Point**: Only one file to change when new data arrives
- ✅ **No More Discrepancies**: Revenue values will match across all features
- ✅ **Easy Maintenance**: Clear instructions for future updates

## Files That Use This Configuration

- `app/api/metrics/route.ts` - Main metrics display
- `app/api/monthly-report-direct/route.ts` - Monthly report generation

## Troubleshooting

If you see errors after updating:
1. Check that the CSV filename is spelled exactly right
2. Ensure the CSV file is in the project root directory
3. Verify the file format matches the previous CSV files

## Current Configuration

- **File**: `10X Business Metrics Through Apr 2025 - 06-04-2025candp1.csv`
- **Version**: April 2025 - Clean Data
- **Last Updated**: 2025-06-09
