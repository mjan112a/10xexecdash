'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMetrics } from '../metrics-context';
import { parseValue, calculatePercentageChange } from '../metrics-utils';

export default function TrendIndicators() {
  const { selectedMetrics, dateColumns, customDateRange } = useMetrics();

  // Calculate trends for each selected metric
  const trends = React.useMemo(() => {
    if (selectedMetrics.length === 0) return [];

    return selectedMetrics.map(metric => {
      // Get the current and previous period values
      const currentPeriodIndex = customDateRange.end;
      const previousPeriodIndex = Math.max(0, currentPeriodIndex - 1);
      
      const currentValue = parseValue(metric.values[currentPeriodIndex]);
      const previousValue = parseValue(metric.values[previousPeriodIndex]);
      
      // Calculate percentage change
      const percentChange = calculatePercentageChange(currentValue, previousValue);
      
      // Determine trend direction
      let direction: 'up' | 'down' | 'neutral' = 'neutral';
      if (percentChange > 0) direction = 'up';
      else if (percentChange < 0) direction = 'down';
      
      return {
        metric,
        currentValue,
        previousValue,
        percentChange,
        direction,
        currentPeriod: dateColumns[currentPeriodIndex],
        previousPeriod: dateColumns[previousPeriodIndex]
      };
    });
  }, [selectedMetrics, dateColumns, customDateRange]);

  if (selectedMetrics.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Trend Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trends.map((trend, index) => (
          <div key={trend.metric.uid} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-800">{trend.metric.fullPath.name}</h4>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                trend.direction === 'up' 
                  ? 'bg-green-100 text-green-800' 
                  : trend.direction === 'down' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {trend.direction === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                {trend.direction === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                {trend.direction === 'neutral' && <Minus className="h-3 w-3 mr-1" />}
                {Math.abs(trend.percentChange).toFixed(1)}%
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <div className="flex justify-between">
                <span>{trend.previousPeriod}:</span>
                <span className="font-medium">{trend.previousValue.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                })}</span>
              </div>
              <div className="flex justify-between">
                <span>{trend.currentPeriod}:</span>
                <span className="font-medium">{trend.currentValue.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
