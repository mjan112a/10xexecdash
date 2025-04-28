import { prisma } from '@/lib/mongodb';
import { headers } from 'next/headers';

export interface AILoggingData {
  provider: string;
  model: string;
  endpoint: string;
  requestPrompt: string;
  response: string;
  requestData: any;
  responseData: any;
  tokens?: number | null;
  duration?: number | null;
  status: 'success' | 'error';
  errorMessage?: string | null;
  interaction?: string | null;
}

export async function logAIInteraction(data: AILoggingData) {
  // Get client IP address
  const headersList = headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

  try {
    await prisma.aIInteraction.create({
      data: {
        ...data,
        requestData: data.requestData || {},
        responseData: data.responseData || {},
        ipAddress,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error logging AI interaction:', error);
    // Don't throw the error - we don't want logging failures to break the main functionality
  }
}

// Helper function to calculate duration
export function calculateDuration(startTime: number): number {
  return Date.now() - startTime;
}

// Helper function to safely extract tokens from OpenAI response
export function getOpenAITokens(completion: any): number | null {
  return completion?.usage?.total_tokens || null;
}

// Helper function to safely extract tokens from Anthropic response
export function getAnthropicTokens(data: any): number | null {
  return (data?.usage?.input_tokens || 0) + (data?.usage?.output_tokens || 0) || null;
}

// Helper function to safely extract tokens from Perplexity response
export function getPerplexityTokens(data: any): number | null {
  return data?.usage?.total_tokens || null;
} 