'use client';

import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BASE_METRICS } from './metrics-relationships/base-metrics';
import { 
  MonthData, 
  MetricAdjustment, 
  applyAdjustments, 
  Scenario, 
  createScenario 
} from './metrics-relationships/relationship-engine';
import { PREDEFINED_SCENARIOS } from './metrics-relationships/scenarios';
import MetricSlider from './components/metric-slider';
import TimeSeriesChart from './components/time-series-chart';
import MetricsSelector from './components/metrics-selector';
import ScenarioControls from './components/scenario-controls';
import PDFDocument from './pdf-document';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Function to parse numeric values from CSV data
function parseValue(value: string): number {
  // Remove quotes, spaces, and currency symbols
  const cleanValue = value.replace(/[""$,\s]/g, '');
  // Remove parentheses and make negative
  if (cleanValue.startsWith('(') && cleanValue.endsWith(')')) {
    return -Number(cleanValue.slice(1, -1));
  }
  return Number(cleanValue);
}

export default function HypotheticalMetrics() {
  const [originalData, setOriginalData] = useState<MonthData[]>([]);
  const [adjustedData, setAdjustedData] = useState<MonthData[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, MetricAdjustment[]>>({});
  const [adjustmentTypes, setAdjustmentTypes] = useState<Record<string, 'percentage' | 'absolute'>>({});
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [selectedBaseMetric, setSelectedBaseMetric] = useState<string>(BASE_METRICS[0]);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts (for PDF rendering)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch metrics data
  useEffect(() => {
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Process the raw data into a more usable format
        const processedData = months.map((month, monthIndex) => {
          const monthData: MonthData = { month };
          
          data.rows.forEach((row: string[]) => {
            const metricName = row[0];
            if (metricName && !metricName.includes('2024') && !metricName.includes('2025')) {
              monthData[metricName] = parseValue(row[monthIndex + 1]);
            }
          });
          
          return monthData;
        });
        
        setOriginalData(processedData);
        setAdjustedData(processedData);
        
        // Initialize adjustment types for all base metrics
        const initialAdjustmentTypes: Record<string, 'percentage' | 'absolute'> = {};
        BASE_METRICS.forEach(metric => {
          initialAdjustmentTypes[metric] = 'percentage';
        });
        setAdjustmentTypes(initialAdjustmentTypes);
        
        // Select some default metrics for visualization
        setSelectedMetrics(['Total COGS', 'Total Expenses', 'Average GM', 'Average OM']);
      });
  }, []);

  // Apply adjustments when they change
  useEffect(() => {
    if (originalData.length === 0) return;
    
    const newAdjustedData = applyAdjustments(originalData, adjustments);
    setAdjustedData(newAdjustedData);
    
    // Check if there are any changes from the original data
    setHasChanges(Object.keys(adjustments).length > 0);
  }, [originalData, adjustments]);

  // Handle metric value change
  const handleMetricChange = (month: string, metric: string, value: number | undefined, type: 'percentage' | 'absolute') => {
    setAdjustments(prev => {
      const newAdjustments = { ...prev };
      
      if (!newAdjustments[month]) {
        newAdjustments[month] = [];
      }
      
      // Find existing adjustment for this metric
      const existingIndex = newAdjustments[month].findIndex(adj => adj.metric === metric);
      
      if (value === undefined) {
        // Remove adjustment if value is undefined (reset to original)
        if (existingIndex !== -1) {
          newAdjustments[month] = newAdjustments[month].filter(adj => adj.metric !== metric);
          
          // Remove empty month arrays
          if (newAdjustments[month].length === 0) {
            delete newAdjustments[month];
          }
        }
      } else {
        // Add or update adjustment
        const adjustment: MetricAdjustment = {
          metric,
          type,
          value
        };
        
        if (existingIndex !== -1) {
          newAdjustments[month][existingIndex] = adjustment;
        } else {
          newAdjustments[month].push(adjustment);
        }
      }
      
      return newAdjustments;
    });
  };

  // Handle adjustment type change
  const handleAdjustmentTypeChange = (metric: string, type: 'percentage' | 'absolute') => {
    setAdjustmentTypes(prev => ({
      ...prev,
      [metric]: type
    }));
  };

  // Load a scenario
  const handleLoadScenario = (scenario: Scenario) => {
    setAdjustments(scenario.adjustments);
    setActiveScenario(scenario);
  };

  // Save current adjustments as a scenario
  const handleSaveScenario = (name: string, description?: string) => {
    const scenario = createScenario(name, adjustments, description);
    setActiveScenario(scenario);
    
    // In a real app, we would save this to a database or local storage
    alert(`Scenario "${name}" saved successfully!`);
  };

  // Reset all adjustments
  const handleResetScenario = () => {
    setAdjustments({});
    setActiveScenario(null);
  };

  // Get the original value for a metric in a month
  const getOriginalValue = (month: string, metric: string): number => {
    const monthData = originalData.find(m => m.month === month);
    return monthData ? (monthData[metric] as number) || 0 : 0;
  };

  // Get the adjusted value for a metric in a month
  const getAdjustedValue = (month: string, metric: string): number => {
    const monthData = adjustedData.find(m => m.month === month);
    return monthData ? (monthData[metric] as number) || 0 : 0;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Hypothetical Scenario Analysis</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-medium text-blue-800 mb-2">About This Tool</h2>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              This tool allows you to create hypothetical financial scenarios by modifying key metrics
              and seeing how they affect derived metrics across time periods.
            </p>
            <ul className="list-disc list-inside">
              <li>Adjust base metrics using sliders</li>
              <li>See how changes affect derived metrics like margins and unit costs</li>
              <li>Compare hypothetical scenarios side-by-side with actual data</li>
              <li>Export your analysis as a PDF for sharing</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <Tabs defaultValue="metrics">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="metrics" className="flex-1">Metrics</TabsTrigger>
              <TabsTrigger value="scenarios" className="flex-1">Scenarios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="metrics" className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Adjust Base Metrics</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Metric:
                  </label>
                  <select
                    value={selectedBaseMetric}
                    onChange={(e) => setSelectedBaseMetric(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {BASE_METRICS.map(metric => (
                      <option key={metric} value={metric}>
                        {metric}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-6 max-h-96 overflow-y-auto p-2">
                  {originalData.map(month => (
                    <div key={month.month} className="border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                      <h4 className="font-medium mb-2">{month.month}</h4>
                      <MetricSlider
                        metric={selectedBaseMetric}
                        originalValue={getOriginalValue(month.month, selectedBaseMetric)}
                        value={getAdjustedValue(month.month, selectedBaseMetric)}
                        onChange={(value, type) => handleMetricChange(month.month, selectedBaseMetric, value, type)}
                        adjustmentType={adjustmentTypes[selectedBaseMetric] || 'percentage'}
                        onAdjustmentTypeChange={(type) => handleAdjustmentTypeChange(selectedBaseMetric, type)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="scenarios">
              <ScenarioControls
                onLoadScenario={handleLoadScenario}
                onSaveScenario={handleSaveScenario}
                onResetScenario={handleResetScenario}
                currentAdjustments={adjustments}
                hasChanges={hasChanges}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <TimeSeriesChart
            originalData={originalData}
            adjustedData={adjustedData}
            selectedMetrics={selectedMetrics}
            chartType={chartType}
            showComparison={true}
          />
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Chart Controls</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Chart Type:</span>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as 'line' | 'bar' | 'area')}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="line">Line</option>
                    <option value="bar">Bar</option>
                    <option value="area">Area</option>
                  </select>
                </div>
                
                {isClient && (
                  <PDFDownloadLink
                    document={
                      <PDFDocument
                        originalData={originalData}
                        hypotheticalData={adjustedData}
                        selectedMetrics={selectedMetrics}
                        selectedMonth="Jan" // Default to January for PDF
                      />
                    }
                    fileName={`hypothetical-metrics-${new Date().toISOString().slice(0, 10)}.pdf`}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {({ loading }) => (loading ? 'Preparing PDF...' : 'Export as PDF')}
                  </PDFDownloadLink>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MetricsSelector
        selectedMetrics={selectedMetrics}
        onSelectMetrics={setSelectedMetrics}
      />
    </div>
  );
}
