/**
 * The relationship engine is responsible for calculating derived metrics
 * based on adjustments to base metrics. It ensures that all metrics are
 * calculated in the correct order based on their dependencies.
 */

import { BASE_METRICS, formatMetricValue } from './base-metrics';
import { 
  DERIVED_METRICS_MAP, 
  getCalculationOrder, 
  ALL_METRICS 
} from './derived-metrics';

// Type for a single month's data
export interface MonthData {
  month: string;
  [key: string]: string | number;
}

// Type for adjustments to base metrics
export interface MetricAdjustment {
  metric: string;
  type: 'percentage' | 'absolute';
  value: number;
}

// Type for a scenario that can be saved and loaded
export interface Scenario {
  id: string;
  name: string;
  description?: string;
  adjustments: Record<string, MetricAdjustment[]>;
  createdAt: string;
}

/**
 * Calculate all derived metrics based on the current values of base metrics
 * @param monthData The current month's data
 * @returns A new object with all metrics calculated
 */
export function calculateDerivedMetrics(monthData: Record<string, number>): Record<string, number> {
  const result = { ...monthData };
  const calculationOrder = getCalculationOrder();
  
  // Calculate each derived metric in the correct order
  calculationOrder.forEach(metricName => {
    const metricDef = DERIVED_METRICS_MAP.get(metricName);
    if (metricDef) {
      result[metricName] = metricDef.calculator(result);
    }
  });
  
  return result;
}

/**
 * Apply adjustments to base metrics and recalculate derived metrics
 * @param originalData The original data for all months
 * @param adjustments The adjustments to apply to base metrics
 * @returns New data with adjustments applied and derived metrics recalculated
 */
export function applyAdjustments(
  originalData: MonthData[],
  adjustments: Record<string, MetricAdjustment[]>
): MonthData[] {
  // Create a deep copy of the original data
  const result = JSON.parse(JSON.stringify(originalData)) as MonthData[];
  
  // Apply adjustments to each month
  result.forEach((monthData, index) => {
    const month = monthData.month as string;
    const monthAdjustments = adjustments[month] || [];
    
    // Convert string values to numbers for calculation
    const numericData: Record<string, number> = {};
    ALL_METRICS.forEach(metric => {
      const value = monthData[metric];
      numericData[metric] = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    });
    
    // Apply adjustments to base metrics
    monthAdjustments.forEach(adjustment => {
      const { metric, type, value } = adjustment;
      
      // Only adjust base metrics
      if (BASE_METRICS.includes(metric)) {
        const originalValue = numericData[metric];
        
        if (type === 'percentage') {
          // Apply percentage adjustment
          numericData[metric] = originalValue * (1 + value / 100);
        } else {
          // Apply absolute adjustment
          numericData[metric] = value;
        }
      }
    });
    
    // Recalculate derived metrics
    const calculatedData = calculateDerivedMetrics(numericData);
    
    // Update the month data with calculated values
    Object.entries(calculatedData).forEach(([metric, value]) => {
      monthData[metric] = value;
    });
  });
  
  return result;
}

/**
 * Create a new scenario with the given adjustments
 * @param name The name of the scenario
 * @param adjustments The adjustments to apply to base metrics
 * @param description Optional description of the scenario
 * @returns A new scenario object
 */
export function createScenario(
  name: string,
  adjustments: Record<string, MetricAdjustment[]>,
  description?: string
): Scenario {
  return {
    id: `scenario-${Date.now()}`,
    name,
    description,
    adjustments,
    createdAt: new Date().toISOString()
  };
}

/**
 * Get the impact of adjustments on metrics
 * @param originalData The original data for a month
 * @param adjustedData The adjusted data for a month
 * @returns An object with the impact on each metric
 */
export function getMetricImpact(
  originalData: Record<string, number>,
  adjustedData: Record<string, number>
): Record<string, { original: number; adjusted: number; change: number; percentChange: string }> {
  const impact: Record<string, { original: number; adjusted: number; change: number; percentChange: string }> = {};
  
  ALL_METRICS.forEach(metric => {
    const original = originalData[metric] || 0;
    const adjusted = adjustedData[metric] || 0;
    const change = adjusted - original;
    const percentChange = original !== 0 
      ? `${(change / Math.abs(original) * 100).toFixed(1)}%` 
      : (adjusted > 0 ? '+∞%' : '0%');
    
    impact[metric] = {
      original,
      adjusted,
      change,
      percentChange: change >= 0 ? `+${percentChange}` : percentChange
    };
  });
  
  return impact;
}

/**
 * Format the data for display in a table
 * @param data The data to format
 * @returns Formatted data for display
 */
export function formatDataForDisplay(data: MonthData[]): MonthData[] {
  return data.map(monthData => {
    const result: MonthData = { month: monthData.month as string };
    
    ALL_METRICS.forEach(metric => {
      const value = monthData[metric];
      const numericValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
      result[metric] = formatMetricValue(numericValue, metric);
    });
    
    return result;
  });
}

/**
 * Format the data for a chart
 * @param originalData The original data
 * @param adjustedData The adjusted data
 * @param selectedMetrics The metrics to include in the chart
 * @returns Formatted data for a chart
 */
export function formatDataForChart(
  originalData: MonthData[],
  adjustedData: MonthData[],
  selectedMetrics: string[]
): any[] {
  return originalData.map((originalMonth, index) => {
    const adjustedMonth = adjustedData[index];
    const result: Record<string, any> = {
      name: originalMonth.month,
    };
    
    selectedMetrics.forEach(metric => {
      const originalValue = originalMonth[metric];
      const adjustedValue = adjustedMonth[metric];
      
      result[`${metric} (Actual)`] = typeof originalValue === 'number' 
        ? originalValue 
        : parseFloat(originalValue as string) || 0;
        
      result[`${metric} (Adjusted)`] = typeof adjustedValue === 'number' 
        ? adjustedValue 
        : parseFloat(adjustedValue as string) || 0;
    });
    
    return result;
  });
}
