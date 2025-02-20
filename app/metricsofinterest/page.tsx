import React from 'react';
import fs from 'fs';
import path from 'path';

function formatValue(value: string): string {
  // Remove extra quotes and spaces
  value = value.replace(/[""]/g, '').trim();
  
  // Handle empty or undefined values
  if (!value || value === '-') return '';
  
  // Handle currency values
  if (value.includes('$')) {
    // Remove extra spaces around the value
    return value.replace(/\s+/g, '');
  }
  
  // Handle percentages
  if (value.includes('%')) {
    return value.trim();
  }
  
  // Handle numbers
  if (!isNaN(Number(value))) {
    return value;
  }
  
  return value;
}

export default function MetricsOfInterest() {
  // Read and parse the metrics file
  const filePath = path.join(process.cwd(), 'metricsofinterest.txt');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const rows = fileContent.split('\n');

  // Process rows to handle sections and data
  const processedRows = rows.map(row => {
    const cells = row.split('\t').map(cell => cell.trim());
    return {
      cells,
      isSection: cells[0] && !cells[1] && !cells[0].includes('$') && !cells[0].match(/^-?\d/),
      isEmpty: cells.every(cell => !cell || cell === '')
    };
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Metrics of Interest</h1>
      <div className="relative">
        {/* Scroll indicators */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
        
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-gray-100 border-b p-3 text-left"></th>
                {Array.from({ length: 14 }, (_, i) => (
                  <th key={i} className="border-b p-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                    {i < 12 ? `2024-${String(i + 1).padStart(2, '0')}` : `2025-${String(i - 11).padStart(2, '0')}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {processedRows.map((row, index) => {
                if (row.isEmpty) return null;

                if (row.isSection) {
                  return (
                    <tr key={index}>
                      <td 
                        colSpan={15} 
                        className="sticky left-0 bg-gray-100 p-3 font-semibold text-gray-700 border-y"
                      >
                        {row.cells[0]}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="sticky left-0 bg-white p-3 font-medium border-b whitespace-nowrap z-10">
                      {row.cells[0]}
                    </td>
                    {row.cells.slice(1).map((cell, cellIndex) => (
                      <td 
                        key={cellIndex} 
                        className={`p-3 border-b text-right whitespace-nowrap ${
                          cell.includes('$') ? 'font-mono' : ''
                        } ${
                          cell.startsWith('(') ? 'text-red-600' : ''
                        }`}
                      >
                        {formatValue(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6">
        <a 
          href="/salesdata"
          className="inline-flex items-center justify-center bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Sales Data
        </a>
      </div>
    </div>
  );
}