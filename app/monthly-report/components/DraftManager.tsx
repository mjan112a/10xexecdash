'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export interface Draft {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

interface DraftManagerProps {
  currentContent: string;
  onLoadDraft: (draft: Draft) => void;
}

export default function DraftManager({ currentContent, onLoadDraft }: DraftManagerProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [draftName, setDraftName] = useState('');
  
  // Load drafts from localStorage on component mount
  useEffect(() => {
    const savedDrafts = localStorage.getItem('monthlyReportDrafts');
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch (error) {
        console.error('Error parsing saved drafts:', error);
      }
    }
  }, []);
  
  // Save drafts to localStorage when they change
  useEffect(() => {
    localStorage.setItem('monthlyReportDrafts', JSON.stringify(drafts));
  }, [drafts]);
  
  const handleSaveDraft = () => {
    if (!draftName.trim()) return;
    
    const newDraft: Draft = {
      id: `draft-${Date.now()}`,
      name: draftName,
      content: currentContent,
      createdAt: new Date().toISOString()
    };
    
    setDrafts(prev => [newDraft, ...prev]);
    setShowSaveDialog(false);
    setDraftName('');
  };
  
  const handleDeleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(draft => draft.id !== id));
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <>
      <Card className="w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">Saved Drafts</h3>
          <Button 
            onClick={() => setShowSaveDialog(true)}
            variant="outline"
          >
            Save Current Draft
          </Button>
        </div>
        
        <div className="p-4">
          {drafts.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No saved drafts yet</p>
          ) : (
            <div className="space-y-2">
              {drafts.map(draft => (
                <div 
                  key={draft.id} 
                  className="border rounded-md p-3 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-medium">{draft.name}</h4>
                    <p className="text-sm text-gray-500">Created: {formatDate(draft.createdAt)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onLoadDraft(draft)}
                    >
                      Load
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Draft</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">Draft Name</label>
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Enter a name for this draft"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDraft} disabled={!draftName.trim()}>
              Save Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
