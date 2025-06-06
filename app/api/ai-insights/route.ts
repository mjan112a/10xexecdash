import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface MetricData {
  uid: string;
  metricGroup: string;
  metricCategory: string;
  metricType: string;
  metricName: string;
  unit: string;
  values: string[];
}

interface InsightRequest {
  type: 'monthly_analysis' | 'trend_analysis' | 'anomaly_detection' | 'ask_data';
  data?: any;
  question?: string;
  month?: string;
}

function formatMetricsForAnalysis(data: MetricData[], dateColumns: string[]): string {
  const recentMonths = dateColumns.slice(-6); // Last 6 months
  
  let formatted = `Business Metrics Data for Analysis (Last 6 Months):\n`;
  formatted += `Time Period: ${recentMonths.join(' | ')}\n\n`;
  
  // Group by category for better organization
  const groupedData: { [key: string]: MetricData[] } = {};
  data.forEach(metric => {
    const category = `${metric.metricGroup} - ${metric.metricCategory}`;
    if (!groupedData[category]) groupedData[category] = [];
    groupedData[category].push(metric);
  });
  
  Object.entries(groupedData).forEach(([category, metrics]) => {
    formatted += `\n${category}:\n`;
    metrics.forEach(metric => {
      const recentValues = metric.values.slice(-6);
      formatted += `  ${metric.metricName} (${metric.unit}): ${recentValues.join(' | ')}\n`;
    });
  });
  
  return formatted;
}

function createAnalysisPrompt(type: string, data: string, question?: string, month?: string): string {
  const basePrompt = `You are a business intelligence analyst for 10X Engineered Materials, an abrasive manufacturing company. Analyze the provided business metrics data and provide actionable insights.

${data}

`;

  switch (type) {
    case 'monthly_analysis':
      return basePrompt + `Provide a comprehensive monthly business analysis focusing on:
1. Key Performance Highlights (top 3 positive developments)
2. Areas of Concern (top 3 issues requiring attention)
3. Trend Analysis (what patterns are emerging)
4. Operational Efficiency Insights
5. Financial Health Assessment
6. Specific Recommendations for management

Format your response in clear sections with bullet points. Be specific with numbers and percentages.`;

    case 'trend_analysis':
      return basePrompt + `Analyze the trends in this data and provide:
1. Revenue Trends (growth/decline patterns)
2. Cost Management Analysis (efficiency improvements/issues)
3. Margin Performance (what's driving changes)
4. Operational Metrics (production efficiency trends)
5. Market Performance (online vs offline, customer segments)
6. Seasonal Patterns (if any)
7. Future Outlook based on current trends

Be specific about percentages, dollar amounts, and time periods.`;

    case 'anomaly_detection':
      return basePrompt + `Identify anomalies and unusual patterns in this data:
1. Significant Month-over-Month Changes (>20% variance)
2. Unusual Cost Spikes or Drops
3. Production Efficiency Anomalies
4. Revenue/Margin Outliers
5. Operational Metric Irregularities

For each anomaly, provide:
- What the anomaly is (specific metric and values)
- Potential causes
- Impact assessment
- Recommended investigation areas`;

    case 'ask_data':
      return basePrompt + `Answer this specific question about the business data: "${question}"

Provide a detailed response using the data provided. Include specific numbers, trends, and context from the metrics.`;

    default:
      return basePrompt + 'Provide a general analysis of the business metrics data.';
  }
}

// Function to parse date strings in M/D/YYYY format
function parseDateString(dateStr: string): string {
  const trimmed = dateStr.trim();
  
  // Check if it's in M/D/YYYY format first
  const dateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]);
    const year = parseInt(dateMatch[3]);
    return `${year}-${month.toString().padStart(2, '0')}`;
  }
  
  // Check if it's an Excel date number (only if it's purely numeric and reasonable range)
  const excelDate = parseInt(trimmed);
  if (!isNaN(excelDate) && trimmed === excelDate.toString() && excelDate > 1000) {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${year}-${month.toString().padStart(2, '0')}`;
  }
  
  // Return as-is if it doesn't match known formats
  return trimmed;
}

function readMetricsData() {
  // Find the latest metrics file
  const directory = process.cwd();
  const files = fs.readdirSync(directory)
    .filter(file => file.startsWith('10X Business Metrics') && file.endsWith('.csv'))
    .sort(); // Sort alphabetically, which should put the latest version last
  
  if (files.length === 0) {
    throw new Error('No metrics files found');
  }
  
  // Use the latest file (last in the sorted array)
  const latestFile = files[files.length - 1];
  console.log(`Using latest metrics file: ${latestFile}`);
  
  const filePath = path.join(directory, latestFile);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Parse CSV
  const lines = fileContent.split('\n');
  const headers = lines[0].split(',');
  
  // Extract date columns (starting from index 6)
  const dateColumns = headers.slice(6)
    .map(date => parseDateString(date))
    .filter(date => date && date.trim() !== ''); // Filter out empty columns
  
  // Parse the data rows
  const data: MetricData[] = lines.slice(1)
    .map(line => {
      const values = line.split(',');
      if (values.length < 7) return null; // Skip incomplete rows
      
      return {
        uid: values[0].trim(),
        metricGroup: values[1].trim(),
        metricCategory: values[2].trim(),
        metricType: values[3].trim(),
        metricName: values[4].trim(),
        unit: values[5].trim(),
        values: values.slice(6, 6 + dateColumns.length).map(v => {
          // Handle quoted values (like "$1,234")
          if (v.trim().startsWith('"') && v.trim().endsWith('"')) {
            return v.trim().replace(/[""$,\s]/g, '');
          }
          return v.trim();
        })
      };
    })
    .filter((item): item is MetricData => item !== null); // Type guard to filter out nulls
  
  return { flatData: data, dateColumns };
}

export async function POST(request: Request) {
  try {
    console.log('AI Insights API called');
    const body: InsightRequest = await request.json();
    const { type, question } = body;
    console.log('Request type:', type);

    // Read metrics data directly from CSV
    console.log('Reading metrics data...');
    const metricsData = readMetricsData();
    console.log(`Loaded ${metricsData.flatData.length} metrics with ${metricsData.dateColumns.length} date columns`);
    
    if (!metricsData.flatData || !metricsData.dateColumns) {
      throw new Error('Invalid metrics data format');
    }

    // Format data for analysis
    console.log('Formatting data for analysis...');
    const formattedData = formatMetricsForAnalysis(metricsData.flatData, metricsData.dateColumns);
    
    // Create prompt based on request type
    const prompt = createAnalysisPrompt(type, formattedData, question);
    console.log('Prompt created, length:', prompt.length);

    console.log('Sending request to Claude...');
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    console.log('Claude response received');
    const analysis = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('Analysis length:', analysis.length);

    const result = {
      analysis,
      type,
      timestamp: new Date().toISOString(),
      dataPoints: metricsData.flatData.length,
      timeRange: `${metricsData.dateColumns[0]} to ${metricsData.dateColumns[metricsData.dateColumns.length - 1]}`
    };

    console.log('Returning successful response');
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in AI insights API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
