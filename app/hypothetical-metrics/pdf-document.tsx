import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    textAlign: 'left',
    fontSize: 10,
  },
  metricCell: {
    width: '40%',
  },
  valueCell: {
    width: '20%',
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#f9f9f9',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    textAlign: 'center',
    color: 'grey',
  },
});

// Format value for display
const formatValue = (value: number | undefined, metric: string): string => {
  if (value === undefined) return '';
  
  if (metric.includes('Price') || metric.includes('Revenue') || metric.includes('GM') || metric.includes('OM')) {
    return value.toFixed(2);
  }
  
  if (metric.includes('%')) {
    return value.toFixed(1);
  }
  
  if (metric.includes('Unit')) {
    return value.toFixed(2);
  }
  
  return value.toFixed(0);
};

// Calculate the percentage change between original and hypothetical values
const calculateChange = (original: number, hypothetical: number): string => {
  if (original === 0) return hypothetical > 0 ? '+∞%' : '0%';
  
  const percentChange = ((hypothetical - original) / Math.abs(original)) * 100;
  return `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
};

// PDF Document component
interface PDFDocumentProps {
  originalData: any[];
  hypotheticalData: any[];
  selectedMetrics: string[];
  selectedMonth: string;
}

const PDFDocument: React.FC<PDFDocumentProps> = ({ 
  originalData, 
  hypotheticalData, 
  selectedMetrics, 
  selectedMonth 
}) => {
  // Get the data for the selected month
  const originalMonthData = originalData.find(m => m.month === selectedMonth) || {};
  const hypotheticalMonthData = hypotheticalData.find(m => m.month === selectedMonth) || {};
  
  // Get all metrics (modifiable and derived)
  const allMetrics = [
    'Process Labor',
    'Raw Material',
    'Packaging',
    'Maintenance',
    'Waste',
    'Inventory',
    'Utilities',
    'Shipping',
    'Total COGS',
    'Professional Fees',
    'Sales & Marketing',
    'Overhead Labor',
    'Benefits',
    'Accounting',
    'Equipment Rental',
    'Tax',
    'Insurance',
    'Office',
    'Banking',
    'R&D',
    'Warehouse',
    'Misc',
    'Legal',
    'Total Expenses',
    'Unit Process Labor',
    'Unit Raw Material',
    'Unit Packaging',
    'Unit Maintenance',
    'Unit Waste',
    'Unit Inventory',
    'Unit Utilities',
    'Unit Shipping',
    'Total Unit COGS',
    'Average GM',
    'Average OM',
    '% Average GM',
    '% Average OM',
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Hypothetical Scenario Analysis</Text>
        
        <Text style={styles.subtitle}>Month: {selectedMonth}</Text>
        
        <Text style={styles.subtitle}>Impact Analysis</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.metricCell]}>Metric</Text>
            <Text style={[styles.tableCell, styles.valueCell]}>Original Value</Text>
            <Text style={[styles.tableCell, styles.valueCell]}>Hypothetical Value</Text>
            <Text style={[styles.tableCell, styles.valueCell]}>Change</Text>
          </View>
          
          {allMetrics.map(metric => {
            const originalValue = originalMonthData[metric] || 0;
            const hypotheticalValue = hypotheticalMonthData[metric] || 0;
            const change = calculateChange(originalValue, hypotheticalValue);
            
            return (
              <View key={metric} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.metricCell]}>{metric}</Text>
                <Text style={[styles.tableCell, styles.valueCell]}>
                  {formatValue(originalValue, metric)}
                </Text>
                <Text style={[styles.tableCell, styles.valueCell]}>
                  {formatValue(hypotheticalValue, metric)}
                </Text>
                <Text style={[styles.tableCell, styles.valueCell]}>
                  {change}
                </Text>
              </View>
            );
          })}
        </View>
        
        {selectedMetrics.length > 0 && (
          <>
            <Text style={styles.subtitle}>Selected Metrics for Visualization</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { width: '100%' }]}>Metric</Text>
              </View>
              
              {selectedMetrics.map(metric => (
                <View key={metric} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '100%' }]}>{metric}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </Text>
      </Page>
    </Document>
  );
};

export default PDFDocument;
