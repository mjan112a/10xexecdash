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
  ebitdaPercentage: number;
  cumulativeCostSavings: number;
  projectedOnlineSales: number;
  totalRevenue: number;
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

  const formatValue = (value: number, item?: ProjectionData) => {
    // Special formatting for EBITDA chart - include percentage
    if (dataKey === 'projectedEBITDA' && item) {
      const baseValue = Math.abs(value) >= 1000 
        ? (value < 0 ? `($${Math.abs(value / 1000).toFixed(0)}K)` : `$${(value / 1000).toFixed(0)}K`)
        : (value < 0 ? `($${Math.abs(value)})` : `$${value}`);
      return `${baseValue} (${item.ebitdaPercentage.toFixed(1)}%)`;
    }
    
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
      
      <div className="relative h-56 flex items-center justify-between px-1">
        {/* Zero line */}
        <div className="absolute w-full h-px bg-gray-300" style={{ top: '50%' }}></div>
        
        {data.map((item, index) => {
          const isLatest = index === data.length - 1;
          const value = item[dataKey] as number;
          const isNegative = value < 0;
          const barHeight = range > 0 ? (Math.abs(value) / maxValue) * 35 : 8; // Reduced height to prevent bleeding
          
          return (
            <div key={item.month} className="flex flex-col items-center flex-1 mx-0.5 relative h-full">
              {/* Positive values - above zero line */}
              {!isNegative && (
                <>
                  {/* Value label above bar */}
                  <div className="absolute text-xs font-medium text-gray-700 text-center" style={{ top: `${50 - barHeight - 15}%` }}>
                    <span className="px-0.5 py-0.5 bg-white/80 rounded text-xs">
                      {formatValue(value, item)}
                    </span>
                  </div>
                  
                  {/* Positive bar */}
                  <div 
                    className={`absolute rounded-sm transition-all duration-200 ${getBarColor(isLatest)}`}
                    style={{ 
                      height: `${Math.max(barHeight, 6)}%`,
                      width: '24px',
                      bottom: '50%'
                    }}
                  />
                </>
              )}
              
              {/* Negative values - below zero line */}
              {isNegative && (
                <>
                  {/* Negative bar */}
                  <div 
                    className={`absolute rounded-sm transition-all duration-200 ${getBarColor(isLatest)} opacity-80`}
                    style={{ 
                      height: `${Math.max(barHeight, 6)}%`,
                      width: '24px',
                      top: '50%'
                    }}
                  />
                  
                  {/* Value label below bar */}
                  <div className="absolute text-xs font-medium text-gray-700 text-center" style={{ top: `${50 + barHeight + 5}%` }}>
                    <span className="px-0.5 py-0.5 bg-white/80 rounded text-xs">
                      {formatValue(value, item)}
                    </span>
                  </div>
                </>
              )}
              
              {/* Month label at bottom */}
              <div className="absolute bottom-0 text-xs text-gray-600 font-medium transform -rotate-45 origin-center">
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
    // Use the actual projected data from your JSON - correct EBITDA, Online Revenue, Total Revenue, and EBITDA %
    const actualProjections = [
      // Jan 2025 - Dec 2025 data from your correct dataset
      { month: 'Jan 2025', onlineRevenue: 9601, ebitda: -72166, totalRevenue: 498564, ebitdaPercent: -14.5 },
      { month: 'Feb 2025', onlineRevenue: 9223, ebitda: 24171, totalRevenue: 434270, ebitdaPercent: 5.6 },
      { month: 'Mar 2025', onlineRevenue: 17758, ebitda: -12846, totalRevenue: 506910, ebitdaPercent: -2.5 },
      { month: 'Apr 2025', onlineRevenue: 21124, ebitda: -114130, totalRevenue: 436126, ebitdaPercent: -26.2 },
      { month: 'May 2025', onlineRevenue: 30437, ebitda: 83227, totalRevenue: 704153, ebitdaPercent: 11.8 },
      { month: 'Jun 2025', onlineRevenue: 38350, ebitda: 107145, totalRevenue: 699403, ebitdaPercent: 15.3 },
      { month: 'Jul 2025', onlineRevenue: 49855, ebitda: 108856, totalRevenue: 730845, ebitdaPercent: 14.9 },
      { month: 'Aug 2025', onlineRevenue: 64812, ebitda: 134408, totalRevenue: 745801, ebitdaPercent: 18.0 },
      { month: 'Sep 2025', onlineRevenue: 84255, ebitda: 137134, totalRevenue: 705245, ebitdaPercent: 19.4 },
      { month: 'Oct 2025', onlineRevenue: 109531, ebitda: 158895, totalRevenue: 662970, ebitdaPercent: 24.0 },
      { month: 'Nov 2025', onlineRevenue: 142391, ebitda: 141022, totalRevenue: 628277, ebitdaPercent: 22.4 },
      { month: 'Dec 2025', onlineRevenue: 185108, ebitda: 131817, totalRevenue: 603443, ebitdaPercent: 21.8 }
    ];

    // Cost reduction schedule (same as before)
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

    let cumulativeSavings = 0;
    const projections: ProjectionData[] = [];

    actualProjections.forEach((projection, index) => {
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

      projections.push({
        month: projection.month,
        monthIndex,
        projectedEBITDA: Math.round(projection.ebitda / 1000), // Convert to thousands
        ebitdaPercentage: projection.ebitdaPercent, // EBITDA percentage
        cumulativeCostSavings: Math.round(cumulativeSavings / 1000), // Convert to thousands
        projectedOnlineSales: Math.round(projection.onlineRevenue / 1000), // Online revenue in thousands
        totalRevenue: Math.round(projection.totalRevenue / 1000), // Convert to thousands
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
          
          {/* 2x2 Chart Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Top Row */}
            <ProjectionChart
              title="Projected EBITDA"
              subtitle="(thousand USD)"
              data={projectionData}
              dataKey="projectedEBITDA"
              color="blue"
            />
            
            <ProjectionChart
              title="Total Revenue"
              subtitle="(thousand USD)"
              data={projectionData}
              dataKey="totalRevenue"
              color="orange"
            />
            
            {/* Bottom Row */}
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
              showGrowth={false}
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
