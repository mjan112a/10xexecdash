-- Schema for Monthly Report Highlights

-- Table for storing monthly reports
CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, published
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Table for storing report sections and their highlights
CREATE TABLE IF NOT EXISTS report_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES monthly_reports(id) ON DELETE CASCADE,
  section VARCHAR(100) NOT NULL, -- llm_context, ceo_message, business_performance, sales, marketing, cost_reduction, operations
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing saved graphs for reports
CREATE TABLE IF NOT EXISTS report_graphs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES monthly_reports(id) ON DELETE CASCADE,
  section VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- Stores the graph configuration (metrics, time period, chart type)
  image_url TEXT, -- Optional URL to a stored image of the graph
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update the updated_at column
CREATE TRIGGER update_monthly_reports_updated_at
BEFORE UPDATE ON monthly_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_highlights_updated_at
BEFORE UPDATE ON report_highlights
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_graphs_updated_at
BEFORE UPDATE ON report_graphs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
