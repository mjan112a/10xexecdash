import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  content: {
    fontSize: 12,
    lineHeight: 1.5,
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  gridItem: {
    flex: 1,
    padding: 8,
    border: '1pt solid #e5e7eb',
  },
  gridTitle: {
    fontSize: 12,
    marginBottom: 4,
    color: '#4b5563',
  },
  list: {
    marginLeft: 15,
  },
  listItem: {
    fontSize: 12,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
});

interface MonthlyReportPDFProps {
  month: string;
  year: number;
  sections?: Record<string, string>;
}

// Helper function to render markdown-like content
const renderContent = (content: string) => {
  if (!content) return null;
  
  const lines = content.split('\n');
  return lines.map((line, index) => {
    // Handle bullet points
    if (line.trim().startsWith('- ')) {
      return (
        <Text key={index} style={styles.listItem}>
          • {line.trim().substring(2)}
        </Text>
      );
    }
    // Handle subheadings (###)
    else if (line.trim().startsWith('### ')) {
      return (
        <Text key={index} style={styles.subheading}>
          {line.trim().substring(4)}
        </Text>
      );
    }
    // Handle regular paragraphs
    else if (line.trim() !== '') {
      return (
        <Text key={index} style={styles.paragraph}>
          {line}
        </Text>
      );
    }
    return null;
  });
};

export function MonthlyReportPDF({ month, year, sections = {} }: MonthlyReportPDFProps) {
  // Default content if no sections are provided
  const defaultExecutiveSummary = `This report provides a comprehensive overview of 10X Engineered Materials' 
performance metrics, financial indicators, and operational highlights for ${month} ${year}.`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>10X Engineered Materials</Text>
          <Text style={styles.date}>Monthly Performance Report - {month} {year}</Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.content}>
            {sections.executiveSummary ? (
              renderContent(sections.executiveSummary)
            ) : (
              <Text style={styles.paragraph}>{defaultExecutiveSummary}</Text>
            )}
          </View>
        </View>

        {/* Key Performance Indicators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          {sections.keyPerformance ? (
            <View style={styles.content}>
              {renderContent(sections.keyPerformance)}
            </View>
          ) : (
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridTitle}>Production Metrics</Text>
                <View style={styles.list}>
                  <Text style={styles.listItem}>• Total Production Volume</Text>
                  <Text style={styles.listItem}>• Production Efficiency Rate</Text>
                  <Text style={styles.listItem}>• Quality Control Metrics</Text>
                  <Text style={styles.listItem}>• Waste Reduction Progress</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridTitle}>Financial Metrics</Text>
                <View style={styles.list}>
                  <Text style={styles.listItem}>• Revenue Growth</Text>
                  <Text style={styles.listItem}>• Cost of Goods Sold</Text>
                  <Text style={styles.listItem}>• Operating Margins</Text>
                  <Text style={styles.listItem}>• Cash Flow Status</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Operational Highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operational Highlights</Text>
          {sections.operationalHighlights ? (
            <View style={styles.content}>
              {renderContent(sections.operationalHighlights)}
            </View>
          ) : (
            <View style={styles.content}>
              <Text style={styles.gridTitle}>Production & Manufacturing</Text>
              <Text style={styles.paragraph}>
                Overview of manufacturing efficiency, equipment utilization, and production milestones.
              </Text>

              <Text style={[styles.gridTitle, { marginTop: 10 }]}>Quality Control</Text>
              <Text style={styles.paragraph}>
                Summary of quality metrics, compliance status, and improvement initiatives.
              </Text>

              <Text style={[styles.gridTitle, { marginTop: 10 }]}>Supply Chain</Text>
              <Text style={styles.paragraph}>
                Analysis of supplier performance, inventory management, and logistics efficiency.
              </Text>
            </View>
          )}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strategic Recommendations</Text>
          {sections.recommendations ? (
            <View style={styles.content}>
              {renderContent(sections.recommendations)}
            </View>
          ) : (
            <>
              <Text style={styles.paragraph}>
                Based on this month's performance metrics, the following strategic initiatives 
                are recommended:
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Optimize production scheduling to improve equipment utilization</Text>
                <Text style={styles.listItem}>• Implement cost reduction measures in identified high-expense areas</Text>
                <Text style={styles.listItem}>• Enhance quality control processes to maintain product excellence</Text>
                <Text style={styles.listItem}>• Strengthen supplier relationships for better supply chain efficiency</Text>
              </View>
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}
