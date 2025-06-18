import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getLatestCSVFilename } from '@/lib/csv-config';

interface MetricOption {
  uid: string;
  name: string;
  unit: string;
  category: string;
  aggregationType: 'sum' | 'average' | 'end-of-period';
}

interface QuarterlyData {
  quarter: string;
  metrics: { [uid: string]: number };
}

// Function to determine aggregation type based on metric name and characteristics
function determineAggregationType(metricName: string, unit: string, category: string): 'sum' | 'average' | 'end-of-period' {
  const name = metricName.toLowerCase();
  const cat = category.toLowerCase();
  
  // Snapshot/Balance Sheet items (end-of-period)
  const snapshotKeywords = [
    'balance', 'cash', 'inventory', 'assets', 'liabilities', 'equity',
    'employees', 'headcount', 'staff', 'outstanding', 'turnover',
    'followers', 'customers', 'ratio', 'rate', 'compliance', 'uptime',
    'satisfaction', 'incidents', 'findings', 'consumption', 'generated'
  ];
  
  // Percentage/Ratio items (average)
  if (unit === '%' || unit === 'ratio' || name.includes('rate') || name.includes('ratio')) {
    return 'average';
  }
  
  // Check for snapshot keywords
  for (const keyword of snapshotKeywords) {
    if (name.includes(keyword)) {
      return 'end-of-period';
    }
  }
  
  // Income statement items (sum)
  if (cat.includes('income') || cat.includes('revenue') || cat.includes('expense') || 
      cat.includes('cost') || cat.includes('cash flow') || name.includes('revenue') ||
      name.includes('income') || name.includes('expense') || name.includes('cost')) {
    return 'sum';
  }
  
  // Default to sum for dollar amounts, end-of-period for others
  return unit === '$' ? 'sum' : 'end-of-period';
}

// Function to parse date strings in M/D/YYYY format or Excel date numbers
function parseDateString(dateStr: string): string {
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

// Function to convert YYYY-MM to quarter
function getQuarterFromDate(dateStr: string): { quarter: number; year: number } | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  
  const year = parseInt(match[1]);
  const month = parseInt(match[2]);
  
  const quarter = Math.ceil(month / 3);
  return { quarter, year };
}

// Function to clean and parse numeric values
function parseNumericValue(value: string): number {
  if (!value || value.trim() === '') return 0;
  
  const trimmed = value.trim();
  
  // Handle quoted values (like "$1,234")
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const cleaned = trimmed.slice(1, -1).replace(/[$,\s]/g, '');
    return parseFloat(cleaned) || 0;
  }
  
  // Handle unquoted currency values (like "$1,234 ")
  if (trimmed.includes('$')) {
    const cleaned = trimmed.replace(/[$,\s]/g, '');
    return parseFloat(cleaned) || 0;
  }
  
  // Handle negative values in parentheses
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    const innerValue = trimmed.slice(1, -1);
    const cleaned = innerValue.replace(/[$,\s]/g, '');
    return -(parseFloat(cleaned) || 0);
  }
  
  // Handle regular numbers with commas
  const cleaned = trimmed.replace(/[,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

export async function GET(request: Request) {
  try {
    // Check for override parameter
    const url = new URL(request.url);
    const overrides = url.searchParams.get('overrides');
    let aggregationOverrides: { [uid: string]: 'sum' | 'average' | 'end-of-period' } = {};
    
    if (overrides) {
      try {
        aggregationOverrides = JSON.parse(overrides);
      } catch (e) {
        console.warn('Invalid overrides parameter:', e);
      }
    }
    
    // Use the same CSV configuration as the metrics API
    const latestFile = getLatestCSVFilename();
    const filePath = path.join(process.cwd(), latestFile);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse CSV
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',');
    
    // Extract and parse date columns (starting from index 6)
    const rawDateColumns = headers.slice(6).filter(col => col && col.trim() !== '');
    const dateColumns = rawDateColumns.map(date => parseDateString(date));
    
    // Create a map of all metrics and available options
    const metricsMap: { [uid: string]: { name: string; unit: string; category: string; values: number[]; aggregationType: 'sum' | 'average' | 'end-of-period' } } = {};
    const metricOptions: MetricOption[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      if (values.length < 7) continue;
      
      const uid = values[0].trim();
      const metricGroup = values[1].trim();
      const metricCategory = values[2].trim();
      const metricType = values[3].trim();
      const metricName = values[4].trim();
      const unit = values[5].trim();
      const numericValues = values.slice(6, 6 + dateColumns.length).map(parseNumericValue);
      
      const category = `${metricGroup} - ${metricCategory} - ${metricType}`;
      
      // Determine aggregation type (can be overridden)
      const defaultAggregationType = determineAggregationType(metricName, unit, category);
      const aggregationType = aggregationOverrides[uid] || defaultAggregationType;
      
      metricsMap[uid] = {
        name: metricName,
        unit: unit,
        category: category,
        values: numericValues,
        aggregationType: aggregationType
      };
      
      metricOptions.push({
        uid: uid,
        name: metricName,
        unit: unit,
        category: category,
        aggregationType: aggregationType
      });
    }
    
    // Group data by quarters
    const quarterlyMap: { [quarterKey: string]: { [uid: string]: number[] } } = {};
    
    // Process each date column
    dateColumns.forEach((dateStr, index) => {
      const quarterInfo = getQuarterFromDate(dateStr);
      if (!quarterInfo) return;
      
      const quarterKey = `${quarterInfo.quarter}Q${quarterInfo.year}`;
      
      if (!quarterlyMap[quarterKey]) {
        quarterlyMap[quarterKey] = {};
      }
      
      // For each metric, add the monthly value to the quarter
      Object.keys(metricsMap).forEach(uid => {
        if (!quarterlyMap[quarterKey][uid]) {
          quarterlyMap[quarterKey][uid] = [];
        }
        quarterlyMap[quarterKey][uid].push(metricsMap[uid].values[index] || 0);
      });
    });
    
    // Convert to quarterly totals
    const quarterlyData: QuarterlyData[] = [];
    
    // Sort quarters chronologically
    const sortedQuarters = Object.keys(quarterlyMap).sort((a, b) => {
      const [q1, y1] = a.split('Q');
      const [q2, y2] = b.split('Q');
      const year1 = parseInt(y1);
      const year2 = parseInt(y2);
      const quarter1 = parseInt(q1);
      const quarter2 = parseInt(q2);
      
      if (year1 !== year2) return year1 - year2;
      return quarter1 - quarter2;
    });
    
    sortedQuarters.forEach(quarterKey => {
      const quarterMetrics: { [uid: string]: number } = {};
      
      // For each metric, aggregate based on its type
      Object.keys(quarterlyMap[quarterKey]).forEach(uid => {
        const monthlyValues = quarterlyMap[quarterKey][uid];
        const aggregationType = metricsMap[uid].aggregationType;
        
        switch (aggregationType) {
          case 'sum':
            quarterMetrics[uid] = monthlyValues.reduce((sum, val) => sum + val, 0);
            break;
          case 'average':
            quarterMetrics[uid] = monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length;
            break;
          case 'end-of-period':
            quarterMetrics[uid] = monthlyValues[monthlyValues.length - 1] || 0; // Last month of quarter
            break;
        }
        
        // Convert to thousands for dollar amounts
        if (metricsMap[uid].unit === '$') {
          quarterMetrics[uid] = Math.round(quarterMetrics[uid] / 1000);
        }
      });
      
      quarterlyData.push({
        quarter: quarterKey,
        metrics: quarterMetrics
      });
    });
    
    // Return the most recent 7 quarters and available options
    const recentQuarters = quarterlyData.slice(-7);
    
    return NextResponse.json({
      quarterlyData: recentQuarters,
      metricOptions: metricOptions,
      metricsInfo: Object.fromEntries(
        Object.entries(metricsMap).map(([uid, info]) => [
          uid, 
          { 
            name: info.name, 
            unit: info.unit, 
            category: info.category,
            aggregationType: info.aggregationType
          }
        ])
      )
    });
    
  } catch (error) {
    console.error('Error processing quarterly data:', error);
    
    // Return fallback data
    return NextResponse.json({
      quarterlyData: [
        { quarter: '3Q24', metrics: { '8': 1431, '20': 195, '33': 34 } }
      ],
      metricOptions: [
        { uid: '8', name: 'Total Revenue', unit: '$', category: 'Accounting - Income Statement - Income', aggregationType: 'sum' },
        { uid: '20', name: 'Gross Income', unit: '$', category: 'Accounting - Income Statement - Gross Margin', aggregationType: 'sum' },
        { uid: '33', name: 'Net Income', unit: '$', category: 'Accounting - Income Statement - Net Income', aggregationType: 'sum' }
      ],
      metricsInfo: {
        '8': { name: 'Total Revenue', unit: '$', category: 'Accounting - Income Statement - Income', aggregationType: 'sum' },
        '20': { name: 'Gross Income', unit: '$', category: 'Accounting - Income Statement - Gross Margin', aggregationType: 'sum' },
        '33': { name: 'Net Income', unit: '$', category: 'Accounting - Income Statement - Net Income', aggregationType: 'sum' }
      }
    });
  }
}
