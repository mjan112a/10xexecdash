'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import MetricsChat from '@/components/MetricsChat';

export default function DynamicMetricsChat() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">AI Metrics Assistant</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-medium text-blue-800 mb-2">About This Tool</h2>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              This AI-powered assistant helps you analyze business metrics through natural language.
              Simply ask questions about your data or request specific visualizations.
            </p>
            <ul className="list-disc list-inside">
              <li>Ask for specific metrics or trends</li>
              <li>Request visualizations of data</li>
              <li>Compare different metrics</li>
              <li>Get insights about business performance</li>
            </ul>
            <p className="mt-2 italic">
              Example: "Show me revenue trends for the last 6 months" or "What was our highest revenue month?"
            </p>
          </div>
        </div>
      </div>

      <MetricsChat />
    </div>
  );
}
