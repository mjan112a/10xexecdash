// Types for the Monthly Report system

export interface MonthlyReport {
  id: string;
  report_date: string;
  title: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ReportHighlight {
  id: string;
  report_id: string;
  section: ReportSection;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ReportGraph {
  id: string;
  report_id: string;
  section: ReportSection;
  name: string;
  description?: string;
  config: GraphConfig;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Report sections based on the new template
export type ReportSection = 
  | 'llm_context'
  | 'ceo_message'
  | 'business_performance'
  | 'sales'
  | 'marketing'
  | 'cost_reduction'
  | 'operations'
  | 'financial_statements';

// Section display names for UI
export const SECTION_NAMES: Record<ReportSection, string> = {
  llm_context: 'LLM Context for the Month',
  ceo_message: 'Message from the CEO',
  business_performance: 'Overall Business Performance',
  sales: 'Sales',
  marketing: 'Marketing',
  cost_reduction: 'Cost Reduction Initiatives',
  operations: 'Operations',
  financial_statements: 'Detailed Financial Statements'
};

// Section descriptions for UI
export const SECTION_DESCRIPTIONS: Record<ReportSection, string> = {
  llm_context: 'One or a few sentences that provide context for the month',
  ceo_message: 'Discussion based on highlights, recap of strategic priorities, business progress & challenges',
  business_performance: 'Discussion of total revenue, margins, income, cash flow, and significant changes',
  sales: 'Discussion of orders, tons sold, pricing, online vs offline, distributor vs direct sales',
  marketing: 'Discussion of marketing expenses, significant events, online store highlights',
  cost_reduction: 'Discussion of raw material costs, sales costs, Alexandria update, one-off expenses',
  operations: 'Discussion of uptime, yield, inventory, safety, priorities/activities',
  financial_statements: 'Detailed year-to-date financial statements in table format'
};

// Graph configuration type
export interface GraphConfig {
  metrics: string[]; // IDs of selected metrics
  timeFrame: string; // month, quarter, year
  chartType: 'line' | 'bar' | 'pie';
  startDate?: string;
  endDate?: string;
  comparisonMode?: boolean;
  [key: string]: any; // For any additional configuration options
}

// LLM provider type
export type LlmProvider = 'anthropic' | 'perplexity' | 'openai';

// New report template sections
export interface ReportTemplate {
  llm_context: string;
  ceo_message: string;
  business_performance: {
    discussion_data: string;
    discussion_highlights: string;
    graphs: ReportGraph[];
    use_generic?: boolean;
  };
  sales: {
    discussion_data: string;
    discussion_highlights: string;
    graphs: ReportGraph[];
    use_generic?: boolean;
  };
  marketing: {
    discussion_data: string;
    discussion_highlights: string;
    graphs: ReportGraph[];
    use_generic?: boolean;
  };
  cost_reduction: {
    discussion_data: string;
    discussion_highlights: string;
    graphs: ReportGraph[];
    use_generic?: boolean;
  };
  operations: {
    discussion_data: string;
    discussion_highlights: string;
    graphs: ReportGraph[];
    use_generic?: boolean;
  };
  financial_statements: string;
  use_generic_ceo?: boolean;
  use_generic_llm?: boolean;
  use_generic_financial?: boolean;
  llm_provider: LlmProvider; // New field for LLM provider preference
}

// Empty template for initializing a new report
export const EMPTY_TEMPLATE: ReportTemplate = {
  llm_context: '',
  ceo_message: '',
  business_performance: {
    discussion_data: '',
    discussion_highlights: '',
    graphs: [],
    use_generic: false
  },
  sales: {
    discussion_data: '',
    discussion_highlights: '',
    graphs: [],
    use_generic: false
  },
  marketing: {
    discussion_data: '',
    discussion_highlights: '',
    graphs: [],
    use_generic: false
  },
  cost_reduction: {
    discussion_data: '',
    discussion_highlights: '',
    graphs: [],
    use_generic: false
  },
  operations: {
    discussion_data: '',
    discussion_highlights: '',
    graphs: [],
    use_generic: false
  },
  financial_statements: '',
  use_generic_ceo: false,
  use_generic_llm: false,
  use_generic_financial: false,
  llm_provider: 'anthropic' // Default to Anthropic
};

// Generic content templates for testing
export const GENERIC_CONTENT = {
  llm_context: 'March 2025 was a month of significant growth for 10X Engineered Materials, with notable improvements in production efficiency and sales performance.',
  ceo_message: 'This month has shown strong progress across all business areas. Our strategic initiatives are yielding results, particularly in cost reduction and operational efficiency. The team has done an excellent job navigating market challenges while maintaining our focus on quality and customer satisfaction.',
  business_performance: {
    discussion_data: 'Total revenue for March was $5.2M, representing a 15% increase over February. Gross margin improved to 42%, up from 38% last month. Operating margin was 22%, and net income reached $850K. Cash flow was positive at $1.2M, with an ending cash balance of $4.5M.',
    discussion_highlights: 'The significant improvement in margins is attributed to our cost reduction initiatives and higher production yields. The balance sheet continues to strengthen with reduced debt and increased cash reserves. Overall business trends are positive, with all key metrics showing improvement over the previous quarter.'
  },
  sales: {
    discussion_data: 'Total orders for March were 125, representing 450 tons sold. Overall average price was $11.50 per lb. Online sales accounted for 35% of total orders, with 65% coming through traditional channels. We had 45 online orders this month. Distributor sales were 40%, with large direct sales at 30%, medium at 20%, and small at 10%. KinetiX represented 50% of sales, DynamiX 35%, and EpiX 15%.',
    discussion_highlights: 'We secured two significant new contracts with major industrial clients this month. Our online store continues to show strong growth, with a 20% increase in order volume. The pipeline for Q2 looks promising, with several large opportunities in advanced negotiation stages. U.S. sales represented 75% of volume, with Canada at 15% and international at 10%.'
  },
  marketing: {
    discussion_data: 'Digital marketing expenses were $85K, representing 65% of our total marketing budget. Total marketing expenses were $130K for the month. WebFX data shows a 25% increase in website traffic and a 15% improvement in conversion rates.',
    discussion_highlights: 'We participated in the International Manufacturing Expo, generating 45 qualified leads. Our new digital campaign for KinetiX products launched successfully, with early metrics showing strong engagement. The online store redesign was completed, resulting in improved user experience and a 10% increase in average order value.'
  },
  cost_reduction: {
    discussion_data: 'Raw material costs decreased by 5% this month due to new supplier agreements. Total sales costs were $1.2M, with distributor sales costs at $520K and direct sales costs at $680K.',
    discussion_highlights: 'The Alexandria facility automation project is on schedule, with Phase II completion expected by the end of Q2. We identified and eliminated several redundant processes in our supply chain, resulting in approximately $50K in monthly savings. Sales costs were temporarily elevated due to the trade show participation, but this is expected to normalize next month.'
  },
  operations: {
    discussion_data: 'Uptime for March was 92%, a 3% improvement over February. Yield increased to 88%, and inventory levels are at optimal levels with 45 days of supply.',
    discussion_highlights: 'Safety: Zero recordable incidents this month, maintaining our excellent safety record. Priorities: Focus on completing the Alexandria automation project and implementing the new quality control procedures. We achieved a significant milestone with the successful implementation of the new grinding process, which has contributed to the improved yield figures.'
  },
  financial_statements: `
| Income Statement | YTD 2025 | % of Revenue |
|------------------|----------|--------------|
| Total Revenue    | $15.2M   | 100%         |
| COGS             | $8.8M    | 58%          |
| Gross Profit     | $6.4M    | 42%          |
| Operating Expenses | $3.1M  | 20%          |
| Net Income       | $3.3M    | 22%          |

| Unit Income Statement | YTD 2025 | % of Revenue |
|----------------------|----------|--------------|
| Revenue per Ton      | $11,500  | 100%         |
| COGS per Ton         | $6,670   | 58%          |
| Gross Profit per Ton | $4,830   | 42%          |
| Op. Expenses per Ton | $2,300   | 20%          |
| Net Income per Ton   | $2,530   | 22%          |

| Balance Sheet      | Mar 2025  | Feb 2025  | Change    |
|-------------------|-----------|-----------|-----------|
| Cash              | $4.5M     | $3.3M     | +$1.2M    |
| Accounts Receivable | $3.8M   | $3.5M     | +$0.3M    |
| Inventory         | $2.2M     | $2.4M     | -$0.2M    |
| Fixed Assets      | $12.5M    | $12.7M    | -$0.2M    |
| Total Assets      | $23.0M    | $21.9M    | +$1.1M    |
| Accounts Payable  | $2.1M     | $2.3M     | -$0.2M    |
| Long-term Debt    | $5.5M     | $5.8M     | -$0.3M    |
| Total Liabilities | $7.6M     | $8.1M     | -$0.5M    |
| Equity            | $15.4M    | $13.8M    | +$1.6M    |

| Cash Flow Statement | YTD 2025 |
|--------------------|----------|
| Operating Cash Flow | $3.2M    |
| Investing Cash Flow | -$1.5M   |
| Financing Cash Flow | -$0.8M   |
| Net Change in Cash  | $0.9M    |
| Beginning Cash      | $3.6M    |
| Ending Cash         | $4.5M    |
`
};
