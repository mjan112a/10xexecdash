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
  path: string;
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
export type ComparisonMode = 'none' | 'yoy';

export type DateRange = {
  start: number;
  end: number;
};

export type ChartConfig = {
  id: string;
  selectedMetrics: FlatMetric[];
  chartType: 'line' | 'bar' | 'pie';
  timeFrame: TimeFrame;
  customDateRange: DateRange;
  comparisonMode: ComparisonMode;
  title?: string;
};

export type FavoriteSelection = {
  id: string;
  name: string;
  metricIds: string[]; // UIDs of selected metrics
};

type MetricsContextType = {
  hierarchicalData: HierarchicalData;
  flatMetrics: FlatMetric[];
  dateColumns: string[];
  selectedMetrics: FlatMetric[];
  selectedChartType: 'line' | 'bar' | 'pie';
  selectedPeriod: number;
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
  showAllData: boolean;
  // Function to toggle between showing all data and showing only the latest 12 months
  toggleDataRange: () => void;
  
  // Saved charts functionality
  savedCharts: ChartConfig[];
  freezeCurrentChart: (title?: string) => void;
  removeSavedChart: (chartId: string) => void;
  
  // Favorites functionality
  favorites: FavoriteSelection[];
  saveAsFavorite: (name: string) => void;
  loadFavorite: (favoriteId: string) => void;
  deleteFavorite: (favoriteId: string) => void;
};

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

export function MetricsProvider({ children }: { children: ReactNode }) {
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({});
  const [flatMetrics, setFlatMetrics] = useState<FlatMetric[]>([]);
  const [dateColumns, setDateColumns] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<FlatMetric[]>([]);
  const [selectedChartType, setSelectedChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('monthly');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ start: 0, end: 11 });
  const [showAllData, setShowAllData] = useState<boolean>(false);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for saved charts
  const [savedCharts, setSavedCharts] = useState<ChartConfig[]>([]);
  
  // State for favorites
  const [favorites, setFavorites] = useState<FavoriteSelection[]>([]);

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

        if (data.dateColumns && data.dateColumns.length > 0) {
          const lastIndex = data.dateColumns.length - 1;
          const startIndex = Math.max(0, lastIndex - 11);
          setCustomDateRange({ start: startIndex, end: lastIndex });
        }

        const flat: FlatMetric[] = [];
        if (data.hierarchicalData) {
          Object.entries(data.hierarchicalData as HierarchicalData).forEach(([group, categories]) => {
            Object.entries(categories).forEach(([category, types]) => {
              Object.entries(types).forEach(([type, metrics]) => {
                Object.entries(metrics).forEach(([name, metric]) => {
                  flat.push({
                    uid: metric.uid,
                    path: `${group}/${category}/${type}/${name}`,
                    fullPath: { group, category, type, name },
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
  
  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('metricsFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to parse saved favorites', e);
      }
    }
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem('metricsFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleMetric = (metric: FlatMetric) => {
    setSelectedMetrics(prev => {
      const exists = prev.some(m => m.uid === metric.uid);
      return exists ? prev.filter(m => m.uid !== metric.uid) : [...prev, metric];
    });
  };

  const selectMetricsByGroup = (group: string) => {
    setSelectedMetrics(flatMetrics.filter(m => m.fullPath.group === group));
  };

  const selectMetricsByCategory = (group: string, category: string) => {
    setSelectedMetrics(flatMetrics.filter(m => m.fullPath.group === group && m.fullPath.category === category));
  };

  const selectMetricsByType = (group: string, category: string, type: string) => {
    setSelectedMetrics(flatMetrics.filter(m => m.fullPath.group === group && m.fullPath.category === category && m.fullPath.type === type));
  };

  const clearSelectedMetrics = () => {
    setSelectedMetrics([]);
  };

  const getAggregatedData = () => {
    if (selectedMetrics.length === 0) return { labels: [], datasets: [] };

    // Exclude pre-summed totals to avoid double counting
    const filteredMetrics = selectedMetrics.filter(metric => 
      !metric.fullPath.name.includes('Unit Total Revenue') &&
      !metric.fullPath.name.includes('Unit Total Expenses') &&
      !metric.fullPath.name.includes('Unit Total COGS')
    );

    let labels: string[] = [];
    let datasets: any[] = [];

    if (timeFrame === 'monthly') {
      labels = dateColumns.slice(customDateRange.start, customDateRange.end + 1);
      datasets = filteredMetrics.map((metric, index) => ({
        label: metric.fullPath.name,
        data: metric.values.slice(customDateRange.start, customDateRange.end + 1).map(v => parseFloat(v.replace(/[^\d.-]/g, ''))),
        borderColor: `hsl(${index * 30}, 70%, 50%)`,
        backgroundColor: `hsla(${index * 30}, 70%, 50%, 0.2)`
      }));
    }

    return { labels, datasets };
  };

  const toggleDataRange = () => {
    if (showAllData) {
      const lastIndex = dateColumns.length - 1;
      const startIndex = Math.max(0, lastIndex - 11);
      setCustomDateRange({ start: startIndex, end: lastIndex });
    } else {
      setCustomDateRange({ start: 0, end: dateColumns.length - 1 });
    }
    setShowAllData(!showAllData);
  };
  
  // Function to save current chart configuration
  const freezeCurrentChart = (title?: string) => {
    if (selectedMetrics.length === 0) return;
    
    setSavedCharts(prev => [
      ...prev,
      {
        id: `chart-${Date.now()}`,
        selectedMetrics: [...selectedMetrics],
        chartType: selectedChartType,
        timeFrame: timeFrame,
        customDateRange: {...customDateRange},
        comparisonMode: comparisonMode,
        title: title || `Chart ${prev.length + 1}`
      }
    ]);
  };
  
  // Function to remove a saved chart
  const removeSavedChart = (chartId: string) => {
    setSavedCharts(prev => prev.filter(chart => chart.id !== chartId));
  };
  
  // Function to save current selection as a favorite
  const saveAsFavorite = (name: string) => {
    if (selectedMetrics.length === 0 || !name.trim()) return;
    
    const newFavorite = {
      id: `fav-${Date.now()}`,
      name: name.trim(),
      metricIds: selectedMetrics.map(m => m.uid)
    };
    
    setFavorites(prev => [...prev, newFavorite]);
  };
  
  // Function to load a favorite
  const loadFavorite = (favoriteId: string) => {
    const favorite = favorites.find(f => f.id === favoriteId);
    if (!favorite) return;
    
    const metricsToSelect = flatMetrics.filter(m =>
      favorite.metricIds.includes(m.uid)
    );
    
    setSelectedMetrics(metricsToSelect);
  };
  
  // Function to delete a favorite
  const deleteFavorite = (favoriteId: string) => {
    setFavorites(prev => prev.filter(f => f.id !== favoriteId));
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
    getAggregatedData,
    showAllData,
    toggleDataRange,
    
    // Saved charts functionality
    savedCharts,
    freezeCurrentChart,
    removeSavedChart,
    
    // Favorites functionality
    favorites,
    saveAsFavorite,
    loadFavorite,
    deleteFavorite
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
