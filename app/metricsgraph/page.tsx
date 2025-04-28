'use client';

import React from 'react';
import './print.css';
import { MetricsProvider } from './metrics-context';
import MetricsSelector from './components/metrics-selector';
import TimePeriodSelector from './components/time-period-selector';
import ExportOptions from './components/export-options';
import GraphDisplay from './components/graph-display';
import FavoritesManager from './components/favorites-manager';
import SavedChartsDisplay from './components/saved-charts-display';
import ClientPDFGenerator from './components/client-pdf-generator';

export default function MetricsGraph() {
  return (
    <MetricsProvider>
      <div className="p-6 print:shadow-none print:bg-white">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">Metrics Trend Analysis</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-medium text-blue-800 mb-2">About This Tool</h2>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                This interactive visualization allows you to analyze and compare different business metrics over time.
                The data is organized hierarchically by group, category, type, and individual metrics.
              </p>
              <ul className="list-disc list-inside">
                <li>Use the search box to quickly find specific metrics</li>
                <li>Select entire groups or categories with a single click</li>
                <li>Choose between line, bar, and pie charts</li>
                <li>Analyze data by month, quarter, or year</li>
                <li>Compare metrics across different time periods</li>
                <li>Hover over data points to see detailed values</li>
                <li><strong>NEW:</strong> Save your favorite metric selections for quick access</li>
                <li><strong>NEW:</strong> Freeze charts to create a multi-chart dashboard</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:shadow-none">
          <div className="lg:col-span-1">
            <FavoritesManager />
            <MetricsSelector />
            <TimePeriodSelector />
          </div>
          <div className="lg:col-span-2 print:shadow-none">
            <ClientPDFGenerator />
            <ExportOptions />
            <GraphDisplay />
            <SavedChartsDisplay />
          </div>
        </div>
      </div>
    </MetricsProvider>
  );
}
