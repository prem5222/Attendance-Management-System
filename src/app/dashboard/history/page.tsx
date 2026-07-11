'use client';

import { useState } from 'react';
import { useAttendance } from '@/hooks/useAttendance';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate, formatTime } from '@/lib/utils/helpers';
import { Search } from 'lucide-react';
import Input from '@/components/ui/Input';

export default function HistoryPage() {
  const { history, loading } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(record => 
    record.date.includes(searchTerm) || record.status.includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Attendance History</h1>
        <div className="w-full sm:w-64">
          <Input 
            icon={<Search className="w-4 h-4" />}
            placeholder="Search date or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Check In</th>
                <th className="px-6 py-4 font-medium">Check Out</th>
                <th className="px-6 py-4 font-medium">Hours</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="p-6"><Skeleton variant="table-row" count={5} /></td></tr>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">{formatDate(new Date(record.date))}</td>
                    <td className="px-6 py-4">{record.checkIn ? formatTime(record.checkIn) : '-'}</td>
                    <td className="px-6 py-4">{record.checkOut ? formatTime(record.checkOut) : '-'}</td>
                    <td className="px-6 py-4">{record.workingHours ? `${record.workingHours}h` : '-'}</td>
                    <td className="px-6 py-4"><Badge status={record.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
