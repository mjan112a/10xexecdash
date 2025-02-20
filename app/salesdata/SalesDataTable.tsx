'use client'

// Helper function to format currency
const formatCurrency = (value: string) => {
  if (!value) return ''
  // Remove any existing currency symbols and spaces
  const numericValue = value.replace(/[$,\s]/g, '')
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(Number(numericValue))
}

// Helper function to format dates
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// Helper function to format numbers
const formatNumber = (value: number, decimals: number = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

// Define types
type Column = {
  column_name: string;
  data_type: string;
}

type SalesDataTableProps = {
  data: any[];
  columns: Column[];
  currentPage: number;
  totalPages: number;
}

export default function SalesDataTable({ 
  data, 
  columns, 
  currentPage, 
  totalPages 
}: SalesDataTableProps) {
  // Helper function to format value based on column name and type
  const formatValue = (value: any, columnName: string, dataType: string) => {
    if (value === null || value === undefined) return ''
    
    // Format based on column name patterns
    const colName = columnName.toLowerCase()
    if (colName.includes('date')) {
      return formatDate(value)
    }
    if (colName.includes('revenue') || colName.includes('shipping')) {
      return formatCurrency(value.toString())
    }
    if (colName.includes('quantity')) {
      return formatNumber(value, 0)
    }
    if (colName.includes('weight')) {
      return `${formatNumber(value)} lbs`
    }
    
    // Format based on data type
    switch (dataType) {
      case 'number':
        return formatNumber(value)
      default:
        return value.toString()
    }
  }

  // Get display name for a column
  const getDisplayName = (columnName: string) => {
    return columnName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Calculate starting record number
  const startRecord = ((currentPage - 1) * 10) + 1

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Sales Records</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 border-b border-gray-200 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              {columns.map((column) => (
                <th 
                  key={column.column_name} 
                  className="px-6 py-3 border-b border-gray-200 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                >
                  {getDisplayName(column.column_name)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}
              >
                <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200 text-sm leading-5 text-gray-500">
                  {startRecord + rowIndex}
                </td>
                {columns.map((column) => (
                  <td 
                    key={`${rowIndex}-${column.column_name}`} 
                    className="px-6 py-4 whitespace-nowrap border-b border-gray-200 text-sm leading-5 text-gray-900"
                  >
                    {formatValue(row[column.column_name], column.column_name, column.data_type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing records {startRecord} to {startRecord + data.length - 1}
        </div>
        <div className="flex items-center space-x-2">
          {renderPaginationLinks()}
        </div>
      </div>
    </div>
  )

  // Generate pagination links
  function renderPaginationLinks() {
    const links = []
    
    // Previous page
    links.push(
      <a
        key="prev"
        href={`/salesdata?page=${currentPage - 1}`}
        className={`px-3 py-2 rounded-md ${
          currentPage === 1
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-blue-600 hover:bg-blue-100'
        }`}
        onClick={e => {
          if (currentPage === 1) e.preventDefault()
        }}
      >
        Previous
      </a>
    )

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // First page
        i === totalPages || // Last page
        (i >= currentPage - 2 && i <= currentPage + 2) // Pages around current
      ) {
        links.push(
          <a
            key={i}
            href={`/salesdata?page=${i}`}
            className={`px-3 py-2 rounded-md ${
              currentPage === i
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 hover:bg-blue-100'
            }`}
          >
            {i}
          </a>
        )
      } else if (
        i === currentPage - 3 ||
        i === currentPage + 3
      ) {
        links.push(
          <span key={i} className="px-3 py-2">
            ...
          </span>
        )
      }
    }

    // Next page
    links.push(
      <a
        key="next"
        href={`/salesdata?page=${currentPage + 1}`}
        className={`px-3 py-2 rounded-md ${
          currentPage === totalPages
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-blue-600 hover:bg-blue-100'
        }`}
        onClick={e => {
          if (currentPage === totalPages) e.preventDefault()
        }}
      >
        Next
      </a>
    )

    return links
  }
}