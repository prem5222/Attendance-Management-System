'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Search, Download } from 'lucide-react';

export default function AdminAttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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
          <Button icon={<Download className="w-4 h-4" />} variant="secondary">
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden min-h-[400px] flex items-center justify-center">
        <div className="text-gray-500">Attendance records for {date} will load here.</div>
      </Card>
    </div>
  );
}
