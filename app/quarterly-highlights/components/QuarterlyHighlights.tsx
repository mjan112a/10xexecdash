'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface MetricOption {
  uid: string;
  name: string;
  unit: string;
  category: string;
  aggregationType: 'sum' | 'average' | 'end-of-period';
}

interface QuarterlyData {
  quarter: string;
  metrics: { [uid: string]: number };
}

interface ApiResponse {
  quarterlyData: QuarterlyData[];
  metricOptions: MetricOption[];
  metricsInfo: { [uid: string]: { name: string; unit: string; category: string; aggregationType: 'sum' | 'average' | 'end-of-period' } };
}

interface ChartProps {
  title: string;
  subtitle: string;
  selectedMetricUid: string;
  quarterlyData: QuarterlyData[];
  metricsInfo: { [uid: string]: { name: string; unit: string; category: string; aggregationType: 'sum' | 'average' | 'end-of-period' } };
}

function QuarterlyChart({ 
  title, 
  subtitle, 
  selectedMetricUid, 
  quarterlyData, 
  metricsInfo
}: ChartProps) {
  // Get data for the selected metric
  const data = quarterlyData.map(q => ({
    quarter: q.quarter,
    value: q.metrics[selectedMetricUid] || 0
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
      
      <div className="relative h-56 flex items-end justify-between px-4">
        {data.map((item, index) => {
          const isLatest = index === data.length - 1;
          const value = item.value;
          const isNegative = value < 0;
          const barHeight = range > 0 ? (Math.abs(value) / maxValue) * 160 : 20;
          
          return (
            <div key={item.quarter} className="flex flex-col items-center flex-1 mx-2">
              {/* Value label - positioned with more space */}
              <div className="mb-4 text-xs font-medium text-gray-700 text-center min-h-[16px] flex items-center justify-center">
                <span className="px-1 py-0.5 bg-white/80 rounded">
                  {formatValue(value)}
                </span>
              </div>
              
              {/* Bar */}
              <div 
                className={`w-full max-w-16 rounded-sm transition-all duration-200 ${
                  isLatest ? 'bg-blue-500' : 'bg-gray-400'
                } ${isNegative ? 'opacity-80' : ''}`}
                style={{ 
                  height: `${Math.max(barHeight, 12)}px`
                }}
              />
              
              {/* Quarter label */}
              <div className="mt-3 text-xs text-gray-600 font-medium">
                {item.quarter}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function QuarterlyHighlights() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Default selected metrics (you can change these UIDs to your preferred defaults)
  const [selectedMetrics, setSelectedMetrics] = useState({
    chart1: '8',  // Total Revenue
    chart2: '20', // Gross Income
    chart3: '33', // Net Income
    chart4: '45', // Operating Cash Flow
    chart5: '46'  // Free Cash Flow
  });

  // Aggregation type overrides
  const [aggregationOverrides, setAggregationOverrides] = useState<{ [uid: string]: 'sum' | 'average' | 'end-of-period' }>({});

  useEffect(() => {
    fetchQuarterlyData();
  }, [aggregationOverrides]);

  const fetchQuarterlyData = async () => {
    try {
      let url = '/api/quarterly-data';
      if (Object.keys(aggregationOverrides).length > 0) {
        url += `?overrides=${encodeURIComponent(JSON.stringify(aggregationOverrides))}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch quarterly data');
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

  const handleAggregationChange = (uid: string, aggregationType: 'sum' | 'average' | 'end-of-period') => {
    setAggregationOverrides(prev => ({
      ...prev,
      [uid]: aggregationType
    }));
  };

  const getAggregationTypeForMetric = (uid: string): 'sum' | 'average' | 'end-of-period' => {
    return aggregationOverrides[uid] || apiData?.metricsInfo[uid]?.aggregationType || 'sum';
  };

  const getAggregationLabel = (type: 'sum' | 'average' | 'end-of-period'): string => {
    switch (type) {
      case 'sum': return 'Sum (3 months)';
      case 'average': return 'Average (3 months)';
      case 'end-of-period': return 'End of Quarter';
      default: return type;
    }
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
            <p className="text-red-600 mb-4">Error loading quarterly data: {error}</p>
            <button 
              onClick={fetchQuarterlyData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!apiData || apiData.quarterlyData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">No quarterly data available</p>
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
            Quarterly income statement highlights
          </h1>
          <p className="text-gray-600 mb-6">
            Configure the metrics for each chart using the dropdowns below. You can also override how each metric is aggregated quarterly.
          </p>
        </div>

        {/* Configuration Section - All Input Fields Above Charts */}
        <Card className="p-6 mb-8 bg-white border-2 border-blue-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Chart Configuration</h2>
          <p className="text-sm text-gray-600 mb-6">
            Select the metrics you want to display in each chart. The system automatically determines how to aggregate each metric, but you can override this below.
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mb-2"
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
              <select
                value={getAggregationTypeForMetric(selectedMetrics.chart1)}
                onChange={(e) => handleAggregationChange(selectedMetrics.chart1, e.target.value as 'sum' | 'average' | 'end-of-period')}
                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="sum">Sum (3 months)</option>
                <option value="average">Average (3 months)</option>
                <option value="end-of-period">End of Quarter</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mb-2"
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
              <select
                value={getAggregationTypeForMetric(selectedMetrics.chart2)}
                onChange={(e) => handleAggregationChange(selectedMetrics.chart2, e.target.value as 'sum' | 'average' | 'end-of-period')}
                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="sum">Sum (3 months)</option>
                <option value="average">Average (3 months)</option>
                <option value="end-of-period">End of Quarter</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mb-2"
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
              <select
                value={getAggregationTypeForMetric(selectedMetrics.chart3)}
                onChange={(e) => handleAggregationChange(selectedMetrics.chart3, e.target.value as 'sum' | 'average' | 'end-of-period')}
                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="sum">Sum (3 months)</option>
                <option value="average">Average (3 months)</option>
                <option value="end-of-period">End of Quarter</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mb-2"
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
              <select
                value={getAggregationTypeForMetric(selectedMetrics.chart4)}
                onChange={(e) => handleAggregationChange(selectedMetrics.chart4, e.target.value as 'sum' | 'average' | 'end-of-period')}
                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="sum">Sum (3 months)</option>
                <option value="average">Average (3 months)</option>
                <option value="end-of-period">End of Quarter</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mb-2"
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
              <select
                value={getAggregationTypeForMetric(selectedMetrics.chart5)}
                onChange={(e) => handleAggregationChange(selectedMetrics.chart5, e.target.value as 'sum' | 'average' | 'end-of-period')}
                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="sum">Sum (3 months)</option>
                <option value="average">Average (3 months)</option>
                <option value="end-of-period">End of Quarter</option>
              </select>
            </div>
          </div>

          {/* Aggregation Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-800 mb-2">Aggregation Types:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
              <div>
                <strong>Sum (3 months):</strong> Adds up all 3 monthly values in the quarter. Best for: Revenue, Expenses, Cash Flow
              </div>
              <div>
                <strong>Average (3 months):</strong> Takes the average of 3 monthly values. Best for: Percentages, Ratios, Rates
              </div>
              <div>
                <strong>End of Quarter:</strong> Uses the last month's value in the quarter. Best for: Cash Balance, Employee Count, Inventory
              </div>
            </div>
          </div>
        </Card>

        {/* Charts Section - Clean for Screen Capture */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          {/* Top row - 3 charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <QuarterlyChart
              title={apiData.metricsInfo[selectedMetrics.chart1]?.name || "Chart 1"}
              subtitle={`(${getAggregationLabel(getAggregationTypeForMetric(selectedMetrics.chart1))})`}
              selectedMetricUid={selectedMetrics.chart1}
              quarterlyData={apiData.quarterlyData}
              metricsInfo={apiData.metricsInfo}
            />
            
            <QuarterlyChart
              title={apiData.metricsInfo[selectedMetrics.chart2]?.name || "Chart 2"}
              subtitle={`(${getAggregationLabel(getAggregationTypeForMetric(selectedMetrics.chart2))})`}
              selectedMetricUid={selectedMetrics.chart2}
              quarterlyData={apiData.quarterlyData}
              metricsInfo={apiData.metricsInfo}
            />
            
            <QuarterlyChart
              title={apiData.metricsInfo[selectedMetrics.chart3]?.name || "Chart 3"}
              subtitle={`(${getAggregationLabel(getAggregationTypeForMetric(selectedMetrics.chart3))})`}
              selectedMetricUid={selectedMetrics.chart3}
              quarterlyData={apiData.quarterlyData}
              metricsInfo={apiData.metricsInfo}
            />
          </div>

          {/* Bottom row - 2 charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <QuarterlyChart
              title={apiData.metricsInfo[selectedMetrics.chart4]?.name || "Chart 4"}
              subtitle={`(${getAggregationLabel(getAggregationTypeForMetric(selectedMetrics.chart4))})`}
              selectedMetricUid={selectedMetrics.chart4}
              quarterlyData={apiData.quarterlyData}
              metricsInfo={apiData.metricsInfo}
            />
            
            <QuarterlyChart
              title={apiData.metricsInfo[selectedMetrics.chart5]?.name || "Chart 5"}
              subtitle={`(${getAggregationLabel(getAggregationTypeForMetric(selectedMetrics.chart5))})`}
              selectedMetricUid={selectedMetrics.chart5}
              quarterlyData={apiData.quarterlyData}
              metricsInfo={apiData.metricsInfo}
            />
          </div>

          {/* Bottom highlight text */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-blue-800 font-medium text-center">
              Business improvement in Q3 reflects progress on safety messaging, sales strategy, and marketing initiatives.
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
