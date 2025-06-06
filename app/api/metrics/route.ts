import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define types for our data structure
type MetricValue = {
  uid: string;
  metricGroup: string;
  metricCategory: string;
  metricType: string;
  metricName: string;
  unit: string;
  values: string[];
};

type HierarchicalData = {
  [group: string]: {
    [category: string]: {
      [type: string]: {
        [name: string]: {
          uid: string;
          unit: string;
          values: string[];
        };
      };
    };
  };
};

// Function to convert Excel date number to a readable date string
function excelDateToString(excelDate: number): string {
  // Excel dates are number of days since December 30, 1899
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  const month = date.getMonth() + 1; // getMonth() is zero-based
  const year = date.getFullYear();
  return `${year}-${month.toString().padStart(2, '0')}`;
}

// Function to parse date strings in M/D/YYYY format
function parseDateString(dateStr: string): string {
  const trimmed = dateStr.trim();
  
  // Check if it's in M/D/YYYY format first
  const dateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]);
    const year = parseInt(dateMatch[3]);
    return `${year}-${month.toString().padStart(2, '0')}`;
  }
  
  // Check if it's an Excel date number (only if it's purely numeric and reasonable range)
  const excelDate = parseInt(trimmed);
  if (!isNaN(excelDate) && trimmed === excelDate.toString() && excelDate > 1000) {
    return excelDateToString(excelDate);
  }
  
  // Return as-is if it doesn't match known formats
  return trimmed;
}

export async function GET() {
  try {
    // Find the latest metrics file
    const directory = process.cwd();
    const files = fs.readdirSync(directory)
      .filter(file => file.startsWith('10X Business Metrics') && file.endsWith('.csv'))
      .sort(); // Sort alphabetically, which should put the latest version last
    
    if (files.length === 0) {
      throw new Error('No metrics files found');
    }
    
    // Use the latest file (last in the sorted array)
    const latestFile = files[files.length - 1];
    console.log(`Using latest metrics file: ${latestFile}`);
    
    const filePath = path.join(directory, latestFile);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse CSV
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',');
    
    // Extract date columns (starting from index 6)
    const dateColumns = headers.slice(6)
      .map(date => parseDateString(date))
      .filter(date => date && date.trim() !== ''); // Filter out empty columns
    
    // Parse the data rows
    const data: MetricValue[] = lines.slice(1)
      .map(line => {
        const values = line.split(',');
        if (values.length < 7) return null; // Skip incomplete rows
        
        return {
          uid: values[0].trim(),
          metricGroup: values[1].trim(),
          metricCategory: values[2].trim(),
          metricType: values[3].trim(),
          metricName: values[4].trim(),
          unit: values[5].trim(),
          values: values.slice(6, 6 + dateColumns.length).map(v => {
            // Handle quoted values (like "$1,234")
            if (v.trim().startsWith('"') && v.trim().endsWith('"')) {
              return v.trim().replace(/[""$,\s]/g, '');
            }
            return v.trim();
          })
        };
      })
      .filter((item): item is MetricValue => item !== null); // Type guard to filter out nulls
    
    // Create a hierarchical structure
    const hierarchicalData: HierarchicalData = {};
    
    data.forEach(item => {
      if (!hierarchicalData[item.metricGroup]) {
        hierarchicalData[item.metricGroup] = {};
      }
      
      if (!hierarchicalData[item.metricGroup][item.metricCategory]) {
        hierarchicalData[item.metricGroup][item.metricCategory] = {};
      }
      
      if (!hierarchicalData[item.metricGroup][item.metricCategory][item.metricType]) {
        hierarchicalData[item.metricGroup][item.metricCategory][item.metricType] = {};
      }
      
      hierarchicalData[item.metricGroup][item.metricCategory][item.metricType][item.metricName] = {
        uid: item.uid,
        unit: item.unit,
        values: item.values
      };
    });
    
    // For backward compatibility, also provide the flat rows format
    const rows = [
      ['', ...dateColumns], // Header row
      ...data.map(item => [item.metricName, ...item.values])
    ];

    return NextResponse.json({ 
      rows,
      hierarchicalData,
      dateColumns,
      flatData: data
    });
  } catch (error) {
    console.error('Error reading metrics file:', error);
    return NextResponse.json(
      { error: 'Failed to read metrics data' },
      { status: 500 }
    );
  }
}
