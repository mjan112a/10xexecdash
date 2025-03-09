'use client';

import { Button } from '@/components/ui/button';
import { MonthlyReportPDF } from './pdf-template';
import { pdf } from '@react-pdf/renderer';
import { useState, useRef } from 'react';
import ReportChat, { ReportChatRef } from './components/ReportChat';
import ReportPreview from './components/ReportPreview';
import DraftManager, { Draft } from './components/DraftManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MonthlyReport() {
  const [isExporting, setIsExporting] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [approvedContent, setApprovedContent] = useState('');
  const [activeTab, setActiveTab] = useState('edit');
  const regenerateRef = useRef<ReportChatRef>(null);
  
  // Get current month and year
  const currentDate = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      // Use the approved content if available, otherwise use the current report content
      const contentToExport = approvedContent || reportContent;
      
      // Split the content into sections for the PDF
      const sections = parseContentForPDF(contentToExport);
      
      const blob = await pdf(
        <MonthlyReportPDF 
          month={currentMonth} 
          year={currentYear}
          sections={sections}
        />
      ).toBlob();
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `10X-Monthly-Report-${currentMonth}-${currentYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Parse the content into sections for the PDF
  const parseContentForPDF = (content: string) => {
    // Simple parsing - this could be enhanced for more complex formatting
    const lines = content.split('\n');
    const sections: Record<string, string> = {
      executiveSummary: '',
      keyPerformance: '',
      operationalHighlights: '',
      recommendations: ''
    };
    
    let currentSection = 'executiveSummary';
    
    for (const line of lines) {
      if (line.startsWith('# ') || line.startsWith('## ')) {
        // This is a heading, determine which section it belongs to
        const heading = line.replace(/^#+ /, '').toLowerCase();
        
        if (heading.includes('executive') || heading.includes('summary')) {
          currentSection = 'executiveSummary';
          continue;
        } else if (heading.includes('performance') || heading.includes('kpi') || heading.includes('indicators')) {
          currentSection = 'keyPerformance';
          continue;
        } else if (heading.includes('operational') || heading.includes('operations')) {
          currentSection = 'operationalHighlights';
          continue;
        } else if (heading.includes('recommendation') || heading.includes('strategic') || heading.includes('outlook')) {
          currentSection = 'recommendations';
          continue;
        }
      }
      
      // Add the line to the current section
      sections[currentSection] += line + '\n';
    }
    
    return sections;
  };
  
  // Handle report generation from the chat
  const handleReportGenerated = (content: string) => {
    setReportContent(content);
    setActiveTab('preview');
  };
  
  // Handle report approval
  const handleApproveReport = (content: string) => {
    setApprovedContent(content);
    alert('Report approved! You can now export it as a PDF.');
  };
  
  // Handle report regeneration
  const handleRegenerateReport = () => {
    if (regenerateRef.current) {
      regenerateRef.current.resetChat();
    }
    setActiveTab('edit');
  };
  
  // Handle loading a draft
  const handleLoadDraft = (draft: Draft) => {
    setReportContent(draft.content);
    setActiveTab('preview');
  };

  return (
    <div className="p-6">
      {/* Export Button */}
      <div className="fixed top-4 right-4 z-10">
        <Button
          onClick={handleExportPDF}
          disabled={isExporting || (!approvedContent && !reportContent)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isExporting ? 'Generating PDF...' : 'Export as PDF'}
        </Button>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Monthly Performance Report</h1>
          <p className="text-gray-600">{currentMonth} {currentYear}</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit Report</TabsTrigger>
            <TabsTrigger value="preview">Preview Report</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <ReportChat 
                onReportGenerated={handleReportGenerated} 
                ref={regenerateRef}
              />
              <DraftManager 
                currentContent={reportContent} 
                onLoadDraft={handleLoadDraft} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="preview">
            {reportContent ? (
              <ReportPreview 
                reportContent={reportContent}
                onApprove={handleApproveReport}
                onRegenerate={handleRegenerateReport}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <p className="text-gray-500">
                  No report content yet. Use the Edit Report tab to generate a report.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
