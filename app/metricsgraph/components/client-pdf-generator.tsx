'use client';

import React, { useState } from 'react';
import { useMetrics } from '../metrics-context';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function ClientPDFGenerator() {
  const { selectedMetrics, savedCharts } = useMetrics();
  const [generating, setGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState('Metrics Analysis Report');
  const [showTitleInput, setShowTitleInput] = useState(false);

  // Function to generate PDF report
  const generatePDFReport = async () => {
    if (selectedMetrics.length === 0 && savedCharts.length === 0) {
      alert('Please create at least one chart before generating a report');
      return;
    }

    setGenerating(true);

    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add report title
      pdf.setFontSize(22);
      pdf.setTextColor(0, 51, 153); // Dark blue color
      pdf.text(reportTitle, 105, 20, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100); // Gray color
      const today = new Date().toLocaleDateString();
      pdf.text(`Generated on: ${today}`, 105, 28, { align: 'center' });
      
      // Add divider
      pdf.setDrawColor(200, 200, 200); // Light gray
      pdf.line(20, 32, 190, 32);
      
      let yPosition = 40; // Starting Y position for content
      
      // First add the current active chart if it exists
      if (selectedMetrics.length > 0) {
        // Add section title
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Current Chart', 20, yPosition);
        yPosition += 8;
        
        // Find the chart element
        const activeChartElement = document.querySelector('.h-\\[400px\\]');
        if (activeChartElement) {
          // Capture the chart as an image
          const canvas = await html2canvas(activeChartElement as HTMLElement, {
            scale: 2, // Higher scale for better quality
            logging: false,
            useCORS: true,
            allowTaint: true
          });
          
          // Add the chart image to the PDF
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 170; // Width in mm
          const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 200); // Limit height
          
          // Check if we need a new page
          if (yPosition + imgHeight > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 15;
        }
      }
      
      // Then add all saved charts
      if (savedCharts.length > 0) {
        // Add section title if we have saved charts
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Saved Charts', 20, yPosition);
        yPosition += 10;
        
        // Process each saved chart
        for (let i = 0; i < savedCharts.length; i++) {
          const chart = savedCharts[i];
          const chartElement = document.getElementById(`chart-container-${chart.id}`);
          
          if (chartElement) {
            // Add chart title
            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0);
            pdf.text(chart.title || `Chart ${i + 1}`, 20, yPosition);
            yPosition += 8;
            
            // Capture the chart as an image
            const canvas = await html2canvas(chartElement as HTMLElement, {
              scale: 2,
              logging: false,
              useCORS: true,
              allowTaint: true
            });
            
            // Add the chart image to the PDF
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 170; // Width in mm
            const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 200); // Limit height
            
            // Always start a new page for each chart
            pdf.addPage();
            yPosition = 20;
            
            // Add the chart image to the PDF
            pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 15;
          }
        }
      }
      
      // Save the PDF
      pdf.save(`${reportTitle.replace(/\s+/g, '_')}.pdf`);
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
        PDF Report Generator
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
        <p>Generate a professional PDF report containing your current chart and all saved charts.</p>
        <p className="mt-1">Each chart will be placed on its own page with proper formatting and titles.</p>
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