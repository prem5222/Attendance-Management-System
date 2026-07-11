'use client';

import { useEffect } from 'react';

import { useAdmin } from '@/hooks/useAdmin';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import { Users, UserCheck, UserMinus, Clock, Activity, PieChart as PieChartIcon } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import Link from 'next/link';
import { AdminWeeklyChart, DepartmentPieChart } from '@/components/ui/charts/DashboardCharts';

export default function AdminDashboardPage() {
  const { stats, loading, fetchAdminStats } = useAdmin();

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      </div>

      {loading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton variant="card" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            icon={<Users className="w-5 h-5 text-blue-400" />}
            color="text-blue-400"
            index={0}
          />
          <StatCard
            title="Present Today"
            value={stats?.presentToday || 0}
            icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
            color="text-emerald-400"
            index={1}
          />
          <StatCard
            title="Absent Today"
            value={stats?.absentToday || 0}
            icon={<UserMinus className="w-5 h-5 text-red-400" />}
            color="text-red-400"
            index={2}
          />
          <StatCard
            title="Late Today"
            value={stats?.lateToday || 0}
            icon={<Clock className="w-5 h-5 text-orange-400" />}
            color="text-orange-400"
            index={3}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="flex flex-col lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Weekly Overview</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            {stats?.weeklyData && stats.weeklyData.length > 0 ? (
              <AdminWeeklyChart data={stats.weeklyData} />
            ) : (
              <div className="text-gray-500 text-sm flex items-center justify-center h-full">No data available for this week</div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Department Breakdown</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            {stats?.departmentChartData && stats.departmentChartData.length > 0 ? (
              <DepartmentPieChart data={stats.departmentChartData} />
            ) : (
              <div className="text-gray-500 text-sm flex items-center justify-center h-full">No active departments today</div>
            )}
          </div>
        </Card>
        
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/admin/attendance" className="text-sm text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>
          <div className="space-y-3">
             {!stats?.recentActivity?.length ? (
               <div className="text-gray-500 text-sm text-center py-10 bg-white/5 rounded-xl border border-white/10">No recent check-ins</div>
             ) : (
               stats.recentActivity.slice(0, 5).map((activity) => (
                 <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                   <div>
                     <p className="text-sm font-medium text-white">{activity.employeeName}</p>
                     <p className="text-xs text-gray-400">
                       {activity.action} {activity.time ? `at ${new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                     </p>
                   </div>
                   <div>
                     <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        activity.status === 'present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        activity.status === 'late' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                     }`}>
                       {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                     </span>
                   </div>
                 </div>
               ))
             )}
          </div>
        </Card>
      </div>
    </div>
  );
}
