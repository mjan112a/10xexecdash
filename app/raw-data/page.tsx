import { Suspense } from 'react'
import Loading from './loading'

function RawDataContent() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Raw Data: Sales</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Coming Soon</h2>
          <p className="text-blue-700 mb-4">
            The raw sales data feature is currently under development and will be available in a future update.
          </p>
          <p className="text-blue-600">
            Check back later for detailed sales transaction data and analytics.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RawDataSales() {
  return (
    <Suspense fallback={<Loading />}>
      <RawDataContent />
    </Suspense>
  )
}
