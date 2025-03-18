'use client';

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ReportSection, SECTION_NAMES, SECTION_DESCRIPTIONS, GENERIC_CONTENT } from '@/types/report';
import { useReport } from '../report-context';

interface HighlightEntryFormProps {
  section: ReportSection;
  dataKey?: 'discussion_data' | 'discussion_highlights';
}

export default function HighlightEntryForm({ section, dataKey }: HighlightEntryFormProps) {
  const { template, updateTemplateSection, isLoading, updateGenericContentFlag } = useReport();
  
  // Check if generic content is enabled for this section
  const isGenericEnabled = () => {
    if (section === 'llm_context') {
      return template.use_generic_llm;
    } else if (section === 'ceo_message') {
      return template.use_generic_ceo;
    } else if (section === 'financial_statements') {
      return template.use_generic_financial;
    } else if (dataKey) {
      return template[section].use_generic;
    }
    return false;
  };
  
  // Handle checkbox change
  const handleGenericChange = (checked: boolean) => {
    if (section === 'llm_context') {
      updateGenericContentFlag(section, '', checked);
      if (checked) {
        updateTemplateSection(section, '', GENERIC_CONTENT.llm_context);
      }
    } else if (section === 'ceo_message') {
      updateGenericContentFlag(section, '', checked);
      if (checked) {
        updateTemplateSection(section, '', GENERIC_CONTENT.ceo_message);
      }
    } else if (section === 'financial_statements') {
      updateGenericContentFlag(section, '', checked);
      if (checked) {
        updateTemplateSection(section, '', GENERIC_CONTENT.financial_statements);
      }
    } else if (dataKey) {
      updateGenericContentFlag(section, dataKey, checked);
      if (checked && dataKey === 'discussion_data') {
        updateTemplateSection(section, dataKey, GENERIC_CONTENT[section].discussion_data);
      } else if (checked && dataKey === 'discussion_highlights') {
        updateTemplateSection(section, dataKey, GENERIC_CONTENT[section].discussion_highlights);
      }
    }
  };
  
  // Get the content based on section and dataKey
  const getContent = () => {
    if (section === 'llm_context') {
      return template.llm_context;
    } else if (section === 'ceo_message') {
      return template.ceo_message;
    } else if (section === 'financial_statements') {
      return template.financial_statements;
    } else if (dataKey) {
      return template[section][dataKey];
    }
    return '';
  };
  
  // Handle content change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (section === 'llm_context' || section === 'ceo_message' || section === 'financial_statements') {
      updateTemplateSection(section, '', e.target.value);
    } else if (dataKey) {
      updateTemplateSection(section, dataKey, e.target.value);
    }
  };
  
  // Get the title based on section and dataKey
  const getTitle = () => {
    if (dataKey === 'discussion_data') {
      return `${SECTION_NAMES[section]} - Data Discussion`;
    } else if (dataKey === 'discussion_highlights') {
      return `${SECTION_NAMES[section]} - Highlights Discussion`;
    }
    return SECTION_NAMES[section];
  };
  
  // Get the description based on section and dataKey
  const getDescription = () => {
    if (dataKey === 'discussion_data') {
      return 'Enter discussion points based on the data and metrics for this section.';
    } else if (dataKey === 'discussion_highlights') {
      return 'Enter discussion points based on highlights and notable events for this section.';
    }
    return SECTION_DESCRIPTIONS[section];
  };
  
  return (
    <Card className="p-4 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium mb-2">{getTitle()}</h3>
          <p className="text-sm text-gray-500">{getDescription()}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={`generic-${section}-${dataKey || ''}`}
            checked={isGenericEnabled()}
            onCheckedChange={handleGenericChange}
            disabled={isLoading}
          />
          <label 
            htmlFor={`generic-${section}-${dataKey || ''}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Use generic content
          </label>
        </div>
      </div>
      
      <Textarea
        value={getContent()}
        onChange={handleChange}
        placeholder={`Enter ${getTitle().toLowerCase()} here...`}
        className="min-h-[150px] mb-2"
        disabled={isLoading || isGenericEnabled()}
      />
      
      {dataKey === 'discussion_data' && (
        <div className="text-xs text-gray-500 mt-2">
          <p className="font-medium">Suggested data points:</p>
          {section === 'business_performance' && (
            <ul className="list-disc list-inside mt-1">
              <li>Total revenue</li>
              <li>Gross Margin</li>
              <li>Operating Margin</li>
              <li>Net Income</li>
              <li>Net change in cash</li>
              <li>Cash at end of period</li>
              <li><strong>Include tables:</strong> Income statement, Cash flow, Balance sheet</li>
              <li><strong>Include graphs:</strong> Revenue, Margins, Income trends</li>
            </ul>
          )}
          {section === 'sales' && (
            <ul className="list-disc list-inside mt-1">
              <li>Total orders</li>
              <li>Total tons sold</li>
              <li>Overall Average Price per lb</li>
              <li>Online vs Offline Sales</li>
              <li>Online Orders (number)</li>
              <li>Distributor, Large/Medium/Small Direct Sales breakdown</li>
              <li>KinetiX, DynamiX, EpiX sales breakdown</li>
              <li><strong>Include graphs:</strong> Price trends, Sales channel percentages, Product line percentages</li>
            </ul>
          )}
          {section === 'marketing' && (
            <ul className="list-disc list-inside mt-1">
              <li>Digital marketing expenses</li>
              <li>% Digital marketing expenses</li>
              <li>Total marketing expenses</li>
              <li>WebFX Data</li>
              <li><strong>Include graphs:</strong> Marketing expenses, Marketing percentages, Online vs Offline Orders</li>
            </ul>
          )}
          {section === 'cost_reduction' && (
            <ul className="list-disc list-inside mt-1">
              <li>Raw material costs</li>
              <li>Total Sales Costs</li>
              <li>Distributor Sales Costs</li>
              <li>Direct Sales Costs</li>
              <li><strong>Include graphs:</strong> Raw Material Costs, Sales Costs breakdown</li>
            </ul>
          )}
          {section === 'operations' && (
            <ul className="list-disc list-inside mt-1">
              <li>Uptime</li>
              <li>Yield</li>
              <li>Inventory</li>
              <li><strong>Include graphs:</strong> Uptime trends, Yield trends</li>
            </ul>
          )}
          {section === 'financial_statements' && (
            <ul className="list-disc list-inside mt-1">
              <li>Income Statement</li>
              <li>Unit Income Statement</li>
              <li>Balance Sheet</li>
              <li>Cash Flow Statement</li>
            </ul>
          )}
        </div>
      )}
      
      {dataKey === 'discussion_highlights' && (
        <div className="text-xs text-gray-500 mt-2">
          <p className="font-medium">Suggested highlight points:</p>
          {section === 'business_performance' && (
            <ul className="list-disc list-inside mt-1">
              <li>Significant changes on the balance sheet</li>
              <li>Key factors affecting margins</li>
              <li>Key factors affecting cash</li>
              <li>Overall business trends/progress</li>
              <li>Reference the included tables and graphs in your discussion</li>
            </ul>
          )}
          {section === 'sales' && (
            <ul className="list-disc list-inside mt-1">
              <li>Significant wins/losses</li>
              <li>Pipeline opportunities</li>
              <li>Online store highlights</li>
              <li>U.S. vs Canada vs International</li>
              <li>Reference the included graphs in your discussion</li>
            </ul>
          )}
          {section === 'marketing' && (
            <ul className="list-disc list-inside mt-1">
              <li>Significant events (conferences, webinars, ad campaigns)</li>
              <li>Online store highlights</li>
              <li>Digital marketing initiatives</li>
              <li>Reference the included graphs in your discussion</li>
            </ul>
          )}
          {section === 'cost_reduction' && (
            <ul className="list-disc list-inside mt-1">
              <li>Alexandria Update</li>
              <li>One-off expenses that affected margins</li>
              <li>Sales cost drivers for the month</li>
              <li>Reference the included graphs in your discussion</li>
            </ul>
          )}
          {section === 'operations' && (
            <ul className="list-disc list-inside mt-1">
              <li>Safety</li>
              <li>Priorities/Activities</li>
              <li>Notable achievements or challenges</li>
              <li>Reference the included graphs in your discussion</li>
            </ul>
          )}
        </div>
      )}
      
      {section === 'financial_statements' && (
        <div className="text-xs text-gray-500 mt-2">
          <p className="font-medium">Required financial statements:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Income Statement</li>
            <li>Unit Income Statement</li>
            <li>Balance Sheet</li>
            <li>Cash Flow Statement</li>
          </ul>
          <p className="mt-2">Enter these statements in a clear, tabular format.</p>
        </div>
      )}
    </Card>
  );
}
