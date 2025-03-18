'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ReportSection as ReportSectionType, SECTION_NAMES } from '@/types/report';
import HighlightEntryForm from './HighlightEntryForm';
import GraphManager from './GraphManager';
import { useReport } from '../report-context';

interface ReportSectionProps {
  section: ReportSectionType;
  showGraphs?: boolean;
}

export default function ReportSection({ section, showGraphs = true }: ReportSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Determine if this section has data and highlights subsections
  const hasSubsections = section !== 'llm_context' && section !== 'ceo_message' && section !== 'financial_statements';
  
  return (
    <Card className="mb-8 overflow-hidden">
      <div 
        className="p-4 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-semibold">{SECTION_NAMES[section]}</h2>
        <Button variant="ghost" size="sm">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          {hasSubsections ? (
            <>
              <HighlightEntryForm section={section} dataKey="discussion_data" />
              <HighlightEntryForm section={section} dataKey="discussion_highlights" />
              {showGraphs && <GraphManager section={section} />}
            </>
          ) : (
            <HighlightEntryForm section={section} />
          )}
        </div>
      )}
    </Card>
  );
}
