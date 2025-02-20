import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'metricsofinterest.txt');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const rows = fileContent.split('\n').map(row => row.split('\t').map(cell => cell.trim()));

    return NextResponse.json({ rows });
  } catch (error) {
    console.error('Error reading metrics file:', error);
    return NextResponse.json(
      { error: 'Failed to read metrics data' },
      { status: 500 }
    );
  }
}