'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types for our data structure
export type MetricValue = {
  uid: string;
  metricGroup: string;
  metricCategory: string;
  metricType: string;
  metricName: string;
  unit: string;
  values: string[];
};

export type HierarchicalData = {
  [group: string]: {
    [category: string]: {
      [type: string]: {
        [name: string]: {
          uid: string;
          unit: string;
          values: string[];
        };
      };
    };
  };
};

export type FlatMetric = {
  uid: string;
  path: string; // Format: "Group/Category/Type/Name"
  fullPath: {
    group: string;
    category: string;
    type: string;
    name: string;
  };
  unit: string;
  values: string[];
};

export type TimeFrame = 'monthly' | 'quarterly' | 'yearly';
export type ComparisonMode = 'none' | 'yoy'; // year-over-year

export type DateRange = {
  start: number;
  end: number;
};

type MetricsContextType = {
  hierarchicalData: HierarchicalData;
  flatMetrics: FlatMetric[];
  dateColumns: string[];
  selectedMetrics: FlatMetric[];
  selectedChartType: 'line' | 'bar' | 'pie';
  selectedPeriod: number; // Index of the selected period for pie chart
  timeFrame: TimeFrame;
  customDateRange: DateRange;
  comparisonMode: ComparisonMode;
  loading: boolean;
  error: string | null;
  setSelectedMetrics: (metrics: FlatMetric[]) => void;
  toggleMetric: (metric: FlatMetric) => void;
  selectMetricsByGroup: (group: string) => void;
  selectMetricsByCategory: (group: string, category: string) => void;
  selectMetricsByType: (group: string, category: string, type: string) => void;
  clearSelectedMetrics: () => void;
  setSelectedChartType: (type: 'line' | 'bar' | 'pie') => void;
  setSelectedPeriod: (index: number) => void;
  setTimeFrame: (timeFrame: TimeFrame) => void;
  setCustomDateRange: (range: DateRange) => void;
  setComparisonMode: (mode: ComparisonMode) => void;
  getAggregatedData: () => { labels: string[], datasets: any[] };
};

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

export function MetricsProvider({ children }: { children: ReactNode }) {
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({});
  const [flatMetrics, setFlatMetrics] = useState<FlatMetric[]>([]);
  const [dateColumns, setDateColumns] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<FlatMetric[]>([]);
  const [selectedChartType, setSelectedChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0); // Default to first period
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('monthly');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ start: 0, end: 11 }); // Default to full year
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch metrics data');
        }
        
        const data = await response.json();
        setDateColumns(data.dateColumns || []);
        setHierarchicalData(data.hierarchicalData || {});
        
        // Create flat metrics array for easier selection
        const flat: FlatMetric[] = [];
        
        if (data.hierarchicalData) {
          Object.entries(data.hierarchicalData as HierarchicalData).forEach(([group, categories]) => {
            Object.entries(categories).forEach(([category, types]) => {
              Object.entries(types).forEach(([type, metrics]) => {
                Object.entries(metrics).forEach(([name, metric]) => {
                  flat.push({
                    uid: metric.uid,
                    path: `${group}/${category}/${type}/${name}`,
                    fullPath: {
                      group,
                      category,
                      type,
                      name
                    },
                    unit: metric.unit,
                    values: metric.values
                  });
                });
              });
            });
          });
        }
        
        setFlatMetrics(flat);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const toggleMetric = (metric: FlatMetric) => {
    setSelectedMetrics(prev => {
      const exists = prev.some(m => m.uid === metric.uid);
      if (exists) {
        return prev.filter(m => m.uid !== metric.uid);
      } else {
        return [...prev, metric];
      }
    });
  };

  const selectMetricsByGroup = (group: string) => {
    const groupMetrics = flatMetrics.filter(m => m.fullPath.group === group);
    setSelectedMetrics(groupMetrics);
  };

  const selectMetricsByCategory = (group: string, category: string) => {
    const categoryMetrics = flatMetrics.filter(
      m => m.fullPath.group === group && m.fullPath.category === category
    );
    setSelectedMetrics(categoryMetrics);
  };

  const selectMetricsByType = (group: string, category: string, type: string) => {
    const typeMetrics = flatMetrics.filter(
      m => m.fullPath.group === group && 
          m.fullPath.category === category && 
          m.fullPath.type === type
    );
    setSelectedMetrics(typeMetrics);
  };

  const clearSelectedMetrics = () => {
    setSelectedMetrics([]);
  };

  // Function to aggregate data based on timeFrame
  const getAggregatedData = () => {
    if (selectedMetrics.length === 0) {
      return { labels: [], datasets: [] };
    }

    let labels: string[] = [];
    let aggregatedDatasets: any[] = [];

    // Handle different time frames
    if (timeFrame === 'monthly') {
      // For monthly, use the original data within the custom date range
      labels = dateColumns.slice(customDateRange.start, customDateRange.end + 1);
      
      aggregatedDatasets = selectedMetrics.map((metric, index) => {
        const values = metric.values
          .slice(customDateRange.start, customDateRange.end + 1)
          .map(v => parseFloat(v.replace(/[^\d.-]/g, '')));
        
        return {
          label: metric.fullPath.name,
          data: values,
          borderColor: `hsl(${index * 30}, 70%, 50%)`,
          backgroundColor: `hsla(${index * 30}, 70%, 50%, 0.2)`,
        };
      });
    } else if (timeFrame === 'quarterly') {
      // Group months into quarters
      const quarters: { [key: string]: number[] }[] = [];
      
      // Initialize quarters for each metric
      selectedMetrics.forEach(() => {
        quarters.push({
          'Q1': [],
          'Q2': [],
          'Q3': [],
          'Q4': []
        });
      });
      
      // Group data into quarters
      for (let i = customDateRange.start; i <= customDateRange.end; i++) {
        const monthIndex = i % 12;
        const quarter = Math.floor(monthIndex / 3) + 1;
        const quarterKey = `Q${quarter}`;
        
        selectedMetrics.forEach((metric, metricIndex) => {
          const value = parseFloat(metric.values[i].replace(/[^\d.-]/g, ''));
          quarters[metricIndex][quarterKey].push(value);
        });
      }
      
      // Create labels for quarters
      labels = Object.keys(quarters[0]);
      
      // Calculate average for each quarter
      aggregatedDatasets = selectedMetrics.map((metric, index) => {
        const quarterData = Object.values(quarters[index]).map(values => {
          if (values.length === 0) return 0;
          return values.reduce((sum, val) => sum + val, 0) / values.length;
        });
        
        return {
          label: metric.fullPath.name,
          data: quarterData,
          borderColor: `hsl(${index * 30}, 70%, 50%)`,
          backgroundColor: `hsla(${index * 30}, 70%, 50%, 0.2)`,
        };
      });
    } else if (timeFrame === 'yearly') {
      // Group all months into a single year average
      labels = ['Yearly Average'];
      
      aggregatedDatasets = selectedMetrics.map((metric, index) => {
        const values = metric.values
          .slice(customDateRange.start, customDateRange.end + 1)
          .map(v => parseFloat(v.replace(/[^\d.-]/g, '')));
        
        const yearlyAverage = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        return {
          label: metric.fullPath.name,
          data: [yearlyAverage],
          borderColor: `hsl(${index * 30}, 70%, 50%)`,
          backgroundColor: `hsla(${index * 30}, 70%, 50%, 0.2)`,
        };
      });
    }

    // Add year-over-year comparison if enabled
    if (comparisonMode === 'yoy' && timeFrame !== 'yearly') {
      // Implementation for YoY comparison would go here
      // This would involve comparing current period with same period last year
    }

    return { labels, datasets: aggregatedDatasets };
  };

  const value = {
    hierarchicalData,
    flatMetrics,
    dateColumns,
    selectedMetrics,
    selectedChartType,
    selectedPeriod,
    timeFrame,
    customDateRange,
    comparisonMode,
    loading,
    error,
    setSelectedMetrics,
    toggleMetric,
    selectMetricsByGroup,
    selectMetricsByCategory,
    selectMetricsByType,
    clearSelectedMetrics,
    setSelectedChartType,
    setSelectedPeriod,
    setTimeFrame,
    setCustomDateRange,
    setComparisonMode,
    getAggregatedData
  };

  return (
    <MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics() {
  const context = useContext(MetricsContext);
  if (context === undefined) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  return context;
}
