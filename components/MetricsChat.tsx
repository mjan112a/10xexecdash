import { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { FileSpreadsheet, Image } from 'lucide-react';
import { Message } from '@/types/metrics';
import { MetricValue } from '@/types/metrics';
import MetricsVisualization from './MetricsVisualization';
import { 
  parseResponseForVisualization, 
  exportAsCSV as exportToCSV,
  VisualizationData
} from '@/utils/metrics-visualization';
import html2canvas from 'html2canvas';

export default function MetricsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState('');
  const [metricsData, setMetricsData] = useState<MetricValue[]>([]);
  const [dateColumns, setDateColumns] = useState<string[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  const loadingMessages = useMemo(() => [
    "Analyzing metrics data...",
    "Processing your request...",
    "Identifying relevant metrics...",
    "Preparing visualization...",
    "Generating insights..."
  ], []);

  // Fetch metrics data on component mount
  useEffect(() => {
    async function fetchMetricsData() {
      try {
        const response = await fetch('/api/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch metrics data');
        }
        
        const data = await response.json();
        setDateColumns(data.dateColumns || []);
        setMetricsData(data.flatData || []);
      } catch (error) {
        console.error('Error fetching metrics data:', error);
      }
    }
    
    fetchMetricsData();
  }, []);

  useEffect(() => {
    let messageIndex = 0;
    let interval: NodeJS.Timeout;

    if (isLoading) {
      setCurrentLoadingMessage(loadingMessages[0]); // Set initial message
      interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setCurrentLoadingMessage(loadingMessages[messageIndex]);
      }, 2000); // Change message every 2 seconds
    }

    return () => clearInterval(interval);
  }, [isLoading, loadingMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    const userMessage = input;
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      console.log('Sending metrics chat request:', {
        messageLength: userMessage.length,
        timestamp: new Date().toISOString()
      });

      const startTime = Date.now();
      const res = await fetch('/api/metrics-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      // Log response time
      console.log(`API Response Time: ${Date.now() - startTime}ms`);

      if (!res.ok) {
        // Try to get error details from response
        const errorData = await res.json().catch(() => ({}));
        console.error('API Error:', {
          status: res.status,
          statusText: res.statusText,
          errorData
        });
        throw new Error(errorData.message || `API error (${res.status}): ${res.statusText}`);
      }
      
      // Log raw response for debugging
      const rawResponse = await res.clone().text();
      console.log('Raw API Response:', rawResponse);
      
      const data = await res.json();
      
      if (!data.response) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }
      
      // Parse the response for visualization data
      let visualizationData: VisualizationData | null = null;
      
      if (metricsData.length > 0 && dateColumns.length > 0) {
        visualizationData = parseResponseForVisualization(
          data.response,
          metricsData,
          dateColumns
        );
        
        console.log('Visualization data:', visualizationData);
      }
      
      // Add the assistant message with visualization if available
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        citations: data.citations,
        visualization: visualizationData ? {
          type: visualizationData.chartType,
          data: visualizationData,
          title: visualizationData.title,
          xAxisLabel: visualizationData.xAxisLabel,
          yAxisLabel: visualizationData.yAxisLabel
        } : undefined
      }]);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Chat Error:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      
      // Provide more detailed error information
      const errorMessage = err.message || 'Sorry, there was an error processing your request.';
      const detailedError = `Error: ${errorMessage}\n\nIf this error persists, please try simplifying your request or asking about a different metric.`;
      
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: detailedError
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to export data as CSV
  const exportAsCSV = (data: any[]) => {
    if (!data || data.length === 0) {
      alert('No data available to export');
      return;
    }
    
    const csvContent = exportToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `metrics_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to export as image
  const exportAsImage = (chartRef: React.RefObject<HTMLDivElement>) => {
    if (!chartRef.current) {
      alert('No chart available to export');
      return;
    }
    
    html2canvas(chartRef.current).then(canvas => {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `metrics_chart_${new Date().toISOString().slice(0, 10)}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="h-[600px] overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === 'user' 
                ? 'bg-primary/10 ml-auto max-w-[80%]' 
                : message.role === 'error'
                ? 'bg-destructive/10 mr-auto max-w-[80%]'
                : 'bg-muted mr-auto max-w-[80%]'
            }`}
          >
            <p className="text-sm font-medium mb-1">
              {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Metrics Assistant' : 'Error'}
            </p>
            <div>
              <p className="text-foreground/90 whitespace-pre-wrap">{message.content}</p>
              
              {/* Render visualization if available */}
              {message.visualization && (
                <div className="mt-4 border rounded-lg p-4 bg-white">
                  <div ref={chartRef}>
                    <MetricsVisualization data={message.visualization.data} />
                  </div>
                  <div className="mt-4 flex space-x-4">
                    <button
                      onClick={() => exportAsCSV(message.visualization?.data.data || [])}
                      className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      Export as CSV
                    </button>
                    <button
                      onClick={() => exportAsImage(chartRef)}
                      className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      <Image className="h-4 w-4 mr-1" />
                      Export as Image
                    </button>
                  </div>
                </div>
              )}
              
              {message.citations && message.citations.length > 0 && (
                <div className="mt-4 text-sm text-muted-foreground border-t pt-2">
                  <p className="font-medium">References:</p>
                  <ol className="list-decimal pl-4 mt-1">
                    {message.citations.map((citation, i) => (
                      <li key={i} className="mb-1">
                        <a 
                          href={citation} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {citation}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="bg-muted rounded-lg p-4 mr-auto max-w-[80%]">
            <p className="text-sm font-medium mb-1">Metrics Assistant</p>
            <div className="flex items-center space-x-2">
              <p className="text-foreground/90 transition-opacity duration-300">{currentLoadingMessage}</p>
              <div className="flex space-x-1">
                <span className="animate-bounce [animation-delay:-0.3s]">•</span>
                <span className="animate-bounce [animation-delay:-0.15s]">•</span>
                <span className="animate-bounce">•</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t p-4 bg-card">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about metrics or request a visualization..."
            disabled={isLoading}
            className="flex-1"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </Card>
  );
}
