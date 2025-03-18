'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportProvider } from './report-context';
import ReportManager from './components/ReportManager';
import ReportSection from './components/ReportSection';
import ReportGenerator from './components/ReportGenerator';
import TablesSection from './components/TablesSection';
import GraphsSection from './components/GraphsSection';
import Instructions from './components/Instructions';

export default function MonthlyReport() {
  return (
    <ReportProvider>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Monthly Performance Report</h1>
            <p className="text-gray-600">Create and manage comprehensive monthly reports</p>
          </div>
          
          <Instructions />

          <Tabs defaultValue="manage" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="manage">Manage Reports</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="graphs">Graphs</TabsTrigger>
              <TabsTrigger value="edit">Edit Report</TabsTrigger>
              <TabsTrigger value="generate">Generate Report</TabsTrigger>
            </TabsList>

            <TabsContent value="manage" className="space-y-6 mt-6">
              <ReportManager />
            </TabsContent>
            
            <TabsContent value="tables" className="space-y-6 mt-6">
              <TablesSection />
            </TabsContent>
            
            <TabsContent value="graphs" className="space-y-6 mt-6">
              <GraphsSection />
            </TabsContent>

            <TabsContent value="edit" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 gap-6">
                <ReportSection section="llm_context" showGraphs={false} />
                <ReportSection section="ceo_message" showGraphs={false} />
                <ReportSection section="business_performance" />
                <ReportSection section="sales" />
                <ReportSection section="marketing" />
                <ReportSection section="cost_reduction" />
                <ReportSection section="operations" />
                <ReportSection section="financial_statements" showGraphs={false} />
              </div>
            </TabsContent>

            <TabsContent value="generate" className="space-y-6 mt-6">
              <ReportGenerator />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ReportProvider>
  );
}
