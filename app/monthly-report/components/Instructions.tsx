'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function Instructions() {
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <Card className="mb-6">
      <div 
        className="p-4 bg-blue-50 border-b flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-800">How to Create a Monthly Report</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-blue-600">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium mb-2">Step 1: Create a New Report</h3>
              <p className="text-sm text-gray-600">
                In the <strong>Manage Reports</strong> tab, click the "New Report" button. Enter a title and select the month for your report.
              </p>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Step 2: Enter Report Highlights</h3>
              <p className="text-sm text-gray-600">
                Switch to the <strong>Edit Report</strong> tab. Fill in the highlight forms for each section of the report:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 ml-4 space-y-1">
                <li>LLM Context: Brief context about the month</li>
                <li>CEO Message: Strategic priorities, business progress, challenges</li>
                <li>Business Performance: Revenue, margins, cash flow</li>
                <li>Sales: Orders, pricing, sales breakdown</li>
                <li>Marketing: Marketing expenses, events, initiatives</li>
                <li>Cost Reduction: Raw material costs, sales costs</li>
                <li>Operations: Uptime, yield, inventory, safety</li>
                <li>Financial Statements: Detailed financial data</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Step 3: Add Graphs (Optional)</h3>
              <p className="text-sm text-gray-600">
                Go to the <strong>Metrics Trend Analysis</strong> page. Create graphs and use the "Save to Monthly Report" button to add them to your report.
              </p>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Step 4: Generate the Report</h3>
              <p className="text-sm text-gray-600">
                Switch to the <strong>Generate Report</strong> tab. Click the "Generate Report" button to create a professional report using the LLM.
              </p>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Step 5: Export as PDF</h3>
              <p className="text-sm text-gray-600">
                Review the generated report and click the "Export PDF" button to download a professionally formatted PDF.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
