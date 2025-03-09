'use client';

import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  citations?: string[];
}

interface ReportChatProps {
  onReportGenerated: (reportContent: string) => void;
}

export interface ReportChatRef {
  resetChat: () => void;
}

const ReportChat = forwardRef<ReportChatRef, ReportChatProps>(({ onReportGenerated }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState('');
  const [useTextarea, setUseTextarea] = useState(false);

  // Expose the resetChat method to the parent component
  useImperativeHandle(ref, () => ({
    resetChat: () => {
      setMessages([
        {
          role: 'assistant',
          content: 'Welcome to the Monthly Report Generator! Please provide bullet points for your report sections. You can use the template button below for guidance on the expected format.'
        }
      ]);
      setInput('');
    }
  }));

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'Welcome to the Monthly Report Generator! Please provide bullet points for your report sections. You can use the template button below for guidance on the expected format.'
      }
    ]);
  }, []);

  const loadingMessages = useMemo(() => [
    "Analyzing your bullet points...",
    "Structuring report content...",
    "Applying company voice and style...",
    "Generating comprehensive report...",
    "Finalizing report formatting..."
  ], []);

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
      console.log('Sending report generation request:', {
        messageLength: userMessage.length,
        timestamp: new Date().toISOString()
      });

      const startTime = Date.now();
      const res = await fetch('/api/monthly-report', {
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
      
      const assistantMessage = { 
        role: 'assistant' as const, 
        content: data.response,
        citations: data.citations 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Pass the generated report to the parent component
      onReportGenerated(data.response);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Report Generation Error:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: err.message || 'Sorry, there was an error generating your report.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const insertTemplate = () => {
    const template = `# Monthly Report Bullet Points

## Executive Summary
- [Key achievement 1]
- [Major challenge faced]
- [Overall business performance summary]

## Sales Performance
- [Key accounts update]
- [New account acquisition]
- [Direct vs distributor sales]
- [Sales pipeline status]

## Operations
- [Production output]
- [Plant performance]
- [Safety incidents]
- [Supply chain status]

## Strategic Initiatives
- [Progress on key projects]
- [Regulatory updates]
- [R&D developments]

## Outlook
- [Short-term forecast]
- [Anticipated challenges]
- [Strategic priorities]`;

    setInput(template);
    setUseTextarea(true);
  };

  return (
    <Card className="w-full">
      <div className="h-[500px] overflow-y-auto p-6 space-y-4">
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
              {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Report Assistant' : 'Error'}
            </p>
            <div>
              <p className="text-foreground/90 whitespace-pre-wrap">{message.content}</p>
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
            <p className="text-sm font-medium mb-1">Report Assistant</p>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={insertTemplate}
              className="text-sm"
            >
              Insert Template
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setUseTextarea(!useTextarea)}
              className="text-xs"
            >
              {useTextarea ? 'Switch to Single Line' : 'Switch to Multi-line'}
            </Button>
          </div>
          
          {useTextarea ? (
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your bullet points here..."
              disabled={isLoading}
              className="min-h-[150px]"
            />
          ) : (
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your bullet points or type a message..."
              disabled={isLoading}
              className="flex-1"
            />
          )}
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </form>
      </div>
    </Card>
  );
});

ReportChat.displayName = 'ReportChat';

export default ReportChat;
