import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import handlebars from 'handlebars';
import { renderPrompt } from './lib/render';

const prisma = new PrismaClient();

// GET /api/prompts - List all latest prompts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('promptId');
    const replacements = searchParams.get('replacements');

    // If promptId is provided, render the prompt with replacements
    if (promptId) {
      const prompt = await prisma.prompt.findFirst({
        where: { 
          promptId,
          isLatest: true 
        }
      });

      if (!prompt) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
      }

      // Parse replacements if provided
      let parsedReplacements = {};
      if (replacements) {
        try {
          parsedReplacements = JSON.parse(replacements);
        } catch (error) {
          return NextResponse.json({ error: 'Invalid replacements format' }, { status: 400 });
        }
      }

      // Render the prompt with replacements
      const renderedPrompt = renderPrompt({
        template: prompt.template,
        replacements: parsedReplacements,
        warnOnMissing: true
      });

      return NextResponse.json({
        promptId: prompt.promptId,
        title: prompt.title,
        category: prompt.category,
        renderedPrompt
      });
    }

    // Otherwise, return all latest prompts
    const prompts = await prisma.prompt.findMany({
      where: { isLatest: true }
    });
    return NextResponse.json(prompts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

// POST /api/prompts - Create a new prompt
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if a prompt with same title and category exists
    const existingPrompt = await prisma.prompt.findFirst({
      where: { 
        isLatest: true,
        title: {
          equals: body.title,
          mode: 'insensitive'
        },
        category: {
          equals: {
            primary: body.category.primary?.toLowerCase(),
            secondary: body.category.secondary?.toLowerCase(),
            tertiary: body.category.tertiary?.toLowerCase()
          }
        }
      }
    });

    if (existingPrompt) {
      return NextResponse.json(
        { error: 'A prompt with that name and category already exists' }, 
        { status: 409 }
      );
    }

    // Generate promptId from category and title (still using original casing)
    const categoryPath = [
      body.category.primary,
      body.category.secondary,
      body.category.tertiary
    ].filter(Boolean).join('_');
    const promptId = `${categoryPath}_${body.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    // Create new prompt
    const newPrompt = await prisma.prompt.create({
      data: {
        promptId,
        version: 1,
        isLatest: true,
        category: body.category,
        title: body.title,
        template: body.template,
        metadata: {
          ...body.metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    });

    return NextResponse.json(newPrompt);
  } catch (error) {
    console.error('Failed to create prompt:', error);
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
  }
}

// PUT /api/prompts/:promptId - Update a prompt
export async function PUT(
  request: Request,
  { params }: { params: { promptId: string } }
) {
  try {
    const body = await request.json();
    
    // Find the latest version
    const latestPrompt = await prisma.prompt.findFirst({
      where: { 
        promptId: params.promptId,
        isLatest: true 
      }
    });

    if (!latestPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // If title or category changed, check for conflicts
    if (body.title !== latestPrompt.title || JSON.stringify(body.category) !== JSON.stringify(latestPrompt.category)) {
      const existingPrompt = await prisma.prompt.findFirst({
        where: { 
          isLatest: true,
          id: { not: latestPrompt.id }, // Exclude current prompt
          title: {
            equals: body.title,
            mode: 'insensitive'
          },
          category: {
            equals: {
              primary: body.category.primary?.toLowerCase(),
              secondary: body.category.secondary?.toLowerCase(),
              tertiary: body.category.tertiary?.toLowerCase()
            }
          }
        }
      });

      if (existingPrompt) {
        return NextResponse.json(
          { error: 'A prompt with that name and category already exists' }, 
          { status: 409 }
        );
      }

      // Generate new promptId if title/category changed
      const categoryPath = [
        body.category.primary,
        body.category.secondary,
        body.category.tertiary
      ].filter(Boolean).join('_');
      const promptId = `${categoryPath}_${body.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      body.promptId = promptId;
    } else {
      body.promptId = latestPrompt.promptId;
    }

    // Create new version
    const newPrompt = await prisma.prompt.create({
      data: {
        promptId: body.promptId,
        version: latestPrompt.version + 1,
        isLatest: true,
        category: body.category,
        title: body.title,
        template: body.template,
        metadata: {
          ...body.metadata,
          updatedAt: new Date()
        }
      }
    });

    // Mark old version as not latest
    await prisma.prompt.update({
      where: { id: latestPrompt.id },
      data: { isLatest: false }
    });

    return NextResponse.json(newPrompt);
  } catch (error) {
    console.error('Failed to update prompt:', error);
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}

// DELETE /api/prompts/:promptId - Soft delete a prompt
export async function DELETE(
  request: Request,
  { params }: { params: { promptId: string } }
) {
  try {
    // Find all versions of this prompt
    const prompts = await prisma.prompt.findMany({
      where: { 
        promptId: params.promptId
      }
    });

    if (!prompts.length) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Mark all versions as not latest (soft delete)
    await prisma.prompt.updateMany({
      where: { promptId: params.promptId },
      data: { isLatest: false }
    });

    return NextResponse.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Failed to delete prompt:', error);
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
  }
} 