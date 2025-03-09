'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Scenario, 
  MetricAdjustment 
} from '../metrics-relationships/relationship-engine';
import { 
  PREDEFINED_SCENARIOS, 
  getScenarioOptions 
} from '../metrics-relationships/scenarios';

interface ScenarioControlsProps {
  onLoadScenario: (scenario: Scenario) => void;
  onSaveScenario: (name: string, description?: string) => void;
  onResetScenario: () => void;
  currentAdjustments: Record<string, MetricAdjustment[]>;
  hasChanges: boolean;
}

export default function ScenarioControls({
  onLoadScenario,
  onSaveScenario,
  onResetScenario,
  currentAdjustments,
  hasChanges
}: ScenarioControlsProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  
  // Get all available scenarios
  const scenarioOptions = getScenarioOptions();
  
  // Handle save scenario
  const handleSaveScenario = () => {
    if (scenarioName.trim()) {
      onSaveScenario(scenarioName, scenarioDescription);
      setSaveDialogOpen(false);
      setScenarioName('');
      setScenarioDescription('');
    }
  };
  
  // Handle load scenario
  const handleLoadScenario = () => {
    if (selectedScenarioId) {
      const scenario = PREDEFINED_SCENARIOS.find(s => s.id === selectedScenarioId);
      if (scenario) {
        onLoadScenario(scenario);
        setLoadDialogOpen(false);
        setSelectedScenarioId('');
      }
    }
  };
  
  // Count the number of adjustments
  const countAdjustments = () => {
    let count = 0;
    Object.values(currentAdjustments).forEach(monthAdjustments => {
      count += monthAdjustments.length;
    });
    return count;
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Scenario Controls</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Active Adjustments:</span>
            <span className="font-medium">{countAdjustments()}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Months Modified:</span>
            <span className="font-medium">{Object.keys(currentAdjustments).length}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Has Unsaved Changes:</span>
            <span className={hasChanges ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>
              {hasChanges ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          {/* Load Scenario Dialog */}
          <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">Load</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Load Scenario</DialogTitle>
                <DialogDescription>
                  Select a predefined scenario to load. This will replace your current adjustments.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario">Select Scenario</Label>
                  <Select
                    value={selectedScenarioId}
                    onValueChange={setSelectedScenarioId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarioOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedScenarioId && (
                  <div className="bg-slate-50 p-3 rounded-md text-sm">
                    <p className="font-medium">Description:</p>
                    <p className="text-slate-600">
                      {PREDEFINED_SCENARIOS.find(s => s.id === selectedScenarioId)?.description}
                    </p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleLoadScenario} disabled={!selectedScenarioId}>
                  Load Scenario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Save Scenario Dialog */}
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={!hasChanges}>
                Save
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Scenario</DialogTitle>
                <DialogDescription>
                  Save your current adjustments as a named scenario for future use.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Scenario Name</Label>
                  <Input
                    id="name"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="Enter a name for your scenario"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={scenarioDescription}
                    onChange={(e) => setScenarioDescription(e.target.value)}
                    placeholder="Describe what this scenario represents"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveScenario} disabled={!scenarioName.trim()}>
                  Save Scenario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Reset Button */}
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onResetScenario}
            disabled={!hasChanges}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
