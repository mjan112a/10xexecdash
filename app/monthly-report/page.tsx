'use client'

import { Button } from '@/components/ui/button'
import { MonthlyReportPDF } from './pdf-template'
import { pdf } from '@react-pdf/renderer'
import { useState } from 'react'

export default function MonthlyReport() {
  const [isExporting, setIsExporting] = useState(false)
  // Get current month and year
  const currentDate = new Date()
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const currentMonth = monthNames[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()

  const handleExportPDF = async () => {
    try {
      setIsExporting(true)
      const blob = await pdf(
        <MonthlyReportPDF 
          month={currentMonth} 
          year={currentYear} 
        />
      ).toBlob()
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob)
      
      // Create a link element and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = `10X-Monthly-Report-${currentMonth}-${currentYear}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the URL
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-6">
      {/* Export Button */}
      <div className="fixed top-4 right-4">
        <Button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isExporting ? 'Generating PDF...' : 'Export as PDF'}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Monthly Performance Report</h1>
          <p className="text-gray-600">{currentMonth} {currentYear}</p>
        </div>

        {/* Executive Summary */}
        <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Executive Summary</h2>
          <p className="text-gray-700 mb-4">
            This report provides a comprehensive overview of 10X Engineered Materials&apos; 
            performance metrics, financial indicators, and operational highlights for {currentMonth} {currentYear}.
          </p>
        </section>

        {/* Key Performance Indicators */}
        <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-600 mb-2">Production Metrics</h3>
              <ul className="space-y-2">
                <li>• Total Production Volume</li>
                <li>• Production Efficiency Rate</li>
                <li>• Quality Control Metrics</li>
                <li>• Waste Reduction Progress</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-600 mb-2">Financial Metrics</h3>
              <ul className="space-y-2">
                <li>• Revenue Growth</li>
                <li>• Cost of Goods Sold</li>
                <li>• Operating Margins</li>
                <li>• Cash Flow Status</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Operational Highlights */}
        <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Operational Highlights</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-600 mb-2">Production & Manufacturing</h3>
              <p className="text-gray-700">
                Overview of manufacturing efficiency, equipment utilization, and production milestones.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-600 mb-2">Quality Control</h3>
              <p className="text-gray-700">
                Summary of quality metrics, compliance status, and improvement initiatives.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-600 mb-2">Supply Chain</h3>
              <p className="text-gray-700">
                Analysis of supplier performance, inventory management, and logistics efficiency.
              </p>
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Strategic Recommendations</h2>
          <div className="space-y-3">
            <p className="text-gray-700">
              Based on this month&apos;s performance metrics, the following strategic initiatives 
              are recommended:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Optimize production scheduling to improve equipment utilization</li>
              <li>Implement cost reduction measures in identified high-expense areas</li>
              <li>Enhance quality control processes to maintain product excellence</li>
              <li>Strengthen supplier relationships for better supply chain efficiency</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
