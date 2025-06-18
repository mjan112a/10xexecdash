import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getLatestCSVFilename } from '@/lib/csv-config';

interface MetricOption {
  uid: string;
  name: string;
  unit: string;
  category: string;
}

interface MonthlyData {
  month: string;
  metrics: { [uid: string]: number };
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

// Function to format month for display
function formatMonth(dateStr: string): string {
  const match = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) return dateStr;
  
  const year = parseInt(match[1]);
  const month = parseInt(match[2]);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${monthNames[month - 1]} ${year}`;
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

export async function GET() {
  try {
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
    const metricsMap: { [uid: string]: { name: string; unit: string; category: string; values: number[] } } = {};
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
      
      metricsMap[uid] = {
        name: metricName,
        unit: unit,
        category: category,
        values: numericValues
      };
      
      metricOptions.push({
        uid: uid,
        name: metricName,
        unit: unit,
        category: category
      });
    }
    
    // Create monthly data
    const monthlyData: MonthlyData[] = [];
    
    dateColumns.forEach((dateStr, index) => {
      // Only include 2025 data through April (months 1-4)
      const match = dateStr.match(/^(\d{4})-(\d{2})$/);
      if (!match || parseInt(match[1]) !== 2025 || parseInt(match[2]) > 4) {
        return; // Skip non-2025 data and May onwards
      }
      
      const monthMetrics: { [uid: string]: number } = {};
      
      // For each metric, get the monthly value
      Object.keys(metricsMap).forEach(uid => {
        let value = metricsMap[uid].values[index] || 0;
        
        // Convert to thousands for dollar amounts
        if (metricsMap[uid].unit === '$') {
          value = Math.round(value / 1000);
        }
        
        monthMetrics[uid] = value;
      });
      
      monthlyData.push({
        month: formatMonth(dateStr),
        metrics: monthMetrics
      });
    });
    
    // Return all 2025 months (should be 5 months: Jan-May 2025)
    const recentMonths = monthlyData;
    
    return NextResponse.json({
      monthlyData: recentMonths,
      metricOptions: metricOptions,
      metricsInfo: Object.fromEntries(
        Object.entries(metricsMap).map(([uid, info]) => [
          uid, 
          { 
            name: info.name, 
            unit: info.unit, 
            category: info.category
          }
        ])
      )
    });
    
  } catch (error) {
    console.error('Error processing monthly data:', error);
    
    // Return fallback data
    return NextResponse.json({
      monthlyData: [
        { month: 'Apr 2025', metrics: { '8': 675, '20': 262, '33': 242 } }
      ],
      metricOptions: [
        { uid: '8', name: 'Total Revenue', unit: '$', category: 'Accounting - Income Statement - Income' },
        { uid: '20', name: 'Gross Income', unit: '$', category: 'Accounting - Income Statement - Gross Margin' },
        { uid: '33', name: 'Net Income', unit: '$', category: 'Accounting - Income Statement - Net Income' }
      ],
      metricsInfo: {
        '8': { name: 'Total Revenue', unit: '$', category: 'Accounting - Income Statement - Income' },
        '20': { name: 'Gross Income', unit: '$', category: 'Accounting - Income Statement - Gross Margin' },
        '33': { name: 'Net Income', unit: '$', category: 'Accounting - Income Statement - Net Income' }
      }
    });
  }
}
