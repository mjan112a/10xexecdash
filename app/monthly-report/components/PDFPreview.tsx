'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';

interface PDFPreviewProps {
  month: string;
  year: number;
  sections: Record<string, string>;
  graphImages?: Record<string, any[]>;
}

export default function PDFPreview({ month, year, sections, graphImages = {} }: PDFPreviewProps) {
  // Parse the content to handle markdown-like formatting
  const renderContent = (content: string) => {
    if (!content) return null;
    
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let tableData: string[][] = [];
    let inTable = false;
    let tableHeaders: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a table row
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        if (!inTable) {
          inTable = true;
          // This is the header row
          tableHeaders = line.split('|')
            .filter(cell => cell.trim() !== '')
            .map(cell => cell.trim());
        } else if (line.trim().match(/^\|[-\s|]+\|$/)) {
          // This is the separator row, skip it
          continue;
        } else {
          // This is a data row
          const rowData = line.split('|')
            .filter(cell => cell.trim() !== '')
            .map(cell => cell.trim());
          tableData.push(rowData);
        }
        
        // If the next line doesn't start with |, render the table
        if (!lines[i + 1] || !lines[i + 1].trim().startsWith('|')) {
          elements.push(renderTable(tableHeaders, tableData, i));
          tableData = [];
          tableHeaders = [];
          inTable = false;
        }
        continue;
      }
      
      // If we were in a table but this line is not a table row, render the table
      if (inTable) {
        elements.push(renderTable(tableHeaders, tableData, i));
        tableData = [];
        tableHeaders = [];
        inTable = false;
      }
      
      // Check for image/graph references
      if (line.trim().startsWith('![') && line.trim().includes('](')) {
        const captionMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
        if (captionMatch && captionMatch.length >= 3) {
          const caption = captionMatch[1];
          const imageUrl = captionMatch[2];
          elements.push(renderGraph(imageUrl, caption, i));
        }
        continue;
      }
      
      // Handle bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        const bulletText = line.trim().startsWith('- ') 
          ? line.trim().substring(2) 
          : line.trim().substring(2);
        elements.push(
          <li key={`list-${i}`} className="ml-6 mb-2 text-sm">
            • {bulletText}
          </li>
        );
      }
      // Handle subheadings (###)
      else if (line.trim().startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-base font-bold mt-4 mb-2">
            {line.trim().substring(4)}
          </h3>
        );
      }
      // Handle subheadings (##)
      else if (line.trim().startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-lg font-bold mt-5 mb-3 bg-gray-100 p-2 rounded">
            {line.trim().substring(3)}
          </h2>
        );
      }
      // Handle headings (#)
      else if (line.trim().startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-xl font-bold mt-6 mb-4">
            {line.trim().substring(2)}
          </h1>
        );
      }
      // Handle regular paragraphs
      else if (line.trim() !== '') {
        elements.push(
          <p key={`p-${i}`} className="mb-3 text-sm leading-relaxed">
            {line}
          </p>
        );
      }
      // Add spacing for empty lines
      else {
        elements.push(<div key={`space-${i}`} className="h-2"></div>);
      }
    }
    
    return elements;
  };
  
  // Render a table
  const renderTable = (headers: string[], data: string[][], key: number) => {
    return (
      <div key={`table-${key}`} className="my-6 overflow-x-auto">
        <div className="text-xs text-gray-500 mb-1 font-medium">Table {key + 1}</div>
        <table className="min-w-full border border-gray-300 text-sm border-collapse">
          <thead className="bg-blue-50">
            <tr>
              {headers.map((header, i) => (
                <th 
                  key={`header-${i}`} 
                  className="border border-gray-300 px-3 py-2 text-left font-bold text-blue-800"
                  style={{ minWidth: '100px' }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr 
                key={`row-${rowIndex}`} 
                className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                {row.map((cell, cellIndex) => {
                  // Check if this is a numeric cell
                  const isNumeric = !isNaN(parseFloat(cell)) && isFinite(Number(cell));
                  
                  return (
                    <td 
                      key={`cell-${rowIndex}-${cellIndex}`} 
                      className={`border border-gray-300 px-3 py-2 ${isNumeric ? 'text-right font-mono' : 'text-left'}`}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render a graph
  const renderGraph = (imageUrl: string, caption: string, index: number) => {
    return (
      <figure key={`graph-${index}`} className="my-8 flex flex-col items-center">
        <div className="text-xs text-gray-500 mb-2 font-medium">Figure {index + 1}</div>
        {imageUrl && (
          <div className="border border-gray-200 p-3 rounded bg-white shadow-sm">
            {/* Use next/image for better performance */}
            <img 
              src={imageUrl} 
              alt={caption}
              className="max-w-full h-auto max-h-[350px]"
            />
          </div>
        )}
        <figcaption className="text-xs text-gray-600 mt-3 text-center max-w-md">
          {caption}
        </figcaption>
      </figure>
    );
  };
  
  return (
    <Card className="bg-white shadow-lg rounded-lg max-w-[800px] mx-auto my-8 overflow-hidden print:shadow-none print:border-none">
      {/* PDF Header */}
      <div className="p-6 border-b flex items-center justify-center bg-gray-50 print:bg-white">
        <div className="flex items-center">
          <div className="w-20 h-20 relative mr-4">
            <Image 
              src="/10X-Logo-Blue_White.png" 
              alt="10X Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">10X Engineered Materials</h1>
            <p className="text-gray-600">Monthly Performance Report - {month} {year}</p>
          </div>
        </div>
      </div>
      
      {/* PDF Content */}
      <div className="p-8 print:p-4">
        {/* Executive Summary */}
        {sections.executiveSummary && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 bg-gray-100 p-2 rounded print:bg-white print:border-b-2 print:border-gray-200 print:rounded-none">Executive Summary</h2>
            <div className="pl-2">
              {renderContent(sections.executiveSummary)}
            </div>
          </div>
        )}
        
        {/* Key Performance Indicators */}
        {sections.keyPerformance && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 bg-gray-100 p-2 rounded print:bg-white print:border-b-2 print:border-gray-200 print:rounded-none">Key Performance Indicators</h2>
            <div className="pl-2">
              {renderContent(sections.keyPerformance)}
            </div>
          </div>
        )}
        
        {/* Operational Highlights */}
        {sections.operationalHighlights && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 bg-gray-100 p-2 rounded print:bg-white print:border-b-2 print:border-gray-200 print:rounded-none">Operational Highlights</h2>
            <div className="pl-2">
              {renderContent(sections.operationalHighlights)}
            </div>
          </div>
        )}
        
        {/* Recommendations */}
        {sections.recommendations && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 bg-gray-100 p-2 rounded print:bg-white print:border-b-2 print:border-gray-200 print:rounded-none">Strategic Recommendations</h2>
            <div className="pl-2">
              {renderContent(sections.recommendations)}
            </div>
          </div>
        )}
      </div>
      
      {/* PDF Footer */}
      <div className="p-4 border-t text-center text-xs text-gray-500 print:fixed print:bottom-0 print:left-0 print:right-0">
        10X Engineered Materials • Confidential • {month} {year}
      </div>
    </Card>
  );
}
