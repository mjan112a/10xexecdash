'use client';

import React, { useState } from 'react';
import { useMetrics, FlatMetric } from '../metrics-context';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PuppeteerPDFGenerator() {
  const {
    selectedMetrics,
    savedCharts,
    dateColumns,
    customDateRange
  } = useMetrics();
  const [generating, setGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState('Metrics Analysis Report');
  const [showTitleInput, setShowTitleInput] = useState(false);

  // Function to generate PDF report using the API
  const generatePDFReport = async () => {
    if (selectedMetrics.length === 0 && savedCharts.length === 0) {
      alert('Please create at least one chart before generating a report');
      return;
    }

    setGenerating(true);

    try {
      // Prepare chart data
      const charts = [];
      
      // Add current chart if it exists
      if (selectedMetrics.length > 0) {
        charts.push({
          id: 'current',
          title: 'Current Chart',
          metrics: selectedMetrics
        });
      }
      
      // Add saved charts
      savedCharts.forEach(chart => {
        charts.push({
          id: chart.id,
          title: chart.title || `Chart ${charts.length + 1}`,
          metrics: chart.selectedMetrics
        });
      });
      
      // Call the API to generate the PDF
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          charts,
          title: reportTitle,
          dateColumns,
          dateRange: customDateRange
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportTitle.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('An error occurred while generating the PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
        <FileText className="h-5 w-5 mr-2 text-blue-600" />
        PDF Report Generator (Puppeteer)
      </h3>
      
      {showTitleInput ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Title:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter report title"
            />
            <Button
              onClick={() => setShowTitleInput(false)}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Set Title
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Report Title:</span> {reportTitle}
          </div>
          <Button
            onClick={() => setShowTitleInput(true)}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Change
          </Button>
        </div>
      )}
      
      <div className="text-sm text-gray-600 mb-4">
        <p>Generate a professional PDF report using Puppeteer for high-quality chart rendering.</p>
        <p className="mt-1">Each chart will be placed on its own page with proper formatting and axes.</p>
      </div>
      
      <Button
        onClick={generatePDFReport}
        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        disabled={generating || (selectedMetrics.length === 0 && savedCharts.length === 0)}
      >
        {generating ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating PDF...
          </>
        ) : (
          <>
            <Download className="h-5 w-5 mr-2" />
            Generate PDF Report
          </>
        )}
      </Button>
    </div>
  );
}