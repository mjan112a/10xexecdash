import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { logAIInteraction, calculateDuration, getOpenAITokens, getAnthropicTokens } from '@/lib/ai-logging';
import { getLatestCSVPath } from '@/lib/csv-config';

// Force Node.js runtime
export const runtime = 'nodejs';

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

// Read the outline file
const getOutlineFile = (): string => {
  try {
    const outlinePath = path.join(process.cwd(), 'Monthly Report Outline - 03-14-2025.docx.txt');
    return fs.readFileSync(outlinePath, 'utf8');
  } catch (error) {
    console.error('Error reading outline file:', error);
    return '';
  }
};

// Read the metrics data file
const getMetricsData = (): string => {
  try {
    const metricsPath = getLatestCSVPath();
    return fs.readFileSync(metricsPath, 'utf8');
  } catch (error) {
    console.error('Error reading metrics data file:', error);
    return '';
  }
};

export async function POST(req: Request) {
  console.log('API route hit - ANTHROPIC API VERSION');
  console.log('Current working directory:', process.cwd());
  
  let startTime = Date.now();
  let status: 'success' | 'error' = 'success';
  let errorMessage = null;
  let responseText = '';
  let userMessage = '';
  let provider = 'anthropic';
  
  try {
    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data:', requestData);
    } catch (error) {
      status = 'error';
      errorMessage = 'Failed to parse request body';
      throw new Error(errorMessage);
    }
    
    // Extract message and provider
    userMessage = requestData.message || '';
    provider = requestData.provider || 'anthropic';
    
    console.log('Message:', userMessage);
    console.log('Provider:', provider);
    
    // Extract report title from the message
    const reportTitleMatch = userMessage.match(/Monthly Report for (.+?)(\n|$)/);
    const reportTitle = reportTitleMatch ? reportTitleMatch[1].trim() : 'Unknown Month';
    console.log('Extracted report title:', reportTitle);
    
    // Read files
    console.log('Reading files...');
    let systemPrompt, outlineFile, metricsData;
    
    try {
      systemPrompt = getSystemPrompt();
      console.log('System prompt length:', systemPrompt.length);
    } catch (error) {
      status = 'error';
      errorMessage = 'Failed to read system prompt';
      throw new Error(errorMessage);
    }
    
    try {
      outlineFile = getOutlineFile();
      console.log('Outline file length:', outlineFile.length);
    } catch (error) {
      status = 'error';
      errorMessage = 'Failed to read outline file';
      throw new Error(errorMessage);
    }
    
    try {
      metricsData = getMetricsData();
      console.log('Metrics data length:', metricsData.length);
    } catch (error) {
      status = 'error';
      errorMessage = 'Failed to read metrics data file';
      throw new Error(errorMessage);
    }
    
    // Combine everything into a single prompt
    const combinedPrompt = `${userMessage}\n\n# MONTHLY REPORT OUTLINE\n\n${outlineFile}\n\n# RAW METRICS DATA\n\n${metricsData}`;
    console.log('Combined prompt length:', combinedPrompt.length);
    
    // Handle different providers
    if (provider === 'openai') {
      console.log('Using OpenAI API with GPT-4.5...');
      
      // Check if OPENAI_API_KEY is set
      if (!process.env.OPENAI_API_KEY) {
        status = 'error';
        errorMessage = 'OpenAI API key not configured';
        throw new Error(errorMessage);
      }
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      console.log('Calling OpenAI API with GPT-4.5...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: combinedPrompt
          }
        ],
        max_tokens: 4000
      });
      
      console.log('OpenAI API response received');
      
      if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
        status = 'error';
        errorMessage = 'Invalid response format from OpenAI API';
        throw new Error(errorMessage);
      }
      
      responseText = completion.choices[0].message.content || '';
      
      // Log the AI interaction
      await logAIInteraction({
        provider: 'openai',
        model: 'gpt-4',
        endpoint: '/api/monthly-report-direct',
        requestPrompt: combinedPrompt,
        response: responseText,
        requestData: {
          message: userMessage,
          reportTitle,
          systemPromptLength: systemPrompt.length,
          outlineLength: outlineFile.length,
          metricsDataLength: metricsData.length
        },
        responseData: {
          responseLength: responseText.length
        },
        tokens: getOpenAITokens(completion),
        duration: calculateDuration(startTime),
        status,
        errorMessage,
        interaction: 'Monthly_Report_Direct'
      });
      
      return NextResponse.json({ response: responseText });
      
    } else {
      // Default to Anthropic
      if (!process.env.ANTHROPIC_API_KEY) {
        status = 'error';
        errorMessage = 'Anthropic API key not configured';
        throw new Error(errorMessage);
      }
      
      const requestBody = {
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n${combinedPrompt}`
          }
        ]
      };
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        status = 'error';
        errorMessage = `Anthropic API error: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        status = 'error';
        errorMessage = 'Invalid response format from Anthropic API';
        throw new Error(errorMessage);
      }
      
      responseText = data.content[0].text;
      
      // Log the AI interaction
      await logAIInteraction({
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20240620',
        endpoint: '/api/monthly-report-direct',
        requestPrompt: `${systemPrompt}\n\n${combinedPrompt}`,
        response: responseText,
        requestData: {
          message: userMessage,
          reportTitle,
          systemPromptLength: systemPrompt.length,
          outlineLength: outlineFile.length,
          metricsDataLength: metricsData.length
        },
        responseData: {
          responseLength: responseText.length
        },
        tokens: getAnthropicTokens(data),
        duration: calculateDuration(startTime),
        status,
        errorMessage,
        interaction: 'Monthly_Report_Direct'
      });
      
      return NextResponse.json({ response: responseText });
    }
    
  } catch (error) {
    console.error('Error in API route:', error);
    
    // Log the error interaction
    await logAIInteraction({
      provider,
      model: provider === 'openai' ? 'gpt-4' : 'claude-3-5-sonnet-20240620',
      endpoint: '/api/monthly-report-direct',
      requestPrompt: userMessage,
      response: responseText,
      requestData: {
        message: userMessage
      },
      responseData: {},
      duration: calculateDuration(startTime),
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
      interaction: 'Monthly_Report_Direct'
    });
    
    return NextResponse.json(
      { message: `Error in API route: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
