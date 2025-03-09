'use client';

import React from 'react';
import { useMetrics } from '../metrics-context';
import { parseValue } from '../metrics-utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Simple linear regression function
function linearRegression(y: number[]): { slope: number; intercept: number } {
  const n = y.length;
  const x = Array.from({ length: n }, (_, i) => i);
  
  // Calculate means
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate slope
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (y[i] - yMean);
    denominator += Math.pow(x[i] - xMean, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  
  return { slope, intercept };
}

// Function to predict future values
function predictFutureValues(values: number[], periods: number): number[] {
  const { slope, intercept } = linearRegression(values);
  const lastIndex = values.length - 1;
  
  return Array.from({ length: periods }, (_, i) => {
    const predictedValue = slope * (lastIndex + i + 1) + intercept;
    return Math.max(0, predictedValue); // Ensure non-negative values
  });
}

export default function ForecastDisplay() {
  const { selectedMetrics, dateColumns, timeFrame } = useMetrics();
  const forecastPeriods = 3; // Number of periods to forecast
  
  // Generate forecast data
  const forecastData = React.useMemo(() => {
    if (selectedMetrics.length === 0) return [];
    
    // Get historical data
    const historicalData = dateColumns.map((date, i) => {
      const dataPoint: any = { name: date };
      
      selectedMetrics.forEach(metric => {
        dataPoint[metric.fullPath.name] = parseValue(metric.values[i]);
      });
      
      return dataPoint;
    });
    
    // Generate forecast periods
    const lastDate = dateColumns[dateColumns.length - 1];
    const lastDateParts = lastDate.split('-');
    
    // Generate future period labels based on time frame
    const futurePeriods = Array.from({ length: forecastPeriods }, (_, i) => {
      if (timeFrame === 'monthly') {
        const month = parseInt(lastDateParts[0]);
        const year = parseInt(lastDateParts[1]);
        const newMonth = (month + i + 1) % 12 || 12;
        const newYear = year + Math.floor((month + i + 1 - 1) / 12);
        return `${newMonth.toString().padStart(2, '0')}-${newYear}`;
      } else if (timeFrame === 'quarterly') {
        const quarter = parseInt(lastDateParts[0].substring(1));
        const year = parseInt(lastDateParts[1]);
        const newQuarter = ((quarter + i) % 4) + 1;
        const newYear = year + Math.floor((quarter + i) / 4);
        return `Q${newQuarter}-${newYear}`;
      } else {
        // Yearly
        const year = parseInt(lastDateParts[0]);
        return `${year + i + 1}`;
      }
    });
    
    // Generate forecast values for each metric
    const forecastPoints = futurePeriods.map((period, i) => {
      const dataPoint: any = { name: period, isForecast: true };
      
      selectedMetrics.forEach(metric => {
        const historicalValues = metric.values.map(v => parseValue(v));
        const forecastValues = predictFutureValues(historicalValues, forecastPeriods);
        dataPoint[metric.fullPath.name] = forecastValues[i];
      });
      
      return dataPoint;
    });
    
    // Mark historical data
    historicalData.forEach(point => {
      point.isForecast = false;
    });
    
    return [...historicalData, ...forecastPoints];
  }, [selectedMetrics, dateColumns, timeFrame]);
  
  if (selectedMetrics.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Forecast Analysis</h3>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-yellow-700">
          This forecast is based on simple linear regression of historical data. 
          Future values are predictions and may not reflect actual outcomes.
        </p>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={forecastData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: any, name: any) => {
              // Extract the base name without the suffix
              const baseName = String(name).replace(/ \(Historical\)| \(Forecast\)/, '');
              const isForecast = String(name).includes('(Forecast)');
              
              // Format the value
              const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
              return [`${formattedValue} ${isForecast ? '(Predicted)' : ''}`, baseName];
            }} />
            <Legend 
              layout="horizontal"
              verticalAlign="top"
              align="center"
              wrapperStyle={{ paddingBottom: 10 }}
              formatter={(value: any) => {
                // Simplify legend labels by removing the suffix
                return String(value).replace(/ \(Historical\)| \(Forecast\)/, '');
              }}
            />
            {selectedMetrics.map((metric, index) => {
              const color = `hsl(${index * 30}, 70%, 50%)`;
              
              // Create a single entry in the legend for each metric
              return [
                // Historical data line (solid)
                <Line
                  key={`${metric.uid}-historical`}
                  type="monotone"
                  dataKey={metric.fullPath.name}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                  name={metric.fullPath.name}
                  connectNulls={true}
                  isAnimationActive={false}
                  data={forecastData.filter(d => !d.isForecast)}
                />,
                // Forecast data line (dashed) - hidden from legend
                <Line
                  key={`${metric.uid}-forecast`}
                  type="monotone"
                  dataKey={metric.fullPath.name}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: 'white', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  name={`${metric.fullPath.name} (Forecast)`}
                  connectNulls={true}
                  isAnimationActive={false}
                  data={forecastData.filter(d => d.isForecast)}
                  // Hide this from the legend
                  legendType="none"
                />
              ];
            }).flat()}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
