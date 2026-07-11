'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { getGreeting } from '@/lib/utils/helpers';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import { Clock, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function DashboardPage() {
  const { userData } = useAuthContext();
  const { stats, loading, todayAttendance, isComplete, canCheckOut } = useAttendance();
  const todayStatus = isComplete ? 'checked-out' : canCheckOut ? 'checked-in' : 'not-checked-in';

  if (!userData) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/20 to-transparent p-6 rounded-2xl border border-blue-500/20">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {getGreeting()}, {userData.name.split(' ')[0]}
          </h1>
          <p className="text-blue-200 text-sm">Here's what's happening with your attendance today.</p>
        </div>
        <Link href="/dashboard/attendance">
          <Button>Mark Attendance</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton variant="card" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Status"
            value={todayStatus === 'not-checked-in' ? 'Not In' : todayStatus === 'checked-in' ? 'Working' : 'Checked Out'}
            icon={<Clock className="w-5 h-5 text-blue-400" />}
            color={todayStatus === 'checked-in' ? 'text-emerald-400' : 'text-blue-400'}
            index={0}
          />
          <StatCard
            title="Hours Worked"
            value={`${todayAttendance?.workingHours || 0}h`}
            icon={<Calendar className="w-5 h-5 text-purple-400" />}
            color="text-purple-400"
            index={1}
          />
          <StatCard
            title="Present Days"
            value={stats?.presentDays || 0}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            color="text-emerald-400"
            index={2}
          />
          <StatCard
            title="Late/Absent"
            value={(stats?.lateDays || 0) + (stats?.absentDays || 0)}
            icon={<AlertCircle className="w-5 h-5 text-orange-400" />}
            color="text-orange-400"
            index={3}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-4">Attendance Overview</h2>
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            {/* Chart placeholder */}
            <div className="text-gray-500 text-sm">Chart will be implemented here</div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/dashboard/history" className="text-sm text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {/* Activity list placeholder */}
             <div className="text-gray-500 text-sm">Recent activity logs...</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
