/**
 * Base metrics are independent variables that can be directly modified by the user.
 * These metrics are not calculated from other metrics but serve as inputs to derived metrics.
 */

export const BASE_METRICS = [
  // Cost of Goods Sold
  'Process Labor',
  'Raw Material',
  'Packaging',
  'Maintenance',
  'Waste',
  'Inventory',
  'Utilities',
  'Shipping',
  
  // SG&A Expenses
  'Professional Fees',
  'Sales & Marketing',
  'Overhead Labor',
  'Benefits',
  'Accounting',
  'Equipment Rental',
  'Tax',
  'Insurance',
  'Office',
  'Banking',
  'R&D',
  'Warehouse',
  'Misc',
  'Legal',
  
  // Business Performance (base metrics)
  'Total Orders',
  'Tons',
  'Product Revenue',
];

// Categorization of metrics for UI organization
export const METRIC_CATEGORIES = {
  'Cost of Goods': [
    'Process Labor',
    'Raw Material',
    'Packaging',
    'Maintenance',
    'Waste',
    'Inventory',
    'Utilities',
    'Shipping',
    'Total COGS'
  ],
  'Unit Metrics': [
    'Unit Process Labor',
    'Unit Raw Material',
    'Unit Packaging',
    'Unit Maintenance',
    'Unit Waste',
    'Unit Inventory',
    'Unit Utilities',
    'Unit Shipping',
    'Total Unit COGS'
  ],
  'SG&A Expenses': [
    'Professional Fees',
    'Sales & Marketing',
    'Overhead Labor',
    'Benefits',
    'Accounting',
    'Equipment Rental',
    'Tax',
    'Insurance',
    'Office',
    'Banking',
    'R&D',
    'Warehouse',
    'Misc',
    'Legal',
    'Total Expenses'
  ],
  'Business Performance': [
    'Total Orders',
    'Tons',
    'Product Revenue',
    'Tons/Order',
    'Revenue/Order',
    'Average Price',
    'Average GM',
    'Average OM',
    '% Average GM',
    '% Average OM'
  ]
};

// Default adjustment ranges for each metric (as percentages)
export const DEFAULT_ADJUSTMENT_RANGES: Record<string, [number, number]> = {
  // Cost of Goods Sold
  'Process Labor': [-30, 30],
  'Raw Material': [-20, 20],
  'Packaging': [-25, 25],
  'Maintenance': [-40, 40],
  'Waste': [-50, 50],
  'Inventory': [-30, 30],
  'Utilities': [-20, 20],
  'Shipping': [-25, 25],
  
  // SG&A Expenses
  'Professional Fees': [-30, 30],
  'Sales & Marketing': [-40, 40],
  'Overhead Labor': [-30, 30],
  'Benefits': [-20, 20],
  'Accounting': [-25, 25],
  'Equipment Rental': [-40, 40],
  'Tax': [-15, 15],
  'Insurance': [-20, 20],
  'Office': [-30, 30],
  'Banking': [-25, 25],
  'R&D': [-50, 50],
  'Warehouse': [-30, 30],
  'Misc': [-40, 40],
  'Legal': [-35, 35],
  
  // Business Performance (base metrics)
  'Total Orders': [-20, 20],
  'Tons': [-20, 20],
  'Product Revenue': [-20, 20],
};

// Format value for display based on metric type
export function formatMetricValue(value: number | undefined, metric: string): string {
  if (value === undefined || value === null) return '';
  
  if (metric.includes('Price') || metric.includes('Revenue') || metric.includes('GM') || metric.includes('OM')) {
    return value.toFixed(2);
  }
  
  if (metric.includes('%')) {
    return value.toFixed(1);
  }
  
  if (metric.includes('Unit')) {
    return value.toFixed(2);
  }
  
  return value.toFixed(0);
}

// Calculate the percentage change between two values
export function calculatePercentageChange(original: number, current: number): string {
  if (original === 0) return current > 0 ? '+∞%' : '0%';
  
  const percentChange = ((current - original) / Math.abs(original)) * 100;
  return `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
}

// Get the appropriate CSS color class for a change value
export function getChangeColorClass(change: string): string {
  if (change.startsWith('+')) return 'text-green-600';
  if (change.startsWith('-')) return 'text-red-600';
  return 'text-gray-600';
}
