'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReportSection, ReportGraph, SECTION_NAMES } from '@/types/report';
import { useReport } from '../report-context';
import { PlusCircle, X, Image, LineChart, BarChart, PieChart } from 'lucide-react';
import Link from 'next/link';

interface GraphManagerProps {
  section: ReportSection;
}

export default function GraphManager({ section }: GraphManagerProps) {
  const { template, saveGraph, removeGraph, isLoading, currentReport } = useReport();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [graphName, setGraphName] = useState('');
  const [graphDescription, setGraphDescription] = useState('');
  
  // Get graphs for this section
  const graphs = section === 'llm_context' || section === 'ceo_message' || section === 'financial_statements'
    ? []
    : template[section].graphs;
  
  // Handle adding a graph
  const handleAddGraph = () => {
    setShowAddDialog(true);
  };
  
  // Handle saving a graph
  const handleSaveGraph = () => {
    // This is just a placeholder - in a real implementation, we would capture the actual graph configuration
    const dummyConfig = {
      metrics: [],
      timeFrame: 'month',
      chartType: 'line'
    };
    
    saveGraph(section, graphName, dummyConfig, graphDescription);
    setShowAddDialog(false);
    setGraphName('');
    setGraphDescription('');
  };
  
  // Handle removing a graph
  const handleRemoveGraph = (id: string) => {
    removeGraph(id);
  };
  
  return (
    <Card className="p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{SECTION_NAMES[section]} - Graphs</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddGraph}
          disabled={isLoading || !currentReport}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Graph
        </Button>
      </div>
      
      {graphs.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-md">
          <LineChart className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No graphs added yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Add graphs from the metrics page or create new ones
          </p>
          <div className="mt-4">
            <Link href="/metricsgraph" target="_blank">
              <Button variant="outline" size="sm">
                Go to Metrics Page
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {graphs.map((graph: ReportGraph) => (
            <Card key={graph.id} className="p-3 border">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{graph.name}</h4>
                  {graph.description && (
                    <p className="text-sm text-gray-500 mt-1">{graph.description}</p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveGraph(graph.id)}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-3 h-32 bg-gray-100 rounded flex items-center justify-center">
                {graph.image_url ? (
                  <img 
                    src={graph.image_url} 
                    alt={graph.name} 
                    className="max-h-full max-w-full object-contain" 
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    {graph.config.chartType === 'bar' ? (
                      <BarChart className="h-8 w-8 mx-auto mb-1" />
                    ) : graph.config.chartType === 'pie' ? (
                      <PieChart className="h-8 w-8 mx-auto mb-1" />
                    ) : (
                      <LineChart className="h-8 w-8 mx-auto mb-1" />
                    )}
                    <span className="text-xs">Graph preview not available</span>
                  </div>
                )}
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                <p>Chart Type: {graph.config.chartType}</p>
                <p>Time Frame: {graph.config.timeFrame}</p>
                <p>Metrics: {graph.config.metrics.length}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add Graph Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Graph to {SECTION_NAMES[section]}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="graph-name">Graph Name</Label>
              <Input
                id="graph-name"
                value={graphName}
                onChange={(e) => setGraphName(e.target.value)}
                placeholder="Enter a name for this graph"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="graph-description">Description (Optional)</Label>
              <Input
                id="graph-description"
                value={graphDescription}
                onChange={(e) => setGraphDescription(e.target.value)}
                placeholder="Enter a description"
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
              <p className="font-medium mb-1">How to add graphs:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to the Metrics Trend Analysis page</li>
                <li>Select the metrics you want to include</li>
                <li>Configure the chart type and time period</li>
                <li>Use the "Export as Image" option</li>
                <li>Return here and add the graph with a name and description</li>
              </ol>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveGraph}
              disabled={!graphName.trim()}
            >
              Add Graph
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
