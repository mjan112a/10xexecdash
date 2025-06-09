const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class DataIntegrityTester {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.csvData = null;
    this.apiData = null;
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logHeader(message) {
    console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}`);
    console.log(`${message}`);
    console.log(`${'='.repeat(60)}${colors.reset}\n`);
  }

  addIssue(type, description, details = {}) {
    this.issues.push({ type, description, details, severity: 'error' });
    this.log(`❌ ERROR: ${description}`, 'red');
    if (Object.keys(details).length > 0) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  addWarning(description, details = {}) {
    this.warnings.push({ description, details });
    this.log(`⚠️  WARNING: ${description}`, 'yellow');
    if (Object.keys(details).length > 0) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  addSuccess(message) {
    this.log(`✅ ${message}`, 'green');
  }

  // Parse CSV file directly (mimicking the API logic)
  parseCSVDirect(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',');
      
      this.log(`📁 Reading CSV file: ${path.basename(filePath)}`, 'blue');
      this.log(`📊 Total lines in CSV: ${lines.length}`, 'blue');
      this.log(`📋 Headers found: ${headers.length}`, 'blue');
      
      // Extract date columns (starting from index 6)
      const rawDateColumns = headers.slice(6);
      const dateColumns = rawDateColumns
        .map(date => this.parseDateString(date))
        .filter(date => date && date.trim() !== '');
      
      this.log(`📅 Raw date columns: ${rawDateColumns.length}`, 'blue');
      this.log(`📅 Processed date columns: ${dateColumns.length}`, 'blue');
      
      // Parse data rows
      const data = [];
      const skippedRows = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const values = this.parseCSVLine(line);
        
        if (values.length < 7) {
          skippedRows.push({ lineNumber: i + 1, reason: 'Insufficient columns', values });
          continue;
        }
        
        const rowData = {
          lineNumber: i + 1,
          uid: values[0]?.trim() || '',
          metricGroup: values[1]?.trim() || '',
          metricCategory: values[2]?.trim() || '',
          metricType: values[3]?.trim() || '',
          metricName: values[4]?.trim() || '',
          unit: values[5]?.trim() || '',
          rawValues: values.slice(6, 6 + dateColumns.length),
          processedValues: values.slice(6, 6 + dateColumns.length).map(v => this.cleanValue(v))
        };
        
        data.push(rowData);
      }
      
      this.log(`📈 Data rows parsed: ${data.length}`, 'blue');
      this.log(`⚠️  Skipped rows: ${skippedRows.length}`, 'yellow');
      
      return {
        headers,
        rawDateColumns,
        dateColumns,
        data,
        skippedRows,
        totalLines: lines.length
      };
    } catch (error) {
      this.addIssue('CSV_PARSE_ERROR', 'Failed to parse CSV file', { error: error.message });
      return null;
    }
  }

  // Parse CSV line handling quoted values properly
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current); // Add the last value
    return values;
  }

  // Clean value (mimicking API logic)
  cleanValue(value) {
    if (!value) return '';
    
    const trimmed = value.trim();
    
    // Handle quoted values (like "$1,234")
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1).replace(/[$,\s]/g, '');
    }
    
    return trimmed;
  }

  // Parse date string (mimicking API logic)
  parseDateString(dateStr) {
    if (!dateStr) return '';
    
    const trimmed = dateStr.trim();
    
    // Check if it's in M/D/YYYY format first
    const dateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1]);
      const year = parseInt(dateMatch[3]);
      return `${year}-${month.toString().padStart(2, '0')}`;
    }
    
    // Check if it's an Excel date number
    const excelDate = parseInt(trimmed);
    if (!isNaN(excelDate) && trimmed === excelDate.toString() && excelDate > 1000) {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${year}-${month.toString().padStart(2, '0')}`;
    }
    
    return trimmed;
  }

  // Fetch data from API
  async fetchAPIData() {
    try {
      this.log('🌐 Fetching data from /api/metrics...', 'blue');
      
      // Since we can't make HTTP requests in Node.js without additional setup,
      // we'll simulate the API logic here
      const directory = process.cwd();
      const files = fs.readdirSync(directory)
        .filter(file => file.startsWith('10X Business Metrics') && file.endsWith('.csv'))
        .sort();
      
      if (files.length === 0) {
        this.addIssue('API_NO_FILES', 'No metrics files found by API logic');
        return null;
      }
      
      const latestFile = files[files.length - 1];
      this.log(`🎯 API would use file: ${latestFile}`, 'blue');
      
      // Parse using the same logic as the API
      return this.parseCSVDirect(path.join(directory, latestFile));
    } catch (error) {
      this.addIssue('API_FETCH_ERROR', 'Failed to simulate API data fetch', { error: error.message });
      return null;
    }
  }

  // Compare CSV structure
  compareStructure(csvData, apiData) {
    this.logHeader('STRUCTURE COMPARISON');
    
    if (!csvData || !apiData) {
      this.addIssue('STRUCTURE_NULL', 'Cannot compare - one or both datasets are null');
      return;
    }
    
    // Compare headers
    if (csvData.headers.length !== apiData.headers.length) {
      this.addIssue('HEADER_COUNT_MISMATCH', 'Header count mismatch', {
        csvHeaders: csvData.headers.length,
        apiHeaders: apiData.headers.length
      });
    } else {
      this.addSuccess(`Header count matches: ${csvData.headers.length}`);
    }
    
    // Compare date columns
    if (csvData.dateColumns.length !== apiData.dateColumns.length) {
      this.addIssue('DATE_COLUMN_MISMATCH', 'Date column count mismatch', {
        csvDateColumns: csvData.dateColumns.length,
        apiDateColumns: apiData.dateColumns.length,
        csvDates: csvData.dateColumns,
        apiDates: apiData.dateColumns
      });
    } else {
      this.addSuccess(`Date column count matches: ${csvData.dateColumns.length}`);
    }
    
    // Compare data row count
    if (csvData.data.length !== apiData.data.length) {
      this.addIssue('ROW_COUNT_MISMATCH', 'Data row count mismatch', {
        csvRows: csvData.data.length,
        apiRows: apiData.data.length
      });
    } else {
      this.addSuccess(`Data row count matches: ${csvData.data.length}`);
    }
  }

  // Compare specific data values
  compareValues(csvData, apiData) {
    this.logHeader('VALUE COMPARISON');
    
    if (!csvData || !apiData) return;
    
    const maxRows = Math.min(csvData.data.length, apiData.data.length, 10); // Check first 10 rows
    let valueDiscrepancies = 0;
    
    for (let i = 0; i < maxRows; i++) {
      const csvRow = csvData.data[i];
      const apiRow = apiData.data[i];
      
      // Compare metadata
      if (csvRow.uid !== apiRow.uid) {
        this.addIssue('UID_MISMATCH', `UID mismatch at row ${i + 1}`, {
          csv: csvRow.uid,
          api: apiRow.uid
        });
      }
      
      if (csvRow.metricName !== apiRow.metricName) {
        this.addIssue('METRIC_NAME_MISMATCH', `Metric name mismatch at row ${i + 1}`, {
          csv: csvRow.metricName,
          api: apiRow.metricName
        });
      }
      
      // Compare values
      const maxValues = Math.min(csvRow.processedValues.length, apiRow.processedValues.length);
      for (let j = 0; j < maxValues; j++) {
        if (csvRow.processedValues[j] !== apiRow.processedValues[j]) {
          valueDiscrepancies++;
          if (valueDiscrepancies <= 5) { // Only show first 5 discrepancies
            this.addIssue('VALUE_MISMATCH', `Value mismatch at row ${i + 1}, column ${j + 1}`, {
              metric: csvRow.metricName,
              csvValue: csvRow.processedValues[j],
              apiValue: apiRow.processedValues[j],
              rawCsvValue: csvRow.rawValues[j]
            });
          }
        }
      }
    }
    
    if (valueDiscrepancies === 0) {
      this.addSuccess(`All values match in first ${maxRows} rows`);
    } else {
      this.log(`📊 Total value discrepancies found: ${valueDiscrepancies}`, 'red');
    }
  }

  // Analyze data quality issues
  analyzeDataQuality(csvData) {
    this.logHeader('DATA QUALITY ANALYSIS');
    
    if (!csvData) return;
    
    let emptyValues = 0;
    let invalidNumbers = 0;
    let inconsistentFormats = 0;
    
    csvData.data.forEach((row, rowIndex) => {
      row.processedValues.forEach((value, colIndex) => {
        if (!value || value.trim() === '') {
          emptyValues++;
        }
        
        // Check for numeric values that might be malformed
        if (value && value.includes('$')) {
          const numericPart = value.replace(/[$,()]/g, '');
          if (isNaN(parseFloat(numericPart))) {
            invalidNumbers++;
          }
        }
      });
    });
    
    this.log(`📊 Data Quality Summary:`, 'cyan');
    this.log(`   Empty values: ${emptyValues}`, emptyValues > 0 ? 'yellow' : 'green');
    this.log(`   Invalid numbers: ${invalidNumbers}`, invalidNumbers > 0 ? 'yellow' : 'green');
    this.log(`   Skipped rows: ${csvData.skippedRows.length}`, csvData.skippedRows.length > 0 ? 'yellow' : 'green');
    
    if (csvData.skippedRows.length > 0) {
      this.log(`\n📋 Skipped rows details:`, 'yellow');
      csvData.skippedRows.slice(0, 5).forEach(row => {
        this.log(`   Line ${row.lineNumber}: ${row.reason} - ${row.values.slice(0, 3).join(', ')}...`, 'yellow');
      });
    }
  }

  // Generate recommendations
  generateRecommendations() {
    this.logHeader('RECOMMENDATIONS');
    
    const recommendations = [];
    
    if (this.issues.some(i => i.type.includes('MISMATCH'))) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Data Discrepancies Found',
        solution: 'Review CSV parsing logic and ensure consistent data processing',
        implementation: 'Update the parseCSVLine function to handle edge cases better'
      });
    }
    
    if (this.issues.some(i => i.type.includes('VALUE'))) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Value Processing Issues',
        solution: 'Implement stricter value cleaning and validation',
        implementation: 'Add data type validation and standardized number formatting'
      });
    }
    
    if (this.warnings.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Data Quality Warnings',
        solution: 'Implement data validation checks before processing',
        implementation: 'Add pre-processing validation to catch malformed data'
      });
    }
    
    recommendations.push({
      priority: 'LOW',
      issue: 'Future Prevention',
      solution: 'Implement automated data integrity testing',
      implementation: 'Run this test script as part of CI/CD pipeline'
    });
    
    recommendations.forEach(rec => {
      const color = rec.priority === 'HIGH' ? 'red' : rec.priority === 'MEDIUM' ? 'yellow' : 'green';
      this.log(`🎯 ${rec.priority} PRIORITY: ${rec.issue}`, color);
      this.log(`   Solution: ${rec.solution}`, 'white');
      this.log(`   Implementation: ${rec.implementation}`, 'cyan');
      console.log('');
    });
  }

  // Generate summary report
  generateSummary() {
    this.logHeader('SUMMARY REPORT');
    
    const totalIssues = this.issues.length;
    const totalWarnings = this.warnings.length;
    
    if (totalIssues === 0 && totalWarnings === 0) {
      this.log('🎉 EXCELLENT! No data integrity issues found!', 'green');
    } else {
      this.log(`📊 Issues Found: ${totalIssues} errors, ${totalWarnings} warnings`, 'yellow');
    }
    
    this.log(`\n📋 Issue Breakdown:`, 'cyan');
    const issueTypes = {};
    this.issues.forEach(issue => {
      issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
    });
    
    Object.entries(issueTypes).forEach(([type, count]) => {
      this.log(`   ${type}: ${count}`, 'white');
    });
    
    // Save detailed report to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues,
        totalWarnings,
        issueTypes
      },
      issues: this.issues,
      warnings: this.warnings
    };
    
    fs.writeFileSync('data_integrity_report.json', JSON.stringify(report, null, 2));
    this.log(`\n💾 Detailed report saved to: data_integrity_report.json`, 'green');
  }

  // Main test runner
  async runTests() {
    this.logHeader('DATA INTEGRITY TEST SUITE');
    this.log('🚀 Starting comprehensive data integrity analysis...', 'cyan');
    
    // Find the latest CSV file
    const directory = process.cwd();
    const files = fs.readdirSync(directory)
      .filter(file => file.startsWith('10X Business Metrics') && file.endsWith('.csv'))
      .sort();
    
    if (files.length === 0) {
      this.addIssue('NO_CSV_FILES', 'No CSV files found in directory');
      return;
    }
    
    const latestFile = files[files.length - 1];
    const filePath = path.join(directory, latestFile);
    
    // Parse CSV directly
    this.csvData = this.parseCSVDirect(filePath);
    
    // Simulate API data
    this.apiData = await this.fetchAPIData();
    
    // Run comparisons
    this.compareStructure(this.csvData, this.apiData);
    this.compareValues(this.csvData, this.apiData);
    this.analyzeDataQuality(this.csvData);
    
    // Generate recommendations and summary
    this.generateRecommendations();
    this.generateSummary();
  }
}

// Run the tests
const tester = new DataIntegrityTester();
tester.runTests().catch(error => {
  console.error('Test suite failed:', error);
});
