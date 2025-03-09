'use client';

import React from 'react';
import { Download, FileSpreadsheet, Image } from 'lucide-react';
import { useMetrics } from '../metrics-context';
import { parseValue, formatDisplayValue } from '../metrics-utils';

export default function ExportOptions() {
  const { selectedMetrics, dateColumns, timeFrame, customDateRange, getAggregatedData } = useMetrics();

  // Function to export data as CSV
  const exportAsCSV = () => {
    if (selectedMetrics.length === 0) return;

    // Get aggregated data
    const { labels, datasets } = getAggregatedData();
    
    // Create CSV header row
    let csvContent = 'Period,' + datasets.map(d => d.label).join(',') + '\n';
    
    // Create CSV data rows
    labels.forEach((label, i) => {
      let row = label;
      datasets.forEach(dataset => {
        row += ',' + dataset.data[i];
      });
      csvContent += row + '\n';
    });
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `metrics_export_${timeFrame}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to export chart as image
  const exportAsImage = () => {
    // Find the chart canvas element
    const canvas = document.querySelector('.h-\\[400px\\] canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Create a link to download the image
    const link = document.createElement('a');
    link.download = `metrics_chart_${timeFrame}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (selectedMetrics.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Export Options</h3>
      <div className="flex space-x-4">
        <button
          onClick={exportAsCSV}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </button>
        <button
          onClick={exportAsImage}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          <Image className="h-4 w-4 mr-2" />
          Export as Image
        </button>
      </div>
    </div>
  );
}
