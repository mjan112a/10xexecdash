import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Force Node.js runtime and set max duration (60s is max for hobby plan)
export const runtime = 'nodejs';
export const maxDuration = 60;

// Define types for our data structure
type MetricValue = {
  uid: string;
  metricGroup: string;
  metricCategory: string;
  metricType: string;
  metricName: string;
  unit: string;
  values: string[];
};

type HierarchicalData = {
  [group: string]: {
    [category: string]: {
      [type: string]: {
        [name: string]: {
          uid: string;
          unit: string;
          values: string[];
        };
      };
    };
  };
};

// Function to create a data context message with specific metrics data
function createDataContext(metricsData: MetricValue[], dateColumns: string[]): string {
  // Select important metrics to include in the context
  const keyMetrics = [
    { group: 'Accounting', category: 'Income Statement', type: 'Income', name: 'Total Revenue' },
    { group: 'Accounting', category: 'Income Statement', type: 'Cost of Goods Sold', name: 'Total COGS' },
    { group: 'Accounting', category: 'Income Statement', type: 'Gross Earnings', name: 'Gross Income' },
    { group: 'Accounting', category: 'Income Statement', type: 'Gross Earnings', name: '% Gross Income' },
    { group: 'Accounting', category: 'Income Statement', type: 'Net Earnings', name: 'Net Income' },
    { group: 'Sales', category: 'Abrasive Sales', type: 'Overall Sales', name: 'Total Orders' },
    { group: 'Sales', category: 'Abrasive Sales', type: 'Overall Sales', name: 'Tons Sold' },
    { group: 'Sales', category: 'Abrasive Sales', type: 'Overall Sales', name: 'Product Revenue' },
    { group: 'Sales', category: 'Abrasive Sales', type: 'Overall Sales', name: 'Average Price' }
  ];

  // Find the metrics in the data
  const metricsContext = keyMetrics.map(keyMetric => {
    const metric = metricsData.find(m => 
      m.metricGroup === keyMetric.group && 
      m.metricCategory === keyMetric.category && 
      m.metricType === keyMetric.type && 
      m.metricName === keyMetric.name
    );

    if (!metric) return `${keyMetric.group} > ${keyMetric.category} > ${keyMetric.type} > ${keyMetric.name}: Not found`;

    // Format the values with their corresponding dates
    const formattedValues = metric.values.map((value, index) => {
      const date = index < dateColumns.length ? dateColumns[index] : `Period ${index + 1}`;
      return `${date}: ${value}`;
    }).join(', ');

    return `${keyMetric.group} > ${keyMetric.category} > ${keyMetric.type} > ${keyMetric.name} (${metric.unit}): ${formattedValues}`;
  }).join('\n\n');

  return `Here is some key metrics data from the company's dataset to help you answer the user's question:

${metricsContext}

Please use this data to provide specific insights and recommendations. When suggesting visualizations, refer to the actual values in the data.`;
}

// Function to create a system prompt with metrics data
function createSystemPrompt(dateColumns: string[], metricsData: MetricValue[]) {
  // Create a summary of available metrics
  const metricGroupsSet = new Set(metricsData.map(m => m.metricGroup));
  const metricGroups = Array.from(metricGroupsSet);
  
  const metricSummary = metricGroups.map(group => {
    const groupMetrics = metricsData.filter(m => m.metricGroup === group);
    const categoriesSet = new Set(groupMetrics.map(m => m.metricCategory));
    const categories = Array.from(categoriesSet);
    
    const categoryDetails = categories.map(category => {
      const categoryMetrics = groupMetrics.filter(m => m.metricCategory === category);
      const typesSet = new Set(categoryMetrics.map(m => m.metricType));
      const types = Array.from(typesSet);
      
      const typeDetails = types.map(type => {
        const typeMetrics = categoryMetrics.filter(m => m.metricType === type);
        return `      - ${type}: ${typeMetrics.map(m => m.metricName).join(', ')}`;
      }).join('\n');
      
      return `    - ${category}:\n${typeDetails}`;
    }).join('\n');
    
    return `  - ${group}:\n${categoryDetails}`;
  }).join('\n');

  // Create a summary of time periods
  const timePeriods = dateColumns.map(date => date).join(', ');

  return `You are an expert Business Metrics Visualization Assistant with access to the company's actual business metrics data. You have extensive knowledge in:
- Business metrics analysis and interpretation
- Data visualization best practices
- Financial performance indicators
- Sales and revenue metrics
- Operational efficiency metrics
- Trend identification and forecasting
- Chart and graph selection

AVAILABLE METRICS:
The following metrics are available in the company's dataset:
${metricSummary}

TIME PERIODS:
The data covers the following time periods: ${timePeriods}

Your role is to:
1. Help users understand their business metrics through visualizations
2. Recommend appropriate chart types based on the data and question
3. Explain metrics and their significance in business context
4. Identify trends, patterns, and anomalies in the data
5. Provide insights and actionable recommendations
6. Answer questions about metrics and their relationships

When a user asks for a visualization:
1. Identify the specific metrics from the available data that would answer their question
2. Determine the appropriate time periods to analyze
3. Recommend the most suitable chart type (line, bar, pie, etc.)
4. Explain what the visualization would show and why it's valuable
5. Include specific data points or trends from the actual metrics data

For example, if a user asks "Show me revenue trends", you should:
1. Identify that "Total Revenue" is available under Accounting > Income Statement > Income
2. Note that we have data for multiple time periods
3. Recommend a line chart to show the trend over time
4. Mention specific insights like "Revenue peaked in [specific month] at [specific amount]"
5. Note any patterns or anomalies in the data

IMPORTANT: Always base your answers on the actual metrics data available. Do not make up data or reference metrics that aren't in the dataset. If asked about metrics not in the dataset, explain what data is available that might address their question.

Maintain a professional, knowledgeable tone while making complex information accessible. Focus on helping users gain actionable insights from their metrics.`;
}

export async function POST(req: Request) {
  console.log('1. Metrics Chat API route hit');
  
  try {
    // Log environment info
    console.log('Environment:', {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      perplexityApiKeyExists: !!process.env.PERPLEXITY_API_KEY,
      anthropicApiKeyExists: !!process.env.anthropic_api_key,
      anthropicApiKeyLength: process.env.anthropic_api_key?.length
    });

    console.log('2. Parsing request body');
    const { message } = await req.json();
    
    if (!message || typeof message !== 'string') {
      console.error('Invalid message format:', { messageType: typeof message });
      return NextResponse.json(
        { message: 'Invalid request format' },
        { status: 400 }
      );
    }

    console.log('3. Loading metrics data');
    // Load metrics data
    const filePath = path.join(process.cwd(), '10X Business Metrics - 03-06-2025e.csv');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse CSV
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',');
    
    // Extract date columns (starting from index 6)
    const dateColumns = headers.slice(6).map(date => {
      // Check if it's a number (Excel date format)
      const excelDate = parseInt(date.trim());
      if (isNaN(excelDate)) {
        return date.trim();
      } else {
        // Excel dates are number of days since December 30, 1899
        const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
        const month = jsDate.getMonth() + 1; // getMonth() is zero-based
        const year = jsDate.getFullYear();
        return `${month.toString().padStart(2, '0')}-${year}`;
      }
    });
    
    // Parse the data rows
    const metricsData: MetricValue[] = lines.slice(1)
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
          values: values.slice(6).map(v => v.trim())
        };
      })
      .filter((item): item is MetricValue => item !== null); // Type guard to filter out nulls

    // Create a system prompt with the metrics data
    const SYSTEM_PROMPT = createSystemPrompt(dateColumns, metricsData);

    // Create a data context message with specific metrics data
    const dataContext = createDataContext(metricsData, dateColumns);

    console.log('4. Creating metrics chat message');
    
    // Commented out Perplexity Implementation
    /*
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-reasoning-pro',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: dataContext },
          { role: 'user', content: message }
        ],
        include_citations: true,
        context_level: 5,
        include_sources: true
      })
    });
    */

    // Anthropic Claude API Implementation
    console.log('Using Anthropic Claude API');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.anthropic_api_key || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [
          { role: 'user', content: `${SYSTEM_PROMPT}\n\n${dataContext}\n\nUser question: ${message}` }
        ],
        temperature: 0.7
      })
    });

    // Log the raw response for debugging
    const rawResponse = await response.clone().text();
    console.log('4. Raw API Response:', rawResponse);
    
    const data = await response.json();
    console.log('5. Metrics chat response received - Response Structure:', {
      status: response.status,
      statusText: response.statusText,
      hasContent: !!data.content,
      contentLength: data.content?.length,
      rootKeys: Object.keys(data)
    });

    // Validate Anthropic response
    if (!data.content) {
      console.error('Missing content in response:', data);
      throw new Error('Invalid API response: Missing content');
    }

    // Extract the response text from Anthropic's format
    const responseText = data.content?.[0]?.text || '';
    if (!responseText) {
      console.error('Missing text in content:', data.content);
      throw new Error('Invalid API response: Missing text in content');
    }
    
    return NextResponse.json(
      { 
        response: responseText,
        citations: [] // Anthropic doesn't provide citations in the same format
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error: unknown) {
    const err = error as Error & { status?: number; response?: unknown };
    console.error('Detailed Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause: err.cause,
      response: err.response,
      phase: {
        requestReceived: true,
        bodyParsed: true
      }
    });

    // Return specific error messages
    if (err.status === 401) {
      return NextResponse.json(
        { message: 'Authentication failed' },
        { status: 401 }
      );
    }
    if (err.status === 429) {
      return NextResponse.json(
        { message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { message: `Error processing request: ${err.message}` },
      { status: 500 }
    );
  }
}
