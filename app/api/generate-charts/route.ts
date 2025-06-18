import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  PRODUCT_COLORS,
  EXTENDED_COLORS,
  getColorSequence,
  formatCurrency,
  formatPercentage,
  CHART_THEME
} from '@/lib/chart-styles';

// Dynamic import for ChartJSNodeCanvas to handle Vercel deployment
let ChartJSNodeCanvas: any;
try {
  ChartJSNodeCanvas = require('chartjs-node-canvas').ChartJSNodeCanvas;
} catch (error) {
  console.warn('ChartJSNodeCanvas not available in this environment');
}

interface MetricData {
  uid: string;
  metricGroup: string;
  metricCategory: string;
  metricType: string;
  metricName: string;
  unit: string;
  values: string[];
}

interface ChartDefinition {
  id: string;
  title: string;
  subtitle: string;
  type: 'bar' | 'pie' | 'doughnut';
  dataSource: string;
  currency?: boolean;
  stacked?: boolean;
}

// Chart definitions matching the Python originals
const CHART_DEFINITIONS: ChartDefinition[] = [
  {
    id: 'channel_distribution',
    title: 'Channel Distribution',
    subtitle: 'Percentage of total Q1 revenue',
    type: 'pie',
    dataSource: 'channel_revenue',
    currency: false
  },
  {
    id: 'channel_revenue',
    title: 'Channel Revenue by Month',
    subtitle: 'Monthly revenue by sales channel',
    type: 'bar',
    dataSource: 'channel_revenue',
    currency: true
  },
  {
    id: 'cost_distribution',
    title: 'Cost Distribution',
    subtitle: 'Percentage of total Q1 costs',
    type: 'pie',
    dataSource: 'cost_breakdown',
    currency: false
  },
  {
    id: 'monthly_costs',
    title: 'Monthly Cost Breakdown',
    subtitle: 'Major expense categories by month',
    type: 'bar',
    dataSource: 'cost_breakdown',
    currency: true
  },
  {
    id: 'product_distribution',
    title: 'Product Distribution',
    subtitle: 'Percentage of total Q1 revenue',
    type: 'pie',
    dataSource: 'product_revenue',
    currency: false
  },
  {
    id: 'product_revenue',
    title: 'Product Revenue by Month',
    subtitle: 'Monthly revenue by product line',
    type: 'bar',
    dataSource: 'product_revenue',
    currency: true
  }
];

class ChartGenerator {
  private width = 800;
  private height = 600;
  private chartJSNodeCanvas: any;

  constructor() {
    if (ChartJSNodeCanvas) {
      this.chartJSNodeCanvas = new ChartJSNodeCanvas({
        width: this.width,
        height: this.height,
        chartCallback: (ChartJS: any) => {
          // Configure Chart.js defaults
          ChartJS.defaults.font.family = CHART_THEME.font_family;
          ChartJS.defaults.font.size = CHART_THEME.axis_font_size;
          ChartJS.defaults.color = '#333333';
        }
      });
    } else {
      this.chartJSNodeCanvas = null;
    }
  }

  private parseValue(value: string): number {
    const cleaned = value.replace(/[""$,\s]/g, '');
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      return -Number(cleaned.slice(1, -1));
    }
    return Number(cleaned) || 0;
  }

  private processMetricsData(metricsData: MetricData[], dateColumns: string[]) {
    const data: { [key: string]: any } = {};

    // Extract recent months (last 3)
    const recentMonths = dateColumns.slice(-3);
    const recentIndices = recentMonths.map((_, i) => dateColumns.length - 3 + i);

    // Sample data based on CSV metrics - you'll need to customize this based on your actual data structure
    data.channel_revenue = {
      categories: ['Distributor', 'Large Direct', 'Medium Direct', 'Small Direct'],
      data: recentMonths.map(month => [320000, 150000, 20000, 10000]), // Sample data
      labels: recentMonths
    };

    data.cost_breakdown = {
      categories: ['Raw Material', 'Process Labor', 'Shipping', 'Sales & Marketing', 'Professional Fees', 'Other Expenses'],
      data: recentMonths.map(month => [80000, 70000, 30000, 90000, 40000, 60000]), // Sample data
      labels: recentMonths
    };

    data.product_revenue = {
      categories: ['KinetiX', 'DynamiX', 'EpiX'],
      data: recentMonths.map(month => [207412, 136541, 110146]), // Sample data
      labels: recentMonths
    };

    return data;
  }

  private createPieChart(chartDef: ChartDefinition, data: any) {
    const totalData = data.data[data.data.length - 1]; // Use latest month
    const total = totalData.reduce((sum: number, val: number) => sum + val, 0);
    const percentages = totalData.map((val: number) => (val / total) * 100);

    const colors = data.categories.includes('KinetiX') 
      ? data.categories.map((cat: string) => PRODUCT_COLORS[cat as keyof typeof PRODUCT_COLORS] || EXTENDED_COLORS.blue)
      : getColorSequence(data.categories);

    const configuration = {
      type: 'pie',
      data: {
        labels: data.categories.map((cat: string, i: number) => 
          `${cat}: ${chartDef.currency ? formatCurrency(totalData[i]) : percentages[i].toFixed(1) + '%'}`
        ),
        datasets: [{
          data: chartDef.currency ? totalData : percentages,
          backgroundColor: colors,
          borderColor: '#FFFFFF',
          borderWidth: 2
        }]
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: [chartDef.title, chartDef.subtitle],
            font: {
              size: CHART_THEME.title_font_size,
              weight: 'bold'
            },
            padding: 20
          },
          legend: {
            position: 'right' as const,
            labels: {
              font: {
                size: CHART_THEME.legend_font_size
              },
              padding: 20,
              usePointStyle: true
            }
          }
        },
        layout: {
          padding: 20
        }
      }
    };

    return configuration;
  }

  private createBarChart(chartDef: ChartDefinition, data: any) {
    const colors = data.categories.includes('KinetiX') 
      ? data.categories.map((cat: string) => PRODUCT_COLORS[cat as keyof typeof PRODUCT_COLORS] || EXTENDED_COLORS.blue)
      : getColorSequence(data.categories);

    const datasets = data.categories.map((category: string, categoryIndex: number) => ({
      label: category,
      data: data.data.map((monthData: number[]) => monthData[categoryIndex]),
      backgroundColor: colors[categoryIndex],
      borderColor: colors[categoryIndex],
      borderWidth: 1
    }));

    const configuration = {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: datasets
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: [chartDef.title, chartDef.subtitle],
            font: {
              size: CHART_THEME.title_font_size,
              weight: 'bold'
            },
            padding: 20
          },
          legend: {
            position: 'top' as const,
            labels: {
              font: {
                size: CHART_THEME.legend_font_size
              },
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${chartDef.currency ? formatCurrency(value) : formatPercentage(value / 100)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: CHART_THEME.grid_color
            }
          },
          y: {
            grid: {
              color: CHART_THEME.grid_color
            },
            ticks: {
              callback: function(value: any) {
                return chartDef.currency ? formatCurrency(value) : value;
              }
            }
          }
        },
        layout: {
          padding: 20
        }
      }
    };

    return configuration;
  }

  async generateChart(chartDef: ChartDefinition, metricsData: MetricData[], dateColumns: string[]): Promise<Buffer> {
    if (!this.chartJSNodeCanvas) {
      throw new Error('Chart generation not available in this environment');
    }

    const processedData = this.processMetricsData(metricsData, dateColumns);
    const data = processedData[chartDef.dataSource];

    let configuration;
    if (chartDef.type === 'pie' || chartDef.type === 'doughnut') {
      configuration = this.createPieChart(chartDef, data);
    } else {
      configuration = this.createBarChart(chartDef, data);
    }

    return await this.chartJSNodeCanvas.renderToBuffer(configuration);
  }
}

async function readMetricsData() {
  try {
    const csvFileName = '10X Business Metrics Through Apr 2025 - 06-04-2025candp.csv';
    let fileContent: string;
    
    if (process.env.VERCEL_URL) {
      const baseUrl = `https://${process.env.VERCEL_URL}`;
      const response = await fetch(`${baseUrl}/${csvFileName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV file: ${response.status}`);
      }
      fileContent = await response.text();
    } else {
      const filePath = path.join(process.cwd(), 'public', csvFileName);
      fileContent = fs.readFileSync(filePath, 'utf8');
    }
    
    // Parse CSV
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',');
    
    // Extract date columns (starting from index 6)
    const dateColumns = headers.slice(6)
      .map(date => date.trim())
      .filter(date => date && date.trim() !== '');
    
    // Parse the data rows
    const data: MetricData[] = lines.slice(1)
      .map(line => {
        const values = line.split(',');
        if (values.length < 7) return null;
        
        return {
          uid: values[0].trim(),
          metricGroup: values[1].trim(),
          metricCategory: values[2].trim(),
          metricType: values[3].trim(),
          metricName: values[4].trim(),
          unit: values[5].trim(),
          values: values.slice(6, 6 + dateColumns.length).map(v => v.trim())
        };
      })
      .filter((item): item is MetricData => item !== null);
    
    return { flatData: data, dateColumns };
  } catch (error) {
    console.error('Error reading metrics data:', error);
    throw new Error(`Failed to read metrics data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const chartId = url.searchParams.get('chartId');
    
    if (!chartId) {
      return NextResponse.json({ error: 'chartId parameter is required' }, { status: 400 });
    }

    const chartDef = CHART_DEFINITIONS.find(def => def.id === chartId);
    if (!chartDef) {
      return NextResponse.json({ error: 'Chart not found' }, { status: 404 });
    }

    // Read metrics data
    const metricsData = await readMetricsData();
    
    // Generate chart
    const generator = new ChartGenerator();
    const chartBuffer = await generator.generateChart(chartDef, metricsData.flatData, metricsData.dateColumns);
    
    // Return image
    return new NextResponse(chartBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('Error generating chart:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate chart',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Generate all charts
    const metricsData = await readMetricsData();
    const generator = new ChartGenerator();
    
    const results = await Promise.all(
      CHART_DEFINITIONS.map(async (chartDef) => {
        try {
          const chartBuffer = await generator.generateChart(chartDef, metricsData.flatData, metricsData.dateColumns);
          
          // Save to public/charts directory
          const chartsDir = path.join(process.cwd(), 'public', 'charts');
          if (!fs.existsSync(chartsDir)) {
            fs.mkdirSync(chartsDir, { recursive: true });
          }
          
          const filePath = path.join(chartsDir, `${chartDef.id}.png`);
          fs.writeFileSync(filePath, chartBuffer);
          
          return {
            id: chartDef.id,
            title: chartDef.title,
            path: `/charts/${chartDef.id}.png`,
            success: true
          };
        } catch (error) {
          return {
            id: chartDef.id,
            title: chartDef.title,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return NextResponse.json({
      message: 'Chart generation completed',
      results,
      successful: results.filter(r => r.success).length,
      total: results.length
    });

  } catch (error) {
    console.error('Error in bulk chart generation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate charts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
