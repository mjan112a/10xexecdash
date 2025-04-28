import { NextResponse } from 'next/server';
import { prisma } from '@/lib/mongodb';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session-token');
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if this is a request for the latest file
    const url = new URL(request.url);
    const isLatest = url.searchParams.get('latest') === 'true';

    if (isLatest) {
      // Fetch only the most recent file with its content
      const latestFile = await prisma.businessMetricsFile.findFirst({
        orderBy: {
          uploadDate: 'desc',
        },
        select: {
          id: true,
          fileName: true,
          uploadDate: true,
          metadata: true,
          content: true,
        },
      });

      if (!latestFile) {
        return NextResponse.json(
          { error: 'No files found' },
          { status: 404 }
        );
      }

      return NextResponse.json(latestFile);
    }

    // Fetch all files sorted by upload date descending
    const files = await prisma.businessMetricsFile.findMany({
      orderBy: {
        uploadDate: 'desc',
      },
      select: {
        id: true,
        fileName: true,
        uploadDate: true,
        metadata: true,
      },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
} 