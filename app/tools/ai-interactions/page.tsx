'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronRight, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIInteraction {
  id: string;
  provider: string;
  model: string;
  endpoint: string;
  requestPrompt: string;
  response: string;
  requestData: any;
  responseData: any;
  tokens: number | null;
  duration: number | null;
  status: string;
  errorMessage: string | null;
  ipAddress: string | null;
  interaction: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExpandedSections {
  [key: string]: {
    request: boolean;
    response: boolean;
    raw: boolean;
  };
}

export default function AIInteractionsPage() {
  const [interactions, setInteractions] = useState<AIInteraction[]>([]);
  const [selectedInteraction, setSelectedInteraction] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({});

  // Get unique interaction types
  const interactionTypes = Array.from(new Set(interactions.map(i => i.interaction).filter(Boolean)));

  useEffect(() => {
    fetchInteractions();
  }, [selectedInteraction]);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/ai-interactions', window.location.origin);
      if (selectedInteraction && selectedInteraction !== 'all') {
        url.searchParams.append('interaction', selectedInteraction);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch interactions');
      }

      const data = await response.json();
      setInteractions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) return 'N/A';
    return `${duration}ms`;
  };

  const formatTokens = (tokens: number | null) => {
    if (!tokens) return 'N/A';
    return tokens.toLocaleString();
  };

  const toggleSection = (id: string, section: 'request' | 'response' | 'raw') => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [section]: !prev[id]?.[section],
      },
    }));
  };

  const formatJSON = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const renderExpandableContent = (interaction: AIInteraction) => {
    const isExpanded = expandedSections[interaction.id] || {
      request: false,
      response: false,
      raw: false,
    };

    return (
      <div className="space-y-4 mt-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-between"
            onClick={() => toggleSection(interaction.id, 'request')}
          >
            <span className="flex items-center">
              {isExpanded.request ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Request Details
            </span>
          </Button>
          {isExpanded.request && (
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">Prompt:</div>
              <div className="text-sm whitespace-pre-wrap font-mono bg-white p-2 rounded border">
                {interaction.requestPrompt}
              </div>
              <div className="font-medium mt-4 mb-2">Data:</div>
              <div className="text-sm whitespace-pre-wrap font-mono bg-white p-2 rounded border overflow-auto max-h-96">
                {formatJSON(interaction.requestData)}
              </div>
            </div>
          )}
        </div>

        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-between"
            onClick={() => toggleSection(interaction.id, 'response')}
          >
            <span className="flex items-center">
              {isExpanded.response ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Response Details
            </span>
          </Button>
          {isExpanded.response && (
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">Response:</div>
              <div className="text-sm whitespace-pre-wrap font-mono bg-white p-2 rounded border overflow-auto max-h-96">
                {interaction.response}
              </div>
              <div className="font-medium mt-4 mb-2">Data:</div>
              <div className="text-sm whitespace-pre-wrap font-mono bg-white p-2 rounded border overflow-auto max-h-96">
                {formatJSON(interaction.responseData)}
              </div>
            </div>
          )}
        </div>

        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-between"
            onClick={() => toggleSection(interaction.id, 'raw')}
          >
            <span className="flex items-center">
              <Code className="h-4 w-4 mr-2" />
              Raw Data
            </span>
          </Button>
          {isExpanded.raw && (
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm whitespace-pre-wrap font-mono bg-white p-2 rounded border overflow-auto max-h-96">
                {formatJSON(interaction)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">AI Interactions</h1>
        <div className="flex items-center gap-4 mb-6">
          <Select
            value={selectedInteraction}
            onValueChange={setSelectedInteraction}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by interaction type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Interactions</SelectItem>
              {interactionTypes.map((type) => (
                <SelectItem key={type} value={type || 'none'}>
                  {type || 'None'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Interaction</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Tokens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interactions.map((interaction) => (
                  <React.Fragment key={interaction.id}>
                    <TableRow>
                      <TableCell>{formatDate(interaction.createdAt)}</TableCell>
                      <TableCell>{interaction.interaction || 'N/A'}</TableCell>
                      <TableCell>{interaction.provider}</TableCell>
                      <TableCell>{interaction.model}</TableCell>
                      <TableCell>{interaction.endpoint}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          interaction.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {interaction.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDuration(interaction.duration)}</TableCell>
                      <TableCell>{formatTokens(interaction.tokens)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={8} className="p-0">
                        {renderExpandableContent(interaction)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
} 