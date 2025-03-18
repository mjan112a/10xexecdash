'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useReport } from '../report-context';

interface IncomeStatementTableProps {
  reportDate: string;
}

export default function IncomeStatementTable({ reportDate }: IncomeStatementTableProps) {
  const [tableHtml, setTableHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { template } = useReport();
  
  useEffect(() => {
    async function fetchTable() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/income-statement-table', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            reportDate,
            provider: template.llm_provider
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate table');
        }
        
        const data = await response.json();
        setTableHtml(data.tableHtml);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching income statement table:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate income statement table');
        setLoading(false);
      }
    }
    
    if (reportDate) {
      fetchTable();
    }
  }, [reportDate, template.llm_provider]);
  
  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="p-4">
        <div className="text-center text-red-500">
          <p>Error: {error}</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-4">
      <div className="overflow-x-auto">
        <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
      </div>
    </Card>
  );
}
