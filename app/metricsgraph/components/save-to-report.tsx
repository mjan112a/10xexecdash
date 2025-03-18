'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ReportSection, SECTION_NAMES } from '@/types/report';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SaveToReportProps {
  onSave: (section: ReportSection, name: string, description: string) => void;
  disabled?: boolean;
}

export default function SaveToReport({ onSave, disabled = false }: SaveToReportProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [section, setSection] = useState<ReportSection>('business_performance');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();
  
  const handleSave = () => {
    onSave(section, name, description);
    setShowDialog(false);
    setName('');
    setDescription('');
  };
  
  const handleGoToReports = () => {
    router.push('/monthly-report');
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        disabled={disabled}
        className="flex items-center"
      >
        <Save className="h-4 w-4 mr-2" />
        Save to Monthly Report
      </Button>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Graph to Monthly Report</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-section">Report Section</Label>
              <Select
                value={section}
                onValueChange={(value) => setSection(value as ReportSection)}
              >
                <SelectTrigger id="report-section">
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_performance">{SECTION_NAMES.business_performance}</SelectItem>
                  <SelectItem value="sales">{SECTION_NAMES.sales}</SelectItem>
                  <SelectItem value="marketing">{SECTION_NAMES.marketing}</SelectItem>
                  <SelectItem value="cost_reduction">{SECTION_NAMES.cost_reduction}</SelectItem>
                  <SelectItem value="operations">{SECTION_NAMES.operations}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="graph-name">Graph Name</Label>
              <Input
                id="graph-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name for this graph"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="graph-description">Description (Optional)</Label>
              <Textarea
                id="graph-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline"
              onClick={handleGoToReports}
            >
              Go to Reports
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!name.trim()}
            >
              Save Graph
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
