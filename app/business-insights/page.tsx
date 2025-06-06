'use client';

import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertCircle, MessageSquare, RefreshCw, Calendar, BarChart3, DollarSign, Target, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface InsightResponse {
  analysis: string;
  type: string;
  timestamp: string;
  dataPoints: number;
  timeRange: string;
}

interface MetricData {
  uid: string;
  metricGroup: string;
  metricCategory: string;
  metricType: string;
  metricName: string;
  unit: string;
  values: string[];
}

interface QuickMetric {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

export default function BusinessInsights() {
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [activeTab, setActiveTab] = useState('monthly');
  const [quickMetrics, setQuickMetrics] = useState<QuickMetric[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Fetch and calculate quick metrics
  useEffect(() => {
    fetchQuickMetrics();
  }, []);

  // Auto-load monthly analysis on component mount
  useEffect(() => {
    generateInsights('monthly_analysis');
  }, []);

  const fetchQuickMetrics = async () => {
    try {
      setMetricsLoading(true);
      const response = await fetch('/api/metrics');
      const data = await response.json();
      
      if (data.flatData && data.dateColumns) {
        const calculatedMetrics = calculateQuickMetrics(data.flatData, data.dateColumns);
        setQuickMetrics(calculatedMetrics);
      }
    } catch (err) {
      console.error('Error fetching quick metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const calculateQuickMetrics = (metricsData: MetricData[], dateColumns: string[]): QuickMetric[] => {
    const parseValue = (value: string): number => {
      const cleaned = value.replace(/[""$,\s]/g, '');
      if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
        return -Number(cleaned.slice(1, -1));
      }
      return Number(cleaned) || 0;
    };

    // Get latest month and previous month for comparison
    const latestIndex = dateColumns.length - 1;
    const previousIndex = latestIndex - 1;

    // Find key metrics
    const revenueMetric = metricsData.find(m => m.metricName.includes('Total Revenue'));
    const marginMetric = metricsData.find(m => m.metricName.includes('Average GM'));
    const efficiencyMetric = metricsData.find(m => m.metricName.includes('Yield'));
    const orderMetric = metricsData.find(m => m.metricName.includes('Total Orders'));

    const metrics: QuickMetric[] = [];

    if (revenueMetric && revenueMetric.values[latestIndex]) {
      const currentRevenue = parseValue(revenueMetric.values[latestIndex]);
      const previousRevenue = parseValue(revenueMetric.values[previousIndex] || '0');
      const change = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;
      
      metrics.push({
        name: 'Total Revenue',
        value: `$${(currentRevenue / 1000).toFixed(0)}K`,
        change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        icon: DollarSign
      });
    }

    if (marginMetric && marginMetric.values[latestIndex]) {
      const currentMargin = parseValue(marginMetric.values[latestIndex]);
      const previousMargin = parseValue(marginMetric.values[previousIndex] || '0');
      const change = currentMargin - previousMargin;
      
      metrics.push({
        name: 'Gross Margin',
        value: `${(currentMargin * 100).toFixed(1)}%`,
        change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}pp`,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        icon: Target
      });
    }

    if (efficiencyMetric && efficiencyMetric.values[latestIndex]) {
      const currentEfficiency = parseValue(efficiencyMetric.values[latestIndex]);
      const previousEfficiency = parseValue(efficiencyMetric.values[previousIndex] || '0');
      const change = currentEfficiency - previousEfficiency;
      
      metrics.push({
        name: 'Operational Efficiency',
        value: `${(currentEfficiency * 100).toFixed(1)}%`,
        change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}pp`,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        icon: Zap
      });
    }

    if (orderMetric && orderMetric.values[latestIndex]) {
      const currentOrders = parseValue(orderMetric.values[latestIndex]);
      const previousOrders = parseValue(orderMetric.values[previousIndex] || '0');
      const change = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders * 100) : 0;
      
      metrics.push({
        name: 'Total Orders',
        value: currentOrders.toLocaleString(),
        change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        icon: BarChart3
      });
    }

    return metrics;
  };

  const generateInsights = async (type: string, customQuestion?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          question: customQuestion,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = () => {
    if (question.trim()) {
      generateInsights('ask_data', question);
      setActiveTab('ask');
    }
  };

  const formatAnalysis = (text: string) => {
    // Split by numbered sections and format nicely
    const sections = text.split(/(?=\d+\.\s)/);
    return sections.map((section, index) => {
      if (!section.trim()) return null;
      
      const lines = section.split('\n').filter(line => line.trim());
      const title = lines[0];
      const content = lines.slice(1);
      
      return (
        <div key={index} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
          <div className="space-y-2">
            {content.map((line, i) => (
              <p key={i} className="text-gray-700 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center">
          <Brain className="h-8 w-8 mr-3 text-blue-600" />
          Business Intelligence Insights
        </h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-medium text-blue-800 mb-2">AI-Powered Business Analysis</h2>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              Get instant, AI-powered insights from your business metrics. Claude analyzes your data to identify trends, 
              anomalies, and opportunities for optimization.
            </p>
            <ul className="list-disc list-inside">
              <li>Monthly performance analysis with key highlights and concerns</li>
              <li>Trend analysis across revenue, costs, and operational metrics</li>
              <li>Automated anomaly detection for unusual patterns</li>
              <li>Natural language queries - ask questions about your data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Key Performance Indicators</h2>
        {metricsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickMetrics.map((metric, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <metric.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className={`flex items-center text-sm font-medium ${
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.trend === 'up' && <ArrowUp className="h-3 w-3 mr-1" />}
                    {metric.trend === 'down' && <ArrowDown className="h-3 w-3 mr-1" />}
                    {metric.change}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          onClick={() => generateInsights('monthly_analysis')}
          disabled={loading}
          className="flex items-center"
          variant={activeTab === 'monthly' ? 'default' : 'outline'}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Monthly Analysis
        </Button>
        <Button
          onClick={() => generateInsights('trend_analysis')}
          disabled={loading}
          className="flex items-center"
          variant={activeTab === 'trends' ? 'default' : 'outline'}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Trend Analysis
        </Button>
        <Button
          onClick={() => generateInsights('anomaly_detection')}
          disabled={loading}
          className="flex items-center"
          variant={activeTab === 'anomalies' ? 'default' : 'outline'}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Anomaly Detection
        </Button>
      </div>

      {/* Ask a Question Section */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Ask Your Data
        </h3>
        <div className="flex gap-3">
          <Textarea
            placeholder="Ask a question about your business metrics... (e.g., 'Why did our margins improve in Q1 2025?' or 'What's driving the increase in online sales?')"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1"
            rows={3}
          />
          <Button 
            onClick={handleAskQuestion}
            disabled={loading || !question.trim()}
            className="self-start"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Ask'}
          </Button>
        </div>
      </Card>

      {/* Results Section */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Analysis Results
          </h3>
          {insights && (
            <div className="text-sm text-gray-500">
              <p>Analysis Type: {insights.type.replace('_', ' ').toUpperCase()}</p>
              <p>Data Range: {insights.timeRange}</p>
              <p>Generated: {new Date(insights.timestamp).toLocaleString()}</p>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Analyzing your business data...</p>
              <p className="text-sm text-gray-500 mt-2">This may take 10-30 seconds</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h4 className="text-red-800 font-medium">Analysis Error</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {insights && !loading && (
          <div className="prose max-w-none">
            <div className="bg-gray-50 rounded-lg p-6">
              {formatAnalysis(insights.analysis)}
            </div>
          </div>
        )}

        {!insights && !loading && !error && (
          <div className="text-center py-12 text-gray-500">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Select an analysis type above to get started with AI-powered insights.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
