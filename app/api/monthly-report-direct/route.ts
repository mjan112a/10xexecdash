import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

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
    const metricsPath = path.join(process.cwd(), '10X Business Metrics - 03-06-2025e.csv');
    return fs.readFileSync(metricsPath, 'utf8');
  } catch (error) {
    console.error('Error reading metrics data file:', error);
    return '';
  }
};

export async function POST(req: Request) {
  console.log('API route hit - ANTHROPIC API VERSION');
  console.log('Current working directory:', process.cwd());
  
  try {
    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data:', requestData);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { message: 'Failed to parse request body' },
        { status: 400 }
      );
    }
    
    // Extract message and provider
    const message = requestData.message || '';
    const provider = requestData.provider || 'anthropic';
    
    console.log('Message:', message);
    console.log('Provider:', provider);
    
    // Extract report title from the message
    const reportTitleMatch = message.match(/Monthly Report for (.+?)(\n|$)/);
    const reportTitle = reportTitleMatch ? reportTitleMatch[1].trim() : 'Unknown Month';
    console.log('Extracted report title:', reportTitle);
    
    // Read files
    console.log('Reading files...');
    let systemPrompt, outlineFile, metricsData;
    
    try {
      systemPrompt = getSystemPrompt();
      console.log('System prompt length:', systemPrompt.length);
    } catch (error) {
      console.error('Error reading system prompt:', error);
      return NextResponse.json(
        { message: 'Failed to read system prompt' },
        { status: 500 }
      );
    }
    
    try {
      outlineFile = getOutlineFile();
      console.log('Outline file length:', outlineFile.length);
    } catch (error) {
      console.error('Error reading outline file:', error);
      return NextResponse.json(
        { message: 'Failed to read outline file' },
        { status: 500 }
      );
    }
    
    try {
      metricsData = getMetricsData();
      console.log('Metrics data length:', metricsData.length);
    } catch (error) {
      console.error('Error reading metrics data file:', error);
      return NextResponse.json(
        { message: 'Failed to read metrics data file' },
        { status: 500 }
      );
    }
    
    // Combine everything into a single prompt
    const combinedPrompt = `${message}\n\n# MONTHLY REPORT OUTLINE\n\n${outlineFile}\n\n# RAW METRICS DATA\n\n${metricsData}`;
    console.log('Combined prompt length:', combinedPrompt.length);
    
    // Handle different providers
    if (provider === 'openai') {
      console.log('Using OpenAI API with GPT-4.5...');
      
      // Check if OPENAI_API_KEY is set
      if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY environment variable is not set');
        
        // Try to read directly from .env.local as a fallback
        try {
          if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
            const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
            const match = envContent.match(/OPENAI_API_KEY=([^\r\n]+)/);
            if (match && match[1]) {
              console.log('Found OPENAI_API_KEY in .env.local file directly');
              process.env.OPENAI_API_KEY = match[1].trim();
            } else {
              console.error('OPENAI_API_KEY not found in .env.local file');
              return NextResponse.json(
                { message: 'OpenAI API key not configured in .env.local' },
                { status: 500 }
              );
            }
          } else {
            console.error('.env.local file not found');
            return NextResponse.json(
              { message: 'OpenAI API key not configured and .env.local file not found' },
              { status: 500 }
            );
          }
        } catch (error) {
          console.error('Error reading .env.local file:', error);
          return NextResponse.json(
            { message: 'Error reading OpenAI API key configuration' },
            { status: 500 }
          );
        }
      }
      
      // Log API key info (safely)
      console.log('OpenAI API key info:', {
        exists: !!process.env.OPENAI_API_KEY,
        length: process.env.OPENAI_API_KEY?.length,
        prefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...'
      });
      
      // Call the OpenAI API
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        
        console.log('Calling OpenAI API with GPT-4.5...');
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
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
        console.log('Response structure:', Object.keys(completion));
        
        if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
          throw new Error('Invalid response format from OpenAI API');
        }
        
        const responseText = completion.choices[0].message.content || '';
        console.log('Response text length:', responseText.length);
        
        return NextResponse.json({ response: responseText });
        
      } catch (error) {
        console.error('Error calling OpenAI API:', error);
        return NextResponse.json(
          { message: `Error calling OpenAI API: ${error instanceof Error ? error.message : String(error)}` },
          { status: 500 }
        );
      }
    } else if (provider !== 'anthropic') {
      console.log('Using mock response for Perplexity provider');
      return NextResponse.json({
        response: `This is a test response for: ${message}. Using provider: ${provider}.
        
# Monthly Report for ${reportTitle}

## Executive Summary

This is a test response with file reading. The following files were successfully read:
- System prompt (${systemPrompt.length} characters)
- Outline file (${outlineFile.length} characters)
- Metrics data (${metricsData.length} characters)

## Business Performance

- Revenue: $1.2M
- Profit: $300K
- Growth: 15%

## Conclusion

This is just a test response to diagnose API issues.`
      });
    }
    
    // Check if ANTHROPIC_API_KEY is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY environment variable is not set');
      
      // Try to read directly from .env.local as a fallback
      try {
        if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
          const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
          const match = envContent.match(/ANTHROPIC_API_KEY=([^\r\n]+)/);
          if (match && match[1]) {
            console.log('Found ANTHROPIC_API_KEY in .env.local file directly');
            process.env.ANTHROPIC_API_KEY = match[1].trim();
          } else {
            console.error('ANTHROPIC_API_KEY not found in .env.local file');
            return NextResponse.json(
              { message: 'API key not configured in .env.local' },
              { status: 500 }
            );
          }
        } else {
          console.error('.env.local file not found');
          return NextResponse.json(
            { message: 'API key not configured and .env.local file not found' },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('Error reading .env.local file:', error);
        return NextResponse.json(
          { message: 'Error reading API key configuration' },
          { status: 500 }
        );
      }
    }
    
    // Log API key info (safely)
    console.log('API key info:', {
      exists: !!process.env.ANTHROPIC_API_KEY,
      length: process.env.ANTHROPIC_API_KEY?.length,
      prefix: process.env.ANTHROPIC_API_KEY?.substring(0, 10) + '...'
    });
    
    // Call the Anthropic API
    console.log('Calling Anthropic API with Claude 3.5...');
    try {
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
      
      console.log('Request body structure:', Object.keys(requestBody));
      console.log('Model:', requestBody.model);
      console.log('Max tokens:', requestBody.max_tokens);
      console.log('Messages length:', requestBody.messages.length);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Anthropic API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Anthropic API error response:', errorText);
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Anthropic API response structure:', Object.keys(data));
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Anthropic API');
      }
      
      const responseText = data.content[0].text;
      console.log('Response text length:', responseText.length);
      
      return NextResponse.json({ response: responseText });
      
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      return NextResponse.json(
        { message: `Error calling Anthropic API: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { message: `Error in API route: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
