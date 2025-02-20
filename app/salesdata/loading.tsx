export default function Loading() {
  return (
    <div className="p-8 animate-pulse">
      {/* Overview Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Structure Skeleton */}
      <div className="mb-8">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4 mb-4">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table Skeleton */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {[...Array(6)].map((_, i) => (
                    <th key={i} className="px-6 py-3 border-b border-gray-200">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {[...Array(6)].map((_, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Skeleton */}
          <div className="mt-4 flex justify-center">
            <div className="h-8 w-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}