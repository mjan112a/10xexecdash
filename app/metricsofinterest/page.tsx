'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Define types for our data structure
type MetricValue = {
  uid: string;
  metricGroup: string;
  metricCategory: string;
  metricType: string;
  metricName: string;
  unit: string;
  values: string[];
};

type HierarchicalData = {
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

function formatValue(value: string, unit?: string): string {
  // Remove extra quotes and spaces
  value = value.replace(/[""]/g, '').trim();
  
  // Handle empty or undefined values
  if (!value || value === '-') return '';
  
  // Handle currency values
  if (value.includes('$')) {
    // Remove extra spaces around the value
    return value.replace(/\s+/g, '');
  }
  
  // Handle percentages that already include % symbol
  if (value.includes('%')) {
    return value.trim();
  }
  
  // Handle percentage units - convert decimal to percentage
  if (unit === '%' && !isNaN(Number(value))) {
    const numValue = parseFloat(value);
    return (numValue * 100).toFixed(2) + '%';
  }
  
  // Handle numbers
  if (!isNaN(Number(value))) {
    return value;
  }
  
  return value;
}

export default function MetricsOfInterest() {
  const [dateColumns, setDateColumns] = useState<string[]>([]);
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to calculate sum of values for a specific metric path
  const calculateSum = (group: string, category: string, type: string, period: number): number => {
    let sum = 0;
    
    if (!hierarchicalData[group]?.[category]?.[type]) return sum;
    
    Object.values(hierarchicalData[group][category][type]).forEach(metric => {
      const value = parseFloat(metric.values[period]);
      if (!isNaN(value)) {
        sum += value;
      }
    });
    
    return sum;
  };

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
        
        // Initialize all top-level groups as expanded
        const initialExpandedGroups: Record<string, boolean> = {};
        Object.keys(data.hierarchicalData || {}).forEach(group => {
          initialExpandedGroups[group] = true;
        });
        setExpandedGroups(initialExpandedGroups);
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const toggleCategory = (path: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const toggleType = (path: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading metrics data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Metrics of Interest</h1>
      
      <div className="mb-4 bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">About This Data</h2>
        <p className="text-blue-700">
          This page displays business metrics in a hierarchical structure. You can expand or collapse sections to focus on specific metrics.
          The data is organized by Metric Group, Category, Type, and individual Metrics.
        </p>
      </div>
      
      <div className="relative">
        {/* Scroll indicators */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
        
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-gray-100 border-b p-3 text-left">Metric</th>
                <th className="border-b p-3 text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                {dateColumns.map((date, index) => (
                  <th key={index} className="border-b p-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {Object.entries(hierarchicalData).map(([group, categories]) => (
                <React.Fragment key={group}>
                  {/* Group Row */}
                  <tr className="bg-gray-100">
                    <td 
                      className="sticky left-0 z-20 bg-gray-100 p-3 font-bold border-y cursor-pointer"
                      onClick={() => toggleGroup(group)}
                    >
                      <div className="flex items-center">
                        {expandedGroups[group] ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                        {group}
                      </div>
                    </td>
                    <td className="p-3 border-y"></td>
                    {dateColumns.map((_, i) => (
                      <td key={i} className="p-3 border-y"></td>
                    ))}
                  </tr>
                  
                  {expandedGroups[group] && Object.entries(categories).map(([category, types]) => (
                    <React.Fragment key={`${group}-${category}`}>
                      {/* Category Row */}
                      <tr className="bg-gray-50">
                        <td 
                          className="sticky left-0 z-20 bg-gray-50 p-3 pl-8 font-semibold border-b cursor-pointer"
                          onClick={() => toggleCategory(`${group}-${category}`)}
                        >
                          <div className="flex items-center">
                            {expandedCategories[`${group}-${category}`] ? 
                              <ChevronDown className="h-4 w-4 mr-1" /> : 
                              <ChevronRight className="h-4 w-4 mr-1" />}
                            {category}
                          </div>
                        </td>
                        <td className="p-3 border-b"></td>
                        {dateColumns.map((_, i) => (
                          <td key={i} className="p-3 border-b"></td>
                        ))}
                      </tr>
                      
                      {expandedCategories[`${group}-${category}`] && Object.entries(types).map(([type, metrics]) => (
                        <React.Fragment key={`${group}-${category}-${type}`}>
                          {/* Type Row */}
                          <tr>
                            <td 
                              className="sticky left-0 z-20 bg-white p-3 pl-12 font-medium border-b cursor-pointer"
                              onClick={() => toggleType(`${group}-${category}-${type}`)}
                            >
                              <div className="flex items-center">
                                {expandedTypes[`${group}-${category}-${type}`] ? 
                                  <ChevronDown className="h-4 w-4 mr-1" /> : 
                                  <ChevronRight className="h-4 w-4 mr-1" />}
                                {type}
                              </div>
                            </td>
                            <td className="p-3 border-b"></td>
                            {dateColumns.map((_, i) => (
                              <td
                                key={i}
                                className="p-3 border-b text-right font-medium"
                              >
                                {/* Hide rollup summation values */}
                                {''}
                              </td>
                            ))}
                          </tr>
                          
                          {expandedTypes[`${group}-${category}-${type}`] && Object.entries(metrics).map(([name, metric]) => (
                            <tr key={`${group}-${category}-${type}-${name}`} className="hover:bg-gray-50 transition-colors">
                              <td className="sticky left-0 bg-white p-3 pl-16 border-b whitespace-nowrap z-10">
                                {name}
                              </td>
                              <td className="p-3 border-b text-center">
                                {metric.unit}
                              </td>
                              {metric.values.map((value, i) => (
                                <td 
                                  key={i} 
                                  className={`p-3 border-b text-right whitespace-nowrap ${
                                    value.includes('$') ? 'font-mono' : ''
                                  } ${
                                    value.startsWith('(') || value.startsWith('-') ? 'text-red-600' : ''
                                  }`}
                                >
                                  {formatValue(value, metric.unit)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
