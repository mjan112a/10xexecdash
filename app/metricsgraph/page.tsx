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
  ],
  'Online Business': [
    'Online Orders',
    'Online Tons',
    'Online Revenue',
    'Online Tons/Order',
    'Online Revenue/Order',
    'Online Avg Price',
    'Online Avg GM',
    'Online Avg OM',
    '% Online Avg GM',
    '% Online Avg OM',
    '% Online Orders',
    '% Online Revenue'
  ],
  'Offline Business': [
    'Offline Orders',
    'Offline Tons',
    'Offline Revenue',
    'Offline Tons/Order',
    'Offline Revenue/Order',
    'Offline Avg Price',
    'Offline Avg GM',
    'Offline Avg OM',
    '% Offline Avg GM',
    '% Offline Avg OM',
    '% Offline Orders',
    '% Offline Revenue'
  ],
  'Product Lines': [
    'KX Orders', 'KX Tons', 'KX Revenue', 'KX Avg Price', 'KX Avg GM', 'KX Avg OM',
    'DX Orders', 'DX Tons', 'DX Revenue', 'DX Avg Price', 'DX Avg GM', 'DX Avg OM',
    'EX Orders', 'EX Tons', 'EX Revenue', 'EX Avg Price', 'EX Avg GM', 'EX Avg OM'
  ],
  'Distribution Channels': [
    'Distributor Orders', 'Distributor Revenue', 'Distributor Avg Price', 'Distributor Avg GM',
    'Large Direct Orders', 'Large Direct Revenue', 'Large Direct Avg Price', 'Large Direct Avg GM',
    'Medium Direct Orders', 'Medium Direct Revenue', 'Medium Direct Avg Price', 'Medium Direct Avg GM',
    'Small Direct Orders', 'Small Direct Revenue', 'Small Direct Avg Price', 'Small Direct Avg GM'
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
              tension: 0.1,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2
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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Metrics Visualization</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-medium text-blue-800 mb-2">About This Graph</h2>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              This interactive visualization allows you to analyze and compare different business metrics over time.
              Use the selection tools below to choose which metrics to display.
            </p>
            <ul className="list-disc list-inside">
              <li>Click the quick selection buttons to view all metrics in a category</li>
              <li>Hover over data points to see detailed values</li>
              <li>The y-axis automatically scales and formats large numbers (K = thousands, M = millions)</li>
              <li>Use the checkboxes below to customize your view</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-700">Select Metrics</h2>
          <div className="flex gap-3">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedMetrics(categories['Cost of Goods'])}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Cost of Goods
              </button>
              <button
                onClick={() => setSelectedMetrics(categories['Unit Metrics'])}
                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Unit Metrics
              </button>
              <button
                onClick={() => setSelectedMetrics(categories['SG&A Expenses'])}
                className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
              >
                SG&A Expenses
              </button>
              <button
                onClick={() => setSelectedMetrics(categories['Business Performance'])}
                className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
              >
                Business Performance
              </button>
              <button
                onClick={() => setSelectedMetrics(categories['Product Lines'])}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Product Lines
              </button>
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
          <Line
            data={chartData}
            options={{
              responsive: true,
              interaction: {
                mode: 'index' as const,
                intersect: false,
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                  },
                  border: {
                    dash: [4, 4],
                  },
                  ticks: {
                    callback: function(value: any, index: any, ticks: any) {
                      // Get the current metric name
                      const currentMetric = selectedMetrics[0] || '';
                      
                      // Handle percentages
                      if (currentMetric.startsWith('%') || currentMetric.includes('GM') || currentMetric.includes('OM')) {
                        return value.toFixed(1) + '%';
                      }
                      
                      // Handle metrics with "Price" in the name
                      if (currentMetric.includes('Price') || currentMetric.includes('Revenue/Order')) {
                        return '$' + value.toFixed(2);
                      }
                      
                      // Handle metrics with "Orders" or "Tons" in the name
                      if (currentMetric.includes('Orders') || currentMetric.includes('Tons')) {
                        return value.toLocaleString();
                      }
                      
                      // Default currency formatting with K/M suffix for large numbers
                      if (Math.abs(value) >= 1000000) {
                        return '$' + (value / 1000000).toFixed(1) + 'M';
                      } else if (Math.abs(value) >= 1000) {
                        return '$' + (value / 1000).toFixed(1) + 'K';
                      }
                      return '$' + value;
                    },
                    padding: 10
                  },
                  title: {
                    display: true,
                    text: selectedMetrics[0]?.includes('Orders') ? 'Number of Orders' :
                          selectedMetrics[0]?.includes('Tons') ? 'Tons' :
                          selectedMetrics[0]?.startsWith('%') || selectedMetrics[0]?.includes('GM') || selectedMetrics[0]?.includes('OM') ? 'Percentage' :
                          'Amount (USD)',
                    font: {
                      size: 14,
                      weight: 'bold'
                    }
                  }
                },
                x: {
                  grid: {
                    display: false
                  },
                  title: {
                    display: true,
                    text: 'Month',
                    font: {
                      size: 14,
                      weight: 'bold'
                    }
                  }
                }
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                  display: true,
                },
                title: {
                  display: true,
                  text: 'Monthly Trends',
                  font: {
                    size: 16,
                    weight: 'bold'
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context: any) {
                      let label = context.dataset.label || '';
                      let value = context.parsed.y;
                      
                      if (label) {
                        label += ': ';
                      }
                      
                      if (value !== null) {
                        // Handle percentages
                        if (label.startsWith('%') || label.includes('GM') || label.includes('OM')) {
                          label += value.toFixed(1) + '%';
                        }
                        // Handle metrics with "Price" in the name
                        else if (label.includes('Price') || label.includes('Revenue/Order')) {
                          label += new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }).format(value);
                        }
                        // Handle metrics with "Orders" or "Tons" in the name
                        else if (label.includes('Orders') || label.includes('Tons')) {
                          label += value.toLocaleString();
                        }
                        // Default currency formatting
                        else {
                          label += new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(value);
                        }
                      }
                      return label;
                    }
                  }
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
