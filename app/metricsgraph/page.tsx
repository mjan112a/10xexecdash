'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

// Generate a color for each metric
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

// Metric categories
const categories = {
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
  'Business Metrics': [
    'Professional Fees',
    'Sales & Marketing',
    'Overhead Labor',
    'Benefits',
    'Accounting',
    'Equipment Rental',
    'Tax',
    'Insurance'
  ]
};

export default function MetricsGraph() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any>(null);

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
          
          const datasets = selectedMetrics.map((metric, index) => {
            const row = data.rows.find((r: string[]) => r[0] === metric);
            const values = row ? row.slice(1, 13).map(parseValue) : [];
            
            return {
              label: metric,
              data: values,
              borderColor: colors[index % colors.length],
              backgroundColor: colors[index % colors.length],
              tension: 0.1
            };
          });

          setChartData({
            labels: months,
            datasets
          });
        });
    } else {
      setChartData(null);
    }
  }, [selectedMetrics]);

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Metrics Visualization</h1>
        <a 
          href="/salesdata"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back to Sales Data
        </a>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-3">Select Metrics</h2>
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
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                  display: true,
                },
                title: {
                  display: true,
                  text: 'Monthly Trends'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        ) : (
          <div className="text-center text-gray-500 py-12">
            Select one or more metrics to display the chart
          </div>
        )}
      </div>
    </div>
  );
}