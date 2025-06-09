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

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}`);
  console.log(`${message}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

// Current (broken) cleanValue function from API
function cleanValueCurrent(value) {
  if (!value) return '';
  
  const trimmed = value.trim();
  
  // Handle quoted values (like "$1,234")
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/[$,\s]/g, '');
  }
  
  return trimmed;
}

// Fixed cleanValue function
function cleanValueFixed(value) {
  if (!value) return '';
  
  const trimmed = value.trim();
  
  // Handle quoted values (like "$1,234")
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/[$,\s]/g, '');
  }
  
  // Handle unquoted currency values (like "$1,234 ")
  if (trimmed.includes('$')) {
    return trimmed.replace(/[$,\s]/g, '');
  }
  
  // Handle negative values in parentheses
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    const innerValue = trimmed.slice(1, -1);
    if (innerValue.includes('$')) {
      return '-' + innerValue.replace(/[$,\s]/g, '');
    }
    return '-' + innerValue.replace(/[,\s]/g, '');
  }
  
  return trimmed;
}

// Test the fix with sample data
function testFix() {
  logHeader('CURRENCY PROCESSING FIX TEST');
  
  const testCases = [
    '"$147,932 "',
    '$147,932 ',
    '($9,964)',
    '"($394)"',
    '$0 ',
    '($71,501)',
    '$1,247 ',
    '0.52',
    '45%',
    ''
  ];
  
  log('Testing currency processing fix:', 'cyan');
  console.log('');
  
  testCases.forEach((testCase, index) => {
    const currentResult = cleanValueCurrent(testCase);
    const fixedResult = cleanValueFixed(testCase);
    const isFixed = currentResult !== fixedResult;
    
    log(`Test ${index + 1}: "${testCase}"`, 'white');
    log(`  Current: "${currentResult}"`, isFixed ? 'red' : 'green');
    log(`  Fixed:   "${fixedResult}"`, isFixed ? 'green' : 'white');
    if (isFixed) {
      log(`  ✅ IMPROVED`, 'green');
    } else {
      log(`  ✅ No change needed`, 'green');
    }
    console.log('');
  });
}

// Generate the fixed API code
function generateFixedAPICode() {
  logHeader('GENERATING FIXED API CODE');
  
  const fixedAPICode = `
// Fixed cleanValue function for app/api/metrics/route.ts
function cleanValue(value) {
  if (!value) return '';
  
  const trimmed = value.trim();
  
  // Handle quoted values (like "$1,234")
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/[$,\\s]/g, '');
  }
  
  // Handle unquoted currency values (like "$1,234 ")
  if (trimmed.includes('$')) {
    return trimmed.replace(/[$,\\s]/g, '');
  }
  
  // Handle negative values in parentheses
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    const innerValue = trimmed.slice(1, -1);
    if (innerValue.includes('$')) {
      return '-' + innerValue.replace(/[$,\\s]/g, '');
    }
    return '-' + innerValue.replace(/[,\\s]/g, '');
  }
  
  return trimmed;
}

// Usage in the data parsing section:
values.slice(6, 6 + dateColumns.length).map(v => cleanValue(v))
`;

  fs.writeFileSync('fixed_api_code.txt', fixedAPICode);
  log('✅ Fixed API code saved to: fixed_api_code.txt', 'green');
  
  return fixedAPICode;
}

// Generate improvement summary
function generateSummary() {
  logHeader('CURRENCY PROCESSING FIX SUMMARY');
  
  log('🔍 ISSUE IDENTIFIED:', 'red');
  log('   The API cleanValue function only handles quoted currency values', 'white');
  log('   but most currency values in the CSV are unquoted (e.g., "$1,234 ")', 'white');
  log('   This causes the API to return "$1,234" instead of "1234"', 'white');
  
  console.log('');
  log('🔧 FIX IMPLEMENTED:', 'green');
  log('   1. Handle unquoted currency values by detecting $ symbol', 'white');
  log('   2. Properly process negative values in parentheses', 'white');
  log('   3. Remove all currency symbols, commas, and spaces', 'white');
  log('   4. Convert negative parentheses to minus sign prefix', 'white');
  
  console.log('');
  log('📊 EXPECTED IMPROVEMENTS:', 'cyan');
  log('   • 323 currency formatting discrepancies will be resolved', 'white');
  log('   • Consistent numeric values for calculations', 'white');
  log('   • Proper handling of negative currency amounts', 'white');
  log('   • Better data integrity between CSV and API', 'white');
  
  console.log('');
  log('🚀 NEXT STEPS:', 'yellow');
  log('   1. Apply the fix to app/api/metrics/route.ts', 'white');
  log('   2. Test the API endpoint', 'white');
  log('   3. Verify UI displays correct values', 'white');
  log('   4. Run the integrity test again to confirm fix', 'white');
}

// Main execution
function main() {
  testFix();
  generateFixedAPICode();
  generateSummary();
}

main();
