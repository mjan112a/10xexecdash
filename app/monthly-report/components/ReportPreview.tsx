'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ReportPreviewProps {
  reportContent: string;
  onApprove: (content: string) => void;
  onRegenerate: () => void;
}

export default function ReportPreview({ 
  reportContent, 
  onApprove, 
  onRegenerate 
}: ReportPreviewProps) {
  const [editedContent, setEditedContent] = useState(reportContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Update edited content when reportContent changes
  useEffect(() => {
    setEditedContent(reportContent);
    setIsDirty(false);
  }, [reportContent]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    setIsDirty(true);
  };

  const handleApprove = () => {
    onApprove(editedContent);
  };

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleRevert = () => {
    setEditedContent(reportContent);
    setIsDirty(false);
  };

  return (
    <Card className="w-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-medium">Report Preview</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleToggleEdit}
          >
            {isEditing ? 'View' : 'Edit'}
          </Button>
          {isDirty && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRevert}
            >
              Revert Changes
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRegenerate}
          >
            Regenerate
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleApprove}
          >
            Approve
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={handleContentChange}
            className="min-h-[500px] font-mono text-sm"
          />
        ) : (
          <div className="prose max-w-none">
            {editedContent.split('\n').map((paragraph, index) => {
              // Check if the paragraph is a heading
              if (paragraph.startsWith('# ')) {
                return <h1 key={index} className="text-2xl font-bold mt-6 mb-4">{paragraph.substring(2)}</h1>;
              } else if (paragraph.startsWith('## ')) {
                return <h2 key={index} className="text-xl font-bold mt-5 mb-3">{paragraph.substring(3)}</h2>;
              } else if (paragraph.startsWith('### ')) {
                return <h3 key={index} className="text-lg font-bold mt-4 mb-2">{paragraph.substring(4)}</h3>;
              } else if (paragraph.startsWith('- ')) {
                return <li key={index} className="ml-6 mb-1">{paragraph.substring(2)}</li>;
              } else if (paragraph.trim() === '') {
                return <div key={index} className="h-4"></div>;
              } else {
                return <p key={index} className="mb-4">{paragraph}</p>;
              }
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
