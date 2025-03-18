'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { useReport } from '../report-context';

export default function GraphsSection() {
  const { currentReport, graphs } = useReport();
  
  // Filter graphs by type
  const revenueGraphs = graphs.filter(graph => 
    graph.name.toLowerCase().includes('revenue') || 
    graph.name.toLowerCase().includes('income') || 
    graph.name.toLowerCase().includes('margin')
  );
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Report Graphs</h2>
      
      <Card className="mb-8 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Financial Performance Graphs</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            These graphs show key financial performance metrics over time.
          </p>
          
          {currentReport && revenueGraphs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {revenueGraphs.map(graph => (
                <div key={graph.id} className="border rounded-md p-4 bg-white">
                  <h3 className="text-lg font-medium mb-2">{graph.name}</h3>
                  {graph.image_url ? (
                    <img 
                      src={graph.image_url} 
                      alt={graph.name} 
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="h-64 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500">No image available</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-100 rounded-md text-center">
              <p className="text-gray-500">
                {!currentReport 
                  ? "Please select or create a report to view graphs" 
                  : "No financial performance graphs available. Create graphs in the Edit Report section."}
              </p>
            </div>
          )}
        </div>
      </Card>
      
      <Card className="mb-8 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Planned Financial Graphs</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            The following graphs will be implemented in future updates:
          </p>
          <ul className="list-disc list-inside space-y-2 p-4 bg-gray-100 rounded-md">
            <li>Total Revenue, Gross Margin, Operating Margin/EBITDA, Net Income (line chart)</li>
            <li>Total Revenue, Gross Margin, Operating Margin/EBITDA, Net Income Percentages (line chart)</li>
            <li>Monthly Revenue Comparison (bar chart)</li>
            <li>YTD Revenue Comparison (bar chart)</li>
            <li>Cash Flow Trends (line chart)</li>
            <li>Balance Sheet Composition (stacked bar chart)</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
