import { MetricValue } from '@/types/metrics';

// Define the types of charts we support
export type ChartType = 'line' | 'bar' | 'pie' | 'area';

// Structure for visualization data
export interface VisualizationData {
  chartType: ChartType;
  title: string;
  metrics: string[];
  data: any[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  timePeriod?: string;
}

// Helper function to detect chart type from AI response
export function detectChartType(response: string): ChartType | null {
  const lineChartPatterns = [
    /line chart/i,
    /line graph/i,
    /trend(s)? (chart|graph)/i,
    /time series/i
  ];
  
  const barChartPatterns = [
    /bar chart/i,
    /bar graph/i,
    /column chart/i,
    /histogram/i,
    /comparative bar/i
  ];
  
  const pieChartPatterns = [
    /pie chart/i,
    /donut chart/i,
    /circular chart/i,
    /distribution chart/i
  ];
  
  const areaChartPatterns = [
    /area chart/i,
    /stacked area/i,
    /cumulative area/i
  ];
  
  if (lineChartPatterns.some(pattern => pattern.test(response))) {
    return 'line';
  }
  
  if (barChartPatterns.some(pattern => pattern.test(response))) {
    return 'bar';
  }
  
  if (pieChartPatterns.some(pattern => pattern.test(response))) {
    return 'pie';
  }
  
  if (areaChartPatterns.some(pattern => pattern.test(response))) {
    return 'area';
  }
  
  // Default to line chart if we can't detect a specific type
  return null;
}

// Helper function to extract metric names from AI response
export function extractMetrics(response: string): string[] {
  const metrics: string[] = [];
  
  // Common metrics to look for
  const commonMetrics = [
    'Total Revenue',
    'Total COGS',
    'Gross Income',
    '% Gross Income',
    'Net Income',
    'Total Orders',
    'Tons Sold',
    'Product Revenue',
    'Average Price'
  ];
  
  // Check for each common metric in the response
  commonMetrics.forEach(metric => {
    if (response.includes(metric)) {
      metrics.push(metric);
    }
  });
  
  return metrics;
}

// Helper function to extract time period from AI response
export function extractTimePeriod(response: string): string | null {
  const timePatterns = [
    /last (\d+) months/i,
    /past (\d+) months/i,
    /(\d+) month period/i,
    /from (\w+ \d{4}) to (\w+ \d{4})/i,
    /between (\w+ \d{4}) and (\w+ \d{4})/i
  ];
  
  for (const pattern of timePatterns) {
    const match = response.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

// Main function to parse AI response and extract visualization data
export function parseResponseForVisualization(
  response: string,
  metricsData: MetricValue[],
  dateColumns: string[]
): VisualizationData | null {
  // Detect chart type
  const chartType = detectChartType(response);
  if (!chartType) {
    return null;
  }
  
  // Extract metrics
  const metrics = extractMetrics(response);
  if (metrics.length === 0) {
    return null;
  }
  
  // Extract time period
  const timePeriod = extractTimePeriod(response);
  
  // Generate title based on metrics and chart type
  const title = `${metrics.join(' & ')} ${chartType === 'line' ? 'Trend' : 'Analysis'}`;
  
  // Prepare data for the chart
  const data = prepareChartData(metrics, metricsData, dateColumns);
  
  return {
    chartType,
    title,
    metrics,
    data,
    xAxisLabel: 'Time Period',
    yAxisLabel: metrics.length === 1 ? metrics[0] : 'Value',
    timePeriod: timePeriod || undefined
  };
}

// Helper function to prepare data for the chart
function prepareChartData(
  metricNames: string[],
  metricsData: MetricValue[],
  dateColumns: string[]
): any[] {
  // Find the metrics in the data
  const metricValues = metricNames.map(name => {
    return metricsData.find(m => m.metricName === name);
  }).filter(Boolean) as MetricValue[];
  
  if (metricValues.length === 0) {
    return [];
  }
  
  // Transform the data into a format suitable for Recharts
  return dateColumns.map((date, index) => {
    const dataPoint: any = { name: date };
    
    metricValues.forEach(metric => {
      if (metric && metric.values[index]) {
        // Try to parse as number, fallback to string if not a valid number
        const value = parseFloat(metric.values[index]);
        dataPoint[metric.metricName] = isNaN(value) ? metric.values[index] : value;
      }
    });
    
    return dataPoint;
  });
}

// Function to export chart data as CSV
export function exportAsCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }
  
  // Get all column names
  const columns = Object.keys(data[0]);
  
  // Create CSV header row
  const header = columns.join(',');
  
  // Create CSV data rows
  const rows = data.map(item => {
    return columns.map(column => {
      const value = item[column];
      // Handle values that might contain commas
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    }).join(',');
  });
  
  // Combine header and rows
  return [header, ...rows].join('\n');
}
