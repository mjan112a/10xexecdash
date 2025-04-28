'use client';

import React, { useState, useRef } from 'react';
import { useMetrics, ChartConfig } from '../metrics-context';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import Chart from 'chart.js/auto';

export default function DirectPDFGenerator() {
  const { 
    selectedMetrics, 
    savedCharts, 
    dateColumns, 
    customDateRange,
    getAggregatedData
  } = useMetrics();
  
  const [generating, setGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState('Metrics Analysis Report');
  const [showTitleInput, setShowTitleInput] = useState(false);
  
  // Create refs for hidden canvases
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
        yPosition += 10;
        
        // Create a chart image using Chart.js
        const chartImage = await createChartImage(selectedMetrics, 'Current Chart');
        
        // Add the chart image to the PDF
        if (chartImage) {
          const imgWidth = 170; // Width in mm
          const imgHeight = 100; // Fixed height for consistent layout
          
          pdf.addImage(chartImage, 'PNG', 20, yPosition, imgWidth, imgHeight);
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
          
          // Always start a new page for each saved chart
          if (i > 0 || selectedMetrics.length > 0) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Add chart title
          pdf.setFontSize(14);
          pdf.setTextColor(0, 0, 0);
          pdf.text(chart.title || `Chart ${i + 1}`, 20, yPosition);
          yPosition += 10;
          
          // Create a chart image using Chart.js
          const chartImage = await createChartImage(chart.selectedMetrics, chart.title || `Chart ${i + 1}`);
          
          // Add the chart image to the PDF
          if (chartImage) {
            const imgWidth = 170; // Width in mm
            const imgHeight = 100; // Fixed height for consistent layout
            
            pdf.addImage(chartImage, 'PNG', 20, yPosition, imgWidth, imgHeight);
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
  
  // Function to create a chart image using Chart.js
  const createChartImage = async (metrics: any[], title: string): Promise<string | null> => {
    if (!canvasRef.current) return null;
    
    // Clear any existing chart
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return null;
    
    // Set canvas dimensions
    canvasRef.current.width = 1200;
    canvasRef.current.height = 600;
    
    // Prepare data for the chart
    const labels = dateColumns.slice(customDateRange.start, customDateRange.end + 1);
    
    // Create datasets
    const datasets = metrics.map((metric, index) => {
      const color = getChartColor(index);
      return {
        label: metric.fullPath.name,
        data: metric.values
          .slice(customDateRange.start, customDateRange.end + 1)
          .map((v: string) => parseFloat(v.replace(/[^\d.-]/g, ''))),
        borderColor: color,
        backgroundColor: color.replace(')', ', 0.2)'),
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      };
    });
    
    // Create a new chart
    const chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: title,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'top',
            labels: {
              boxWidth: 20,
              padding: 15
            }
          }
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
              padding: 10
            },
            title: {
              display: true,
              text: getYAxisTitle(metrics[0]),
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
            ticks: {
              display: true, // Ensure x-axis labels are visible
              maxRotation: 45,
              minRotation: 45
            },
            title: {
              display: true,
              text: 'Period',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          }
        }
      }
    });
    
    // Wait for chart animation to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Convert chart to image
    const image = canvasRef.current.toDataURL('image/png', 1.0);
    
    // Destroy the chart to free up resources
    chartInstance.destroy();
    
    return image;
  };
  
  // Helper function to get chart colors
  const getChartColor = (index: number): string => {
    const colors = [
      'rgb(75, 192, 192)',   // teal
      'rgb(255, 99, 132)',   // pink
      'rgb(54, 162, 235)',   // blue
      'rgb(255, 206, 86)',   // yellow
      'rgb(153, 102, 255)',  // purple
      'rgb(255, 159, 64)',   // orange
      'rgb(75, 192, 100)',   // green
      'rgb(255, 99, 71)',    // red
      'rgb(201, 203, 207)',  // grey
      'rgb(0, 128, 128)',    // dark teal
      'rgb(220, 20, 60)',    // crimson
      'rgb(0, 0, 139)',      // dark blue
    ];
    
    return colors[index % colors.length];
  };
  
  // Helper function to get y-axis title
  const getYAxisTitle = (metric: any): string => {
    if (!metric) return 'Value';
    
    const { fullPath, unit } = metric;
    
    if (fullPath.name.includes('Orders')) {
      return 'Number of Orders';
    }
    
    if (fullPath.name.includes('Tons')) {
      return 'Tons';
    }
    
    if (unit === '%' || fullPath.name.includes('GM') || fullPath.name.includes('OM')) {
      return 'Percentage (%)';
    }
    
    if (unit === '$' || fullPath.name.includes('Price') || fullPath.name.includes('Revenue')) {
      return 'Amount (USD)';
    }
    
    return 'Value';
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
        <p>Generate a professional PDF report with properly formatted charts.</p>
        <p className="mt-1">Each chart will be placed on its own page with clear labels and axes.</p>
      </div>
      
      {/* Hidden canvas for chart rendering */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none', position: 'absolute', pointerEvents: 'none' }}
      />
      
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