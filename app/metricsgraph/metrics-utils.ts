// Utility functions for metrics data processing

/**
 * Parse a string value to a number, handling special formats
 * @param value The string value to parse
 * @returns The parsed number value
 */
export function parseValue(value: string): number {
  // Remove quotes, spaces, and currency symbols
  const cleanValue = value.replace(/[""$,\s]/g, '');
  
  // Remove parentheses and make negative
  if (cleanValue.startsWith('(') && cleanValue.endsWith(')')) {
    return -Number(cleanValue.slice(1, -1));
  }
  
  return Number(cleanValue);
}

/**
 * Format a value for display based on its unit and type
 * @param value The numeric value to format
 * @param unit The unit of the value (e.g., '$', '%', etc.)
 * @param metricName The name of the metric
 * @returns Formatted string value
 */
export function formatDisplayValue(value: number, unit: string, metricName: string): string {
  // Handle ratios
  if (unit.toLowerCase().includes('ratio') || metricName.toLowerCase().includes('ratio')) {
    return value.toFixed(2);
  }

  // Handle percentages
  if (unit === '%' || metricName.includes('GM') || metricName.includes('OM')) {
    if (value >= -1 && value <= 1 && value !== 0) {
      value = value * 100;
    }
    return `${value.toFixed(1)}%`;
  }

  // Handle currency values
  if (unit === '$' || metricName.includes('Price') || metricName.includes('Revenue')) {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  }
  
  // Handle counts (orders, tons, etc.)
  if (metricName.includes('Orders') || metricName.includes('Tons')) {
    return value.toLocaleString();
  }
  
  // Default formatting
  return value.toString();
}

/**
 * Format a value for tooltip display with more precision
 * @param value The numeric value to format
 * @param unit The unit of the value
 * @param metricName The name of the metric
 * @returns Formatted string value for tooltip
 */
export function formatTooltipValue(value: number, unit: string, metricName: string): string {
  // Handle percentages
  if (unit === '%' || metricName.includes('GM') || metricName.includes('OM')) {
    return `${value.toFixed(2)}%`;
  }
  
  // Handle currency values
  if (unit === '$' || metricName.includes('Price') || metricName.includes('Revenue')) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
  
  // Handle counts (orders, tons, etc.)
  if (metricName.includes('Orders') || metricName.includes('Tons')) {
    return value.toLocaleString();
  }
  
  // Default formatting
  return value.toString();
}

/**
 * Calculate the percentage change between two values
 * @param current The current value
 * @param previous The previous value
 * @returns The percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Generate a color for a metric based on its index
 * @param index The index of the metric
 * @returns A color string in rgb format
 */
export function getMetricColor(index: number): string {
  const colors = [
    'rgb(75, 192, 192)',   // teal
    'rgb(255, 99, 132)',   // pink
    'rgb(54, 162, 235)',   // blue
    'rgb(255, 206, 86)',   // yellow
    'rgb(153, 102, 255)',  // purple
    'rgb(255, 159, 64)',   // orange
    'rgb(75, 192, 100)',   // green
    'rgb(255, 99, 71)',    // red
    'rgb(201, 203, 207)',  // grey
    'rgb(0, 128, 128)',    // dark teal
    'rgb(220, 20, 60)',    // crimson
    'rgb(0, 0, 139)',      // dark blue
  ];
  
  return colors[index % colors.length];
}

/**
 * Get the appropriate y-axis title based on the metric
 * @param metricName The name of the metric
 * @param unit The unit of the metric
 * @returns The y-axis title
 */
export function getYAxisTitle(metricName: string, unit: string): string {
  if (metricName.includes('Orders')) {
    return 'Number of Orders';
  }
  
  if (metricName.includes('Tons')) {
    return 'Tons';
  }
  
  if (unit === '%' || metricName.includes('GM') || metricName.includes('OM')) {
    return 'Percentage (%)';
  }
  
  if (unit === '$' || metricName.includes('Price') || metricName.includes('Revenue')) {
    return 'Amount (USD)';
  }
  
  return 'Value';
}
