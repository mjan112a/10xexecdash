'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useMetrics, FlatMetric } from '../metrics-context';

export default function MetricsSelector() {
  const {
    hierarchicalData,
    flatMetrics,
    selectedMetrics,
    toggleMetric,
    selectMetricsByGroup,
    selectMetricsByCategory,
    selectMetricsByType,
    clearSelectedMetrics
  } = useMetrics();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Toggle expansion state for a group
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  // Toggle expansion state for a category
  const toggleCategory = (path: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Toggle expansion state for a type
  const toggleType = (path: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Check if a metric is selected
  const isMetricSelected = (metric: FlatMetric) => {
    return selectedMetrics.some(m => m.uid === metric.uid);
  };

  // Filter metrics based on search term
  const filteredMetrics = searchTerm.trim() === '' 
    ? [] 
    : flatMetrics.filter(metric => 
        metric.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.fullPath.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-700">Select Metrics</h2>
        <div className="flex gap-3">
          <button
            onClick={clearSelectedMetrics}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Search box */}
      <div className="mb-4 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search metrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        
        {searchTerm.trim() !== '' && (
          <div className="mt-2 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
            {filteredMetrics.length === 0 ? (
              <div className="p-3 text-gray-500">No metrics found</div>
            ) : (
              filteredMetrics.map(metric => (
                <div 
                  key={metric.uid}
                  className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleMetric(metric)}
                >
                  <input
                    type="checkbox"
                    checked={isMetricSelected(metric)}
                    onChange={() => {}}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    {metric.fullPath.group} &gt; {metric.fullPath.category} &gt; {metric.fullPath.type} &gt; <span className="font-medium">{metric.fullPath.name}</span>
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick selection buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.keys(hierarchicalData).map(group => (
          <button
            key={group}
            onClick={() => selectMetricsByGroup(group)}
            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            {group}
          </button>
        ))}
      </div>

      {/* Hierarchical selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(hierarchicalData).map(([group, categories]) => (
          <div key={group} className="bg-white p-4 rounded-lg shadow">
            <div 
              className="flex items-center justify-between cursor-pointer mb-2"
              onClick={() => toggleGroup(group)}
            >
              <div className="flex items-center">
                {expandedGroups[group] ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                <h3 className="font-medium text-gray-900">{group}</h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectMetricsByGroup(group);
                }}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
              >
                Select All
              </button>
            </div>
            
            {expandedGroups[group] && (
              <div className="ml-4 space-y-2">
                {Object.entries(categories).map(([category, types]) => (
                  <div key={`${group}-${category}`}>
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleCategory(`${group}-${category}`)}
                    >
                      <div className="flex items-center">
                        {expandedCategories[`${group}-${category}`] ? 
                          <ChevronDown className="h-4 w-4 mr-1" /> : 
                          <ChevronRight className="h-4 w-4 mr-1" />}
                        <span className="text-sm font-medium">{category}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectMetricsByCategory(group, category);
                        }}
                        className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                      >
                        Select
                      </button>
                    </div>
                    
                    {expandedCategories[`${group}-${category}`] && (
                      <div className="ml-4 space-y-1">
                        {Object.entries(types).map(([type, metrics]) => (
                          <div key={`${group}-${category}-${type}`}>
                            <div 
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => toggleType(`${group}-${category}-${type}`)}
                            >
                              <div className="flex items-center">
                                {expandedTypes[`${group}-${category}-${type}`] ? 
                                  <ChevronDown className="h-3 w-3 mr-1" /> : 
                                  <ChevronRight className="h-3 w-3 mr-1" />}
                                <span className="text-xs font-medium">{type}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectMetricsByType(group, category, type);
                                }}
                                className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                              >
                                Select
                              </button>
                            </div>
                            
                            {expandedTypes[`${group}-${category}-${type}`] && (
                              <div className="ml-4 space-y-1 mt-1">
                                {Object.entries(metrics).map(([name, metric]) => {
                                  const flatMetric = flatMetrics.find(
                                    m => m.fullPath.group === group && 
                                        m.fullPath.category === category && 
                                        m.fullPath.type === type && 
                                        m.fullPath.name === name
                                  );
                                  
                                  if (!flatMetric) return null;
                                  
                                  return (
                                    <label 
                                      key={`${group}-${category}-${type}-${name}`}
                                      className="flex items-center space-x-2 p-1 rounded hover:bg-gray-50 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isMetricSelected(flatMetric)}
                                        onChange={() => toggleMetric(flatMetric)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-xs text-gray-700">{name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
