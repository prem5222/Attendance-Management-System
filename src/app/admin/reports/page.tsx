'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Skeleton from '@/components/ui/Skeleton';
import { Download, Calendar, BarChart3, Users, Clock, PieChart as PieChartIcon } from 'lucide-react';
import { getAllAttendanceRange } from '@/lib/services/attendance.service';
import { getActiveEmployees } from '@/lib/services/user.service';
import { AttendanceRecord, User } from '@/types';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

function getDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function AdminReportsPage() {
  const [startDate, setStartDate] = useState(getDateString(new Date(new Date().setDate(1)))); // First of month
  const [endDate, setEndDate] = useState(getDateString(new Date()));
  const [reportData, setReportData] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    if (startDate > endDate) {
      toast.error('The start date must be before the end date.');
      return;
    }

    setLoading(true);
    try {
      const [attendance, employees] = await Promise.all([
        getAllAttendanceRange(startDate, endDate),
        getActiveEmployees(),
      ]);

      setAllEmployees(employees);

      // Aggregate data per employee
      const aggregated = employees.map(emp => {
        const empRecords = attendance.filter(r => r.uid === emp.uid);
        
        let presentCount = 0;
        let lateCount = 0;
        let earlyLeaveCount = 0;
        let totalHours = 0;

        empRecords.forEach(record => {
          if (record.status === 'present') presentCount++;
          if (record.status === 'late') {
            lateCount++;
            presentCount++;
          }
          if (record.status === 'early-leave') {
            earlyLeaveCount++;
            presentCount++;
          }
          if (record.workingHours) {
            totalHours += record.workingHours;
          }
        });

        const avgHours = presentCount > 0 ? (totalHours / presentCount).toFixed(1) : '0';

        return {
          employeeID: emp.employeeID,
          employeeName: emp.name,
          department: emp.department || 'N/A',
          presentCount,
          lateCount,
          earlyLeaveCount,
          totalHours: totalHours.toFixed(1),
          avgHours,
        };
      });

      // Sort by present count descending
      aggregated.sort((a, b) => b.presentCount - a.presentCount);
      
      setReportData(aggregated);
    } catch (error) {
      toast.error('Failed to generate the report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (reportData.length === 0) {
      toast.error('There is no data available to export.');
      return;
    }

    const headers = ['Employee ID', 'Name', 'Department', 'Days Present', 'Days Late', 'Early Leaves', 'Total Hours', 'Avg Hours/Day'];
    const rows = reportData.map(row => [
      row.employeeID,
      row.employeeName,
      row.department,
      row.presentCount,
      row.lateCount,
      row.earlyLeaveCount,
      row.totalHours,
      row.avgHours,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('The report has been successfully exported!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Attendance Reports</h1>
          <p className="text-gray-400 text-sm">Generate comprehensive attendance summaries.</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full space-y-1">
            <label className="text-sm font-medium text-gray-400">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-sm font-medium text-gray-400">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <Button icon={<BarChart3 className="w-4 h-4" />} onClick={generateReport} loading={loading} className="w-full sm:w-auto">
              Generate
            </Button>
            <Button icon={<Download className="w-4 h-4" />} variant="secondary" onClick={exportCSV} disabled={loading || reportData.length === 0} className="w-full sm:w-auto">
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Aggregate Stats */}
      {!loading && reportData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 mb-1">Total Staff</p>
              <p className="text-2xl font-bold text-white">{reportData.length}</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 mb-1">Total Hours Logged</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(reportData.reduce((acc, row) => acc + parseFloat(row.totalHours), 0))}h
              </p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 mb-1">Avg Days Present</p>
              <p className="text-2xl font-bold text-white">
                {(reportData.reduce((acc, row) => acc + row.presentCount, 0) / (reportData.length || 1)).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="p-0 overflow-hidden border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300 whitespace-nowrap">
            <thead className="text-xs uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Days Present</th>
                <th className="px-6 py-4 font-medium text-amber-400">Days Late</th>
                <th className="px-6 py-4 font-medium">Total Hours</th>
                <th className="px-6 py-4 font-medium">Avg Hours/Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="p-6"><Skeleton variant="table-row" count={5} /></td></tr>
              ) : reportData.length > 0 ? (
                reportData.map((row, i) => (
                  <tr key={row.employeeID + i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{row.employeeName}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{row.employeeID}</div>
                    </td>
                    <td className="px-6 py-4">{row.department}</td>
                    <td className="px-6 py-4 font-medium">{row.presentCount}</td>
                    <td className="px-6 py-4 text-amber-400">{row.lateCount > 0 ? row.lateCount : '-'}</td>
                    <td className="px-6 py-4 text-blue-400">{row.totalHours}h</td>
                    <td className="px-6 py-4 text-purple-400">{row.avgHours}h</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No data available for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
