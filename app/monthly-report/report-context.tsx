'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  MonthlyReport, 
  ReportHighlight, 
  ReportGraph, 
  ReportSection,
  EMPTY_TEMPLATE,
  ReportTemplate,
  LlmProvider
} from '@/types/report';
import {
  getLocalReports,
  saveLocalReport,
  getLocalReportById,
  deleteLocalReport,
  saveLocalHighlight,
  getLocalHighlightsByReportId,
  saveLocalGraph,
  getLocalGraphsByReportId,
  deleteLocalGraph,
  getLocalCompleteReportData
} from './local-storage-fallback';

interface ReportContextType {
  // Current report state
  currentReport: MonthlyReport | null;
  highlights: ReportHighlight[];
  graphs: ReportGraph[];
  allReports: MonthlyReport[];
  isLoading: boolean;
  error: string | null;
  
  // Template data
  template: ReportTemplate;
  
  // Actions
  createNewReport: (reportDate: string, title: string) => Promise<void>;
  loadReport: (id: string) => Promise<void>;
  updateReport: (updates: Partial<MonthlyReport>) => Promise<void>;
  saveHighlight: (section: ReportSection, content: string) => Promise<void>;
  saveGraph: (section: ReportSection, name: string, config: any, description?: string, imageUrl?: string) => Promise<void>;
  removeGraph: (id: string) => Promise<void>;
  generateReport: () => Promise<string>;
  generateReportDirect: () => Promise<string>;
  generateFieldContent: (field: string) => Promise<string>;
  
  // Template management
  updateTemplateSection: (section: string, key: string, value: string) => void;
  updateGenericContentFlag: (section: string, key: string, value: boolean) => void;
  updateLlmProvider: (provider: LlmProvider) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
  // State
  const [currentReport, setCurrentReport] = useState<MonthlyReport | null>(null);
  const [highlights, setHighlights] = useState<ReportHighlight[]>([]);
  const [graphs, setGraphs] = useState<ReportGraph[]>([]);
  const [allReports, setAllReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<ReportTemplate>(EMPTY_TEMPLATE);

  // Load all reports on mount
  useEffect(() => {
    const loadAllReports = () => {
      try {
        setIsLoading(true);
        const reports = getLocalReports();
        setAllReports(reports);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reports');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllReports();
  }, []);

  // Create a new report
  const createNewReport = async (reportDate: string, title: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newReport = saveLocalReport({ report_date: reportDate, title });
      setCurrentReport(newReport);
      setHighlights([]);
      setGraphs([]);
      setTemplate(EMPTY_TEMPLATE);
      
      // Refresh the list of all reports
      const reports = getLocalReports();
      setAllReports(reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create report');
    } finally {
      setIsLoading(false);
    }
  };

  // Load a report by ID
  const loadReport = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { report, highlights, graphs } = getLocalCompleteReportData(id);
      
      if (!report) {
        throw new Error('Report not found');
      }
      
      setCurrentReport(report);
      setHighlights(highlights);
      setGraphs(graphs);
      
      // Initialize template with existing data
      const newTemplate = { ...EMPTY_TEMPLATE };
      
      // Populate template with highlights
      highlights.forEach(highlight => {
        if (highlight.section === 'llm_context') {
          newTemplate.llm_context = highlight.content;
        } else if (highlight.section === 'ceo_message') {
          newTemplate.ceo_message = highlight.content;
        } else if (highlight.section === 'business_performance') {
          // Split content into data and highlights if possible
          const lines = highlight.content.split('\n');
          const dataIndex = lines.findIndex(line => line.includes('Discussion Based on Data'));
          const highlightsIndex = lines.findIndex(line => line.includes('Discussion Based on Highlights'));
          
          if (dataIndex !== -1 && highlightsIndex !== -1) {
            newTemplate.business_performance.discussion_data = lines.slice(dataIndex + 1, highlightsIndex).join('\n');
            newTemplate.business_performance.discussion_highlights = lines.slice(highlightsIndex + 1).join('\n');
          } else {
            newTemplate.business_performance.discussion_highlights = highlight.content;
          }
        } else if (highlight.section === 'sales') {
          // Similar parsing for other sections
          const lines = highlight.content.split('\n');
          const dataIndex = lines.findIndex(line => line.includes('Discussion Based on Data'));
          const highlightsIndex = lines.findIndex(line => line.includes('Discussion Based on Highlights'));
          
          if (dataIndex !== -1 && highlightsIndex !== -1) {
            newTemplate.sales.discussion_data = lines.slice(dataIndex + 1, highlightsIndex).join('\n');
            newTemplate.sales.discussion_highlights = lines.slice(highlightsIndex + 1).join('\n');
          } else {
            newTemplate.sales.discussion_highlights = highlight.content;
          }
        } else if (highlight.section === 'marketing') {
          const lines = highlight.content.split('\n');
          const dataIndex = lines.findIndex(line => line.includes('Discussion Based on Data'));
          const highlightsIndex = lines.findIndex(line => line.includes('Discussion Based on Highlights'));
          
          if (dataIndex !== -1 && highlightsIndex !== -1) {
            newTemplate.marketing.discussion_data = lines.slice(dataIndex + 1, highlightsIndex).join('\n');
            newTemplate.marketing.discussion_highlights = lines.slice(highlightsIndex + 1).join('\n');
          } else {
            newTemplate.marketing.discussion_highlights = highlight.content;
          }
        } else if (highlight.section === 'cost_reduction') {
          const lines = highlight.content.split('\n');
          const dataIndex = lines.findIndex(line => line.includes('Discussion Based on Data'));
          const highlightsIndex = lines.findIndex(line => line.includes('Discussion Based on Highlights'));
          
          if (dataIndex !== -1 && highlightsIndex !== -1) {
            newTemplate.cost_reduction.discussion_data = lines.slice(dataIndex + 1, highlightsIndex).join('\n');
            newTemplate.cost_reduction.discussion_highlights = lines.slice(highlightsIndex + 1).join('\n');
          } else {
            newTemplate.cost_reduction.discussion_highlights = highlight.content;
          }
        } else if (highlight.section === 'operations') {
          const lines = highlight.content.split('\n');
          const dataIndex = lines.findIndex(line => line.includes('Discussion Based on Data'));
          const highlightsIndex = lines.findIndex(line => line.includes('Discussion Based on Highlights'));
          
          if (dataIndex !== -1 && highlightsIndex !== -1) {
            newTemplate.operations.discussion_data = lines.slice(dataIndex + 1, highlightsIndex).join('\n');
            newTemplate.operations.discussion_highlights = lines.slice(highlightsIndex + 1).join('\n');
          } else {
            newTemplate.operations.discussion_highlights = highlight.content;
          }
        } else if (highlight.section === 'financial_statements') {
          newTemplate.financial_statements = highlight.content;
        }
      });
      
      // Add graphs to template
      graphs.forEach(graph => {
        if (graph.section === 'business_performance') {
          newTemplate.business_performance.graphs.push(graph);
        } else if (graph.section === 'sales') {
          newTemplate.sales.graphs.push(graph);
        } else if (graph.section === 'marketing') {
          newTemplate.marketing.graphs.push(graph);
        } else if (graph.section === 'cost_reduction') {
          newTemplate.cost_reduction.graphs.push(graph);
        } else if (graph.section === 'operations') {
          newTemplate.operations.graphs.push(graph);
        }
      });
      
      setTemplate(newTemplate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  // Update report
  const updateReport = async (updates: Partial<MonthlyReport>) => {
    if (!currentReport) {
      setError('No report selected');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedReport = saveLocalReport({
        ...currentReport,
        ...updates
      });
      
      setCurrentReport(updatedReport);
      
      // Refresh the list of all reports
      const reports = getLocalReports();
      setAllReports(reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report');
    } finally {
      setIsLoading(false);
    }
  };

  // Save highlight
  const saveHighlight = async (section: ReportSection, content: string) => {
    if (!currentReport) {
      setError('No report selected');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const highlight = saveLocalHighlight(currentReport.id, section, content);
      
      // Update highlights state
      setHighlights(prev => {
        const index = prev.findIndex(h => h.section === section);
        if (index !== -1) {
          return [...prev.slice(0, index), highlight, ...prev.slice(index + 1)];
        } else {
          return [...prev, highlight];
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save highlight');
    } finally {
      setIsLoading(false);
    }
  };

  // Save graph
  const saveGraph = async (
    section: ReportSection,
    name: string,
    config: any,
    description?: string,
    imageUrl?: string
  ) => {
    if (!currentReport) {
      setError('No report selected');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const graph = saveLocalGraph(
        currentReport.id,
        section,
        name,
        config,
        description,
        imageUrl
      );
      
      // Update graphs state
      setGraphs(prev => [...prev, graph]);
      
      // Update template
      setTemplate(prev => {
        const newTemplate = { ...prev };
        if (section === 'business_performance') {
          newTemplate.business_performance.graphs.push(graph);
        } else if (section === 'sales') {
          newTemplate.sales.graphs.push(graph);
        } else if (section === 'marketing') {
          newTemplate.marketing.graphs.push(graph);
        } else if (section === 'cost_reduction') {
          newTemplate.cost_reduction.graphs.push(graph);
        } else if (section === 'operations') {
          newTemplate.operations.graphs.push(graph);
        }
        return newTemplate;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save graph');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove graph
  const removeGraph = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      deleteLocalGraph(id);
      
      // Update graphs state
      setGraphs(prev => prev.filter(g => g.id !== id));
      
      // Update template
      setTemplate(prev => {
        const newTemplate = { ...prev };
        newTemplate.business_performance.graphs = newTemplate.business_performance.graphs.filter(g => g.id !== id);
        newTemplate.sales.graphs = newTemplate.sales.graphs.filter(g => g.id !== id);
        newTemplate.marketing.graphs = newTemplate.marketing.graphs.filter(g => g.id !== id);
        newTemplate.cost_reduction.graphs = newTemplate.cost_reduction.graphs.filter(g => g.id !== id);
        newTemplate.operations.graphs = newTemplate.operations.graphs.filter(g => g.id !== id);
        return newTemplate;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove graph');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate report
  const generateReport = async () => {
    if (!currentReport) {
      setError('No report selected');
      return '';
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Save all highlights first
      await saveHighlight('llm_context', template.llm_context);
      await saveHighlight('ceo_message', template.ceo_message);
      
      // For sections with data and highlights, combine them
      const businessPerformanceContent = `
## Overall Business Performance

### Discussion Based on Data
${template.business_performance.discussion_data}

### Discussion Based on Highlights
${template.business_performance.discussion_highlights}
      `.trim();
      
      const salesContent = `
## Sales

### Discussion Based on Data
${template.sales.discussion_data}

### Discussion Based on Highlights
${template.sales.discussion_highlights}
      `.trim();
      
      const marketingContent = `
## Marketing

### Discussion Based on Data
${template.marketing.discussion_data}

### Discussion Based on Highlights
${template.marketing.discussion_highlights}
      `.trim();
      
      const costReductionContent = `
## Cost Reduction Initiatives

### Discussion Based on Data
${template.cost_reduction.discussion_data}

### Discussion Based on Highlights
${template.cost_reduction.discussion_highlights}
      `.trim();
      
      const operationsContent = `
## Operations

### Discussion Based on Data
${template.operations.discussion_data}

### Discussion Based on Highlights
${template.operations.discussion_highlights}
      `.trim();
      
      await saveHighlight('business_performance', businessPerformanceContent);
      await saveHighlight('sales', salesContent);
      await saveHighlight('marketing', marketingContent);
      await saveHighlight('cost_reduction', costReductionContent);
      await saveHighlight('operations', operationsContent);
      await saveHighlight('financial_statements', template.financial_statements);
      
      // Prepare the prompt for the LLM
      const prompt = `
# Monthly Report for ${currentReport.title}

## LLM Context for the Month
${template.llm_context}

## Message from the CEO
${template.ceo_message}

${businessPerformanceContent}

${salesContent}

${marketingContent}

${costReductionContent}

${operationsContent}

## Detailed Year-to-Date Financial Statements
${template.financial_statements}
      `.trim();
      
      // Call the API to generate the report
      const response = await fetch('/api/monthly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  // Update template section
  const updateTemplateSection = (section: string, key: string, value: string) => {
    setTemplate(prev => {
      const newTemplate = { ...prev };
      
      if (section === 'llm_context') {
        newTemplate.llm_context = value;
      } else if (section === 'ceo_message') {
        newTemplate.ceo_message = value;
      } else if (section === 'business_performance') {
        newTemplate.business_performance = {
          ...newTemplate.business_performance,
          [key]: value
        };
      } else if (section === 'sales') {
        newTemplate.sales = {
          ...newTemplate.sales,
          [key]: value
        };
      } else if (section === 'marketing') {
        newTemplate.marketing = {
          ...newTemplate.marketing,
          [key]: value
        };
      } else if (section === 'cost_reduction') {
        newTemplate.cost_reduction = {
          ...newTemplate.cost_reduction,
          [key]: value
        };
      } else if (section === 'operations') {
        newTemplate.operations = {
          ...newTemplate.operations,
          [key]: value
        };
      } else if (section === 'financial_statements') {
        newTemplate.financial_statements = value;
      }
      
      return newTemplate;
    });
  };
  
  // Update generic content flag
  const updateGenericContentFlag = (section: string, key: string, value: boolean) => {
    setTemplate(prev => {
      const newTemplate = { ...prev };
      
      if (section === 'llm_context') {
        newTemplate.use_generic_llm = value;
      } else if (section === 'ceo_message') {
        newTemplate.use_generic_ceo = value;
      } else if (section === 'financial_statements') {
        newTemplate.use_generic_financial = value;
      } else if (section === 'business_performance') {
        newTemplate.business_performance = {
          ...newTemplate.business_performance,
          use_generic: value
        };
      } else if (section === 'sales') {
        newTemplate.sales = {
          ...newTemplate.sales,
          use_generic: value
        };
      } else if (section === 'marketing') {
        newTemplate.marketing = {
          ...newTemplate.marketing,
          use_generic: value
        };
      } else if (section === 'cost_reduction') {
        newTemplate.cost_reduction = {
          ...newTemplate.cost_reduction,
          use_generic: value
        };
      } else if (section === 'operations') {
        newTemplate.operations = {
          ...newTemplate.operations,
          use_generic: value
        };
      }
      
      return newTemplate;
    });
  };
  
  // Generate content for a single field
  const generateFieldContent = async (field: string): Promise<string> => {
    if (!currentReport) {
      setError('No report selected');
      return '';
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Prepare the prompt for the LLM based on the field
      let prompt = '';
      
      if (field === 'llm_context') {
        prompt = `Generate a brief context paragraph for the monthly report for ${currentReport.title}. This should be 1-2 sentences that provide high-level context for the month.`;
      } else if (field === 'ceo_message') {
        prompt = `Generate a CEO message for the monthly report for ${currentReport.title}. This should discuss strategic priorities, business progress, and challenges.`;
      } else if (field === 'business_performance_data') {
        prompt = `Generate a data-focused discussion for the Business Performance section of the monthly report for ${currentReport.title}. This should cover total revenue, margins, income, cash flow, and significant changes.`;
      } else if (field === 'business_performance_highlights') {
        prompt = `Generate a highlights-focused discussion for the Business Performance section of the monthly report for ${currentReport.title}. This should cover significant changes on the balance sheet, key factors affecting margins and cash, and overall business trends/progress.`;
      } else if (field === 'sales_data') {
        prompt = `Generate a data-focused discussion for the Sales section of the monthly report for ${currentReport.title}. This should cover orders, tons sold, pricing, online vs offline, distributor vs direct sales.`;
      } else if (field === 'sales_highlights') {
        prompt = `Generate a highlights-focused discussion for the Sales section of the monthly report for ${currentReport.title}. This should cover significant wins/losses, pipeline opportunities, online store highlights, and U.S. vs Canada vs International sales.`;
      } else if (field === 'marketing_data') {
        prompt = `Generate a data-focused discussion for the Marketing section of the monthly report for ${currentReport.title}. This should cover marketing expenses, digital marketing expenses, and WebFX data.`;
      } else if (field === 'marketing_highlights') {
        prompt = `Generate a highlights-focused discussion for the Marketing section of the monthly report for ${currentReport.title}. This should cover significant events, online store highlights, and digital marketing initiatives.`;
      } else if (field === 'cost_reduction_data') {
        prompt = `Generate a data-focused discussion for the Cost Reduction section of the monthly report for ${currentReport.title}. This should cover raw material costs, total sales costs, distributor sales costs, and direct sales costs.`;
      } else if (field === 'cost_reduction_highlights') {
        prompt = `Generate a highlights-focused discussion for the Cost Reduction section of the monthly report for ${currentReport.title}. This should cover Alexandria updates, one-off expenses that affected margins, and sales cost drivers for the month.`;
      } else if (field === 'operations_data') {
        prompt = `Generate a data-focused discussion for the Operations section of the monthly report for ${currentReport.title}. This should cover uptime, yield, and inventory.`;
      } else if (field === 'operations_highlights') {
        prompt = `Generate a highlights-focused discussion for the Operations section of the monthly report for ${currentReport.title}. This should cover safety, priorities/activities, and notable achievements or challenges.`;
      } else if (field === 'financial_statements') {
        prompt = `Generate financial statements for the monthly report for ${currentReport.title}. This should include Income Statement, Unit Income Statement, Balance Sheet, and Cash Flow Statement in a clear, tabular format.`;
      } else {
        throw new Error(`Unknown field: ${field}`);
      }
      
      // Call the API to generate the content
      const response = await fetch('/api/monthly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: prompt,
          field: field
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate field content');
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  // Update LLM provider
  const updateLlmProvider = (provider: LlmProvider) => {
    setTemplate(prev => ({
      ...prev,
      llm_provider: provider
    }));
  };

  // Generate report using the direct approach with outline and metrics data files
  const generateReportDirect = async () => {
    if (!currentReport) {
      setError('No report selected');
      return '';
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Prepare a simple prompt with just the report title
      const prompt = `Monthly Report for ${currentReport.title}`;
      
      // Call the direct API route with the selected LLM provider
      const response = await fetch('/api/monthly-report-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: prompt,
          provider: template.llm_provider 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentReport,
    highlights,
    graphs,
    allReports,
    isLoading,
    error,
    template,
    createNewReport,
    loadReport,
    updateReport,
    saveHighlight,
    saveGraph,
    removeGraph,
    generateReport,
    generateReportDirect,
    generateFieldContent,
    updateTemplateSection,
    updateGenericContentFlag,
    updateLlmProvider,
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReport() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}
