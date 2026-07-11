'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { Calendar, Filter } from 'lucide-react';
import { getAttendanceHistory } from '@/lib/services/attendance.service';
import { AttendanceRecord } from '@/types';
import { formatTime } from '@/lib/utils/helpers';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const { userData } = useAuthContext();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date range filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (userData?.uid) {
      loadHistory();
    }
  }, [userData, startDate, endDate]);

  const loadHistory = async () => {
    if (!userData?.uid) return;
    setLoading(true);
    try {
      const data = await getAttendanceHistory(userData.uid, startDate, endDate);
      setRecords(data);
    } catch (error) {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    if (statusFilter === 'all') return true;
    return record.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Attendance History</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm text-white outline-none w-full max-w-[120px] sm:w-32"
            />
            <span className="text-gray-500 shrink-0">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm text-white outline-none w-full max-w-[120px] sm:w-32"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm text-white outline-none w-32 py-1 appearance-none"
            >
              <option value="all" className="bg-[#111]">All Status</option>
              <option value="present" className="bg-[#111]">Present</option>
              <option value="late" className="bg-[#111]">Late</option>
              <option value="absent" className="bg-[#111]">Absent</option>
              <option value="early-leave" className="bg-[#111]">Early Leave</option>
            </select>
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Entry Time</th>
                <th className="px-6 py-4 font-medium">Exit Time</th>
                <th className="px-6 py-4 font-medium">Working Hours</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center"><Spinner /></td></tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-6 py-4">{formatTime(record.checkIn)}</td>
                    <td className="px-6 py-4">{record.checkOut ? formatTime(record.checkOut) : '-'}</td>
                    <td className="px-6 py-4">{record.workingHours ? `${record.workingHours}h` : '-'}</td>
                    <td className="px-6 py-4"><Badge status={record.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No attendance records found for this period.
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
