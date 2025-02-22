import Link from 'next/link'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Welcome Content */}
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to 10X Engineered Materials</h1>
          <div className="space-y-4 text-lg">
            <p>
              Welcome to your executive dashboard. Here you can access all key metrics,
              performance graphs, and sales data for 10X Engineered Materials.
            </p>
            <p>
              Use the sidebar navigation to explore:
            </p>
            <ul className="list-none space-y-2">
              <li>• Detailed metrics and KPIs</li>
              <li>• Performance graphs and trends</li>
              <li>• Comprehensive sales data</li>
              <li>• Monthly performance reports</li>
            </ul>
            <p className="mt-8 text-muted-foreground">
              This dashboard provides a centralized view of your company&apos;s performance metrics
              and critical business data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
