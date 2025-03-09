'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { MonthData } from '../metrics-relationships/relationship-engine';

// Define colors for charts
const COLORS = [
  '#8884d8', // purple
  '#82ca9d', // green
  '#ffc658', // yellow
  '#ff8042', // orange
  '#0088fe', // blue
  '#00c49f', // teal
  '#ffbb28', // amber
  '#ff8042', // coral
  '#a4de6c', // lime
];

interface TimeSeriesChartProps {
  originalData: MonthData[];
  adjustedData: MonthData[];
  selectedMetrics: string[];
  chartType?: 'line' | 'bar' | 'area';
  showComparison?: boolean;
}

export default function TimeSeriesChart({
  originalData,
  adjustedData,
  selectedMetrics,
  chartType = 'line',
  showComparison = true
}: TimeSeriesChartProps) {
  // Prepare chart data
  const chartData = originalData.map((originalMonth, index) => {
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
        
      if (showComparison) {
        result[`${metric} (Adjusted)`] = typeof adjustedValue === 'number' 
          ? adjustedValue 
          : parseFloat(adjustedValue as string) || 0;
      }
    });
    
    return result;
  });
  
  // No metrics selected
  if (selectedMetrics.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-500">Select one or more metrics to display</p>
      </div>
    );
  }
  
  // Render the appropriate chart type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return renderBarChart();
      case 'area':
        return renderAreaChart();
      case 'line':
      default:
        return renderLineChart();
    }
  };
  
  // Render a line chart
  const renderLineChart = () => (
    <LineChart data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      {selectedMetrics.flatMap((metric, index) => {
        const metricColor = COLORS[index % COLORS.length];
        
        const lines = [
          <Line
            key={`${metric}-actual`}
            type="monotone"
            dataKey={`${metric} (Actual)`}
            stroke={metricColor}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
          />
        ];
        
        if (showComparison) {
          lines.push(
            <Line
              key={`${metric}-adjusted`}
              type="monotone"
              dataKey={`${metric} (Adjusted)`}
              stroke={metricColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
          );
        }
        
        return lines;
      })}
    </LineChart>
  );
  
  // Render a bar chart
  const renderBarChart = () => (
    <BarChart data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      {selectedMetrics.flatMap((metric, index) => {
        const metricColor = COLORS[index % COLORS.length];
        
        const bars = [
          <Bar
            key={`${metric}-actual`}
            dataKey={`${metric} (Actual)`}
            fill={metricColor}
            fillOpacity={0.8}
          />
        ];
        
        if (showComparison) {
          bars.push(
            <Bar
              key={`${metric}-adjusted`}
              dataKey={`${metric} (Adjusted)`}
              fill={metricColor}
              fillOpacity={0.4}
              stroke={metricColor}
              strokeWidth={1}
            />
          );
        }
        
        return bars;
      })}
    </BarChart>
  );
  
  // Render an area chart
  const renderAreaChart = () => (
    <AreaChart data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      {selectedMetrics.flatMap((metric, index) => {
        const metricColor = COLORS[index % COLORS.length];
        
        const areas = [
          <Area
            key={`${metric}-actual`}
            type="monotone"
            dataKey={`${metric} (Actual)`}
            fill={metricColor}
            stroke={metricColor}
            fillOpacity={0.6}
          />
        ];
        
        if (showComparison) {
          areas.push(
            <Area
              key={`${metric}-adjusted`}
              type="monotone"
              dataKey={`${metric} (Adjusted)`}
              fill={metricColor}
              stroke={metricColor}
              fillOpacity={0.3}
              strokeDasharray="5 5"
            />
          );
        }
        
        return areas;
      })}
    </AreaChart>
  );
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Metrics Visualization</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>
          {showComparison 
            ? 'Solid lines/bars represent actual values, dashed/lighter ones represent adjusted values' 
            : 'Showing actual values only'}
        </span>
        <span>
          {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''} selected
        </span>
      </div>
    </div>
  );
}
