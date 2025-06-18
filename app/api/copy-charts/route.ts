import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Chart definitions matching the original Python charts
const CHART_DEFINITIONS = [
  {
    id: 'channel_distribution',
    title: 'Channel Distribution',
    subtitle: 'Percentage of total Q1 revenue',
    filename: 'channel_distribution.png'
  },
  {
    id: 'channel_revenue',
    title: 'Channel Revenue by Month',
    subtitle: 'Monthly revenue by sales channel',
    filename: 'channel_revenue.png'
  },
  {
    id: 'cost_distribution',
    title: 'Cost Distribution',
    subtitle: 'Percentage of total Q1 costs',
    filename: 'cost_distribution.png'
  },
  {
    id: 'monthly_costs',
    title: 'Monthly Cost Breakdown',
    subtitle: 'Major expense categories by month',
    filename: 'monthly_costs.png'
  },
  {
    id: 'product_distribution',
    title: 'Product Distribution',
    subtitle: 'Percentage of total Q1 revenue',
    filename: 'product_distribution.png'
  },
  {
    id: 'product_revenue',
    title: 'Product Revenue by Month',
    subtitle: 'Monthly revenue by product line',
    filename: 'product_revenue.png'
  }
];

export async function POST(request: Request) {
  try {
    // Create charts directory in public
    const chartsDir = path.join(process.cwd(), 'public', 'charts');
    if (!fs.existsSync(chartsDir)) {
      fs.mkdirSync(chartsDir, { recursive: true });
    }

    // Copy charts from monthlyrpt/charts_modern to public/charts
    const sourceDir = path.join(process.cwd(), '..', 'monthlyrpt', 'charts_modern');
    
    const results = CHART_DEFINITIONS.map(chart => {
      try {
        const sourcePath = path.join(sourceDir, chart.filename);
        const destPath = path.join(chartsDir, chart.filename);
        
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
          return {
            id: chart.id,
            title: chart.title,
            subtitle: chart.subtitle,
            path: `/charts/${chart.filename}`,
            success: true
          };
        } else {
          return {
            id: chart.id,
            title: chart.title,
            success: false,
            error: `Source file not found: ${sourcePath}`
          };
        }
      } catch (error) {
        return {
          id: chart.id,
          title: chart.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    return NextResponse.json({
      message: 'Chart copying completed',
      results,
      successful: results.filter(r => r.success).length,
      total: results.length
    });

  } catch (error) {
    console.error('Error copying charts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to copy charts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Return list of available charts
    const chartsDir = path.join(process.cwd(), 'public', 'charts');
    
    const availableCharts = CHART_DEFINITIONS.map(chart => ({
      id: chart.id,
      title: chart.title,
      subtitle: chart.subtitle,
      path: `/charts/${chart.filename}`,
      exists: fs.existsSync(path.join(chartsDir, chart.filename))
    }));

    return NextResponse.json({
      charts: availableCharts,
      total: availableCharts.length,
      available: availableCharts.filter(c => c.exists).length
    });

  } catch (error) {
    console.error('Error listing charts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list charts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
