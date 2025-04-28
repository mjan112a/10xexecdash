'use client';

import React from 'react';
import { Download, FileSpreadsheet, Image, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMetrics } from '../metrics-context';
import { parseValue, formatDisplayValue } from '../metrics-utils';
import SaveToReport from './save-to-report';
import { ReportSection } from '@/types/report';

export default function ExportOptions() {
  const { selectedMetrics, dateColumns, timeFrame, customDateRange, getAggregatedData, selectedChartType } = useMetrics();

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
  
  // Function to print charts
  const printCharts = () => {
    window.print();
  };

  if (selectedMetrics.length === 0) {
    return null;
  }

  // Handle saving to monthly report
  const handleSaveToReport = (section: ReportSection, name: string, description: string) => {
    // Get the current chart configuration
    const config = {
      metrics: selectedMetrics.map(m => m.uid),
      timeFrame,
      chartType: selectedChartType,
      startDate: customDateRange ? customDateRange.toString().split(' - ')[0] : undefined,
      endDate: customDateRange ? customDateRange.toString().split(' - ')[1] : undefined,
    };
    
    // Get the chart image
    const canvas = document.querySelector('.h-\\[400px\\] canvas') as HTMLCanvasElement;
    let imageUrl = null;
    
    if (canvas) {
      imageUrl = canvas.toDataURL('image/png');
    }
    
    // Get the current reports from localStorage
    const reportsJson = localStorage.getItem('monthly_reports');
    const reports = reportsJson ? JSON.parse(reportsJson) : [];
    
    if (reports.length === 0) {
      alert('No reports found. Please create a report first in the Monthly Report page.');
      return;
    }
    
    // Use the most recent report
    const reportId = reports[0].id;
    
    // Get existing graphs
    const graphsJson = localStorage.getItem('report_graphs');
    const graphs = graphsJson ? JSON.parse(graphsJson) : [];
    
    // Generate a unique ID
    const id = 'graph-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Create the new graph
    const newGraph = {
      id,
      report_id: reportId,
      section,
      name,
      description: description || '',
      config,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to graphs array
    graphs.push(newGraph);
    
    // Save back to localStorage
    localStorage.setItem('report_graphs', JSON.stringify(graphs));
    
    // Show success message
    alert(`Graph "${name}" saved to ${section} section of the most recent report!`);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6 print:shadow-none print:bg-white">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Export Options</h3>
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={exportAsCSV}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          disabled={selectedMetrics.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </Button>
        <Button
          onClick={exportAsImage}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          disabled={selectedMetrics.length === 0}
        >
          <Image className="h-4 w-4 mr-2" />
          Export as Image
        </Button>
        <Button
          onClick={printCharts}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          disabled={selectedMetrics.length === 0}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Charts
        </Button>
        <SaveToReport 
          onSave={handleSaveToReport}
          disabled={selectedMetrics.length === 0}
        />
      </div>
    </div>
  );
}
