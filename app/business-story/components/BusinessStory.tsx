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
  highlightGrowth?: boolean;
}

function StoryChart({ 
  title, 
  subtitle, 
  selectedMetricUid, 
  monthlyData, 
  metricsInfo,
  highlightGrowth = false
}: ChartProps) {
  // Get data for the selected metric
  const data = monthlyData.map(m => ({
    month: m.month,
    value: m.metrics[selectedMetricUid] || 0
  }));

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  // Calculate growth percentage for online sales
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const growthPercent = firstValue > 0 ? ((lastValue - firstValue) / firstValue * 100) : 0;

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
        {highlightGrowth && growthPercent > 0 && (
          <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium inline-block">
            📈 {growthPercent.toFixed(0)}% Growth
          </div>
        )}
      </div>
      
      <div className="relative h-56 flex items-end justify-between px-1">
        {data.map((item, index) => {
          const isLatest = index === data.length - 1;
          const value = item.value;
          const isNegative = value < 0;
          const barHeight = range > 0 ? (Math.abs(value) / maxValue) * 160 : 20;
          
          return (
            <div key={item.month} className="flex flex-col items-center flex-1 mx-0.5">
              {/* Value label */}
              <div className="mb-3 text-xs font-medium text-gray-700 text-center min-h-[16px] flex items-center justify-center">
                <span className="px-0.5 py-0.5 bg-white/80 rounded text-xs">
                  {formatValue(value)}
                </span>
              </div>
              
              {/* Bar */}
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

function CostReductionTable() {
  const costReductions = [
    { initiative: "Increase Prices", startMonth: "April", monthlyImpact: 33502, yearTotal: 301518, status: "✅ Complete" },
    { initiative: "Sales Coaching Elimination", startMonth: "June", monthlyImpact: 7263, yearTotal: 50841, status: "✅ Complete" },
    { initiative: "Cap Digital Marketing at $40K", startMonth: "June", monthlyImpact: 13764, yearTotal: 82584, status: "✅ Implemented" },
    { initiative: "Eliminate Overtime", startMonth: "July", monthlyImpact: 15321, yearTotal: 91923, status: "In Progress" },
    { initiative: "Decrease Parcel Costs", startMonth: "July", monthlyImpact: 5903, yearTotal: 35415, status: "Negotiated" },
    { initiative: "Decrease Red Wing 40%", startMonth: "August", monthlyImpact: 69600, yearTotal: 139200, status: "Ed developing alternatives" },
    { initiative: "Daun Retirement", startMonth: "October", monthlyImpact: 5080, yearTotal: 15240, status: "Planned transition" },
    { initiative: "Alexandria Replaces Red Wing", startMonth: "October", monthlyImpact: 44600, yearTotal: 133800, status: "Evaluation phase" }
  ];

  const plannedExpenses = [
    { investment: "Increase WebFX Hub Fee", startMonth: "July", monthlyCost: 11000, yearTotal: 66000, purpose: "Raise for the Founders" },
    { investment: "Three Decanter RA Payments", startMonth: "July", monthlyCost: 34000, yearTotal: 102000, purpose: "Equipment financing" },
    { investment: "Add Maintenance Technician", startMonth: "September", monthlyCost: 708, yearTotal: 2832, purpose: "Support Jake's promotion" },
    { investment: "Decanter VFD", startMonth: "August", monthlyCost: 0, yearTotal: 34000, purpose: "Process reliability" }
  ];

  const totalReductions = costReductions.reduce((sum, item) => sum + item.yearTotal, 0);
  const totalIncreases = plannedExpenses.reduce((sum, item) => sum + item.yearTotal, 0);
  const netSavings = totalReductions - totalIncreases;

  return (
    <div className="space-y-6">
      {/* Cost Reduction Plan */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">💰 Cost Reduction Plan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-700">Initiative</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Start Month</th>
                <th className="text-right py-3 px-2 font-medium text-gray-700">Monthly Impact</th>
                <th className="text-right py-3 px-2 font-medium text-gray-700">End of Year Total</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Implementation Status</th>
              </tr>
            </thead>
            <tbody>
              {costReductions.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-2 font-medium">{item.initiative}</td>
                  <td className="py-3 px-2">{item.startMonth}</td>
                  <td className="py-3 px-2 text-right font-mono">${item.monthlyImpact.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right font-mono font-semibold">${item.yearTotal.toLocaleString()}</td>
                  <td className="py-3 px-2">{item.status}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 bg-green-50">
                <td className="py-3 px-2 font-bold">TOTAL COST REDUCTIONS</td>
                <td className="py-3 px-2"></td>
                <td className="py-3 px-2 text-right font-mono font-bold">${costReductions.reduce((sum, item) => sum + item.monthlyImpact, 0).toLocaleString()}</td>
                <td className="py-3 px-2 text-right font-mono font-bold text-green-700">${totalReductions.toLocaleString()}</td>
                <td className="py-3 px-2 font-semibold">Phased implementation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Planned Expenses */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">📈 Planned Expenses and Cost Increases</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-700">Investment</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Start Month</th>
                <th className="text-right py-3 px-2 font-medium text-gray-700">Monthly Cost</th>
                <th className="text-right py-3 px-2 font-medium text-gray-700">End of Year Total</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {plannedExpenses.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-2 font-medium">{item.investment}</td>
                  <td className="py-3 px-2">{item.startMonth}</td>
                  <td className="py-3 px-2 text-right font-mono">
                    {item.monthlyCost > 0 ? `$${item.monthlyCost.toLocaleString()}` : 'One-time'}
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-semibold">${item.yearTotal.toLocaleString()}</td>
                  <td className="py-3 px-2">{item.purpose}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 bg-red-50">
                <td className="py-3 px-2 font-bold">TOTAL COST INCREASES</td>
                <td className="py-3 px-2"></td>
                <td className="py-3 px-2 text-right font-mono font-bold">${plannedExpenses.reduce((sum, item) => sum + item.monthlyCost, 0).toLocaleString()}</td>
                <td className="py-3 px-2 text-right font-mono font-bold text-red-700">${totalIncreases.toLocaleString()}</td>
                <td className="py-3 px-2 font-semibold">Growth enablers</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Net Impact */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <h4 className="text-lg font-semibold text-blue-800 mb-2">Net Savings through Dec 2025</h4>
            <p className="text-3xl font-bold text-blue-900">${netSavings.toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-800 mb-2">Average Monthly Savings</h4>
            <p className="text-3xl font-bold text-blue-900">${Math.round(netSavings / 12).toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-800 mb-2">Implementation Status</h4>
            <p className="text-lg font-semibold text-blue-900">Phased Rollout</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function BusinessStory() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-96 mb-8"></div>
            <div className="h-32 bg-gray-300 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            <p className="text-red-600 mb-4">Error loading data: {error}</p>
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
            <p className="text-gray-600">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            📊 Business Transformation Story
          </h1>
          <p className="text-gray-600 mb-6">
            Showcasing our strategic growth in online sales and comprehensive cost reduction initiatives for 2025.
          </p>
        </div>

        {/* Story Section */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🚀 Our Growth Story</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
            <div>
              <h3 className="font-semibold text-blue-700 mb-2">📈 Online Sales Explosion</h3>
              <p className="text-gray-700">
                We've achieved remarkable growth in our online abrasive revenue, demonstrating our successful digital transformation and market expansion strategy.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-green-700 mb-2">💰 Strategic Cost Management</h3>
              <p className="text-gray-700">
                Through our comprehensive cost reduction plan, we're projected to save <strong>$645,689</strong> by end of 2025 while investing in growth enablers.
              </p>
            </div>
          </div>
        </Card>

        {/* Charts Section */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">📊 Key Performance Indicators</h2>
          
          {/* Top row - Growth metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <StoryChart
              title="Online Abrasive Revenue Growth"
              subtitle="(thousand USD)"
              selectedMetricUid="2"
              monthlyData={apiData.monthlyData}
              metricsInfo={apiData.metricsInfo}
              highlightGrowth={true}
            />
            
            <StoryChart
              title="Total Revenue Performance"
              subtitle="(thousand USD)"
              selectedMetricUid="8"
              monthlyData={apiData.monthlyData}
              metricsInfo={apiData.metricsInfo}
            />
          </div>

          {/* Bottom row - Profitability metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <StoryChart
              title="Net Income Trend"
              subtitle="(thousand USD)"
              selectedMetricUid="33"
              monthlyData={apiData.monthlyData}
              metricsInfo={apiData.metricsInfo}
            />
            
            <StoryChart
              title="Operating Cash Flow"
              subtitle="(thousand USD)"
              selectedMetricUid="45"
              monthlyData={apiData.monthlyData}
              metricsInfo={apiData.metricsInfo}
            />
          </div>

          {/* Key Insights */}
          <Card className="p-4 bg-yellow-50 border-yellow-200 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">💡 Key Insights</h3>
            <ul className="text-yellow-700 space-y-1">
              <li>• Online sales showing exponential growth trajectory</li>
              <li>• Strong overall revenue performance with consistent growth</li>
              <li>• Healthy cash flow supporting operational expansion</li>
              <li>• Strategic cost reductions enabling reinvestment in growth</li>
            </ul>
          </Card>
        </div>

        {/* Cost Reduction Tables */}
        <CostReductionTable />

        {/* Bottom highlight text */}
        <Card className="p-4 bg-blue-50 border-blue-200 mt-8">
          <p className="text-blue-800 font-medium text-center">
            Strategic transformation through digital growth and operational efficiency drives sustainable profitability.
          </p>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-right">
          <p className="text-sm text-gray-500">
            © 2024 10X ENGINEERED MATERIALS, LLC
          </p>
        </div>
      </div>
    </div>
  );
}
