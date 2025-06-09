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

class UIFormattingTester {
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
    this.log(`❌ ISSUE: ${description}`, 'red');
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

  // Replicate the UI's formatValue function exactly
  formatValueUI(value, unit) {
    // Remove extra quotes and spaces
    value = value.replace(/[""]/g, '').trim();
    
    // Handle empty or undefined values
    if (!value || value === '-') return '';
    
    // Handle currency values
    if (value.includes('$')) {
      // Remove extra spaces around the value
      return value.replace(/\s+/g, '');
    }
    
    // Handle percentages that already include % symbol
    if (value.includes('%')) {
      return value.trim();
    }
    
    // Handle percentage units - convert decimal to percentage
    if (unit === '%' && !isNaN(Number(value))) {
      const numValue = parseFloat(value);
      return (numValue * 100).toFixed(2) + '%';
    }
    
    // Handle numbers
    if (!isNaN(Number(value))) {
      return value;
    }
    
    return value;
  }

  // Replicate the API's cleanValue function
  cleanValueAPI(value) {
    if (!value) return '';
    
    const trimmed = value.trim();
    
    // Handle quoted values (like "$1,234")
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1).replace(/[$,\s]/g, '');
    }
    
    return trimmed;
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

  // Load and parse CSV data
  loadCSVData() {
    try {
      const directory = process.cwd();
      const files = fs.readdirSync(directory)
        .filter(file => file.startsWith('10X Business Metrics') && file.endsWith('.csv'))
        .sort();
      
      if (files.length === 0) {
        this.addIssue('NO_CSV_FILES', 'No CSV files found');
        return null;
      }
      
      const latestFile = files[files.length - 1];
      const filePath = path.join(directory, latestFile);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      this.log(`📁 Loading CSV: ${latestFile}`, 'blue');
      
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',');
      
      // Extract date columns (starting from index 6)
      const rawDateColumns = headers.slice(6);
      const dateColumns = rawDateColumns
        .map(date => this.parseDateString(date))
        .filter(date => date && date.trim() !== '');
      
      // Parse data rows
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = this.parseCSVLine(line);
        if (values.length < 7) continue;
        
        const rowData = {
          uid: values[0]?.trim() || '',
          metricGroup: values[1]?.trim() || '',
          metricCategory: values[2]?.trim() || '',
          metricType: values[3]?.trim() || '',
          metricName: values[4]?.trim() || '',
          unit: values[5]?.trim() || '',
          rawValues: values.slice(6, 6 + dateColumns.length),
          apiProcessedValues: values.slice(6, 6 + dateColumns.length).map(v => this.cleanValueAPI(v)),
          uiFormattedValues: values.slice(6, 6 + dateColumns.length).map(v => 
            this.formatValueUI(this.cleanValueAPI(v), values[5]?.trim() || '')
          )
        };
        
        data.push(rowData);
      }
      
      return {
        headers,
        dateColumns,
        data
      };
    } catch (error) {
      this.addIssue('CSV_LOAD_ERROR', 'Failed to load CSV data', { error: error.message });
      return null;
    }
  }

  // Compare raw CSV values vs API processed vs UI formatted
  compareFormattingLayers() {
    this.logHeader('FORMATTING LAYER COMPARISON');
    
    if (!this.csvData) return;
    
    let formattingDiscrepancies = 0;
    let percentageConversions = 0;
    let currencyFormatting = 0;
    let unexpectedChanges = 0;
    
    // Check first 20 rows for detailed analysis
    const sampleSize = Math.min(20, this.csvData.data.length);
    
    for (let i = 0; i < sampleSize; i++) {
      const row = this.csvData.data[i];
      
      for (let j = 0; j < row.rawValues.length; j++) {
        const rawValue = row.rawValues[j];
        const apiValue = row.apiProcessedValues[j];
        const uiValue = row.uiFormattedValues[j];
        
        // Skip empty values
        if (!rawValue || rawValue.trim() === '') continue;
        
        // Check for percentage conversion issues
        if (row.unit === '%' && !isNaN(Number(apiValue))) {
          percentageConversions++;
          const expectedUI = (parseFloat(apiValue) * 100).toFixed(2) + '%';
          if (uiValue !== expectedUI) {
            this.addIssue('PERCENTAGE_CONVERSION_ERROR', 
              `Percentage conversion mismatch for ${row.metricName}`, {
                rawValue,
                apiValue,
                uiValue,
                expectedUI,
                unit: row.unit
              });
            formattingDiscrepancies++;
          }
        }
        
        // Check currency formatting
        if (rawValue.includes('$')) {
          currencyFormatting++;
          // API should remove quotes and extra spaces
          // UI should remove all spaces
          const expectedAPI = rawValue.replace(/[""]/g, '').trim();
          const expectedUI = expectedAPI.replace(/\s+/g, '');
          
          if (apiValue !== expectedAPI.replace(/[$,\s]/g, '')) {
            this.addIssue('CURRENCY_API_PROCESSING_ERROR',
              `Currency API processing error for ${row.metricName}`, {
                rawValue,
                apiValue,
                expectedAPI: expectedAPI.replace(/[$,\s]/g, ''),
                column: j
              });
            formattingDiscrepancies++;
          }
          
          if (uiValue !== expectedUI) {
            this.addIssue('CURRENCY_UI_FORMATTING_ERROR',
              `Currency UI formatting error for ${row.metricName}`, {
                rawValue,
                apiValue,
                uiValue,
                expectedUI,
                column: j
              });
            formattingDiscrepancies++;
          }
        }
        
        // Check for unexpected changes
        if (rawValue !== apiValue && !rawValue.includes('$') && !rawValue.includes('"')) {
          unexpectedChanges++;
          if (unexpectedChanges <= 5) { // Only show first 5
            this.addWarning('Unexpected value change during API processing', {
              metric: row.metricName,
              rawValue,
              apiValue,
              column: j
            });
          }
        }
      }
    }
    
    this.log(`\n📊 Formatting Analysis Summary:`, 'cyan');
    this.log(`   Rows analyzed: ${sampleSize}`, 'white');
    this.log(`   Percentage conversions: ${percentageConversions}`, 'white');
    this.log(`   Currency formatting instances: ${currencyFormatting}`, 'white');
    this.log(`   Formatting discrepancies: ${formattingDiscrepancies}`, formattingDiscrepancies > 0 ? 'red' : 'green');
    this.log(`   Unexpected changes: ${unexpectedChanges}`, unexpectedChanges > 0 ? 'yellow' : 'green');
  }

  // Analyze specific problematic patterns
  analyzeProblematicPatterns() {
    this.logHeader('PROBLEMATIC PATTERN ANALYSIS');
    
    if (!this.csvData) return;
    
    const patterns = {
      quotedCurrency: 0,
      negativeParentheses: 0,
      emptyValues: 0,
      inconsistentSpacing: 0,
      mixedFormats: 0
    };
    
    this.csvData.data.forEach((row, rowIndex) => {
      row.rawValues.forEach((value, colIndex) => {
        if (!value) {
          patterns.emptyValues++;
          return;
        }
        
        // Check for quoted currency values
        if (value.includes('"') && value.includes('$')) {
          patterns.quotedCurrency++;
        }
        
        // Check for negative values in parentheses
        if (value.includes('(') && value.includes(')')) {
          patterns.negativeParentheses++;
        }
        
        // Check for inconsistent spacing
        if (value.includes('  ') || value.startsWith(' ') || value.endsWith(' ')) {
          patterns.inconsistentSpacing++;
        }
        
        // Check for mixed formats in the same column
        if (colIndex < 3) { // Only check first few columns for mixed formats
          const otherValuesInColumn = this.csvData.data
            .map(r => r.rawValues[colIndex])
            .filter(v => v && v.trim() !== '');
          
          const hasQuotes = otherValuesInColumn.some(v => v.includes('"'));
          const hasNoQuotes = otherValuesInColumn.some(v => !v.includes('"'));
          
          if (hasQuotes && hasNoQuotes && rowIndex === 0) { // Only count once per column
            patterns.mixedFormats++;
          }
        }
      });
    });
    
    this.log(`📋 Pattern Analysis:`, 'cyan');
    Object.entries(patterns).forEach(([pattern, count]) => {
      const color = count > 0 ? 'yellow' : 'green';
      this.log(`   ${pattern}: ${count}`, color);
    });
    
    return patterns;
  }

  // Generate specific examples of discrepancies
  generateExamples() {
    this.logHeader('DISCREPANCY EXAMPLES');
    
    if (!this.csvData) return;
    
    const examples = [];
    
    // Find examples of different types of discrepancies
    for (let i = 0; i < Math.min(10, this.csvData.data.length); i++) {
      const row = this.csvData.data[i];
      
      for (let j = 0; j < Math.min(5, row.rawValues.length); j++) {
        const rawValue = row.rawValues[j];
        const apiValue = row.apiProcessedValues[j];
        const uiValue = row.uiFormattedValues[j];
        
        if (rawValue && (rawValue !== apiValue || apiValue !== uiValue)) {
          examples.push({
            metric: row.metricName,
            unit: row.unit,
            column: j,
            rawValue,
            apiValue,
            uiValue,
            transformations: {
              rawToAPI: rawValue !== apiValue,
              apiToUI: apiValue !== uiValue
            }
          });
        }
      }
    }
    
    if (examples.length === 0) {
      this.addSuccess('No formatting discrepancies found in sample data');
    } else {
      this.log(`Found ${examples.length} examples of value transformations:`, 'yellow');
      examples.slice(0, 5).forEach((example, index) => {
        this.log(`\n📝 Example ${index + 1}: ${example.metric}`, 'cyan');
        this.log(`   Raw CSV: "${example.rawValue}"`, 'white');
        this.log(`   API Processed: "${example.apiValue}"`, 'white');
        this.log(`   UI Formatted: "${example.uiValue}"`, 'white');
        this.log(`   Unit: "${example.unit}"`, 'white');
      });
    }
    
    return examples;
  }

  // Generate improvement recommendations
  generateRecommendations() {
    this.logHeader('IMPROVEMENT RECOMMENDATIONS');
    
    const recommendations = [];
    
    if (this.issues.some(i => i.type.includes('PERCENTAGE'))) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Percentage Conversion Issues',
        solution: 'Standardize percentage handling between API and UI',
        implementation: 'Ensure consistent decimal-to-percentage conversion logic'
      });
    }
    
    if (this.issues.some(i => i.type.includes('CURRENCY'))) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Currency Formatting Inconsistencies',
        solution: 'Unify currency value processing across all layers',
        implementation: 'Create a centralized currency formatting utility'
      });
    }
    
    if (this.warnings.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Data Processing Inconsistencies',
        solution: 'Review and standardize data cleaning logic',
        implementation: 'Implement consistent value cleaning across API and UI'
      });
    }
    
    recommendations.push({
      priority: 'LOW',
      issue: 'Data Quality Monitoring',
      solution: 'Implement automated formatting validation',
      implementation: 'Add unit tests for formatValue and cleanValue functions'
    });
    
    recommendations.push({
      priority: 'LOW',
      issue: 'User Experience',
      solution: 'Add data validation indicators in UI',
      implementation: 'Show warnings when data formatting issues are detected'
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
      this.log('🎉 EXCELLENT! No UI formatting discrepancies found!', 'green');
    } else {
      this.log(`📊 Issues Found: ${totalIssues} errors, ${totalWarnings} warnings`, 'yellow');
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues,
        totalWarnings,
        testType: 'UI Formatting Discrepancy Analysis'
      },
      issues: this.issues,
      warnings: this.warnings
    };
    
    fs.writeFileSync('ui_formatting_report.json', JSON.stringify(report, null, 2));
    this.log(`\n💾 Detailed report saved to: ui_formatting_report.json`, 'green');
  }

  // Main test runner
  async runTests() {
    this.logHeader('UI FORMATTING DISCREPANCY TEST SUITE');
    this.log('🚀 Analyzing formatting differences between CSV, API, and UI...', 'cyan');
    
    // Load CSV data
    this.csvData = this.loadCSVData();
    
    if (!this.csvData) {
      this.log('❌ Cannot proceed without CSV data', 'red');
      return;
    }
    
    // Run analysis
    this.compareFormattingLayers();
    this.analyzeProblematicPatterns();
    this.generateExamples();
    
    // Generate recommendations and summary
    this.generateRecommendations();
    this.generateSummary();
  }
}

// Run the tests
const tester = new UIFormattingTester();
tester.runTests().catch(error => {
  console.error('Test suite failed:', error);
});
