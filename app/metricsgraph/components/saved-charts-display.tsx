'use client';

import React from 'react';
import { useMetrics, ChartConfig } from '../metrics-context';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { X, Edit } from 'lucide-react';
import { getMetricColor, getYAxisTitle, formatTooltipValue } from '../metrics-utils';

// Component to display a single frozen chart
function FrozenChartDisplay({ config }: { config: ChartConfig }) {
  const { dateColumns } = useMetrics();
  
  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (config.selectedMetrics.length === 0) return null;
    
    // For pie chart, we use a different data structure
    if (config.chartType === 'pie') {
      return {
        labels: config.selectedMetrics.map(m => m.fullPath.name),
        datasets: [{
          data: config.selectedMetrics.map(m => parseFloat(m.values[0].replace(/[^\d.-]/g, ''))),
          backgroundColor: config.selectedMetrics.map((_, i) => getMetricColor(i)),
          borderColor: config.selectedMetrics.map((_, i) => getMetricColor(i).replace(')', ', 0.8)')),
          borderWidth: 1
        }]
      };
    }
    
    // Get labels based on date range
    const labels = dateColumns.slice(config.customDateRange.start, config.customDateRange.end + 1);
    
    // Create datasets
    const datasets = config.selectedMetrics.map((metric, index) => ({
      label: metric.fullPath.name,
      data: metric.values
        .slice(config.customDateRange.start, config.customDateRange.end + 1)
        .map(v => parseFloat(v.replace(/[^\d.-]/g, ''))),
      borderColor: getMetricColor(index),
      backgroundColor: `${getMetricColor(index).replace(')', ', 0.2)')}`,
      tension: 0.1,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2
    }));
    
    return {
      labels,
      datasets
    };
  }, [config, dateColumns]);
  
  // Chart options
  const chartOptions = React.useMemo(() => {
    if (config.selectedMetrics.length === 0) return {};
    
    // Determine y-axis title based on the first selected metric
    const yAxisTitle = getYAxisTitle(
      config.selectedMetrics[0].fullPath.name,
      config.selectedMetrics[0].unit
    );
    
    return {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      scales: config.chartType !== 'pie' ? {
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
              const metric = config.selectedMetrics[0];
              
              // Handle percentages
              if (metric.unit === '%' || metric.fullPath.name.includes('GM') || metric.fullPath.name.includes('OM')) {
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
            }
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
          ticks: {
            display: false // Hide x-axis labels since we have a legend
          },
          title: {
            display: false, // Hide x-axis title
            text: 'Period',
            font: {
              size: 14,
              weight: 'bold' as 'bold'
            }
          }
        }
      } : undefined,
      plugins: {
        legend: {
          position: config.chartType === 'pie' ? 'right' as const : 'top' as const,
          display: true,
        },
        title: {
          display: true,
          text: config.title || 'Metrics Trend Analysis',
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
              
              if (config.chartType === 'pie') {
                const metric = config.selectedMetrics[context.dataIndex];
                value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => Math.abs(a) + Math.abs(b), 0);
                const percentage = Math.round((Math.abs(value) / total) * 100);
                return `${metric.fullPath.name}: ${formatTooltipValue(value, metric.unit, metric.fullPath.name)} (${percentage}%)`;
              }
              
              if (label) {
                label += ': ';
              }
              
              if (value !== null) {
                // Find the corresponding metric
                const metric = config.selectedMetrics.find(m => m.fullPath.name === context.dataset.label);
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
  }, [config]);
  
  if (!chartData) return null;
  
  return (
    <div id={`chart-container-${config.id}`} className="h-[350px] print:shadow-none">
      {config.chartType === 'bar' && (
        <div className="print:shadow-none">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
      
      {config.chartType === 'line' && (
        <div className="print:shadow-none">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
      
      {config.chartType === 'pie' && (
        <div className="flex justify-center print:shadow-none">
          <div style={{ width: '350px', height: '350px' }} className="print:shadow-none">
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
}

// Main component to display all saved charts
export default function SavedChartsDisplay() {
  const { savedCharts, removeSavedChart } = useMetrics();
  
  if (savedCharts.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-8 print:shadow-none print:bg-white">
      <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
        Saved Charts
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({savedCharts.length} {savedCharts.length === 1 ? 'chart' : 'charts'})
        </span>
      </h3>
      
      <div className="space-y-8">
        {savedCharts.map(chart => (
          <div key={chart.id} className="bg-white p-6 rounded-lg shadow-lg relative print:shadow-none print:bg-white">
            <div className="absolute top-4 right-4 flex space-x-2">
              <button 
                onClick={() => removeSavedChart(chart.id)}
                className="p-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
                title="Remove chart"
              >
                <X size={16} />
              </button>
            </div>
            
            <h4 className="text-md font-medium text-gray-700 mb-4">{chart.title}</h4>
            
            <FrozenChartDisplay config={chart} />
            
            <div className="mt-4 bg-blue-50 p-3 rounded-lg print:shadow-none print:bg-white">
              <h5 className="text-sm font-medium text-blue-800 mb-1">Metrics in this chart</h5>
              <div className="flex flex-wrap gap-2">
                {chart.selectedMetrics.map((metric, index) => (
                  <div 
                    key={metric.uid}
                    className="px-2 py-1 text-xs rounded-full flex items-center"
                    style={{ 
                      backgroundColor: `${getMetricColor(index).replace(')', ', 0.1)')}`,
                      borderColor: getMetricColor(index),
                      borderWidth: '1px',
                      color: getMetricColor(index).replace('rgb', 'rgba').replace(')', ', 0.9)')
                    }}
                  >
                    <span className="mr-1">{metric.fullPath.name}</span>
                    <span className="text-xs text-gray-500">({metric.unit})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}