import { NextResponse } from 'next/server';
import { prisma } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    // Get the interaction filter from query parameters
    const { searchParams } = new URL(request.url);
    const interaction = searchParams.get('interaction');

    // Build the query
    const query: any = {
      orderBy: {
        createdAt: 'desc'
      }
    };

    // Add interaction filter if specified
    if (interaction) {
      query.where = {
        interaction: interaction
      };
    }

    // Fetch interactions
    const interactions = await prisma.aIInteraction.findMany(query);

    return NextResponse.json(interactions);
  } catch (error) {
    console.error('Error fetching AI interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI interactions' },
      { status: 500 }
    );
  }
} 