'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface MetricOption {
  uid: string;
  name: string;
  unit: string;
  category: string;
}

interface MonthlyData {
  month: string;
  metrics: { [uid: string]: number };
}

interface ApiResponse {
  monthlyData: MonthlyData[];
  metricOptions: MetricOption[];
  metricsInfo: { [uid: string]: { name: string; unit: string; category: string } };
}

interface ChartProps {
  title: string;
  subtitle: string;
  selectedMetricUid: string;
  monthlyData: MonthlyData[];
  metricsInfo: { [uid: string]: { name: string; unit: string; category: string } };
}

function MonthlyChart({ 
  title, 
  subtitle, 
  selectedMetricUid, 
  monthlyData, 
  metricsInfo
}: ChartProps) {
  // Get data for the selected metric
  const data = monthlyData.map(m => ({
    month: m.month,
    value: m.metrics[selectedMetricUid] || 0
  }));

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  const formatValue = (value: number) => {
    const metricInfo = metricsInfo[selectedMetricUid];
    if (!metricInfo) return value.toString();

    if (metricInfo.unit === '$') {
      return value < 0 ? `($${Math.abs(value)})` : `$${value}`;
    } else if (metricInfo.unit === '%') {
      return `${(value * 100).toFixed(1)}%`;
    } else if (metricInfo.unit === 'ratio') {
      return value.toFixed(2);
    } else {
      return value.toString();
    }
  };

  return (
    <Card className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
      
      <div className="relative h-56 flex items-end justify-between px-1">
        {data.map((item, index) => {
          const isLatest = index === data.length - 1;
          const value = item.value;
          const isNegative = value < 0;
          const barHeight = range > 0 ? (Math.abs(value) / maxValue) * 160 : 20;
          
          return (
            <div key={item.month} className="flex flex-col items-center flex-1 mx-0.5">
              {/* Value label - positioned with more space */}
              <div className="mb-3 text-xs font-medium text-gray-700 text-center min-h-[16px] flex items-center justify-center">
                <span className="px-0.5 py-0.5 bg-white/80 rounded text-xs">
                  {formatValue(value)}
                </span>
              </div>
              
              {/* Bar - wider still */}
              <div 
                className={`rounded-sm transition-all duration-200 ${
                  isLatest ? 'bg-blue-500' : 'bg-gray-400'
                } ${isNegative ? 'opacity-80' : ''}`}
                style={{ 
                  height: `${Math.max(barHeight, 12)}px`,
                  width: '36px'
                }}
              />
              
              {/* Month label */}
              <div className="mt-2 text-xs text-gray-600 font-medium transform -rotate-45 origin-center">
                <span className="block w-8 text-center text-xs">
                  {item.month}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function IncomeHighlights() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Default selected metrics matching the attached image
  const [selectedMetrics, setSelectedMetrics] = useState({
    chart1: '8',  // Total Revenue
    chart2: '2',  // Online Abrasive Revenue
    chart3: '20', // EBITDA (Gross Income)
    chart4: '33', // Net Income
    chart5: '45'  // Operating Cash Flow (closest to Cash at End of Period)
  });

  useEffect(() => {
    fetchMonthlyData();
  }, []);

  const fetchMonthlyData = async () => {
    try {
      const response = await fetch('/api/monthly-data');
      if (!response.ok) {
        throw new Error('Failed to fetch monthly data');
      }
      const data = await response.json();
      setApiData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMetricChange = (chartId: string, uid: string) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [chartId]: uid
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-96 mb-8"></div>
            <div className="h-32 bg-gray-300 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="h-80 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Error loading monthly data: {error}</p>
            <button 
              onClick={fetchMonthlyData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!apiData || apiData.monthlyData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">No monthly data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Group options by category for better organization
  const groupedOptions = apiData.metricOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as { [category: string]: MetricOption[] });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            2025 Monthly income statement highlights
          </h1>
          <p className="text-gray-600 mb-6">
            Showing 2025 data (4 months: Jan-Apr). Configure the metrics for each chart using the dropdowns below, then scroll down for clean charts perfect for screen capture.
          </p>
        </div>

        {/* Configuration Section - All Input Fields Above Charts */}
        <Card className="p-6 mb-8 bg-white border-2 border-blue-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Chart Configuration</h2>
          <p className="text-sm text-gray-600 mb-6">
            Select the metrics you want to display in each chart. Changes will be reflected immediately in the charts below.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Chart 1 Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart 1 Metric:
              </label>
              <select
                value={selectedMetrics.chart1}
                onChange={(e) => handleMetricChange('chart1', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {Object.entries(groupedOptions).map(([category, options]) => (
                  <optgroup key={category} label={category}>
                    {options.map((option) => (
                      <option key={option.uid} value={option.uid}>
                        {option.name} ({option.unit})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Chart 2 Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart 2 Metric:
              </label>
              <select
                value={selectedMetrics.chart2}
                onChange={(e) => handleMetricChange('chart2', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {Object.entries(groupedOptions).map(([category, options]) => (
                  <optgroup key={category} label={category}>
                    {options.map((option) => (
                      <option key={option.uid} value={option.uid}>
                        {option.name} ({option.unit})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Chart 3 Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart 3 Metric:
              </label>
              <select
                value={selectedMetrics.chart3}
                onChange={(e) => handleMetricChange('chart3', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {Object.entries(groupedOptions).map(([category, options]) => (
                  <optgroup key={category} label={category}>
                    {options.map((option) => (
                      <option key={option.uid} value={option.uid}>
                        {option.name} ({option.unit})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Chart 4 Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart 4 Metric:
              </label>
              <select
                value={selectedMetrics.chart4}
                onChange={(e) => handleMetricChange('chart4', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {Object.entries(groupedOptions).map(([category, options]) => (
                  <optgroup key={category} label={category}>
                    {options.map((option) => (
                      <option key={option.uid} value={option.uid}>
                        {option.name} ({option.unit})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Chart 5 Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart 5 Metric:
              </label>
              <select
                value={selectedMetrics.chart5}
                onChange={(e) => handleMetricChange('chart5', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {Object.entries(groupedOptions).map(([category, options]) => (
                  <optgroup key={category} label={category}>
                    {options.map((option) => (
                      <option key={option.uid} value={option.uid}>
                        {option.name} ({option.unit})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Charts Section - Clean for Screen Capture */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          {/* Top row - 3 charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MonthlyChart
              title={apiData.metricsInfo[selectedMetrics.chart1]?.name || "Chart 1"}
              subtitle="(thousand USD)"
              selectedMetricUid={selectedMetrics.chart1}
              monthlyData={apiData.monthlyData}
              metricsInfo={apiData.metricsInfo}
            />
            
            <MonthlyChart
              title={apiData.metricsInfo[selectedMetrics.chart2]?.name || "Chart 2"}
              subtitle="(thousand USD)"
              selectedMetricUid={selectedMetrics.chart2}
              monthlyData={apiData.monthlyData}
              metricsInfo={apiData.metricsInfo}
            />
            
            <MonthlyChart
              title={apiData.metricsInfo[selectedMetrics.chart3]?.name || "Chart 3"}
              subtitle="(thousand USD)"
              selectedMetricUid={selectedMetrics.chart3}
              monthlyData={apiData.monthlyData}
              metricsInfo={apiData.metricsInfo}
            />
          </div>

          {/* Bottom row - 2 charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <MonthlyChart
              title={apiData.metricsInfo[selectedMetrics.chart4]?.name || "Chart 4"}
              subtitle="(thousand USD)"
              selectedMetricUid={selectedMetrics.chart4}
              monthlyData={apiData.monthlyData}
              metricsInfo={apiData.metricsInfo}
            />
            
            <MonthlyChart
              title={apiData.metricsInfo[selectedMetrics.chart5]?.name || "Chart 5"}
              subtitle="(thousand USD)"
              selectedMetricUid={selectedMetrics.chart5}
              monthlyData={apiData.monthlyData}
              metricsInfo={apiData.metricsInfo}
            />
          </div>

          {/* Bottom highlight text */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-blue-800 font-medium text-center">
              Business improvement reflects progress on safety messaging, sales strategy, and marketing initiatives.
            </p>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-right">
            <p className="text-sm text-gray-500">
              © 2024 10X ENGINEERED MATERIALS, LLC
            </p>
            <p className="text-sm text-gray-500">8</p>
          </div>
        </div>
      </div>
    </div>
  );
}
