import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/mongodb';
import { cookies, headers } from 'next/headers';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['text/csv', 'application/vnd.ms-excel', 'application/csv'];

export async function POST(request: NextRequest) {
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

    // Get client IP address
    const headersList = headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 
                     request.ip || 
                     'unknown';

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const notes = formData.get('notes') as string;
    const tags = formData.get('tags') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV files are allowed.' },
        { status: 400 }
      );
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    const content = new TextDecoder().decode(buffer);

    // Calculate file hash
    const hash = createHash('sha256')
      .update(content)
      .digest('hex');

    // Check for duplicates
    const existingFile = await prisma.businessMetricsFile.findFirst({
      where: {
        fileHash: hash,
      },
    });

    if (existingFile) {
      return NextResponse.json(
        { 
          error: 'Duplicate file detected',
          details: `This file has already been uploaded as "${existingFile.fileName}" on ${existingFile.uploadDate.toISOString()}`
        },
        { status: 409 }
      );
    }

    // Parse tags
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // Create file record
    const savedFile = await prisma.businessMetricsFile.create({
      data: {
        fileName: file.name,
        fileHash: hash,
        fileSize: file.size,
        mimeType: file.type,
        content: content,
        ipAddress: ipAddress,
        metadata: {
          uploadedBy: 'ricci', // Since we're using a simple auth system
          notes: notes || undefined,
          tags: parsedTags.length > 0 ? parsedTags : undefined,
        },
      },
    });

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileId: savedFile.id,
      fileName: savedFile.fileName,
      uploadDate: savedFile.uploadDate,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 