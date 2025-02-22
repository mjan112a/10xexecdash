'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Define type for categories
type CategoryMap = {
  [key: string]: string[];
};

// Reuse the categories from the original implementation
const categories: CategoryMap = {
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

// Generate colors for metrics
const colors = [
  'rgb(75, 192, 192)',   // teal
  'rgb(255, 99, 132)',   // pink
  'rgb(54, 162, 235)',   // blue
  'rgb(255, 206, 86)',   // yellow
  'rgb(153, 102, 255)',  // purple
  'rgb(255, 159, 64)',   // orange
  'rgb(75, 192, 100)',   // green
  'rgb(255, 99, 71)',    // red
];

// Function to parse numeric values
function parseValue(value: string): number {
  // Remove quotes, spaces, and currency symbols
  const cleanValue = value.replace(/[""$,\s]/g, '');
  // Remove parentheses and make negative
  if (cleanValue.startsWith('(') && cleanValue.endsWith(')')) {
    return -Number(cleanValue.slice(1, -1));
  }
  return Number(cleanValue);
}

export default function DynamicMetrics() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [selectedChart, setSelectedChart] = useState('line');

  // Available chart types
  const chartTypes = ['line', 'bar', 'pie'];

  useEffect(() => {
    // Read and parse the metrics file
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => {
        // Extract available metrics (first column values)
        const metrics = data.rows
          .filter((row: string[]) => row[0] && !row[0].includes('2024') && !row[0].includes('2025'))
          .map((row: string[]) => row[0]);
        setAvailableMetrics(metrics);
      });
  }, []);

  useEffect(() => {
    if (selectedMetrics.length > 0) {
      fetch('/api/metrics')
        .then(res => res.json())
        .then(data => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          if (selectedChart === 'pie') {
            // For pie chart, we'll use the latest month's data
            const latestData = selectedMetrics.map((metric, index) => {
              const row = data.rows.find((r: string[]) => r[0] === metric);
              const value = row ? parseValue(row[1]) : 0; // Use first month's data
              
              return {
                name: metric,
                value: Math.abs(value), // Use absolute value for pie chart
                fill: colors[index % colors.length]
              };
            });
            setChartData(latestData);
          } else {
            // For line and bar charts, use time series data
            const timeSeriesData = months.map((month, i) => {
              const monthData: any = { name: month };
              selectedMetrics.forEach((metric, index) => {
                const row = data.rows.find((r: string[]) => r[0] === metric);
                monthData[metric] = row ? parseValue(row[i + 1]) : 0;
              });
              return monthData;
            });
            setChartData(timeSeriesData);
          }
        });
    } else {
      setChartData(null);
    }
  }, [selectedMetrics, selectedChart]);

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  // Function to render the appropriate chart based on selection
  const renderChart = () => {
    if (!chartData) return null;

    switch (selectedChart) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetrics.map((metric, index) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={colors[index % colors.length]}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetrics.map((metric, index) => (
                <Bar
                  key={metric}
                  dataKey={metric}
                  fill={colors[index % colors.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Dynamic Metrics Visualization</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-medium text-blue-800 mb-2">About This Graph</h2>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              This enhanced visualization allows you to analyze metrics using different chart types.
              Select your metrics and choose between line, bar, and pie charts for different perspectives.
            </p>
            <ul className="list-disc list-inside">
              <li>Line charts show trends over time</li>
              <li>Bar charts are great for comparisons</li>
              <li>Pie charts display proportional relationships</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Chart Type:
        </label>
        <select
          value={selectedChart}
          onChange={(e) => setSelectedChart(e.target.value)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {chartTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)} Chart
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-700">Select Metrics</h2>
          <div className="flex gap-3">
            <div className="flex flex-wrap gap-3">
              {Object.keys(categories).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedMetrics(categories[category])}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {category}
                </button>
              ))}
              <button
                onClick={() => setSelectedMetrics([])}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(categories).map(([category, metrics]) => (
            <div key={category} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-900 mb-3">{category}</h3>
              <div className="space-y-2">
                {metrics.map((metric) => (
                  <label 
                    key={`${category}-${metric}`}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric)}
                      onChange={() => handleMetricToggle(metric)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{metric}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        {chartData ? (
          renderChart()
        ) : (
          <div className="text-center text-gray-500 py-12">
            Select one or more metrics to display the chart
          </div>
        )}
      </div>
    </div>
  );
}
