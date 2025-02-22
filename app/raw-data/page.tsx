import { Suspense } from 'react'
import { createClient } from '../../utils/supabase/server'
import RawDataTable from './RawDataTable'
import Loading from './loading'

const PAGE_SIZE = 10

async function RawDataContent({
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
        <h1 className="text-2xl font-bold mb-4">Raw Data: Sales</h1>
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
    <div className="p-6">
      {/* Table Overview */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Raw Data Overview: Sales</h1>
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
        <RawDataTable 
          data={salesdata} 
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  )
}

export default function RawDataSales({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const currentPage = Number(searchParams.page) || 1

  return (
    <Suspense fallback={<Loading />}>
      <RawDataContent currentPage={currentPage} />
    </Suspense>
  )
}
