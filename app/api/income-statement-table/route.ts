import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { prisma } from '@/lib/mongodb';
import { headers } from 'next/headers';
import { logAIInteraction, calculateDuration, getOpenAITokens, getAnthropicTokens } from '@/lib/ai-logging';
import { renderPrompt } from '../prompts/lib/render';
import { cookies } from 'next/headers';

// Force Node.js runtime
export const runtime = 'nodejs';

// Read the metrics data from the latest uploaded file
const getMetricsData = async (sessionToken: string): Promise<string> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/business-metrics/files?latest=true`, {
      headers: {
        'Cookie': `session-token=${sessionToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch latest metrics file: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Split the content into lines and filter based on criteria
    const lines = data.content.split('\n');
    const headerRow = lines[0]; // Keep the header row
    
    // Filter rows where Metric Group is "Accounting" and Metric Category is "Income Statement"
    const filteredRows = lines.slice(1).filter((line: string) => {
      const columns = line.split(',');
      // Check if we have enough columns and if they match our criteria
      return columns.length >= 3 && 
             columns[1].trim() === 'Accounting' && 
             columns[2].trim() === 'Income Statement';
    });

    // Combine header and filtered rows
    return [headerRow, ...filteredRows].join('\n');
  } catch (error) {
    console.error('Error fetching metrics data:', error);
    return '';
  }
};

interface TokenCount {
  total: number;
  completion?: number;
  prompt?: number;
}

type AnthropicHeaders = Record<string, string>;

// Add retry logic for API calls
async function makeAnthropicRequest(prompt: string, model: string, retries = 3): Promise<any> {
  const headers: AnthropicHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY || '',
    'anthropic-version': '2023-06-01'
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model,
          max_tokens: 7000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });
      
      if (response.status === 529) {
        if (attempt === retries) {
          throw new Error('Anthropic API rate limit reached. Please try again in a few minutes.');
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      if (attempt === retries) throw error;
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

export async function POST(req: Request) {
  console.log('Income Statement Table API route hit');
  
  let requestData;
  let metricsData = '';  // Initialize with empty string
  let startTime = Date.now();
  let status: 'success' | 'error' = 'success';
  let errorMessage = null;
  let tableHtml = '';
  let totalTokens = 0;
  let model = '';
  let provider = 'anthropic';
  
  try {
    // Get session token from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session-token');
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get metrics data using the session token
    metricsData = await getMetricsData(sessionToken.value);

    // Parse the request body
    requestData = await req.json();
    const reportDate = requestData.reportDate;
    provider = requestData.provider || 'anthropic';
    
    console.log('Report Date:', reportDate);
    console.log('Provider:', provider);
    console.log('Metrics data length:', metricsData.length);
    
    if (!metricsData) {
      throw new Error('No metrics data available');
    }

    // Format the date for display
    const reportDateObj = new Date(reportDate);
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const reportMonth = monthNames[reportDateObj.getMonth()];
    const reportYear = reportDateObj.getFullYear();
    const reportMonthYear = `${reportMonth} ${reportYear}`;

    // Retrieve both prompts
    const jsonPrompt = await prisma.prompt.findFirst({
      where: {
        category: {
          equals: {
            primary: 'IncomeStatement',
            secondary: 'JSON'
          }
        },
        title: {
          equals: 'IncomeStatement',
          mode: 'insensitive'
        },
        isLatest: true
      }
    });

    if (!jsonPrompt) {
      throw new Error('Required JSON prompt not found');
    }

    // Render the JSON prompt with replacements
    const jsonPromptText = renderPrompt({
      template: jsonPrompt.template,
      replacements: {
        metricsData,
        reportMonthYear
      },
      warnOnMissing: true
    });

    let jsonResponse;
    let parsedJson;

    // Handle different providers for JSON generation
    if (provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      model = "gpt-4o";
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a financial data processor that generates JSON data from financial data in a CSV format."
          },
          {
            role: "user",
            content: jsonPromptText
          }
        ],
        max_tokens: 7000
      });
      
      jsonResponse = completion.choices[0].message.content || '';
      const openAITokens = getOpenAITokens(completion);
      totalTokens = openAITokens ? openAITokens : 0;

      // Log JSON generation interaction
      await logAIInteraction({
        provider,
        model,
        endpoint: '/api/income-statement-table',
        requestPrompt: jsonPromptText,
        response: jsonResponse,
        requestData: {
          reportDate: requestData.reportDate,
          metricsDataLength: metricsData.length
        },
        responseData: {
          jsonLength: jsonResponse.length
        },
        tokens: totalTokens,
        duration: calculateDuration(startTime),
        status,
        errorMessage,
        interaction: 'Income_Statement_JSON'
      });
      
    } else {
      // Default to Anthropic
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Anthropic API key not configured');
      }
      
      model = 'claude-3-5-sonnet-20240620';
      
      try {
        const data = await makeAnthropicRequest(jsonPromptText, model);
        jsonResponse = data.content[0].text;
        console.log('Raw AI Response:', jsonResponse); // Log the raw response
        
        const anthropicTokens = getAnthropicTokens(data);
        const newTotal = anthropicTokens ? anthropicTokens : 0;
        totalTokens = newTotal;

        // Log successful JSON generation interaction with enhanced metadata
        await logAIInteraction({
          provider,
          model,
          endpoint: '/api/income-statement-table',
          requestPrompt: jsonPromptText,
          response: jsonResponse,
          requestData: {
            reportDate: requestData.reportDate,
            metricsDataLength: metricsData.length
          },
          responseData: {
            jsonLength: jsonResponse.length,
            responseId: data.id,
            stopReason: data.stop_reason,
            stopSequence: data.stop_sequence,
            usage: data.usage
          },
          tokens: totalTokens,
          duration: calculateDuration(startTime),
          status: 'success',
          errorMessage: null,
          interaction: 'Income_Statement_JSON'
        });
      } catch (error) {
        console.error('Error in Anthropic API call:', error); // Log any API errors
        // Log the error interaction before throwing
        await logAIInteraction({
          provider,
          model,
          endpoint: '/api/income-statement-table',
          requestPrompt: jsonPromptText,
          response: '',
          requestData: {
            reportDate: requestData.reportDate,
            metricsDataLength: metricsData.length
          },
          responseData: {},
          tokens: 0,
          duration: calculateDuration(startTime),
          status: 'error',
          errorMessage: error instanceof Error ? error.message : String(error),
          interaction: 'Income_Statement_JSON'
        });
        throw new Error(`Failed to generate JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Validate JSON response
    try {
      console.log('Attempting to parse JSON response...'); // Log before parsing
      parsedJson = JSON.parse(jsonResponse);
      console.log('Parsed JSON:', parsedJson); // Log the parsed JSON
      
      // Validate the parsed JSON structure
      if (!Array.isArray(parsedJson)) {
        console.error('JSON is not an array:', parsedJson); // Log invalid structure
        throw new Error('JSON response must be an array');
      }
      
      if (parsedJson.length === 0) {
        console.error('JSON array is empty'); // Log empty array
        throw new Error('JSON response array is empty');
      }
      
      if (!parsedJson[0] || typeof parsedJson[0] !== 'object') {
        console.error('First element is not an object:', parsedJson[0]); // Log invalid first element
        throw new Error('First element of JSON response must be an object');
      }
      
      if (!parsedJson[0].account) {
        console.error('First element missing account field:', parsedJson[0]); // Log missing account
        throw new Error('Each row must have an account field');
      }

      // Get all unique fields except 'account' to create columns
      const allFields = new Set<string>();
      parsedJson.forEach((row: any) => {
        Object.keys(row).forEach(key => {
          if (key !== 'account') {
            allFields.add(key);
          }
        });
      });

      const fieldArray = Array.from(allFields);
      console.log('Fields found:', fieldArray); // Log the fields we found

      // Transform the data into AG Grid format
      const columns = [
        {
          field: 'account',
          headerName: 'Account',
          width: 400,
          pinned: 'left',
          cellStyle: { textAlign: 'left' }
        },
        ...fieldArray.map(key => ({
          field: key,
          headerName: key.charAt(0).toUpperCase() + key.slice(1),
          width: 120,
          type: 'numericColumn',
          valueFormatter: (params: any) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(params.value || 0);
          }
        }))
      ];

      console.log('Final columns:', columns); // Log the final column definitions
      console.log('Final rows:', parsedJson); // Log the final row data

      // Return the data in AG Grid format
      return NextResponse.json({
        columns,
        rows: parsedJson
      });
      
    } catch (error: any) {
      console.error('Error processing JSON:', error); // Log JSON processing errors
      throw new Error(`Invalid JSON response: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Error in Income Statement Table API route:', error);
    
    // Log the error interaction
    await logAIInteraction({
      provider,
      model: provider === 'openai' ? 'gpt-4' : 'claude-3-5-sonnet-20240620',
      endpoint: '/api/income-statement-table',
      requestPrompt: '',
      response: '',
      requestData: {
        reportDate: requestData?.reportDate,
        metricsDataLength: metricsData?.length
      },
      responseData: {},
      duration: calculateDuration(startTime),
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
      interaction: 'Income_Statement_Error'
    });

    return NextResponse.json(
      { message: `Error generating table: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
