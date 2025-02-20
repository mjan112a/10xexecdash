import { Suspense } from 'react'
import { createClient } from '../../utils/supabase/server'
import SalesDataTable from './SalesDataTable'
import Loading from './loading'
import Link from 'next/link'

const PAGE_SIZE = 10

async function SalesDataContent({
  currentPage,
}: {
  currentPage: number
}) {
  const offset = (currentPage - 1) * PAGE_SIZE

  // Create Supabase client and get data
  const supabase = await createClient()

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('salesdata')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    throw new Error(`Count Error: ${countError.message}`)
  }

  // Get paginated data
  const { data: salesdata, error: dataError } = await supabase
    .from('salesdata')
    .select()
    .range(offset, offset + PAGE_SIZE - 1)

  if (dataError) {
    throw new Error(`Data Error: ${dataError.message}`)
  }

  if (!salesdata || salesdata.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Sales Data</h1>
        <p>No data found in the salesdata table.</p>
      </div>
    )
  }

  // Get column names from the first row
  const columns = Object.keys(salesdata[0]).map(column => ({
    column_name: column,
    data_type: typeof salesdata[0][column]
  }))

  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE)

  return (
    <div className="p-8">
      {/* Table Overview */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Sales Data Overview</h1>
          <div className="flex gap-4">
            <Link 
              href="/metricsofinterest" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              View Metrics of Interest
            </Link>
            <Link 
              href="/metricsgraph" 
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              View Metrics Graph
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Records</div>
            <div className="text-2xl font-bold">{totalCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Columns</div>
            <div className="text-2xl font-bold">{columns.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Current Page</div>
            <div className="text-2xl font-bold">{currentPage} of {totalPages}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Records Per Page</div>
            <div className="text-2xl font-bold">{PAGE_SIZE}</div>
          </div>
        </div>
      </div>

      {/* Table Structure */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Table Structure</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Column Name
                </th>
                <th className="px-6 py-3 border-b border-gray-200 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Data Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {columns.map((col, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200 text-sm leading-5 font-medium text-gray-900">
                    {col.column_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200 text-sm leading-5 text-gray-500">
                    {col.data_type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow">
        <SalesDataTable 
          data={salesdata} 
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  )
}

export default function SalesData({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const currentPage = Number(searchParams.page) || 1

  return (
    <Suspense fallback={<Loading />}>
      <SalesDataContent currentPage={currentPage} />
    </Suspense>
  )
}