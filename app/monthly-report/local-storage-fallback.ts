'use client';

import { MonthlyReport, ReportHighlight, ReportGraph, ReportSection } from '@/types/report';

// Local storage keys
const REPORTS_KEY = 'monthly_reports';
const HIGHLIGHTS_KEY = 'report_highlights';
const GRAPHS_KEY = 'report_graphs';

// Helper to generate a UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper to get current timestamp
const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// Get all reports from localStorage
export const getLocalReports = (): MonthlyReport[] => {
  if (typeof window === 'undefined') return [];
  
  const reportsJson = localStorage.getItem(REPORTS_KEY);
  return reportsJson ? JSON.parse(reportsJson) : [];
};

// Save a report to localStorage
export const saveLocalReport = (report: Partial<MonthlyReport>): MonthlyReport => {
  const reports = getLocalReports();
  
  const newReport: MonthlyReport = {
    id: report.id || generateUUID(),
    report_date: report.report_date || new Date().toISOString().split('T')[0],
    title: report.title || 'Untitled Report',
    status: report.status || 'draft',
    created_at: report.created_at || getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
    created_by: report.created_by || 'local-user'
  };
  
  // If report with this ID already exists, update it
  const existingIndex = reports.findIndex(r => r.id === newReport.id);
  if (existingIndex !== -1) {
    reports[existingIndex] = { ...reports[existingIndex], ...newReport };
  } else {
    reports.push(newReport);
  }
  
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  return newReport;
};

// Get a report by ID
export const getLocalReportById = (id: string): MonthlyReport | null => {
  const reports = getLocalReports();
  return reports.find(r => r.id === id) || null;
};

// Delete a report
export const deleteLocalReport = (id: string): boolean => {
  const reports = getLocalReports();
  const newReports = reports.filter(r => r.id !== id);
  
  if (newReports.length === reports.length) {
    return false; // Report not found
  }
  
  localStorage.setItem(REPORTS_KEY, JSON.stringify(newReports));
  
  // Also delete associated highlights and graphs
  const highlights = getLocalHighlights();
  const newHighlights = highlights.filter(h => h.report_id !== id);
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(newHighlights));
  
  const graphs = getLocalGraphs();
  const newGraphs = graphs.filter(g => g.report_id !== id);
  localStorage.setItem(GRAPHS_KEY, JSON.stringify(newGraphs));
  
  return true;
};

// Get all highlights
export const getLocalHighlights = (): ReportHighlight[] => {
  if (typeof window === 'undefined') return [];
  
  const highlightsJson = localStorage.getItem(HIGHLIGHTS_KEY);
  return highlightsJson ? JSON.parse(highlightsJson) : [];
};

// Get highlights for a report
export const getLocalHighlightsByReportId = (reportId: string): ReportHighlight[] => {
  const highlights = getLocalHighlights();
  return highlights.filter(h => h.report_id === reportId);
};

// Save a highlight
export const saveLocalHighlight = (reportId: string, section: ReportSection, content: string): ReportHighlight => {
  const highlights = getLocalHighlights();
  
  // Check if highlight already exists
  const existingIndex = highlights.findIndex(h => h.report_id === reportId && h.section === section);
  
  if (existingIndex !== -1) {
    // Update existing highlight
    const updatedHighlight: ReportHighlight = {
      ...highlights[existingIndex],
      content,
      updated_at: getCurrentTimestamp()
    };
    
    highlights[existingIndex] = updatedHighlight;
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlights));
    
    return updatedHighlight;
  } else {
    // Create new highlight
    const newHighlight: ReportHighlight = {
      id: generateUUID(),
      report_id: reportId,
      section,
      content,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };
    
    highlights.push(newHighlight);
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlights));
    
    return newHighlight;
  }
};

// Get all graphs
export const getLocalGraphs = (): ReportGraph[] => {
  if (typeof window === 'undefined') return [];
  
  const graphsJson = localStorage.getItem(GRAPHS_KEY);
  return graphsJson ? JSON.parse(graphsJson) : [];
};

// Get graphs for a report
export const getLocalGraphsByReportId = (reportId: string): ReportGraph[] => {
  const graphs = getLocalGraphs();
  return graphs.filter(g => g.report_id === reportId);
};

// Save a graph
export const saveLocalGraph = (
  reportId: string,
  section: ReportSection,
  name: string,
  config: any,
  description?: string,
  imageUrl?: string
): ReportGraph => {
  const graphs = getLocalGraphs();
  
  const newGraph: ReportGraph = {
    id: generateUUID(),
    report_id: reportId,
    section,
    name,
    description: description || '',
    config,
    image_url: imageUrl,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  };
  
  graphs.push(newGraph);
  localStorage.setItem(GRAPHS_KEY, JSON.stringify(graphs));
  
  return newGraph;
};

// Delete a graph
export const deleteLocalGraph = (id: string): boolean => {
  const graphs = getLocalGraphs();
  const newGraphs = graphs.filter(g => g.id !== id);
  
  if (newGraphs.length === graphs.length) {
    return false; // Graph not found
  }
  
  localStorage.setItem(GRAPHS_KEY, JSON.stringify(newGraphs));
  return true;
};

// Get complete report data
export const getLocalCompleteReportData = (reportId: string) => {
  const report = getLocalReportById(reportId);
  const highlights = getLocalHighlightsByReportId(reportId);
  const graphs = getLocalGraphsByReportId(reportId);
  
  return {
    report,
    highlights,
    graphs
  };
};
