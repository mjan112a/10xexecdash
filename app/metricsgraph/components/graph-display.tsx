'use client';

import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useMetrics } from '../metrics-context';
import { parseValue, getMetricColor, getYAxisTitle, formatTooltipValue } from '../metrics-utils';
import { Save, X } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function GraphDisplay() {
  const {
    selectedMetrics,
    dateColumns,
    selectedChartType,
    selectedPeriod,
    setSelectedChartType,
    setSelectedPeriod,
    freezeCurrentChart
  } = useMetrics();

  // Get aggregated data for charts
  const { timeFrame, comparisonMode, getAggregatedData } = useMetrics();
  
  
  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (selectedMetrics.length === 0) return null;
    
    // For pie chart, we use a different data structure
    if (selectedChartType === 'pie') {
      return null; // We'll handle pie chart data separately
    }
    
    // Get aggregated data based on time frame
    const { labels, datasets } = getAggregatedData();
    
    // Add styling to datasets
    const styledDatasets = datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: getMetricColor(index),
      backgroundColor: `${getMetricColor(index).replace(')', ', 0.2)')}`,
      tension: 0.1,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2
    }));
    
    return {
      labels,
      datasets: styledDatasets
    };
  }, [selectedMetrics, selectedChartType, timeFrame, comparisonMode, getAggregatedData]);

  // Chart options
  const chartOptions = React.useMemo(() => {
    if (selectedMetrics.length === 0) return {};
    
    // Determine y-axis title based on the first selected metric
    const yAxisTitle = getYAxisTitle(
      selectedMetrics[0].fullPath.name,
      selectedMetrics[0].unit
    );
    
    return {
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
            callback: function(value: any) {
              // Get the current metric
              const metric = selectedMetrics[0];
              
              // Handle percentages
              if (metric.unit === '%' || metric.fullPath.name.includes('GM') || metric.fullPath.name.includes('OM')) {
                // Check if the value is in decimal form (between -1 and 1)
                if (value >= -1 && value <= 1 && value !== 0) {
                  value = value * 100;
                }
                return value.toFixed(1) + '%';
              }
              
              // Handle metrics with "Price" in the name
              if (metric.fullPath.name.includes('Price') || metric.fullPath.name.includes('Revenue/Order')) {
                return '$' + value.toFixed(2);
              }
              
              // Handle metrics with "Orders" or "Tons" in the name
              if (metric.fullPath.name.includes('Orders') || metric.fullPath.name.includes('Tons')) {
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
            text: yAxisTitle,
            font: {
              size: 14,
              weight: 'bold' as 'bold'
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          title: {
            display: true,
            text: 'Period',
            font: {
              size: 14,
              weight: 'bold' as 'bold'
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
          text: 'Metrics Trend Analysis',
          font: {
            size: 16,
            weight: 'bold' as 'bold'
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
                // Find the corresponding metric
                const metric = selectedMetrics.find(m => m.fullPath.name === context.dataset.label);
                if (metric) {
                  label += formatTooltipValue(value, metric.unit, metric.fullPath.name);
                } else {
                  label += value.toString();
                }
              }
              return label;
            }
          }
        }
      }
    };
  }, [selectedMetrics]);

  // Render pie chart data
  const pieChartData = React.useMemo(() => {
    if (selectedMetrics.length === 0) return null;
    
    return {
      labels: selectedMetrics.map(m => m.fullPath.name),
      datasets: [{
        data: selectedMetrics.map(m => parseValue(m.values[selectedPeriod])),
        backgroundColor: selectedMetrics.map((_, i) => getMetricColor(i)),
        borderColor: selectedMetrics.map((_, i) => getMetricColor(i).replace(')', ', 0.8)')),
        borderWidth: 1
      }]
    };
  }, [selectedMetrics, selectedPeriod]);

  // Pie chart options
  const pieChartOptions = React.useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right' as const,
          display: true,
        },
        title: {
          display: true,
          text: `Metrics Distribution - ${dateColumns[selectedPeriod] || ''}`,
          font: {
            size: 16,
            weight: 'bold' as 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const metric = selectedMetrics[context.dataIndex];
              const value = context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number) => Math.abs(a) + Math.abs(b), 0);
              const percentage = Math.round((Math.abs(value) / total) * 100);
              return `${metric.fullPath.name}: ${formatTooltipValue(value, metric.unit, metric.fullPath.name)} (${percentage}%)`;
            }
          }
        }
      }
    };
  }, [selectedMetrics, dateColumns, selectedPeriod]);

  // Render chart type selector and chart
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg print:shadow-none print:bg-white">
      {selectedMetrics.length > 0 ? (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-700">Chart Type</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedChartType('line')}
                className={`px-3 py-1.5 text-sm rounded ${
                  selectedChartType === 'line'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setSelectedChartType('bar')}
                className={`px-3 py-1.5 text-sm rounded ${
                  selectedChartType === 'bar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setSelectedChartType('pie')}
                className={`px-3 py-1.5 text-sm rounded ${
                  selectedChartType === 'pie'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pie
              </button>
              <button
                onClick={() => {
                  // Get the subcategory name from the first selected metric
                  if (selectedMetrics.length > 0) {
                    freezeCurrentChart();
                  }
                }}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                disabled={selectedMetrics.length === 0}
              >
                <Save className="h-3 w-3 mr-1" />
                Freeze Chart
              </button>
            </div>
          </div>
          
          <div className="h-[500px] print:shadow-none">
            {selectedChartType === 'bar' && chartData && (
              <div className="h-full w-full print:shadow-none">
                <Bar data={chartData} options={chartOptions} />
              </div>
            )}
            
            {selectedChartType === 'line' && chartData && (
              <div className="h-full w-full print:shadow-none">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
            
            {selectedChartType === 'pie' && pieChartData && (
              <div className="h-full flex flex-col items-center justify-center print:shadow-none">
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mr-2">Select Period:</label>
                  <select
                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                  >
                    {dateColumns.map((date, index) => (
                      <option key={index} value={index}>{date}</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: '400px', height: '400px' }} className="print:shadow-none">
                  <Pie data={pieChartData} options={pieChartOptions} />
                </div>
              </div>
            )}
          </div>
          
        </>
      ) : (
        <div className="text-center text-gray-500 py-12">
          <p className="mb-4">Select one or more metrics to display the chart</p>
          <p className="text-sm text-gray-400">Use the selection panel above to choose metrics</p>
        </div>
      )}
    </div>
  );
}
