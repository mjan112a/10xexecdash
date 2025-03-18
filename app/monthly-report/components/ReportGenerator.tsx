'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReport } from '../report-context';
import { FileText, Download, RefreshCw, FileCode, File, Printer, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LlmProvider } from '@/types/report';
import { MonthlyReportPDF } from '../pdf-template';
import { pdf } from '@react-pdf/renderer';
import PDFPreview from './PDFPreview';
import { Progress } from '@/components/ui/progress';
import FinancialOverviewTable from './FinancialOverviewTable';

export default function ReportGenerator() {
  const { 
    currentReport, 
    generateReport, 
    generateReportDirect, 
    generateFieldContent, 
    isLoading, 
    error, 
    graphs, 
    template,
    updateLlmProvider 
  } = useReport();
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [graphImages, setGraphImages] = useState<{[key: string]: string}>({});
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  
  // Load graph images from localStorage when component mounts
  useEffect(() => {
    if (currentReport && graphs.length > 0) {
      const images: {[key: string]: string} = {};
      graphs.forEach(graph => {
        if (graph.image_url) {
          images[graph.id] = graph.image_url;
        }
      });
      setGraphImages(images);
    }
  }, [currentReport, graphs]);
  
  // Define the fields to generate in order
  const fieldsToGenerate = [
    { id: 'llm_context', name: 'LLM Context', useGeneric: template.use_generic_llm },
    { id: 'ceo_message', name: 'CEO Message', useGeneric: template.use_generic_ceo },
    { id: 'business_performance_data', name: 'Business Performance Data', useGeneric: template.business_performance.use_generic },
    { id: 'business_performance_highlights', name: 'Business Performance Highlights', useGeneric: template.business_performance.use_generic },
    { id: 'sales_data', name: 'Sales Data', useGeneric: template.sales.use_generic },
    { id: 'sales_highlights', name: 'Sales Highlights', useGeneric: template.sales.use_generic },
    { id: 'marketing_data', name: 'Marketing Data', useGeneric: template.marketing.use_generic },
    { id: 'marketing_highlights', name: 'Marketing Highlights', useGeneric: template.marketing.use_generic },
    { id: 'cost_reduction_data', name: 'Cost Reduction Data', useGeneric: template.cost_reduction.use_generic },
    { id: 'cost_reduction_highlights', name: 'Cost Reduction Highlights', useGeneric: template.cost_reduction.use_generic },
    { id: 'operations_data', name: 'Operations Data', useGeneric: template.operations.use_generic },
    { id: 'operations_highlights', name: 'Operations Highlights', useGeneric: template.operations.use_generic },
    { id: 'financial_statements', name: 'Financial Statements', useGeneric: template.use_generic_financial }
  ];
  
  // Handle generating the report using the standard approach
  const handleGenerateReport = async () => {
    if (!currentReport) return;
    
    try {
      setIsGenerating(true);
      setProgress(0);
      
      // Filter out fields that are using generic content
      const fieldsToProcess = fieldsToGenerate.filter(field => !field.useGeneric);
      
      if (fieldsToProcess.length === 0) {
        // If all fields are using generic content, just generate the report
        const content = await generateReport();
        setGeneratedContent(content);
        setActiveTab('wysiwyg');
        return;
      }
      
      // Process each field sequentially
      for (let i = 0; i < fieldsToProcess.length; i++) {
        const field = fieldsToProcess[i];
        setCurrentField(field.id);
        setProgressText(`Generating ${field.name}... (${i + 1}/${fieldsToProcess.length})`);
        setProgress(Math.round(((i) / fieldsToProcess.length) * 100));
        
        // Generate content for this field
        const fieldContent = await generateFieldContent(field.id);
        
        // Update the appropriate section in the template
        if (field.id === 'llm_context') {
          template.llm_context = fieldContent;
        } else if (field.id === 'ceo_message') {
          template.ceo_message = fieldContent;
        } else if (field.id === 'business_performance_data') {
          template.business_performance.discussion_data = fieldContent;
        } else if (field.id === 'business_performance_highlights') {
          template.business_performance.discussion_highlights = fieldContent;
        } else if (field.id === 'sales_data') {
          template.sales.discussion_data = fieldContent;
        } else if (field.id === 'sales_highlights') {
          template.sales.discussion_highlights = fieldContent;
        } else if (field.id === 'marketing_data') {
          template.marketing.discussion_data = fieldContent;
        } else if (field.id === 'marketing_highlights') {
          template.marketing.discussion_highlights = fieldContent;
        } else if (field.id === 'cost_reduction_data') {
          template.cost_reduction.discussion_data = fieldContent;
        } else if (field.id === 'cost_reduction_highlights') {
          template.cost_reduction.discussion_highlights = fieldContent;
        } else if (field.id === 'operations_data') {
          template.operations.discussion_data = fieldContent;
        } else if (field.id === 'operations_highlights') {
          template.operations.discussion_highlights = fieldContent;
        } else if (field.id === 'financial_statements') {
          template.financial_statements = fieldContent;
        }
      }
      
      // Now generate the full report
      setProgressText('Finalizing report...');
      setProgress(95);
      const content = await generateReport();
      setGeneratedContent(content);
      setActiveTab('wysiwyg'); // Change to WYSIWYG tab after generating
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setCurrentField(null);
      setProgressText('');
      setProgress(100);
      setIsGenerating(false);
    }
  };
  
  // Handle generating the report using the direct approach
  const handleGenerateReportDirect = async () => {
    if (!currentReport) return;
    
    try {
      setIsGenerating(true);
      setProgress(0);
      setProgressText('Generating report directly using outline and metrics data...');
      
      // Generate the report using the direct approach
      const content = await generateReportDirect();
      setGeneratedContent(content);
      setActiveTab('wysiwyg'); // Change to WYSIWYG tab after generating
      setProgress(100);
    } catch (err) {
      console.error('Error generating report directly:', err);
    } finally {
      setCurrentField(null);
      setProgressText('');
      setIsGenerating(false);
    }
  };
  
  // Handle exporting the report as PDF
  const handleExportPDF = async () => {
    if (!currentReport || !generatedContent) return;
    
    try {
      setIsGenerating(true);
      
      // Parse the content into sections for the PDF
      const sections = parseContentForPDF(generatedContent);
      
      // Get current month and year from the report date
      const reportDate = new Date(currentReport.report_date);
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const month = monthNames[reportDate.getMonth()];
      const year = reportDate.getFullYear();
      
      // Add graph images to sections
      const sectionsWithGraphs = addGraphsToSections(sections);
      
      const blob = await pdf(
        <MonthlyReportPDF
          month={month}
          year={year}
          sections={sectionsWithGraphs}
        />
      ).toBlob();
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentReport.title.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Add graph images to sections
  const addGraphsToSections = (sections: Record<string, string>) => {
    const sectionsWithGraphs = { ...sections };
    
    // Group graphs by section
    const graphsBySection: Record<string, any[]> = {};
    graphs.forEach(graph => {
      if (!graphsBySection[graph.section]) {
        graphsBySection[graph.section] = [];
      }
      graphsBySection[graph.section].push(graph);
    });
    
    // Add graph references to each section
    Object.keys(graphsBySection).forEach(section => {
      let sectionKey = '';
      
      // Map section to PDF section key
      if (section === 'business_performance') {
        sectionKey = 'keyPerformance';
      } else if (section === 'sales') {
        sectionKey = 'keyPerformance';
      } else if (section === 'marketing' || section === 'cost_reduction' || section === 'operations') {
        sectionKey = 'operationalHighlights';
      } else if (section === 'financial_statements') {
        sectionKey = 'recommendations';
      }
      
      if (sectionKey && sectionsWithGraphs[sectionKey]) {
        // Add graph references at the end of the section
        graphsBySection[section].forEach((graph, index) => {
          if (graph.image_url) {
            sectionsWithGraphs[sectionKey] += `\n\n![Figure ${index + 1}: ${graph.name}](${graph.image_url})\n`;
          }
        });
      }
    });
    
    return sectionsWithGraphs;
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
        
        if (heading.includes('executive') || heading.includes('summary') || heading.includes('ceo message')) {
          currentSection = 'executiveSummary';
          continue;
        } else if (heading.includes('performance') || heading.includes('business') || heading.includes('sales')) {
          currentSection = 'keyPerformance';
          continue;
        } else if (heading.includes('operational') || heading.includes('operations') || heading.includes('marketing') || heading.includes('cost')) {
          currentSection = 'operationalHighlights';
          continue;
        } else if (heading.includes('recommendation') || heading.includes('strategic') || heading.includes('outlook') || heading.includes('financial')) {
          currentSection = 'recommendations';
          continue;
        }
      }
      
      // Add the line to the current section
      sections[currentSection] += line + '\n';
    }
    
    return sections;
  };
  
  // Render a table from markdown-style table content
  const renderTable = (tableContent: string) => {
    const lines = tableContent.trim().split('\n');
    if (lines.length < 3) return null; // Need at least header, separator, and one data row
    
    const headers = lines[0].split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
    
    // Skip the separator line (index 1)
    const rows = lines.slice(2).map(line => 
      line.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim())
    );
    
    return (
      <table className="min-w-full border-collapse border border-gray-300 my-4">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header, i) => (
              <th key={i} className="border border-gray-300 px-4 py-2 text-left">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border border-gray-300 px-4 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
  
  // Render the preview content with proper formatting
  const renderPreviewContent = () => {
    if (!generatedContent) return null;
    
    const elements: JSX.Element[] = [];
    const lines = generatedContent.split('\n');
    let tableLines: string[] = [];
    let inTable = false;
    let inFinancialSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're entering the financial statements section
      if (line.startsWith('# ') || line.startsWith('## ')) {
        const heading = line.replace(/^#+ /, '').toLowerCase();
        if (heading.includes('financial') && heading.includes('statement')) {
          inFinancialSection = true;
          elements.push(<h2 key={i} className="text-xl font-bold mt-5 mb-3">{line.substring(line.startsWith('# ') ? 2 : 3)}</h2>);
          continue;
        } else {
          inFinancialSection = false;
        }
      }
      
      // Skip regular content rendering for the financial section
      if (inFinancialSection) {
        // Still render headings within the financial section
        if (line.startsWith('### ')) {
          elements.push(<h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.substring(4)}</h3>);
        }
        continue;
      }
      
      // Check if this is a table row
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        if (!inTable) inTable = true;
        tableLines.push(line);
        
        // If the next line doesn't start with |, render the table
        if (!lines[i + 1] || !lines[i + 1].trim().startsWith('|')) {
          elements.push(
            <div key={`table-${i}`} className="my-4">
              {renderTable(tableLines.join('\n'))}
            </div>
          );
          tableLines = [];
          inTable = false;
        }
        continue;
      }
      
      // If we were in a table but this line is not a table row, render the table
      if (inTable) {
        elements.push(
          <div key={`table-${i}`} className="my-4">
            {renderTable(tableLines.join('\n'))}
          </div>
        );
        tableLines = [];
        inTable = false;
      }
      
      // Check if the paragraph is a heading
      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.substring(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-xl font-bold mt-5 mb-3">{line.substring(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.substring(4)}</h3>);
      } else if (line.startsWith('- ')) {
        elements.push(<li key={i} className="ml-6 mb-1">{line.substring(2)}</li>);
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-4"></div>);
      } else {
        elements.push(<p key={i} className="mb-4">{line}</p>);
      }
    }
    
    return elements;
  };
  
  return (
    <Card className="mb-6">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Report Generation</h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateReport}
              disabled={isLoading || isGenerating || !currentReport}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateReportDirect}
              disabled={isLoading || isGenerating || !currentReport}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate Direct'}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExportPDF}
              disabled={isLoading || isGenerating || !generatedContent || !currentReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
        
        <div className="mt-4 flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="use-anthropic" 
              checked={template.llm_provider === 'anthropic'}
              onCheckedChange={(checked) => {
                if (checked) updateLlmProvider('anthropic');
              }}
            />
            <Label htmlFor="use-anthropic">Use Anthropic (Claude)</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="use-perplexity" 
              checked={template.llm_provider === 'perplexity'}
              onCheckedChange={(checked) => {
                if (checked) updateLlmProvider('perplexity');
              }}
            />
            <Label htmlFor="use-perplexity">Use Perplexity</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="use-openai" 
              checked={template.llm_provider === 'openai'}
              onCheckedChange={(checked) => {
                if (checked) updateLlmProvider('openai');
              }}
            />
            <Label htmlFor="use-openai">Use OpenAI (GPT-4o)</Label>
          </div>
        </div>
        
        {isGenerating && (
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-sm">{progressText}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {error && (
          <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">
              <FileText className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="wysiwyg">
              <File className="h-4 w-4 mr-2" />
              WYSIWYG
            </TabsTrigger>
            <TabsTrigger value="raw">
              <FileCode className="h-4 w-4 mr-2" />
              Raw Markdown
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="preview" className="p-4">
          {generatedContent ? (
            <div className="prose max-w-none">
              {renderPreviewContent()}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No report generated yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Fill in the report sections and click "Generate Report"
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="wysiwyg" className="p-4">
          {generatedContent ? (
            <div>
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="print:hidden"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
              </div>
              <div className="overflow-auto">
              {(() => {
                // Parse the content into sections for the PDF
                const sections = parseContentForPDF(generatedContent);
                
                // Get current month and year from the report date
                const reportDate = currentReport ? new Date(currentReport.report_date) : new Date();
                const monthNames = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
                ];
                const month = monthNames[reportDate.getMonth()];
                const year = reportDate.getFullYear();
                
                // Add graph images to sections
                const sectionsWithGraphs = addGraphsToSections(sections);
                
                return (
                  <PDFPreview
                    month={month}
                    year={year}
                    sections={sectionsWithGraphs}
                  />
                );
              })()}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <File className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No report generated yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Fill in the report sections and click "Generate Report"
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="raw" className="p-4">
          {generatedContent ? (
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-sm font-mono">{generatedContent}</pre>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileCode className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No report generated yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Fill in the report sections and click "Generate Report"
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
