'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useReport } from '../report-context';
import { AgGridReact } from 'ag-grid-react';
import { 
  ClientSideRowModelModule,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  RowApiModule
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register the modules
ModuleRegistry.registerModules([ClientSideRowModelModule, RowApiModule]);

interface IncomeStatementTableProps {
  reportDate: string;
}

export default function IncomeStatementTable({ reportDate }: IncomeStatementTableProps) {
  const [rowData, setRowData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { template } = useReport();
  
  useEffect(() => {
    if (!reportDate) {
      console.log('No reportDate provided, skipping fetch');
      return;
    }

    async function fetchTable() {
      try {
        console.log('Starting fetch with reportDate:', reportDate);
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
          console.error('API Error:', errorData);
          throw new Error(errorData.message || 'Failed to generate table');
        }
        
        const data = await response.json();
        
        // Adjust the width of the account column (first column)
        if (data.columns && data.columns.length > 0) {
          data.columns[0].width = Math.floor(data.columns[0].width * 0.7);
        }

        // Add number formatting to all columns except the first (account) column
        if (data.columns) {
          data.columns = data.columns.map((col: any, index: number) => {
            if (index === 0) { // First column (Account)
              return {
                ...col,
                align: 'left',
                headerAlign: 'left',
                cellClass: 'ag-cell-left',
                headerClass: 'ag-header-cell-left'
              };
            }
            // All other columns (numeric)
            return {
              ...col,
              valueFormatter: (params: any) => {
                // Don't display values for parent/total rows
                if (params.data && params.data.isTotal) return '';
                
                if (params.value === null || params.value === undefined) return '';
                const num = parseFloat(params.value);
                if (isNaN(num)) return params.value;
                return num.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                });
              },
              cellStyle: (params: any) => ({
                color: params.value !== null && params.value !== undefined &&
                       !isNaN(parseFloat(params.value)) && parseFloat(params.value) < 0
                       ? '#dc2626' : 'inherit'
              }),
              headerClass: 'ag-header-cell-right',
              cellClass: 'ag-cell-right',
              align: 'right',
              headerAlign: 'right'
            };
          });
        }

        setColumnDefs(data.columns);
        setRowData(data.rows);
      } catch (err) {
        console.error('Error in fetchTable:', err);
        if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchTable();
  }, [reportDate]);

  // Log when state changes
  useEffect(() => {
    console.log('Grid state updated:', {
      columnDefsLength: columnDefs.length,
      rowDataLength: rowData.length,
      firstColumn: columnDefs[0],
      firstRow: rowData[0]
    });
  }, [columnDefs, rowData]);

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    cellStyle: { 
      padding: '4px 8px',
      fontSize: '0.65rem',
      lineHeight: '0.9rem'
    },
    headerStyle: {
      backgroundColor: 'hsl(207 97% 59%)',
      color: 'white',
      fontWeight: '600',
      fontSize: '0.65rem',
      padding: '6px 10px'
    }
  };

  const gridOptions = {
    defaultColDef,
    rowData,
    columnDefs,
    domLayout: 'normal' as const,
    suppressRowClickSelection: true,
    groupDefaultExpanded: 1,
    suppressAggFuncInHeader: true,
    suppressAggAtRootLevel: true,
    style: { width: '100%', height: '500px' },
    className: 'ag-theme-alpine',
    rowStyle: { 
      fontSize: '0.65rem',
      lineHeight: '0.9rem'
    },
    headerHeight: 32,
    rowHeight: 24,
    suppressCellFocus: true,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    getRowStyle: (params: any) => {
      const style: any = {};
      
      // Base alternating row colors
      if (params.node.rowIndex % 2 === 0) {
        style.background = '#ffffff';
      } else {
        style.background = '#f8fafc';
      }
      
      // Enhanced highlighting for total rows
      if (params.data.isTotal) {
        style.background = '#e6f0ff';
        style.fontWeight = '600';
        style.borderTop = '1px solid #b3d7ff';
        style.borderBottom = '1px solid #b3d7ff';
      }
      
      return style;
    },
    onRowMouseEnter: (params: any) => {
      params.node.setData({
        ...params.node.data,
        hover: true
      });
    },
    onRowMouseLeave: (params: any) => {
      params.node.setData({
        ...params.node.data,
        hover: false
      });
    }
  };

  const gridContainerStyle = {
    '--ag-header-height': '32px',
    '--ag-header-foreground-color': 'white',
    '--ag-header-background-color': 'hsl(207 97% 59%)',
    '--ag-header-cell-hover-background-color': 'hsl(207 97% 65%)',
    '--ag-header-cell-moving-background-color': 'hsl(207 97% 70%)',
    '--ag-row-hover-color': 'hsl(207 97% 95%)',
    '--ag-selected-row-background-color': 'hsl(207 97% 90%)',
    '--ag-odd-row-background-color': '#ffffff',
    '--ag-even-row-background-color': '#f8fafc',
    '--ag-font-size': '0.65rem',
    '--ag-line-height': '0.9rem',
    '--ag-cell-horizontal-padding': '8px',
    '--ag-cell-vertical-padding': '4px',
    '--ag-row-height': '24px',
    '--ag-border-color': '#e2e8f0',
    '--ag-secondary-border-color': '#f1f5f9',
    '--ag-row-border-color': '#f1f5f9',
    '--ag-font-family': 'system-ui, -apple-system, sans-serif'
  } as React.CSSProperties;

  // Log the final grid options before render
  console.log('Grid options before render:', {
    hasRowData: !!gridOptions.rowData,
    rowDataLength: gridOptions.rowData?.length,
    hasColumnDefs: !!gridOptions.columnDefs,
    columnDefsLength: gridOptions.columnDefs?.length,
    firstColumn: gridOptions.columnDefs?.[0],
    firstRow: gridOptions.rowData?.[0]
  });
  
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
      <div className="financial-document">
        <div className="header">Income Statement</div>
        <style jsx global>{`
          .ag-theme-alpine .ag-cell {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
          }
          .ag-theme-alpine .ag-header-cell {
            text-align: right !important;
          }
          .ag-theme-alpine .ag-header-cell[col-id="0"] {
            text-align: left !important;
          }
          .ag-theme-alpine .ag-cell[col-id="0"] {
            text-align: left !important;
          }
          .ag-header-cell-right {
            text-align: right !important;
          }
          .ag-cell-right {
            text-align: right !important;
            display: flex;
            justify-content: flex-end;
          }
          .ag-header-cell-left {
            text-align: left !important;
          }
          .ag-cell-left {
            text-align: left !important;
            display: flex;
            justify-content: flex-start;
          }
          .ag-cell-right .ag-cell-value {
            font-variant-numeric: tabular-nums;
            letter-spacing: 0.01em;
            width: 100%;
            text-align: right;
          }
        `}</style>
        <div className="ag-theme-alpine" style={{ width: '100%', height: '500px', ...gridContainerStyle }}>
          <AgGridReact
            {...gridOptions}
            onGridReady={(params: GridReadyEvent) => {
              console.log('Grid ready event:', {
                api: !!params.api,
                rowCount: params.api.getDisplayedRowCount(),
                firstRow: params.api.getDisplayedRowAtIndex(0)
              });
            }}
          />
        </div>
        <div className="footnote">
          * All amounts are in USD and rounded to the nearest dollar
        </div>
      </div>
    </Card>
  );
}
