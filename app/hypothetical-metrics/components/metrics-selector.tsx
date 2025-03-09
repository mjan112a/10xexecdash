'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { METRIC_CATEGORIES } from '../metrics-relationships/base-metrics';
import { ALL_METRICS } from '../metrics-relationships/derived-metrics';

interface MetricsSelectorProps {
  selectedMetrics: string[];
  onSelectMetrics: (metrics: string[]) => void;
}

export default function MetricsSelector({
  selectedMetrics,
  onSelectMetrics
}: MetricsSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter metrics based on search term
  const filteredMetrics = searchTerm.trim() === ''
    ? ALL_METRICS
    : ALL_METRICS.filter(metric => 
        metric.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
  // Toggle a single metric
  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      onSelectMetrics(selectedMetrics.filter(m => m !== metric));
    } else {
      onSelectMetrics([...selectedMetrics, metric]);
    }
  };
  
  // Select all metrics in a category
  const selectCategory = (category: string) => {
    const categoryMetrics = METRIC_CATEGORIES[category as keyof typeof METRIC_CATEGORIES];
    const newSelectedMetrics = [...selectedMetrics];
    
    categoryMetrics.forEach(metric => {
      if (!newSelectedMetrics.includes(metric)) {
        newSelectedMetrics.push(metric);
      }
    });
    
    onSelectMetrics(newSelectedMetrics);
  };
  
  // Clear all selected metrics
  const clearSelection = () => {
    onSelectMetrics([]);
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Select Metrics to Visualize</h3>
      
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search metrics..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.keys(METRIC_CATEGORIES).map(category => (
          <Button
            key={category}
            variant="outline"
            size="sm"
            onClick={() => selectCategory(category)}
            className="text-xs"
          >
            {category}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={clearSelection}
          className="text-xs"
        >
          Clear All
        </Button>
      </div>
      
      <div className="max-h-[300px] overflow-y-auto border rounded-md p-2">
        {searchTerm.trim() !== '' && filteredMetrics.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No metrics found matching "{searchTerm}"</p>
        ) : (
          <div className="space-y-1">
            {Object.entries(METRIC_CATEGORIES).map(([category, metrics]) => {
              // Filter metrics in this category based on search term
              const categoryMetrics = searchTerm.trim() === ''
                ? metrics
                : metrics.filter(metric => 
                    metric.toLowerCase().includes(searchTerm.toLowerCase())
                  );
              
              // Skip category if no metrics match search
              if (categoryMetrics.length === 0) {
                return null;
              }
              
              return (
                <div key={category} className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {categoryMetrics.map(metric => (
                      <div key={metric} className="flex items-center space-x-2">
                        <Checkbox
                          id={`metric-${metric}`}
                          checked={selectedMetrics.includes(metric)}
                          onCheckedChange={() => toggleMetric(metric)}
                        />
                        <Label
                          htmlFor={`metric-${metric}`}
                          className="text-sm cursor-pointer"
                        >
                          {metric}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        {selectedMetrics.length} of {ALL_METRICS.length} metrics selected
      </div>
    </div>
  );
}
