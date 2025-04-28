'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

interface IncomeStatementTableProps {
  reportDate: string;
}

export default function IncomeStatementTable({ reportDate }: IncomeStatementTableProps) {
  return (
    <Card className="p-4">
      <div className="p-4 bg-blue-50 rounded-md text-center">
        <p className="text-blue-700">
          The detailed income statement is temporarily unavailable. 
          Please refer to the Financial Overview table for summary income data.
        </p>
        <p className="text-blue-500 mt-2 text-sm">
          (Report date: {reportDate})
        </p>
      </div>
    </Card>
  );
}
