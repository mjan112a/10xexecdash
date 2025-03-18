// Script to generate a monthly report using Claude 3.7 Sonnet Extended
// This script combines the system prompt, outline, and metrics data
// and sends it to the Anthropic API to generate a comprehensive monthly report

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load environment variables from .env.local first, then fall back to .env
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
  console.log('Loaded environment variables from .env.local');
} else {
  require('dotenv').config();
  console.log('Loaded environment variables from .env');
}

// Function to read file contents
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Function to parse CSV data
function parseCSV(csvData) {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  const dateColumns = headers.slice(6);
  
  // Create a structured data object
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
  
  return {
    dateColumns,
    flatData: data
  };
}

// Function to format metrics data for the LLM
function formatMetricsForLLM(metricsData) {
  if (!metricsData || !metricsData.flatData) {
    console.log('No metrics data available for formatting');
    return '';
  }
  
  // Get all date columns
  const dateColumns = metricsData.dateColumns || [];
  console.log(`Formatting metrics data with ${dateColumns.length} months of data`);
  console.log(`Metrics data contains ${metricsData.flatData.length} metrics`);
  
  // Determine the target month (most recent month)
  const targetMonthIndex = dateColumns.length - 1;
  const targetMonth = dateColumns[targetMonthIndex];
  
  // Format the metrics data
  let formattedData = '## METRICS DATA FOR MONTHLY REPORT\n\n';
  formattedData += `This section contains metrics data for your monthly report. The report is for: **March 2025**.\n\n`;
  formattedData += `### IMPORTANT ANALYSIS INSTRUCTIONS\n\n`;
  formattedData += `1. Focus your analysis on the data for **${targetMonth}** (Column ${targetMonthIndex + 1})\n`;
  formattedData += `2. Compare with the previous month (${targetMonthIndex > 0 ? dateColumns[targetMonthIndex - 1] : 'N/A'})\n`;
  formattedData += `3. Compare with the same month last year if available (${targetMonthIndex >= 12 ? dateColumns[targetMonthIndex - 12] : 'N/A'})\n`;
  formattedData += `4. Calculate percentage changes and identify significant trends\n`;
  formattedData += `5. For each section, analyze the relevant metrics and provide insights\n\n`;
  
  // Add a reference for the date columns
  formattedData += '### Date Reference\n\n';
  formattedData += 'The following dates correspond to the columns in the data:\n\n';
  dateColumns.forEach((date, index) => {
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
  
  const businessMetrics = metricsData.flatData.filter(metric => 
    (metric.metricGroup === 'Accounting' && 
     (metric.metricCategory === 'Income Statement' || 
      metric.metricCategory === 'Cash Flow Statement' || 
      metric.metricCategory === 'Balance Sheet'))
  );
  
  businessMetrics.forEach(metric => {
    formattedData += `**${metric.metricName}** (${metric.unit}):\n`;
    formattedData += `${metric.values.join(', ')}\n\n`;
  });
  
  // Sales section metrics
  formattedData += '#### Sales Metrics\n\n';
  formattedData += 'ANALYSIS INSTRUCTIONS: Analyze Total Orders, Tons Sold, Average Price, Online vs Offline sales, and product mix (KinetiX, DynamiX, EpiX). Calculate the percentage of online orders and revenue. Identify trends in distributor vs direct sales channels.\n\n';
  
  const salesMetrics = metricsData.flatData.filter(metric => 
    metric.metricGroup === 'Sales'
  );
  
  salesMetrics.forEach(metric => {
    formattedData += `**${metric.metricName}** (${metric.unit}):\n`;
    formattedData += `${metric.values.join(', ')}\n\n`;
  });
  
  // Marketing section metrics
  formattedData += '#### Marketing Metrics\n\n';
  formattedData += 'ANALYSIS INSTRUCTIONS: Analyze Digital Marketing Expenses, General Marketing Expenses, and Total Marketing Expenses. Calculate the percentage of digital vs general marketing. Evaluate the effectiveness of marketing spend by comparing to online orders and revenue.\n\n';
  
  const marketingMetrics = metricsData.flatData.filter(metric => 
    metric.metricGroup === 'Costs' && metric.metricCategory === 'Marketing'
  );
  
  marketingMetrics.forEach(metric => {
    formattedData += `**${metric.metricName}** (${metric.unit}):\n`;
    formattedData += `${metric.values.join(', ')}\n\n`;
  });
  
  // Cost Reduction section metrics
  formattedData += '#### Cost Reduction Metrics\n\n';
  formattedData += 'ANALYSIS INSTRUCTIONS: Focus on Raw Material costs, Sales Expenses (Distributor, Direct, Total). Calculate month-over-month changes and identify cost reduction opportunities. Analyze the relationship between sales costs and revenue.\n\n';
  
  const costMetrics = metricsData.flatData.filter(metric => 
    (metric.metricGroup === 'Costs' && metric.metricCategory === 'Sales') ||
    (metric.metricGroup === 'Accounting' && metric.metricName.includes('Raw Material'))
  );
  
  costMetrics.forEach(metric => {
    formattedData += `**${metric.metricName}** (${metric.unit}):\n`;
    formattedData += `${metric.values.join(', ')}\n\n`;
  });
  
  // Operations section metrics
  formattedData += '#### Operations Metrics\n\n';
  formattedData += 'ANALYSIS INSTRUCTIONS: Analyze Uptime, Yield, and production efficiency metrics. Calculate month-over-month changes and identify operational improvements or challenges. Evaluate inventory levels and production capacity.\n\n';
  
  const operationsMetrics = metricsData.flatData.filter(metric => 
    metric.metricGroup === 'Manufacturing Process'
  );
  
  operationsMetrics.forEach(metric => {
    formattedData += `**${metric.metricName}** (${metric.unit}):\n`;
    formattedData += `${metric.values.join(', ')}\n\n`;
  });
  
  console.log(`Formatted metrics data: ${formattedData.length} characters`);
  
  return formattedData;
}

// Main function to generate the report
async function generateReport() {
  try {
    // Read the system prompt, outline, and metrics data
    const systemPrompt = readFile(path.join(__dirname, 'monthlyrptsysprompt.txt'));
    const outline = readFile(path.join(__dirname, 'Monthly Report Outline - 03-14-2025.docx.txt'));
    const metricsCSV = readFile(path.join(__dirname, '10X Business Metrics - 03-06-2025e.csv'));
    
    // Parse the metrics data
    const metricsData = parseCSV(metricsCSV);
    
    // Format the metrics data for the LLM
    const formattedMetrics = formatMetricsForLLM(metricsData);
    
    // Combine everything into a single prompt
    const combinedPrompt = `${systemPrompt}\n\n# MONTHLY REPORT OUTLINE\n\n${outline}\n\n# RAW METRICS DATA\n\n${formattedMetrics}`;
    
    console.log('Combined prompt length:', combinedPrompt.length);
    
    // Check if ANTHROPIC_API_KEY is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY environment variable is not set');
      console.log('Please ensure your API key is set in .env.local or .env file:');
      console.log('ANTHROPIC_API_KEY=your_api_key_here');
      return;
    }
    
    // Call the Anthropic API
    console.log('Calling Anthropic API...');
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 100000,
        messages: [
          {
            role: 'user',
            content: combinedPrompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Save the generated report
    const report = response.data.content[0].text;
    fs.writeFileSync(path.join(__dirname, 'Monthly Report - March 2025.md'), report);
    
    console.log('Report generated successfully!');
    console.log('Saved to:', path.join(__dirname, 'Monthly Report - March 2025.md'));
    
  } catch (error) {
    console.error('Error generating report:', error);
    if (error.response) {
      console.error('API response error:', error.response.data);
    }
  }
}

// Run the main function
generateReport();
