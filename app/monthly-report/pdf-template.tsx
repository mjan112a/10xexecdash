import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    marginBottom: 10,
  },
  headerContent: {
    marginLeft: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
    padding: 10,
    fontWeight: 'bold',
    borderRadius: 4,
  },
  content: {
    fontSize: 12,
    lineHeight: 1.5,
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 10,
    textAlign: 'justify',
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
    fontWeight: 'bold',
  },
  list: {
    marginLeft: 15,
    marginBottom: 10,
  },
  listItem: {
    fontSize: 12,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#333333',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
  },
  // Table styles
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
  tableHeader: {
    margin: 5,
    fontSize: 10,
    fontWeight: 'bold',
  },
  graphContainer: {
    marginVertical: 15,
    alignItems: 'center',
  },
  graphImage: {
    maxWidth: 500,
    maxHeight: 300,
    marginBottom: 5,
  },
  graphCaption: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    marginTop: 5,
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
  const elements: JSX.Element[] = [];
  let tableData: string[][] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a table row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        // This is the header row
        tableHeaders = line.split('|')
          .filter(cell => cell.trim() !== '')
          .map(cell => cell.trim());
      } else if (line.trim().match(/^\|[-\s|]+\|$/)) {
        // This is the separator row, skip it
        continue;
      } else {
        // This is a data row
        const rowData = line.split('|')
          .filter(cell => cell.trim() !== '')
          .map(cell => cell.trim());
        tableData.push(rowData);
      }
      
      // If the next line doesn't start with |, render the table
      if (!lines[i + 1] || !lines[i + 1].trim().startsWith('|')) {
        elements.push(renderTable(tableHeaders, tableData, i));
        tableData = [];
        tableHeaders = [];
        inTable = false;
      }
      continue;
    }
    
    // If we were in a table but this line is not a table row, render the table
    if (inTable) {
      elements.push(renderTable(tableHeaders, tableData, i));
      tableData = [];
      tableHeaders = [];
      inTable = false;
    }
    
    // Handle bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      const bulletText = line.trim().startsWith('- ') 
        ? line.trim().substring(2) 
        : line.trim().substring(2);
      elements.push(
        <Text key={`list-${i}`} style={styles.listItem}>
          • {bulletText}
        </Text>
      );
    }
    // Handle subheadings (###)
    else if (line.trim().startsWith('### ')) {
      elements.push(
        <Text key={`h3-${i}`} style={styles.subheading}>
          {line.trim().substring(4)}
        </Text>
      );
    }
    // Handle subheadings (##)
    else if (line.trim().startsWith('## ')) {
      elements.push(
        <Text key={`h2-${i}`} style={styles.sectionTitle}>
          {line.trim().substring(3)}
        </Text>
      );
    }
    // Handle regular paragraphs
    else if (line.trim() !== '') {
      elements.push(
        <Text key={`p-${i}`} style={styles.paragraph}>
          {line}
        </Text>
      );
    }
  }
  
  return elements;
};

// Helper function to render tables
const renderTable = (headers: string[], data: string[][], key: number) => {
  // Calculate column widths based on content
  const colCount = Math.max(headers.length, ...data.map(row => row.length));
  const colWidths = Array(colCount).fill(0);
  
  // Set a minimum width for each column
  const minColWidth = 100 / colCount;
  
  return (
    <View key={`table-${key}`} style={styles.table}>
      {/* Table Header */}
      <View style={styles.tableHeaderRow}>
        {headers.map((header, i) => (
          <View key={`header-${i}`} style={[styles.tableCol, { width: `${minColWidth}%` }]}>
            <Text style={styles.tableHeader}>{header}</Text>
          </View>
        ))}
      </View>
      
      {/* Table Rows */}
      {data.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.tableRow}>
          {row.map((cell, cellIndex) => (
            <View key={`cell-${rowIndex}-${cellIndex}`} style={[styles.tableCol, { width: `${minColWidth}%` }]}>
              <Text style={styles.tableCell}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

// Helper function to render a graph image
const renderGraph = (imageUrl: string, caption: string, index: number) => {
  return (
    <View key={`graph-${index}`} style={styles.graphContainer}>
      <Image src={imageUrl} style={styles.graphImage} />
      <Text style={styles.graphCaption}>Figure {index + 1}: {caption}</Text>
    </View>
  );
};

export function MonthlyReportPDF({ month, year, sections = {} }: MonthlyReportPDFProps) {
  // Default content if no sections are provided
  const defaultExecutiveSummary = `This report provides a comprehensive overview of 10X Engineered Materials' 
performance metrics, financial indicators, and operational highlights for ${month} ${year}.`;

  // Sample graph images (in a real implementation, these would be passed in)
  const sampleGraphs = [
    {
      url: 'https://www.example.com/graph1.png',
      caption: 'Monthly Revenue Trends'
    },
    {
      url: 'https://www.example.com/graph2.png',
      caption: 'Sales Channel Distribution'
    }
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <Image 
            src="/10X-Logo-Blue_White.png" 
            style={styles.logo} 
          />
          <View style={styles.headerContent}>
            <Text style={styles.title}>10X Engineered Materials</Text>
            <Text style={styles.date}>Monthly Performance Report - {month} {year}</Text>
          </View>
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
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text>10X Engineered Materials • Confidential • {month} {year}</Text>
        </View>
      </Page>
    </Document>
  );
}
