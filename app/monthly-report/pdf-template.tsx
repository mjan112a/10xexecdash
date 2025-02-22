import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

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
})

interface MonthlyReportPDFProps {
  month: string
  year: number
}

export function MonthlyReportPDF({ month, year }: MonthlyReportPDFProps) {
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
          <Text style={styles.content}>
            This report provides a comprehensive overview of 10X Engineered Materials&apos; 
            performance metrics, financial indicators, and operational highlights for {month} {year}.
          </Text>
        </View>

        {/* KPIs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
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
        </View>

        {/* Operational Highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operational Highlights</Text>
          <View style={styles.content}>
            <Text style={styles.gridTitle}>Production & Manufacturing</Text>
            <Text style={styles.content}>
              Overview of manufacturing efficiency, equipment utilization, and production milestones.
            </Text>

            <Text style={[styles.gridTitle, { marginTop: 10 }]}>Quality Control</Text>
            <Text style={styles.content}>
              Summary of quality metrics, compliance status, and improvement initiatives.
            </Text>

            <Text style={[styles.gridTitle, { marginTop: 10 }]}>Supply Chain</Text>
            <Text style={styles.content}>
              Analysis of supplier performance, inventory management, and logistics efficiency.
            </Text>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strategic Recommendations</Text>
          <Text style={styles.content}>
            Based on this month&apos;s performance metrics, the following strategic initiatives 
            are recommended:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Optimize production scheduling to improve equipment utilization</Text>
            <Text style={styles.listItem}>• Implement cost reduction measures in identified high-expense areas</Text>
            <Text style={styles.listItem}>• Enhance quality control processes to maintain product excellence</Text>
            <Text style={styles.listItem}>• Strengthen supplier relationships for better supply chain efficiency</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
