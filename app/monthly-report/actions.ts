'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MonthlyReport, ReportHighlight, ReportGraph, ReportSection } from '@/types/report';

// Create a Supabase client for server components
const createClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};

  // Create a new monthly report
  export async function createMonthlyReport(reportDate: string, title: string) {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // For local development, allow unauthenticated users
    const userId = user?.id || 'local-dev-user';
    
    const { data, error } = await supabase
      .from('monthly_reports')
      .insert({
        report_date: reportDate,
        title,
        created_by: userId
      })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating monthly report:', error);
    throw new Error(`Failed to create monthly report: ${error.message}`);
  }
  
  return data as MonthlyReport;
}

// Get a monthly report by ID
export async function getMonthlyReportById(id: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching monthly report:', error);
    throw new Error(`Failed to fetch monthly report: ${error.message}`);
  }
  
  return data as MonthlyReport;
}

// Get all monthly reports
export async function getAllMonthlyReports() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .order('report_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching monthly reports:', error);
    throw new Error(`Failed to fetch monthly reports: ${error.message}`);
  }
  
  return data as MonthlyReport[];
}

// Update a monthly report
export async function updateMonthlyReport(id: string, updates: Partial<MonthlyReport>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('monthly_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating monthly report:', error);
    throw new Error(`Failed to update monthly report: ${error.message}`);
  }
  
  return data as MonthlyReport;
}

// Delete a monthly report
export async function deleteMonthlyReport(id: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('monthly_reports')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting monthly report:', error);
    throw new Error(`Failed to delete monthly report: ${error.message}`);
  }
  
  return true;
}

// Create or update a report highlight
export async function upsertReportHighlight(reportId: string, section: ReportSection, content: string) {
  const supabase = createClient();
  
  // Check if highlight already exists
  const { data: existingHighlight } = await supabase
    .from('report_highlights')
    .select('*')
    .eq('report_id', reportId)
    .eq('section', section)
    .maybeSingle();
  
  if (existingHighlight) {
    // Update existing highlight
    const { data, error } = await supabase
      .from('report_highlights')
      .update({ content })
      .eq('id', existingHighlight.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating report highlight:', error);
      throw new Error(`Failed to update report highlight: ${error.message}`);
    }
    
    return data as ReportHighlight;
  } else {
    // Create new highlight
    const { data, error } = await supabase
      .from('report_highlights')
      .insert({
        report_id: reportId,
        section,
        content
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating report highlight:', error);
      throw new Error(`Failed to create report highlight: ${error.message}`);
    }
    
    return data as ReportHighlight;
  }
}

// Get all highlights for a report
export async function getReportHighlights(reportId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('report_highlights')
    .select('*')
    .eq('report_id', reportId);
  
  if (error) {
    console.error('Error fetching report highlights:', error);
    throw new Error(`Failed to fetch report highlights: ${error.message}`);
  }
  
  return data as ReportHighlight[];
}

// Save a graph for a report
export async function saveReportGraph(
  reportId: string,
  section: ReportSection,
  name: string,
  config: any,
  description?: string,
  imageUrl?: string
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('report_graphs')
    .insert({
      report_id: reportId,
      section,
      name,
      description,
      config,
      image_url: imageUrl
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving report graph:', error);
    throw new Error(`Failed to save report graph: ${error.message}`);
  }
  
  return data as ReportGraph;
}

// Get all graphs for a report
export async function getReportGraphs(reportId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('report_graphs')
    .select('*')
    .eq('report_id', reportId);
  
  if (error) {
    console.error('Error fetching report graphs:', error);
    throw new Error(`Failed to fetch report graphs: ${error.message}`);
  }
  
  return data as ReportGraph[];
}

// Delete a graph from a report
export async function deleteReportGraph(id: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('report_graphs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting report graph:', error);
    throw new Error(`Failed to delete report graph: ${error.message}`);
  }
  
  return true;
}

// Get complete report data (report, highlights, and graphs)
export async function getCompleteReportData(reportId: string) {
  const report = await getMonthlyReportById(reportId);
  const highlights = await getReportHighlights(reportId);
  const graphs = await getReportGraphs(reportId);
  
  return {
    report,
    highlights,
    graphs
  };
}
