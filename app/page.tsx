import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  LineChart, 
  FileText, 
  ChartPieIcon 
} from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      {/* Welcome Content */}
      <div className="container mx-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center justify-center mb-8">
            <Image 
              src="/10X-Logo-Blue_White.png" 
              alt="10X Logo" 
              width={200} 
              height={80} 
              className="object-contain mb-6"
            />
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 text-primary text-center">
              Welcome to 10X Engineered Materials
            </h1>
            <p className="text-lg text-center max-w-3xl">
              Your executive dashboard for accessing all key metrics,
              performance graphs, and sales data.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/metricsofinterest" className="group">
              <div className="bg-white rounded-lg shadow-md p-6 h-full border-2 border-transparent hover:border-primary transition-all">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-primary group-hover:text-primary">Metrics & KPIs</h3>
                <p className="text-gray-600">View detailed metrics and key performance indicators</p>
              </div>
            </Link>
            
            <Link href="/metricsgraph" className="group">
              <div className="bg-white rounded-lg shadow-md p-6 h-full border-2 border-transparent hover:border-secondary transition-all">
                <div className="flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-full mb-4 text-secondary">
                  <LineChart className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-secondary group-hover:text-secondary">Trend Graphs</h3>
                <p className="text-gray-600">Analyze performance trends and patterns over time</p>
              </div>
            </Link>
            
            {/* Dynamic Charts card temporarily hidden
            <Link href="/dynamic-metrics" className="group">
              <div className="bg-white rounded-lg shadow-md p-6 h-full border-2 border-transparent hover:border-accent transition-all">
                <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-full mb-4 text-accent">
                  <ChartPieIcon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-accent group-hover:text-accent">Dynamic Charts</h3>
                <p className="text-gray-600">Explore interactive charts and visualizations</p>
              </div>
            </Link>
            */}
            
            <Link href="/monthly-report" className="group">
              <div className="bg-white rounded-lg shadow-md p-6 h-full border-2 border-transparent hover:border-primary transition-all">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-primary group-hover:text-primary">Monthly Reports</h3>
                <p className="text-gray-600">Generate and view comprehensive monthly reports</p>
              </div>
            </Link>
          </div>
          
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4 text-primary">Getting Started</h2>
            <p className="mb-4">
              This dashboard provides a centralized view of your company&apos;s performance metrics
              and critical business data. Use the sidebar navigation or the cards above to explore different sections.
            </p>
            <div className="flex justify-center mt-6">
              <Button variant="default" size="lg" asChild>
                <Link href="/hypothetical-metrics">
                  Try Hypothetical Scenario Analysis
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
