'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReport } from '../report-context';
import { PlusCircle, FileText, Calendar, Edit, Trash } from 'lucide-react';

export default function ReportManager() {
  const { allReports, createNewReport, loadReport, isLoading } = useReport();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDate, setReportDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  
  // Handle creating a new report
  const handleCreateReport = () => {
    createNewReport(reportDate, reportTitle);
    setShowCreateDialog(false);
    setReportTitle('');
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };
  
  return (
    <Card className="p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Monthly Reports</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowCreateDialog(true)}
          disabled={isLoading}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>
      
      {allReports.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-md">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No reports created yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create a new report to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {allReports.map(report => (
            <div 
              key={report.id} 
              className="border rounded-md p-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <div>
                <h4 className="font-medium">{report.title}</h4>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  <span>{formatDate(report.report_date)}</span>
                  <span className="mx-2">•</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    report.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadReport(report.id)}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Create Report Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Monthly Report</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-title">Report Title</Label>
              <Input
                id="report-title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g., March 2025 Monthly Report"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report-date">Report Month</Label>
              <Input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Select the first day of the month you're reporting on
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateReport}
              disabled={!reportTitle.trim() || !reportDate}
            >
              Create Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
