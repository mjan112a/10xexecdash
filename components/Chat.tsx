import { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  citations?: string[];
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState('');

  const loadingMessages = useMemo(() => [
    "Analyzing data...",
    "Processing information...",
    "Identifying patterns...",
    "Preparing insights...",
    "Compiling analysis..."
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
      console.log('Sending chat request:', {
        messageLength: userMessage.length,
        timestamp: new Date().toISOString()
      });

      const startTime = Date.now();
      const res = await fetch('/api/chat', {
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
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        citations: data.citations 
      }]);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Chat Error:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: err.message || 'Sorry, there was an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
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
              {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Data Assistant' : 'Error'}
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
            <p className="text-sm font-medium mb-1">Data Assistant</p>
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
            placeholder="Ask about your data..."
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
