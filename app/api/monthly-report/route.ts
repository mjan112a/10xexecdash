import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import { logAIInteraction, calculateDuration, getPerplexityTokens } from '@/lib/ai-logging';

// Force Node.js runtime and set max duration (60s is max for hobby plan)
export const runtime = 'nodejs';
export const maxDuration = 60;

// Read the system prompt from the file
const getSystemPrompt = (): string => {
  try {
    const promptPath = path.join(process.cwd(), 'monthlyrptsysprompt.txt');
    return fs.readFileSync(promptPath, 'utf8');
  } catch (error) {
    console.error('Error reading system prompt file:', error);
    return `You are tasked with creating a professional monthly business report for 10X Engineered Materials, a company that manufactures superoxalloy abrasives for industrial applications. Using the bullet points provided, transform them into a comprehensive, well-structured report that follows the company's voice and reporting style.`;
  }
};

// Function to fetch metrics data
async function fetchMetricsData() {
  try {
    // Create a request to the metrics API
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = headers().get('host') || 'localhost:3000';
    const url = `${protocol}://${host}/api/metrics`;
    
    console.log('DEBUG: Fetching metrics data from:', url);
    console.log('DEBUG: Headers:', JSON.stringify(headers().entries()));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });
    
    console.log('DEBUG: Metrics API response status:', response.status);
    console.log('DEBUG: Metrics API response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics data: ${response.status}`);
    }
    
    // Try to get the response text first to debug
    const responseText = await response.text();
    console.log('DEBUG: Metrics API response text (first 200 chars):', responseText.substring(0, 200));
    
    // Check if the response starts with HTML
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error('DEBUG: Received HTML instead of JSON from metrics API');
      
      // Try to read the metrics data directly from the file as a fallback
      try {
        console.log('DEBUG: Attempting to read metrics data directly from file');
        const filePath = path.join(process.cwd(), '10X Business Metrics - 03-06-2025e.csv');
        const fileExists = fs.existsSync(filePath);
        console.log('DEBUG: Metrics file exists:', fileExists);
        
        if (fileExists) {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          console.log('DEBUG: Successfully read metrics file, length:', fileContent.length);
          
          // Parse CSV (simplified version of what the API does)
          const lines = fileContent.split('\n');
          const headers = lines[0].split(',');
          const dateColumns = headers.slice(6);
          
          // Create a simplified data structure
          const data = lines.slice(1).map(line => {
            const values = line.split(',');
            if (values.length < 7) return null;
            
            return {
              uid: values[0].trim(),
              metricGroup: values[1].trim(),
              metricCategory: values[2].trim(),
              metricType: values[3].trim(),
              metricName: values[4].trim(),
              unit: values[5].trim(),
              values: values.slice(6)
            };
          }).filter(item => item !== null);
          
          console.log('DEBUG: Parsed metrics data from file, count:', data.length);
          
          return {
            dateColumns,
            flatData: data
          };
        }
      } catch (fileError) {
        console.error('DEBUG: Error reading metrics file directly:', fileError);
      }
      
      return null;
    }
    
    // Parse the response as JSON
    try {
      const data = JSON.parse(responseText);
      console.log('DEBUG: Successfully parsed metrics data, flatData count:', data.flatData?.length || 0);
      return data;
    } catch (jsonError) {
      console.error('DEBUG: Error parsing metrics data as JSON:', jsonError);
      return null;
    }
  } catch (error) {
    console.error('DEBUG: Error fetching metrics data:', error);
    
    // Try to read the metrics data directly from the file as a fallback
    try {
      console.log('DEBUG: Attempting to read metrics data directly from file after fetch error');
      const filePath = path.join(process.cwd(), '10X Business Metrics - 03-06-2025e.csv');
      const fileExists = fs.existsSync(filePath);
      console.log('DEBUG: Metrics file exists:', fileExists);
      
      if (fileExists) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        console.log('DEBUG: Successfully read metrics file, length:', fileContent.length);
        
        // Parse CSV (simplified version of what the API does)
        const lines = fileContent.split('\n');
        const headers = lines[0].split(',');
        const dateColumns = headers.slice(6);
        
        // Create a simplified data structure
        const data = lines.slice(1).map(line => {
          const values = line.split(',');
          if (values.length < 7) return null;
          
          return {
            uid: values[0].trim(),
            metricGroup: values[1].trim(),
            metricCategory: values[2].trim(),
            metricType: values[3].trim(),
            metricName: values[4].trim(),
            unit: values[5].trim(),
            values: values.slice(6)
          };
        }).filter(item => item !== null);
        
        console.log('DEBUG: Parsed metrics data from file, count:', data.length);
        
        return {
          dateColumns,
          flatData: data
        };
      }
    } catch (fileError) {
      console.error('DEBUG: Error reading metrics file directly:', fileError);
    }
    
    return null;
  }
}

// Function to extract month from report title
function extractMonthFromTitle(title: string): { month: string | null, year: string | null } {
  // Common month name patterns
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  let foundMonth = null;
  let foundYear = null;
  
  // Try to find a month name in the title
  for (const month of monthNames) {
    if (title.includes(month)) {
      foundMonth = month;
      break;
    }
  }
  
  // Try to extract a year pattern
  const yearPattern = /\b(20\d{2})\b/;
  const yearMatch = title.match(yearPattern);
  if (yearMatch) {
    foundYear = yearMatch[0];
  }
  
  return { month: foundMonth, year: foundYear };
}

// Function to format metrics data for the LLM with focus on the report month
function formatMetricsForLLM(metricsData: any, reportTitle: string) {
  if (!metricsData || !metricsData.flatData) {
    console.log('DEBUG: No metrics data available for formatting');
    return '';
  }
  
  // Get all date columns
  const dateColumns = metricsData.dateColumns || [];
  console.log(`DEBUG: Formatting metrics data with ${dateColumns.length} months of data`);
  console.log(`DEBUG: Metrics data contains ${metricsData.flatData.length} metrics`);
  
  // Extract month and year from report title
  const { month, year } = extractMonthFromTitle(reportTitle);
  console.log(`DEBUG: Extracted month: ${month}, year: ${year} from title: ${reportTitle}`);
  
  // Find the target month index
  let targetMonthIndex = dateColumns.length - 1; // Default to most recent month
  if (month && year) {
    // Try to find the month in the date columns
    const monthIndex = dateColumns.findIndex((date: string) => 
      date.includes(month) && date.includes(year)
    );
    
    if (monthIndex !== -1) {
      targetMonthIndex = monthIndex;
      console.log(`DEBUG: Found matching month at index: ${targetMonthIndex}`);
    }
  }
  
  const targetMonth = dateColumns[targetMonthIndex];
  console.log(`DEBUG: Target month for analysis: ${targetMonth}`);
  
  // Format the metrics data
  let formattedData = '## METRICS DATA FOR MONTHLY REPORT\n\n';
  formattedData += `This section contains metrics data for your monthly report. The report is for: **${reportTitle}**.\n\n`;
  formattedData += `### IMPORTANT ANALYSIS INSTRUCTIONS\n\n`;
  formattedData += `1. Focus your analysis on the data for **${targetMonth}** (Column ${targetMonthIndex + 1})\n`;
  formattedData += `2. Compare with the previous month (${targetMonthIndex > 0 ? dateColumns[targetMonthIndex - 1] : 'N/A'})\n`;
  formattedData += `3. Compare with the same month last year if available (${targetMonthIndex >= 12 ? dateColumns[targetMonthIndex - 12] : 'N/A'})\n`;
  formattedData += `4. Calculate percentage changes and identify significant trends\n`;
  formattedData += `5. For each section, analyze the relevant metrics and provide insights\n\n`;
  
  // Add a reference for the date columns
  formattedData += '### Date Reference\n\n';
  formattedData += 'The following dates correspond to the columns in the data:\n\n';
  dateColumns.forEach((date: string, index: number) => {
    if (index === targetMonthIndex) {
      formattedData += `- Column ${index + 1}: ${date} **(REPORT MONTH)**\n`;
    } else if (index === targetMonthIndex - 1 && targetMonthIndex > 0) {
      formattedData += `- Column ${index + 1}: ${date} **(PREVIOUS MONTH)**\n`;
    } else if (index === targetMonthIndex - 12 && targetMonthIndex >= 12) {
      formattedData += `- Column ${index + 1}: ${date} **(SAME MONTH LAST YEAR)**\n`;
    } else {
      formattedData += `- Column ${index + 1}: ${date}\n`;
    }
  });
  formattedData += '\n';
  
  // Organize metrics by report section with section-specific instructions
  formattedData += '### Metrics By Report Section\n\n';
  
  // Business Performance section metrics
  formattedData += '#### Business Performance Metrics\n\n';
  formattedData += 'ANALYSIS INSTRUCTIONS: Focus on Total Revenue, Gross Income, Net Ordinary Income, Net Income, and Cash at End of Period. Calculate month-over-month and year-over-year changes. Identify trends in margins (Gross, Operating, Net).\n\n';
  
  const businessMetrics = metricsData.flatData.filter((metric: any) => 
    (metric.metricGroup === 'Accounting' && 
     (metric.metricCategory === 'Income Statement' || 
      metric.metricCategory === 'Cash Flow Statement' || 
      metric.metricCategory === 'Balance Sheet'))
  );
  
  businessMetrics.forEach((metric: any) => {
    formattedData += `**${metric.metricName}** (${metric.unit}):\n`;
    formattedData += `${metric.values.join(', ')}\n\n`;
  });
  
  // Sales section metrics
  formattedData += '#### Sales Metrics\n\n';
  formattedData += 'ANALYSIS INSTRUCTIONS: Analyze Total Orders, Tons Sold, Average Price, Online vs Offline sales, and product mix (KinetiX, DynamiX, EpiX). Calculate the percentage of online orders and revenue. Identify trends in distributor vs direct sales channels.\n\n';
  
  const salesMetrics = metricsData.flatData.filter((metric: any) => 
    metric.metricGroup === 'Sales'
  );
  
  salesMetrics.forEach((metric: any) => {
    formattedData += `**${metric.metricName}** (${metric.unit}):\n`;
    formattedData += `${metric.values.join(', ')}\n\n`;
  });
  
  // Marketing section metrics
  formattedData += '#### Marketing Metrics\n\n';
  formattedData += 'ANALYSIS INSTRUCTIONS: Analyze Digital Marketing Expenses, General Marketing Expenses, and Total Marketing Expenses. Calculate the percentage of digital vs general marketing. Evaluate the effectiveness of marketing spend by comparing to online orders and revenue.\n\n';
  
  const marketingMetrics = metricsData.flatData.filter((metric: any) => 
    metric.metricGroup === 'Costs' && metric.metricCategory === 'Marketing'
  );
  
  marketingMetrics.forEach((metric: any) => {
    formattedData += `**${metric.metricName}** (${metric.unit}):\n`;
    formattedData += `${metric.values.join(', ')}\n\n`;
  });
  
  // Cost Reduction section metrics
  formattedData += '#### Cost Reduction Metrics\n\n';
  formattedData += 'ANALYSIS INSTRUCTIONS: Focus on Raw Material costs, Sales Expenses (Distributor, Direct, Total). Calculate month-over-month changes and identify cost reduction opportunities. Analyze the relationship between sales costs and revenue.\n\n';
  
  const costMetrics = metricsData.flatData.filter((metric: any) => 
    (metric.metricGroup === 'Costs' && metric.metricCategory === 'Sales') ||
    (metric.metricGroup === 'Accounting' && metric.metricName.includes('Raw Material'))
  );
  
  costMetrics.forEach((metric: any) => {
    formattedData += `**${metric.metricName}** (${metric.unit}):\n`;
    formattedData += `${metric.values.join(', ')}\n\n`;
  });
  
  // Operations section metrics
  formattedData += '#### Operations Metrics\n\n';
  formattedData += 'ANALYSIS INSTRUCTIONS: Analyze Uptime, Yield, and production efficiency metrics. Calculate month-over-month changes and identify operational improvements or challenges. Evaluate inventory levels and production capacity.\n\n';
  
  const operationsMetrics = metricsData.flatData.filter((metric: any) => 
    metric.metricGroup === 'Manufacturing Process'
  );
  
  operationsMetrics.forEach((metric: any) => {
    formattedData += `**${metric.metricName}** (${metric.unit}):\n`;
    formattedData += `${metric.values.join(', ')}\n\n`;
  });
  
  console.log(`DEBUG: Formatted metrics data: ${formattedData.length} characters`);
  
  // Log a sample of the formatted data
  console.log(`DEBUG: Formatted metrics data sample: ${formattedData.substring(0, 500)}...`);
  
  return formattedData;
}

export async function POST(req: Request) {
  console.log('1. Monthly Report API route hit');
  
  let startTime = Date.now();
  let status: 'success' | 'error' = 'success';
  let errorMessage = null;
  let responseText = '';
  let userMessage = '';
  
  try {
    console.log('2. Parsing request body');
    const { message } = await req.json();
    userMessage = message;
    
    if (!userMessage || typeof userMessage !== 'string') {
      console.error('Invalid message format:', { messageType: typeof userMessage });
      status = 'error';
      errorMessage = 'Invalid request format';
      throw new Error(errorMessage);
    }

    // Extract report title from the message
    const reportTitleMatch = message.match(/Monthly Report for (.+?)(\n|$)/);
    const reportTitle = reportTitleMatch ? reportTitleMatch[1].trim() : 'Unknown Month';
    console.log('DEBUG: Extracted report title:', reportTitle);

    console.log('3. Fetching metrics data');
    const metricsData = await fetchMetricsData();
    console.log('DEBUG: Metrics data fetched:', metricsData ? 'success' : 'failed');
    
    const formattedMetrics = metricsData ? formatMetricsForLLM(metricsData, reportTitle) : '';
    console.log('DEBUG: Metrics data formatted:', formattedMetrics ? 'success' : 'failed');
    console.log('DEBUG: Formatted metrics length:', formattedMetrics?.length || 0);
    
    console.log('4. Creating monthly report content');
    
    // Get the system prompt and append metrics data instructions
    let SYSTEM_PROMPT = getSystemPrompt();
    
    // Add instructions for using metrics data
    SYSTEM_PROMPT += `\n\n# IMPORTANT: USE THE PROVIDED METRICS DATA\n\nThe input will include a section with metrics data for the report month. You MUST use this data when discussing trends, making comparisons, or mentioning specific figures. DO NOT make up or hallucinate any metrics. Always refer to the actual data provided.\n\nWhen discussing trends:\n- Always compare to previous periods (previous month and year-over-year) using the exact numbers from the data\n- Calculate and include specific percentage changes\n- Focus on the report month but provide context from historical data\n- Identify patterns and seasonality in the data\n\nFor each section of the report, analyze the relevant metrics as organized in the "Metrics By Report Section" part of the data.\n`;
    
    // Combine the message with the metrics data
    const enhancedMessage = formattedMetrics ? `${message}\n\n${formattedMetrics}` : message;
    console.log('DEBUG: Enhanced message length:', enhancedMessage.length);
    console.log('DEBUG: Original message length:', message.length);
    console.log('DEBUG: Added metrics data length:', enhancedMessage.length - message.length);
    
    console.log('5. Creating monthly report message');
    
    // Perplexity Implementation
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
          { role: 'user', content: enhancedMessage }
        ],
        include_citations: true,
        context_level: 5,
        include_sources: true
      })
    });

    if (!response.ok) {
      status = 'error';
      errorMessage = `Perplexity API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('5. Monthly report response received - Structure:', {
      hasResponse: !!data.choices?.[0]?.message?.content,
      contentLength: data.choices?.[0]?.message?.content?.length,
      hasContext: !!data.choices?.[0]?.message?.context,
      hasMetadata: !!data.choices?.[0]?.message?.metadata,
      hasCitations: !!data.citations,
      messageKeys: Object.keys(data.choices?.[0]?.message || {})
    });

    if (!data.choices?.[0]?.message?.content) {
      status = 'error';
      errorMessage = 'Invalid response format from API';
      throw new Error(errorMessage);
    }

    responseText = data.choices[0].message.content;
    const citations = data.citations || [];

    // Log the AI interaction
    await logAIInteraction({
      provider: 'perplexity',
      model: 'sonar-reasoning-pro',
      endpoint: '/api/monthly-report',
      requestPrompt: enhancedMessage,
      response: responseText,
      requestData: {
        message: userMessage,
        systemPrompt: SYSTEM_PROMPT
      },
      responseData: {
        responseLength: responseText.length,
        hasCitations: citations.length > 0
      },
      tokens: getPerplexityTokens(data),
      duration: calculateDuration(startTime),
      status,
      errorMessage,
      interaction: 'Monthly_Report'
    });
    
    return NextResponse.json(
      { 
        response: responseText,
        citations: citations
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Error in Monthly Report API route:', error);
    
    // Log the error interaction
    await logAIInteraction({
      provider: 'perplexity',
      model: 'sonar-reasoning-pro',
      endpoint: '/api/monthly-report',
      requestPrompt: userMessage,
      response: responseText,
      requestData: { message: userMessage },
      responseData: {},
      duration: calculateDuration(startTime),
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
      interaction: 'Monthly_Report'
    });

    return NextResponse.json(
      { message: `Error processing request: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
