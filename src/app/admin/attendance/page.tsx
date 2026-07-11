'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { Search, Download, Calendar, Filter, Users } from 'lucide-react';
import { getAllAttendanceByDate } from '@/lib/services/attendance.service';
import { getActiveEmployees } from '@/lib/services/user.service';
import { AttendanceRecord, User } from '@/types';
import { formatTime } from '@/lib/utils/helpers';
import toast from 'react-hot-toast';

function getDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function AdminAttendancePage() {
  const [date, setDate] = useState(getDateString(new Date()));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [allEmployees, setAllEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attendance, employees] = await Promise.all([
        getAllAttendanceByDate(date),
        getActiveEmployees(),
      ]);
      setRecords(attendance);
      setAllEmployees(employees);
    } catch (error) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Merge employees with attendance to show absent employees too
  const mergedData = allEmployees.map(emp => {
    const record = records.find(r => r.uid === emp.uid);
    return {
      employeeID: emp.employeeID,
      employeeName: emp.name,
      department: emp.department || 'N/A',
      date,
      checkIn: record?.checkIn || null,
      checkOut: record?.checkOut || null,
      workingHours: record?.workingHours || null,
      status: record ? record.status : 'absent',
      uid: emp.uid,
    };
  });

  // Apply filters
  const filtered = mergedData.filter(row => {
    const matchesSearch = !search || 
      row.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      row.employeeID.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const presentCount = mergedData.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'early-leave').length;
  const absentCount = mergedData.filter(r => r.status === 'absent').length;
  const lateCount = mergedData.filter(r => r.status === 'late').length;

  const exportCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Date', 'Entry Time', 'Exit Time', 'Working Hours', 'Status'];
    const rows = filtered.map(row => [
      row.employeeID,
      row.employeeName,
      row.department,
      row.date,
      row.checkIn ? formatTime(row.checkIn) : '-',
      row.checkOut ? formatTime(row.checkOut) : '-',
      row.workingHours ? `${row.workingHours}h` : '-',
      row.status,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Daily Attendance</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
          />
          <Button icon={<Download className="w-4 h-4" />} variant="secondary" onClick={exportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Total Employees</p>
          <p className="text-2xl font-bold text-white">{allEmployees.length}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Present</p>
          <p className="text-2xl font-bold text-emerald-400">{presentCount}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Absent</p>
          <p className="text-2xl font-bold text-red-400">{absentCount}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Late</p>
          <p className="text-2xl font-bold text-amber-400">{lateCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
          <option value="early-leave">Early Leave</option>
        </select>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Employee ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Entry Time</th>
                <th className="px-6 py-4 font-medium">Exit Time</th>
                <th className="px-6 py-4 font-medium">Hours</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><Spinner /></td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((row, i) => (
                  <tr key={row.uid + i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{row.employeeID}</td>
                    <td className="px-6 py-4 font-medium text-white">{row.employeeName}</td>
                    <td className="px-6 py-4">{row.department}</td>
                    <td className="px-6 py-4">{row.checkIn ? formatTime(row.checkIn) : '-'}</td>
                    <td className="px-6 py-4">{row.checkOut ? formatTime(row.checkOut) : '-'}</td>
                    <td className="px-6 py-4">{row.workingHours ? `${row.workingHours}h` : '-'}</td>
                    <td className="px-6 py-4"><Badge status={row.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No attendance records found.
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
