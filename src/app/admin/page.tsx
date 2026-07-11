'use client';

import { useAdmin } from '@/hooks/useAdmin';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import { Users, UserCheck, UserMinus, Clock } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { stats, loading } = useAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      </div>

      {loading ? (
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-4">Weekly Overview</h2>
          <div className="flex-1 flex items-center justify-center min-h-[250px]">
            {/* Chart placeholder */}
            <div className="text-gray-500 text-sm">Attendance Chart</div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/admin/attendance" className="text-sm text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>
          <div className="space-y-4">
             {/* Activity list placeholder */}
             <div className="text-gray-500 text-sm">Recent check-ins...</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
