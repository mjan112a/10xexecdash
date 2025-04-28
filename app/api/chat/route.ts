import { NextResponse } from 'next/server';
import { logAIInteraction, calculateDuration, getPerplexityTokens } from '@/lib/ai-logging';

// Force Node.js runtime and set max duration (60s is max for hobby plan)
export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert Data Analysis Assistant with extensive knowledge in:
- Data analysis and interpretation
- Statistical methods and metrics
- Business intelligence
- Performance indicators
- Sales data analysis
- Trend identification
- Report generation
- Data visualization

Your role is to:
1. Help users understand and analyze their data
2. Explain metrics and their significance
3. Identify trends and patterns
4. Suggest relevant visualizations
5. Provide insights and recommendations
6. Help with report interpretation
7. Answer questions about data analysis methods

Maintain a professional, knowledgeable tone while making complex information accessible. When appropriate, cite industry statistics and studies. Focus on helping users gain actionable insights from their data.`;

export async function POST(req: Request) {
  console.log('1. API route hit');
  
  let startTime = Date.now();
  let status: 'success' | 'error' = 'success';
  let errorMessage = null;
  let responseText = '';
  let userMessage = '';
  
  try {
    // Log environment info
    console.log('Environment:', {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      apiKeyExists: !!process.env.PERPLEXITY_API_KEY,
      apiKeyLength: process.env.PERPLEXITY_API_KEY?.length
    });

    console.log('2. Parsing request body');
    const { message } = await req.json();
    userMessage = message;
    
    if (!userMessage || typeof userMessage !== 'string') {
      console.error('Invalid message format:', { messageType: typeof userMessage });
      status = 'error';
      errorMessage = 'Invalid request format';
      throw new Error(errorMessage);
    }

    console.log('3. Creating chat message');
    
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
          { role: 'user', content: userMessage }
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
    console.log('4. Chat response received - Full Response:', JSON.stringify(data, null, 2));
    console.log('Response Structure:', {
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
      endpoint: '/api/chat',
      requestPrompt: userMessage,
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
      interaction: 'General_Chat'
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
    console.error('Error in Chat API route:', error);
    
    // Log the error interaction
    await logAIInteraction({
      provider: 'perplexity',
      model: 'sonar-reasoning-pro',
      endpoint: '/api/chat',
      requestPrompt: userMessage,
      response: responseText,
      requestData: { message: userMessage },
      responseData: {},
      duration: calculateDuration(startTime),
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
      interaction: 'General_Chat'
    });

    return NextResponse.json(
      { message: `Error processing request: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
