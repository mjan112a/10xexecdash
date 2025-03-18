import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Force Node.js runtime
export const runtime = 'nodejs';

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
  console.log('Income Statement Table API route hit');
  
  try {
    // Parse the request body
    const requestData = await req.json();
    const reportDate = requestData.reportDate;
    const provider = requestData.provider || 'anthropic';
    
    console.log('Report Date:', reportDate);
    console.log('Provider:', provider);
    
    // Read metrics data
    const metricsData = getMetricsData();
    console.log('Metrics data length:', metricsData.length);
    
    // Format the date for display
    const reportDateObj = new Date(reportDate);
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const reportMonth = monthNames[reportDateObj.getMonth()];
    const reportYear = reportDateObj.getFullYear();
    const reportMonthYear = `${reportMonth} ${reportYear}`;
    
    // Construct the prompt
    const prompt = `Generate an HTML table for a 10X Engineered Materials Income Statement.

The table should show data up to ${reportMonthYear}. Format it exactly like this reference:

REQUIREMENTS:
1. Include all rows shown in the reference with their exact account numbers and names
2. Show F/V indicators for fixed and variable costs in a gray color
3. Format all currency values with $ and commas, negative values in parentheses
4. Calculate totals and percentages based on total revenue
5. Use Tailwind CSS classes for styling to match the application

TABLE STRUCTURE:
- First column: Row labels with account numbers (e.g., "4010 · Revenue-Abrasives Reg")
- Monthly columns from Jan-24 through the report month
- TOTAL column
- % column (percentage of total revenue)

SECTIONS TO INCLUDE:
1. REVENUE
   - All revenue line items (4010, 4020, 4030, etc.)
   - Total Gross Revenue
   - Adjustments
   - NET REVENUE

2. COGS
   - All COGS line items (5000, 5001, 5002, etc.)
   - Mark variable costs with "V" and fixed costs with "F"
   - Total Cost of Goods Sold

3. GROSS PROFIT

4. EXPENSES (SG&A)
   - All expense line items (6010, 6020, 6030, etc.)
   - Mark fixed costs with "F"
   - Total Expenses

5. OPERATING INCOME

6. OTHER INCOME
   - Other income line items
   - Total Other Income

7. OTHER EXPENSE
   - Other expense line items (interest, depreciation, etc.)
   - Total Other Expense

8. NET OTHER INCOME
9. NET INCOME
10. EBITDA

STYLING:
- Use a white background for the table
- Use a blue background (bg-blue-500 text-white) for section headers
- Right-align all numeric values
- Use a slightly larger font for total rows
- Add appropriate padding and borders
- Make the table responsive with horizontal scrolling if needed

Here is the metrics data to use:
${metricsData}

Generate only the HTML table with appropriate Tailwind CSS classes for styling. The table should match the styling of the application.`;

    // Handle different providers
    if (provider === 'openai') {
      // Check if OPENAI_API_KEY is set
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { message: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a financial report generator that creates HTML tables with Tailwind CSS styling."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000
      });
      
      const tableHtml = completion.choices[0].message.content || '';
      return NextResponse.json({ tableHtml });
      
    } else {
      // Default to Anthropic
      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json(
          { message: 'Anthropic API key not configured' },
          { status: 500 }
        );
      }
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }
      
      const data = await response.json();
      const tableHtml = data.content[0].text;
      
      return NextResponse.json({ tableHtml });
    }
    
  } catch (error) {
    console.error('Error in Income Statement Table API route:', error);
    return NextResponse.json(
      { message: `Error generating table: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
