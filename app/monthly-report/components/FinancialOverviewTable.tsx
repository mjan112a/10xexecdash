'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface FinancialOverviewTableProps {
  reportDate: string; // ISO date string for the report month
}

interface MetricValue {
  uid: string;
  metricGroup: string;
  metricCategory: string;
  metricType: string;
  metricName: string;
  unit: string;
  values: string[];
}

interface HierarchicalData {
  [group: string]: {
    [category: string]: {
      [type: string]: {
        [name: string]: {
          uid: string;
          unit: string;
          values: string[];
        };
      };
    };
  };
}

const FinancialOverviewTable: React.FC<FinancialOverviewTableProps> = ({ reportDate }) => {
  const [dateColumns, setDateColumns] = useState<string[]>([]);
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportMonth, setReportMonth] = useState<number>(-1);
  const [ytdEndIndex, setYtdEndIndex] = useState<number>(-1);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch metrics data');
        }
        
        const data = await response.json();
        setDateColumns(data.dateColumns || []);
        setHierarchicalData(data.hierarchicalData || {});
        
        // Find the index of the report month in the date columns
        const reportDateObj = new Date(reportDate);
        const reportMonthYear = `${reportDateObj.getFullYear()}-${String(reportDateObj.getMonth() + 1).padStart(2, '0')}`;
        
        const monthIndex = data.dateColumns.findIndex((date: string) => date.startsWith(reportMonthYear));
        setReportMonth(monthIndex !== -1 ? monthIndex : data.dateColumns.length - 1);
        
        // Set YTD end index to the report month
        setYtdEndIndex(monthIndex !== -1 ? monthIndex : data.dateColumns.length - 1);
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    }
    
    fetchData();
  }, [reportDate]);

  // Helper function to get a specific metric value
  const getMetricValue = (group: string, category: string, type: string, name: string, index: number): string => {
    try {
      return hierarchicalData[group][category][type][name].values[index] || '0';
    } catch (error) {
      return '0';
    }
  };

  // Helper function to calculate YTD sum for a metric
  const calculateYTD = (group: string, category: string, type: string, name: string): string => {
    try {
      const values = hierarchicalData[group][category][type][name].values;
      let sum = 0;
      
      // Sum from the beginning of the year up to the report month
      for (let i = 0; i <= ytdEndIndex; i++) {
        const value = parseFloat(values[i] || '0');
        if (!isNaN(value)) {
          sum += value;
        }
      }
      
      return sum.toString();
    } catch (error) {
      return '0';
    }
  };

  // Format value based on unit
  const formatValue = (value: string, unit: string, isTotalRow: boolean = false): string => {
    // Return empty string for total/summary rows
    if (isTotalRow) return '';
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) return '';
    
    if (unit === '$') {
      return formatCurrency(numValue);
    } else if (unit === '%') {
      return formatPercentage(numValue);
    } else {
      return numValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
  };

  if (loading) {
    return <div>Loading financial data...</div>;
  }

  if (error) {
    return <div>Error loading financial data: {error}</div>;
  }

  // Get the report month name and year
  const reportDateObj = new Date(reportDate);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const reportMonthName = monthNames[reportDateObj.getMonth()];
  const reportYear = reportDateObj.getFullYear();

  // Format the date for the balance sheet (e.g., "31-Oct-24")
  const lastDayOfMonth = new Date(reportDateObj.getFullYear(), reportDateObj.getMonth() + 1, 0);
  const balanceSheetDate = `${lastDayOfMonth.getDate()}-${monthNames[reportDateObj.getMonth()].substring(0, 3)}-${String(reportDateObj.getFullYear()).substring(2)}`;

  return (
    <div className="financial-overview-table">
      <div className="text-center font-bold text-xl mb-4">
        10X ENGINEERED MATERIALS, LLC
      </div>
      <div className="text-center font-bold text-xl mb-6">
        FINANCIAL OVERVIEW
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {/* INCOME SECTION */}
        <div className="col-span-1">
          <div className="bg-blue-500 text-white p-2 font-bold">INCOME</div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2"></th>
                <th className="text-right p-2">MONTH</th>
                <th className="text-right p-2">% of Net</th>
                <th className="text-right p-2">YTD</th>
                <th className="text-right p-2">% of Net</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 font-bold">Gross Revenue</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Income Statement', 'Income', 'Total Revenue', reportMonth), '$', true)}
                </td>
                <td className="text-right p-2">100.0%</td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Income Statement', 'Income', 'Total Revenue'), '$', true)}
                </td>
                <td className="text-right p-2">
                  {formatPercentage(100)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 pl-6">Adjustments</td>
                <td className="text-right p-2">
                  {formatValue('0', '$')}
                </td>
                <td className="text-right p-2">0.0%</td>
                <td className="text-right p-2">
                  {formatValue('0', '$')}
                </td>
                <td className="text-right p-2">0.0%</td>
              </tr>
              <tr>
                <td className="p-2 font-bold">NET REVENUE</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Income Statement', 'Income', 'Total Revenue', reportMonth), '$', true)}
                </td>
                <td className="text-right p-2">100.0%</td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Income Statement', 'Income', 'Total Revenue'), '$', true)}
                </td>
                <td className="text-right p-2">100.0%</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">COGS</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Income Statement', 'Cost of Goods Sold', 'Total COGS', reportMonth), '$')}
                </td>
                <td className="text-right p-2">
                  {formatPercentage(parseFloat(getMetricValue('Accounting', 'Income Statement', 'Gross Earnings', '% Gross Income', reportMonth)) * 100)}
                </td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Income Statement', 'Cost of Goods Sold', 'Total COGS'), '$')}
                </td>
                <td className="text-right p-2">
                  {formatPercentage(parseFloat(getMetricValue('Accounting', 'Income Statement', 'Gross Earnings', '% Gross Income', reportMonth)) * 100)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold">GROSS MARGIN</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Income Statement', 'Gross Earnings', 'Gross Income', reportMonth), '$', true)}
                </td>
                <td className="text-right p-2">
                  {formatPercentage(parseFloat(getMetricValue('Accounting', 'Income Statement', 'Gross Earnings', '% Gross Income', reportMonth)) * 100)}
                </td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Income Statement', 'Gross Earnings', 'Gross Income'), '$', true)}
                </td>
                <td className="text-right p-2">
                  {formatPercentage(parseFloat(getMetricValue('Accounting', 'Income Statement', 'Gross Earnings', '% Gross Income', reportMonth)) * 100)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">SG&A</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Income Statement', 'SG&A Expenses', 'Total Expenses', reportMonth), '$')}
                </td>
                <td className="text-right p-2">
                  {formatPercentage((parseFloat(getMetricValue('Accounting', 'Income Statement', 'SG&A Expenses', 'Total Expenses', reportMonth)) / 
                    parseFloat(getMetricValue('Accounting', 'Income Statement', 'Income', 'Total Revenue', reportMonth))) * 100)}
                </td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Income Statement', 'SG&A Expenses', 'Total Expenses'), '$')}
                </td>
                <td className="text-right p-2">
                  {formatPercentage((parseFloat(calculateYTD('Accounting', 'Income Statement', 'SG&A Expenses', 'Total Expenses')) / 
                    parseFloat(calculateYTD('Accounting', 'Income Statement', 'Income', 'Total Revenue'))) * 100)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold">OPERATING INCOME</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Income Statement', 'Ordinary Earninjgs', 'Net Ordinary Income', reportMonth), '$', true)}
                </td>
                <td className="text-right p-2">
                  {formatPercentage(parseFloat(getMetricValue('Accounting', 'Income Statement', 'Ordinary Earninjgs', '% Net Ordinary Income', reportMonth)) * 100)}
                </td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Income Statement', 'Ordinary Earninjgs', 'Net Ordinary Income'), '$', true)}
                </td>
                <td className="text-right p-2">
                  {formatPercentage((parseFloat(calculateYTD('Accounting', 'Income Statement', 'Ordinary Earninjgs', 'Net Ordinary Income')) / 
                    parseFloat(calculateYTD('Accounting', 'Income Statement', 'Income', 'Total Revenue'))) * 100)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">Net Other Income</td>
                <td className="text-right p-2">
                  {formatValue(
                    (
                      parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'Other Income', reportMonth)) -
                      parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'Debt Interest', reportMonth)) -
                      parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'Depreciation', reportMonth)) -
                      parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'QOZ Penalty', reportMonth))
                    ).toString(), 
                    '$'
                  )}
                </td>
                <td className="text-right p-2">
                  {formatPercentage(
                    (
                      (
                        parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'Other Income', reportMonth)) -
                        parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'Debt Interest', reportMonth)) -
                        parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'Depreciation', reportMonth)) -
                        parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'QOZ Penalty', reportMonth))
                      ) /
                      parseFloat(getMetricValue('Accounting', 'Income Statement', 'Income', 'Total Revenue', reportMonth))
                    ) * 100
                  )}
                </td>
                <td className="text-right p-2">
                  {formatValue(
                    (
                      parseFloat(calculateYTD('Accounting', 'Income Statement', 'Other Income & Expenses', 'Other Income')) -
                      parseFloat(calculateYTD('Accounting', 'Income Statement', 'Other Income & Expenses', 'Debt Interest')) -
                      parseFloat(calculateYTD('Accounting', 'Income Statement', 'Other Income & Expenses', 'Depreciation')) -
                      parseFloat(calculateYTD('Accounting', 'Income Statement', 'Other Income & Expenses', 'QOZ Penalty'))
                    ).toString(), 
                    '$'
                  )}
                </td>
                <td className="text-right p-2">
                  {formatPercentage(
                    (
                      (
                        parseFloat(calculateYTD('Accounting', 'Income Statement', 'Other Income & Expenses', 'Other Income')) -
                        parseFloat(calculateYTD('Accounting', 'Income Statement', 'Other Income & Expenses', 'Debt Interest')) -
                        parseFloat(calculateYTD('Accounting', 'Income Statement', 'Other Income & Expenses', 'Depreciation')) -
                        parseFloat(calculateYTD('Accounting', 'Income Statement', 'Other Income & Expenses', 'QOZ Penalty'))
                      ) /
                      parseFloat(calculateYTD('Accounting', 'Income Statement', 'Income', 'Total Revenue'))
                    ) * 100
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold">NET INCOME</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Income Statement', 'Net Earnings', 'Net Income', reportMonth), '$', true)}
                </td>
                <td className="text-right p-2">
                  {formatPercentage(parseFloat(getMetricValue('Accounting', 'Income Statement', 'Net Earnings', '% Net Income', reportMonth)) * 100)}
                </td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Income Statement', 'Net Earnings', 'Net Income'), '$', true)}
                </td>
                <td className="text-right p-2">
                  {formatPercentage((parseFloat(calculateYTD('Accounting', 'Income Statement', 'Net Earnings', 'Net Income')) / 
                    parseFloat(calculateYTD('Accounting', 'Income Statement', 'Income', 'Total Revenue'))) * 100)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">Adjustments</td>
                <td className="text-right p-2">
                  {formatValue('0', '$')}
                </td>
                <td className="text-right p-2">0.0%</td>
                <td className="text-right p-2">
                  {formatValue('0', '$')}
                </td>
                <td className="text-right p-2">0.0%</td>
              </tr>
              <tr>
                <td className="p-2 font-bold">EBITDA</td>
                <td className="text-right p-2">
                  {formatValue(
                    (
                      parseFloat(getMetricValue('Accounting', 'Income Statement', 'Net Earnings', 'Net Income', reportMonth)) +
                      parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'Debt Interest', reportMonth)) +
                      parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'Depreciation', reportMonth))
                    ).toString(),
                    '$',
                    true
                  )}
                </td>
                <td className="text-right p-2">
                  {formatPercentage(
                    (
                      (
                        parseFloat(getMetricValue('Accounting', 'Income Statement', 'Net Earnings', 'Net Income', reportMonth)) +
                        parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'Debt Interest', reportMonth)) +
                        parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'Depreciation', reportMonth))
                      ) /
                      parseFloat(getMetricValue('Accounting', 'Income Statement', 'Income', 'Total Revenue', reportMonth))
                    ) * 100
                  )}
                </td>
                <td className="text-right p-2">
                  {formatValue(
                    (
                      parseFloat(calculateYTD('Accounting', 'Income Statement', 'Net Earnings', 'Net Income')) +
                      parseFloat(calculateYTD('Accounting', 'Income Statement', 'Other Income & Expenses', 'Debt Interest')) +
                      parseFloat(calculateYTD('Accounting', 'Income Statement', 'Other Income & Expenses', 'Depreciation'))
                    ).toString(),
                    '$',
                    true
                  )}
                </td>
                <td className="text-right p-2">
                  {formatPercentage(
                    (
                      (
                        parseFloat(calculateYTD('Accounting', 'Income Statement', 'Net Earnings', 'Net Income')) +
                        parseFloat(calculateYTD('Accounting', 'Income Statement', 'Other Income & Expenses', 'Debt Interest')) +
                        parseFloat(calculateYTD('Accounting', 'Income Statement', 'Other Income & Expenses', 'Depreciation'))
                      ) /
                      parseFloat(calculateYTD('Accounting', 'Income Statement', 'Income', 'Total Revenue'))
                    ) * 100
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* BALANCE SECTION */}
        <div className="col-span-1">
          <div className="bg-blue-500 text-white p-2 font-bold">BALANCE</div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2"></th>
                <th className="text-right p-2">{balanceSheetDate}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 font-bold">ASSETS</td>
                <td className="text-right p-2"></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 pl-6">Current Assets</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Balance Sheet', 'Assets', 'Total Current Assets', reportMonth), '$')}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 pl-6">Fixed Assets</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Balance Sheet', 'Assets', 'Fixed Assets', reportMonth), '$')}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold">TOTAL ASSETS</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Balance Sheet', 'Assets', 'Total Assets', reportMonth), '$', true)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold">LIABILITIES & EQUITY</td>
                <td className="text-right p-2"></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 pl-6">Current Liabilities</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Balance Sheet', 'Liabilities & Equity', 'Current Liabilities', reportMonth), '$')}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 pl-6">Long Term Liabilities</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Balance Sheet', 'Liabilities & Equity', 'Long Term Liabilities', reportMonth), '$')}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold">TOTAL LIABILITIES</td>
                <td className="text-right p-2">
                  {formatValue(
                    (
                      parseFloat(getMetricValue('Accounting', 'Balance Sheet', 'Liabilities & Equity', 'Current Liabilities', reportMonth)) +
                      parseFloat(getMetricValue('Accounting', 'Balance Sheet', 'Liabilities & Equity', 'Long Term Liabilities', reportMonth))
                    ).toString(),
                    '$',
                    true
                  )}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 pl-6">Shareholders Capital</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Balance Sheet', 'Liabilities & Equity', 'Equity', reportMonth), '$')}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 pl-6">Retained Earnings</td>
                <td className="text-right p-2">
                  {formatValue('0', '$')}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 pl-6">Net Income</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Income Statement', 'Net Earnings', 'Net Income', reportMonth), '$')}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold">TOTAL EQUITY</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Balance Sheet', 'Liabilities & Equity', 'Equity', reportMonth), '$', true)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold">TOTAL LIABILITIES & EQUITY</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Balance Sheet', 'Liabilities & Equity', 'Total Liabilities & Equity', reportMonth), '$', true)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* CASH FLOW SECTION */}
        <div className="col-span-1">
          <div className="bg-blue-500 text-white p-2 font-bold">CASH FLOW</div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2"></th>
                <th className="text-right p-2">MONTH</th>
                <th className="text-right p-2">YTD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 font-bold">OPERATING ACTIVITIES</td>
                <td className="text-right p-2"></td>
                <td className="text-right p-2"></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 pl-6">Net Income</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Income Statement', 'Net Earnings', 'Net Income', reportMonth), '$')}
                </td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Income Statement', 'Net Earnings', 'Net Income'), '$')}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 pl-6">Operating Adjustments</td>
                <td className="text-right p-2">
                  {formatValue(
                    (
                      parseFloat(getMetricValue('Accounting', 'Cash Flow Statement', 'Operating Activities', 'Total Adjustments to Net Income', reportMonth))
                    ).toString(),
                    '$'
                  )}
                </td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Cash Flow Statement', 'Operating Activities', 'Total Adjustments to Net Income'), '$')}
                </td>
              </tr>
              <tr>
                <td className="p-2 pl-6">Net cash for operating activities</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Cash Flow Statement', 'Operating Activities', 'Total Operating Activities', reportMonth), '$', true)}
                </td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Cash Flow Statement', 'Operating Activities', 'Total Operating Activities'), '$', true)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold">INVESTING ACTIVITIES</td>
                <td className="text-right p-2"></td>
                <td className="text-right p-2"></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 pl-6">Net cash for investing activities</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Cash Flow Statement', 'Investing Activities', 'Total Investing Activities', reportMonth), '$', true)}
                </td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Cash Flow Statement', 'Investing Activities', 'Total Investing Activities'), '$', true)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold">FINANCING ACTIVITIES</td>
                <td className="text-right p-2"></td>
                <td className="text-right p-2"></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 pl-6">Net cash for financing activities</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Cash Flow Statement', 'Financing Activities', 'Total Financing Activities', reportMonth), '$', true)}
                </td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Cash Flow Statement', 'Financing Activities', 'Total Financing Activities'), '$', true)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold">Net cash increase for period</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Cash Flow Statement', 'Cash', 'Net Change in Cash for Period', reportMonth), '$', true)}
                </td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Accounting', 'Cash Flow Statement', 'Cash', 'Net Change in Cash for Period'), '$', true)}
                </td>
              </tr>
              <tr className="bg-gray-100">
                <td className="p-2">Beginning Date</td>
                <td className="text-right p-2">{reportMonthName.substring(0, 3)} 1, {reportYear}</td>
                <td className="text-right p-2">1/1/{reportYear}</td>
              </tr>
              <tr>
                <td className="p-2">Cash at Beginning</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Cash Flow Statement', 'Cash', 'Cash at Beginning of Period', reportMonth), '$')}
                </td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Cash Flow Statement', 'Cash', 'Cash at Beginning of Period', 0), '$')}
                </td>
              </tr>
              <tr className="bg-gray-100">
                <td className="p-2">End Date</td>
                <td className="text-right p-2">{reportMonthName.substring(0, 3)} {lastDayOfMonth.getDate()}, {reportYear}</td>
                <td className="text-right p-2">{reportMonthName.substring(0, 3)} {lastDayOfMonth.getDate()}, {reportYear}</td>
              </tr>
              <tr>
                <td className="p-2">Cash at End</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Cash Flow Statement', 'Cash', 'Cash at End of Period', reportMonth), '$', true)}
                </td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Accounting', 'Cash Flow Statement', 'Cash', 'Cash at End of Period', reportMonth), '$', true)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* RATIOS, UNIT NUMBERS, SAFETY, BREAK EVEN SECTIONS */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {/* RATIOS AND INDICATORS */}
        <div className="col-span-1">
          <div className="bg-blue-500 text-white p-2 font-bold">RATIOS AND INDICATORS</div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="p-2">Employee Count</td>
                <td className="text-right p-2">
                  {formatValue('14', '')}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">Annual Revenue per Employee</td>
                <td className="text-right p-2">
                  {formatValue('349815', '$')}
                </td>
              </tr>
              <tr>
                <td className="p-2">Gross Margin %</td>
                <td className="text-right p-2">
                  {formatPercentage(parseFloat(getMetricValue('Accounting', 'Income Statement', 'Gross Earnings', '% Gross Income', reportMonth)) * 100)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">Operating Margin %</td>
                <td className="text-right p-2">
                  {formatPercentage(parseFloat(getMetricValue('Accounting', 'Income Statement', 'Ordinary Earninjgs', '% Net Ordinary Income', reportMonth)) * 100)}
                </td>
              </tr>
              <tr>
                <td className="p-2">Net Income %</td>
                <td className="text-right p-2">
                  {formatPercentage(parseFloat(getMetricValue('Accounting', 'Income Statement', 'Net Earnings', '% Net Income', reportMonth)) * 100)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">EBITDA %</td>
                <td className="text-right p-2">
                  {formatPercentage(
                    (
                      (
                        parseFloat(getMetricValue('Accounting', 'Income Statement', 'Net Earnings', 'Net Income', reportMonth)) +
                        parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'Debt Interest', reportMonth)) +
                        parseFloat(getMetricValue('Accounting', 'Income Statement', 'Other Income & Expenses', 'Depreciation', reportMonth))
                      ) /
                      parseFloat(getMetricValue('Accounting', 'Income Statement', 'Income', 'Total Revenue', reportMonth))
                    ) * 100
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2">Current Ratio</td>
                <td className="text-right p-2">
                  {(
                    parseFloat(getMetricValue('Accounting', 'Balance Sheet', 'Assets', 'Total Current Assets', reportMonth)) /
                    parseFloat(getMetricValue('Accounting', 'Balance Sheet', 'Liabilities & Equity', 'Current Liabilities', reportMonth))
                  ).toFixed(2)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">Working Capital</td>
                <td className="text-right p-2">
                  {formatValue(
                    (
                      parseFloat(getMetricValue('Accounting', 'Balance Sheet', 'Assets', 'Total Current Assets', reportMonth)) -
                      parseFloat(getMetricValue('Accounting', 'Balance Sheet', 'Liabilities & Equity', 'Current Liabilities', reportMonth))
                    ).toString(),
                    '$'
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* UNIT NUMBERS */}
        <div className="col-span-1">
          <div className="bg-blue-500 text-white p-2 font-bold">UNIT NUMBERS</div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="p-2">Tons Produced (month)</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Manufacturing Process', 'Operations', 'Production Data', 'Finished Goods', reportMonth), '')}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">Tons Produced (YTD)</td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Manufacturing Process', 'Operations', 'Production Data', 'Finished Goods'), '')}
                </td>
              </tr>
              <tr>
                <td className="p-2">Tons Sold (month)</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Sales', 'Abrasive Sales', 'Overall Sales', 'Tons Sold', reportMonth), '')}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">Tons Sold (YTD)</td>
                <td className="text-right p-2">
                  {formatValue(calculateYTD('Sales', 'Abrasive Sales', 'Overall Sales', 'Tons Sold'), '')}
                </td>
              </tr>
              <tr>
                <td className="p-2">Abrasive sales/ton (month)</td>
                <td className="text-right p-2">
                  {formatValue(getMetricValue('Sales', 'Abrasive Sales', 'Overall Sales', 'Average Price', reportMonth), '$')}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">Abrasive sales/ton (YTD)</td>
                <td className="text-right p-2">
                  {formatValue(
                    (
                      parseFloat(calculateYTD('Sales', 'Abrasive Sales', 'Overall Sales', 'Product Revenue')) /
                      parseFloat(calculateYTD('Sales', 'Abrasive Sales', 'Overall Sales', 'Tons Sold'))
                    ).toString(),
                    '$'
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2">Abrasive sales/pound (month)</td>
                <td className="text-right p-2">
                  {formatValue(
                    (
                      parseFloat(getMetricValue('Sales', 'Abrasive Sales', 'Overall Sales', 'Average Price', reportMonth)) / 2000
                    ).toString(),
                    '$'
                  )}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">Abrasive sales/pound (YTD)</td>
                <td className="text-right p-2">
                  {formatValue(
                    (
                      parseFloat(calculateYTD('Sales', 'Abrasive Sales', 'Overall Sales', 'Product Revenue')) /
                      (parseFloat(calculateYTD('Sales', 'Abrasive Sales', 'Overall Sales', 'Tons Sold')) * 2000)
                    ).toString(),
                    '$'
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* SAFETY */}
        <div className="col-span-1">
          <div className="bg-blue-500 text-white p-2 font-bold">SAFETY</div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="p-2">Recordable Incident Cases (YTD)</td>
                <td className="text-right p-2">1</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">Recordable Incident Rate (RIR)</td>
                <td className="text-right p-2">0.0</td>
              </tr>
              <tr>
                <td className="p-2">Lost Work Day Cases (YTD)</td>
                <td className="text-right p-2">1</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">Lost Work Day Rate (LWDR)</td>
                <td className="text-right p-2">0.0</td>
              </tr>
              <tr>
                <td className="p-2 text-xs" colSpan={2}>Note: Safety rates are per 100 full-time employees</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* BREAK EVEN */}
        <div className="col-span-1">
          <div className="bg-blue-500 text-white p-2 font-bold">BREAK EVEN</div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="p-2">Break Even (tons per year)</td>
                <td className="text-right p-2">6,613</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2">Annualized Actual (tons per year)</td>
                <td className="text-right p-2">7,604</td>
              </tr>
              <tr>
                <td className="p-2">Break Even Achievement Percentage</td>
                <td className="text-right p-2">115%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* COMMENTS SECTION */}
      <div className="mt-6">
        <div className="bg-blue-500 text-white p-2 font-bold">COMMENTS:</div>
        <div className="p-2 border border-gray-300">
          <p>No recordable injuries in {reportMonthName}. Revenue in {reportMonthName} was up $149K from previous month. EBITDA was positive at $178K and net income increased to $112K. Cash increased $61K in {reportMonthName}, ending with a balance of $1.27M. Receivables were $824K as of the end of {reportMonthName}. Sales of DynamiX represented 29% of total sales, EpiX represented 7% of total sales and KinetiX represented 64%.</p>
          <p className="mt-2">There were no significant changes on the balance sheet.</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialOverviewTable;
