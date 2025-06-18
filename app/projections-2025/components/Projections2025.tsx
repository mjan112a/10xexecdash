'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface MonthlyData {
  month: string;
  metrics: { [uid: string]: number };
}

interface ApiResponse {
  monthlyData: MonthlyData[];
  metricsInfo: { [uid: string]: { name: string; unit: string; category: string } };
}

interface ProjectionData {
  month: string;
  monthIndex: number;
  projectedEBITDA: number;
  cumulativeCostSavings: number;
  projectedOnlineSales: number;
  costReductionImpact: number;
  costIncreaseImpact: number;
}

interface ChartProps {
  title: string;
  subtitle: string;
  data: ProjectionData[];
  dataKey: keyof ProjectionData;
  color?: string;
  showGrowth?: boolean;
}

function ProjectionChart({ 
  title, 
  subtitle, 
  data, 
  dataKey,
  color = 'blue',
  showGrowth = false
}: ChartProps) {
  const values = data.map(d => d[dataKey] as number);
  const maxValue = Math.max(...values.map(v => Math.abs(v)));
  const minValue = Math.min(...values);
  const range = maxValue - minValue;

  // Calculate growth from first to last value
  const firstValue = values[0] || 0;
  const lastValue = values[values.length - 1] || 0;
  const growthPercent = firstValue > 0 ? ((lastValue - firstValue) / firstValue * 100) : 0;

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return value < 0 ? `($${Math.abs(value / 1000).toFixed(0)}K)` : `$${(value / 1000).toFixed(0)}K`;
    }
    return value < 0 ? `($${Math.abs(value)})` : `$${value}`;
  };

  const getBarColor = (isLatest: boolean) => {
    if (color === 'green') return isLatest ? 'bg-green-500' : 'bg-green-400';
    if (color === 'purple') return isLatest ? 'bg-purple-500' : 'bg-purple-400';
    if (color === 'orange') return isLatest ? 'bg-orange-500' : 'bg-orange-400';
    return isLatest ? 'bg-blue-500' : 'bg-blue-400';
  };

  return (
    <Card className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
        {showGrowth && growthPercent > 0 && (
          <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium inline-block">
            📈 {growthPercent.toFixed(0)}% Projected Growth
          </div>
        )}
      </div>
      
      <div className="relative h-56 flex items-end justify-between px-1">
        {data.map((item, index) => {
          const isLatest = index === data.length - 1;
          const value = item[dataKey] as number;
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
                  getBarColor(isLatest)
                } ${isNegative ? 'opacity-80' : ''}`}
                style={{ 
                  height: `${Math.max(barHeight, 12)}px`,
                  width: '24px'
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

function ProjectionTable({ data }: { data: ProjectionData[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Monthly Projection Details</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-700">Month</th>
              <th className="text-right py-3 px-2 font-medium text-gray-700">Projected EBITDA</th>
              <th className="text-right py-3 px-2 font-medium text-gray-700">Online Sales</th>
              <th className="text-right py-3 px-2 font-medium text-gray-700">Cost Savings</th>
              <th className="text-right py-3 px-2 font-medium text-gray-700">Cumulative Savings</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 px-2 font-medium">{item.month}</td>
                <td className="py-3 px-2 text-right font-mono">${item.projectedEBITDA.toLocaleString()}</td>
                <td className="py-3 px-2 text-right font-mono">${item.projectedOnlineSales.toLocaleString()}</td>
                <td className="py-3 px-2 text-right font-mono">${(item.costReductionImpact - item.costIncreaseImpact).toLocaleString()}</td>
                <td className="py-3 px-2 text-right font-mono font-semibold">${item.cumulativeCostSavings.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function Projections2025() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectionData, setProjectionData] = useState<ProjectionData[]>([]);

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
      generateProjections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateProjections = (data: ApiResponse) => {
    // Get historical data for trend analysis
    const historicalEBITDA = data.monthlyData.map(m => m.metrics['20'] || 0); // Gross Income as EBITDA proxy
    const historicalOnline = data.monthlyData.map(m => m.metrics['2'] || 0); // Online Abrasive Revenue

    // Calculate growth trends
    const ebitdaGrowthRate = historicalEBITDA.length > 1 ? 
      (historicalEBITDA[historicalEBITDA.length - 1] - historicalEBITDA[0]) / historicalEBITDA.length : 0;
    
    const onlineGrowthRate = historicalOnline.length > 1 ? 
      Math.max((historicalOnline[historicalOnline.length - 1] - historicalOnline[0]) / historicalOnline.length, 2) : 2;

    // Cost reduction schedule
    const costReductions = [
      { name: "Increase Prices", startMonth: 4, monthlyImpact: 33502 },
      { name: "Sales Coaching Elimination", startMonth: 6, monthlyImpact: 7263 },
      { name: "Cap Digital Marketing at $40K", startMonth: 6, monthlyImpact: 13764 },
      { name: "Eliminate Overtime", startMonth: 7, monthlyImpact: 15321 },
      { name: "Decrease Parcel Costs", startMonth: 7, monthlyImpact: 5903 },
      { name: "Decrease Red Wing 40%", startMonth: 8, monthlyImpact: 69600 },
      { name: "Daun Retirement", startMonth: 10, monthlyImpact: 5080 },
      { name: "Alexandria Replaces Red Wing", startMonth: 10, monthlyImpact: 44600 }
    ];

    const costIncreases = [
      { name: "Increase WebFX Hub Fee", startMonth: 7, monthlyImpact: 11000 },
      { name: "Three Decanter RA Payments", startMonth: 7, monthlyImpact: 34000 },
      { name: "Add Maintenance Technician", startMonth: 9, monthlyImpact: 708 },
      { name: "Decanter VFD", startMonth: 8, monthlyImpact: 0 } // One-time cost
    ];

    const months = [
      'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025',
      'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025'
    ];

    let cumulativeSavings = 0;
    const projections: ProjectionData[] = [];

    // Base values from April 2025 (last actual month)
    const baseEBITDA = historicalEBITDA[historicalEBITDA.length - 1] || 200;
    const baseOnline = historicalOnline[historicalOnline.length - 1] || 20;

    months.forEach((month, index) => {
      const monthIndex = index + 1;
      
      // Calculate cost reduction impact for this month
      let monthlyReductionImpact = 0;
      costReductions.forEach(reduction => {
        if (monthIndex >= reduction.startMonth) {
          monthlyReductionImpact += reduction.monthlyImpact;
        }
      });

      // Calculate cost increase impact for this month
      let monthlyIncreaseImpact = 0;
      costIncreases.forEach(increase => {
        if (monthIndex >= increase.startMonth) {
          monthlyIncreaseImpact += increase.monthlyImpact;
        }
      });

      const netMonthlySavings = monthlyReductionImpact - monthlyIncreaseImpact;
      cumulativeSavings += netMonthlySavings;

      // Project EBITDA with growth trend + cost savings impact
      const projectedEBITDA = Math.round(baseEBITDA + (ebitdaGrowthRate * monthIndex) + (netMonthlySavings / 1000));

      // Project online sales with accelerated growth
      const projectedOnlineSales = Math.round(baseOnline + (onlineGrowthRate * monthIndex * 1.5));

      projections.push({
        month,
        monthIndex,
        projectedEBITDA,
        cumulativeCostSavings: Math.round(cumulativeSavings),
        projectedOnlineSales,
        costReductionImpact: monthlyReductionImpact,
        costIncreaseImpact: monthlyIncreaseImpact
      });
    });

    setProjectionData(projections);
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

  const totalProjectedSavings = projectionData[projectionData.length - 1]?.cumulativeCostSavings || 0;
  const finalOnlineSales = projectionData[projectionData.length - 1]?.projectedOnlineSales || 0;
  const initialOnlineSales = projectionData[0]?.projectedOnlineSales || 0;
  const onlineGrowthPercent = initialOnlineSales > 0 ? ((finalOnlineSales - initialOnlineSales) / initialOnlineSales * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            🔮 2025 Financial Projections
          </h1>
          <p className="text-gray-600 mb-6">
            Month-by-month projections through December 2025 showing EBITDA growth, cost reduction impact, and online sales expansion.
          </p>
        </div>

        {/* Key Metrics Summary */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🎯 2025 Year-End Projections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-2">Total Cost Savings</h3>
              <p className="text-3xl font-bold text-green-800">${totalProjectedSavings.toLocaleString()}</p>
              <p className="text-sm text-green-600">Cumulative through Dec 2025</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-700 mb-2">Online Sales Growth</h3>
              <p className="text-3xl font-bold text-blue-800">{onlineGrowthPercent.toFixed(0)}%</p>
              <p className="text-sm text-blue-600">Projected annual growth</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-700 mb-2">Final EBITDA</h3>
              <p className="text-3xl font-bold text-purple-800">${projectionData[projectionData.length - 1]?.projectedEBITDA.toLocaleString() || 0}</p>
              <p className="text-sm text-purple-600">December 2025 projection</p>
            </div>
          </div>
        </Card>

        {/* Charts Section */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">📈 Monthly Projection Charts</h2>
          
          {/* Top row - 3 charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ProjectionChart
              title="Projected EBITDA"
              subtitle="(thousand USD)"
              data={projectionData}
              dataKey="projectedEBITDA"
              color="blue"
            />
            
            <ProjectionChart
              title="Cumulative Cost Savings"
              subtitle="(thousand USD)"
              data={projectionData}
              dataKey="cumulativeCostSavings"
              color="green"
            />
            
            <ProjectionChart
              title="Online Sales Growth"
              subtitle="(thousand USD)"
              data={projectionData}
              dataKey="projectedOnlineSales"
              color="purple"
              showGrowth={true}
            />
          </div>

          {/* Key Assumptions */}
          <Card className="p-4 bg-yellow-50 border-yellow-200 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">📋 Projection Assumptions</h3>
            <ul className="text-yellow-700 space-y-1 text-sm">
              <li>• EBITDA projections based on historical growth trends plus cost reduction impact</li>
              <li>• Online sales growth accelerated based on digital transformation initiatives</li>
              <li>• Cost reductions implemented according to planned schedule</li>
              <li>• Strategic investments (equipment, personnel) factored into projections</li>
              <li>• Market conditions remain stable with continued demand growth</li>
            </ul>
          </Card>
        </div>

        {/* Detailed Table */}
        <ProjectionTable data={projectionData} />

        {/* Bottom highlight text */}
        <Card className="p-4 bg-blue-50 border-blue-200 mt-8">
          <p className="text-blue-800 font-medium text-center">
            Strategic cost management and digital growth initiatives position 10X for exceptional 2025 performance.
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
