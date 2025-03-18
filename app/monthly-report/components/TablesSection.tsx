'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { useReport } from '../report-context';
import FinancialOverviewTable from './FinancialOverviewTable';
import IncomeStatementTable from './IncomeStatementTable';

export default function TablesSection() {
  const { currentReport } = useReport();
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Report Tables</h2>
      
      <Card className="mb-8 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Financial Overview</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            This table provides a comprehensive financial overview including income statement, 
            balance sheet, cash flow, and key metrics for the current reporting period.
          </p>
          {currentReport ? (
            <div className="border rounded-md p-4 bg-white">
              <FinancialOverviewTable reportDate={currentReport.report_date} />
            </div>
          ) : (
            <div className="p-4 bg-gray-100 rounded-md text-center">
              <p className="text-gray-500">Please select or create a report to view financial tables</p>
            </div>
          )}
        </div>
      </Card>
      
      <Card className="mb-8 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Income Statement</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            Monthly income statement showing revenue, costs, expenses, and profitability metrics.
            Fixed (F) and Variable (V) costs are indicated for relevant line items.
          </p>
          {currentReport ? (
            <div className="border rounded-md p-4 bg-white">
              <IncomeStatementTable reportDate={currentReport.report_date} />
            </div>
          ) : (
            <div className="p-4 bg-gray-100 rounded-md text-center">
              <p className="text-gray-500">Please select or create a report to view income statement</p>
            </div>
          )}
        </div>
      </Card>
      
      {/* Placeholder for additional tables */}
      <Card className="mb-8 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Additional Tables</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            Additional tables will be added here in future updates.
          </p>
          <div className="p-4 bg-gray-100 rounded-md text-center">
            <p className="text-gray-500">More tables coming soon</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
