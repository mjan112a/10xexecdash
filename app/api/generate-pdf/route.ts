import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { FlatMetric } from '@/app/metricsgraph/metrics-context';

export async function POST(req: NextRequest) {
  try {
    const { charts, title, dateColumns, dateRange } = await req.json();
    
    if (!charts || !Array.isArray(charts) || charts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: charts must be a non-empty array' },
        { status: 400 }
      );
    }
    
    // Create a temporary HTML file with the charts
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-'));
    const htmlPath = path.join(tempDir, 'charts.html');
    
    // Generate HTML content with the charts
    const htmlContent = generateChartsHtml(charts, title || 'Metrics Report', dateColumns, dateRange);
    await fs.writeFile(htmlPath, htmlContent);
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport to A4 size
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 2,
    });
    
    // Navigate to the HTML file
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    
    // Wait for charts to render (adjust timeout as needed)
    await page.waitForSelector('.chart-container', { timeout: 5000 });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    });
    
    // Close browser and clean up
    await browser.close();
    await fs.rm(tempDir, { recursive: true, force: true });
    
    // Return the PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title || 'metrics-report')}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

// Type definition for chart data
type ChartData = {
  id: string;
  title: string;
  metrics: FlatMetric[];
};

// Function to generate HTML content with the charts
function generateChartsHtml(
  charts: ChartData[],
  title: string,
  dateColumns: string[],
  dateRange: { start: number; end: number }
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .report-title {
          text-align: center;
          color: #0047AB;
          margin-bottom: 20px;
          font-size: 24px;
          font-weight: bold;
        }
        .report-date {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
          font-size: 12px;
        }
        .page-break {
          page-break-after: always;
          height: 0;
          margin: 0;
          border: 0;
        }
        .chart-container {
          width: 100%;
          height: 400px;
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .chart-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
        canvas {
          max-width: 100%;
          height: auto !important;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .chart-container {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-title">${title}</div>
      <div class="report-date">Generated on: ${new Date().toLocaleDateString()}</div>
      
      ${charts.map((chart, index) => `
        ${index > 0 ? '<div class="page-break"></div>' : ''}
        <div class="chart-container">
          <div class="chart-title">${chart.title}</div>
          <canvas id="chart-${chart.id}" class="chart" width="700" height="350"></canvas>
        </div>
      `).join('')}
      
      <script>
        // Chart data and rendering
        document.addEventListener('DOMContentLoaded', function() {
          const dateColumns = ${JSON.stringify(dateColumns.slice(dateRange.start, dateRange.end + 1))};
          const charts = ${JSON.stringify(charts.map(chart => ({
            id: chart.id,
            title: chart.title,
            metrics: chart.metrics.map(metric => ({
              name: metric.fullPath.name,
              unit: metric.unit,
              values: metric.values.slice(dateRange.start, dateRange.end + 1).map(v => parseFloat(v.replace(/[^\d.-]/g, '')))
            }))
          })))};
          
          // Function to get chart color
          function getChartColor(index) {
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
          }
          
          // Function to get y-axis title
          function getYAxisTitle(metrics) {
            if (metrics.length === 0) return 'Value';
            
            const metric = metrics[0];
            
            if (metric.name.includes('Orders')) {
              return 'Number of Orders';
            }
            
            if (metric.name.includes('Tons')) {
              return 'Tons';
            }
            
            if (metric.unit === '%' || metric.name.includes('GM') || metric.name.includes('OM')) {
              return 'Percentage (%)';
            }
            
            if (metric.unit === '$' || metric.name.includes('Price') || metric.name.includes('Revenue')) {
              return 'Amount (USD)';
            }
            
            return 'Value';
          }
          
          // Render each chart
          charts.forEach(chart => {
            const ctx = document.getElementById('chart-' + chart.id).getContext('2d');
            
            // Create datasets
            const datasets = chart.metrics.map((metric, index) => {
              const color = getChartColor(index);
              return {
                label: metric.name,
                data: metric.values,
                borderColor: color,
                backgroundColor: color.replace(')', ', 0.2)'),
                tension: 0.1,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2
              };
            });
            
            // Create chart
            new Chart(ctx, {
              type: 'line',
              data: {
                labels: dateColumns,
                datasets: datasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
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
                      text: getYAxisTitle(chart.metrics),
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
                      display: true,
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
          });
        });
      </script>
    </body>
    </html>
  `;
}