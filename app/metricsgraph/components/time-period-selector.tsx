'use client';

import React from 'react';
import { useMetrics, TimeFrame, DateRange, ComparisonMode } from '../metrics-context';

export default function TimePeriodSelector() {
  const {
    dateColumns,
    timeFrame,
    customDateRange,
    comparisonMode,
    setTimeFrame,
    setCustomDateRange,
    setComparisonMode
  } = useMetrics();

  // Handle time frame change
  const handleTimeFrameChange = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
  };

  // Handle date range change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const start = parseInt(e.target.value);
    // Ensure end date is not before start date
    const end = Math.max(start, customDateRange.end);
    setCustomDateRange({ start, end });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const end = parseInt(e.target.value);
    // Ensure start date is not after end date
    const start = Math.min(customDateRange.start, end);
    setCustomDateRange({ start, end });
  };

  // Handle comparison mode change
  const handleComparisonModeChange = (newMode: ComparisonMode) => {
    setComparisonMode(newMode);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Time Period Selection</h3>
      
      {/* Time Frame Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Time Frame</label>
        <div className="flex space-x-2">
          <button
            onClick={() => handleTimeFrameChange('monthly')}
            className={`px-3 py-1.5 text-sm rounded ${
              timeFrame === 'monthly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => handleTimeFrameChange('quarterly')}
            className={`px-3 py-1.5 text-sm rounded ${
              timeFrame === 'quarterly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Quarterly
          </button>
          <button
            onClick={() => handleTimeFrameChange('yearly')}
            className={`px-3 py-1.5 text-sm rounded ${
              timeFrame === 'yearly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>
      
      {/* Date Range Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Period</label>
            <select
              value={customDateRange.start}
              onChange={handleStartDateChange}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateColumns.map((date, index) => (
                <option key={`start-${index}`} value={index}>
                  {date}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Period</label>
            <select
              value={customDateRange.end}
              onChange={handleEndDateChange}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateColumns.map((date, index) => (
                <option key={`end-${index}`} value={index}>
                  {date}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Comparison Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Comparison</label>
        <div className="flex space-x-2">
          <button
            onClick={() => handleComparisonModeChange('none')}
            className={`px-3 py-1.5 text-sm rounded ${
              comparisonMode === 'none' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            None
          </button>
          <button
            onClick={() => handleComparisonModeChange('yoy')}
            className={`px-3 py-1.5 text-sm rounded ${
              comparisonMode === 'yoy' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Year-over-Year
          </button>
        </div>
      </div>
    </div>
  );
}
