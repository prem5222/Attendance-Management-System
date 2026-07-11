'use client';

import { useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { getGreeting, formatTime } from '@/lib/utils/helpers';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import { Clock, Calendar, AlertCircle, CheckCircle2, AlertTriangle, ScanFace, LogIn, LogOut, Timer, Activity, TrendingUp } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import Link from 'next/link';
import { WeeklyHoursChart } from '@/components/ui/charts/DashboardCharts';
import Button from '@/components/ui/Button';

export default function DashboardPage() {
  const { userData } = useAuthContext();
  const { stats, loading, todayAttendance, isComplete, canCheckIn, canCheckOut, fetchTodayAttendance, fetchStats } = useAttendance();

  useEffect(() => {
    if (userData?.uid) {
      fetchTodayAttendance(userData.uid);
      fetchStats(userData.uid);
    }
  }, [userData, fetchTodayAttendance, fetchStats]);

  if (!userData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white/5 rounded-2xl border border-white/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Skeleton variant="card" count={5} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-64" />
        </div>
      </div>
    );
  }

  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/20 to-transparent p-6 rounded-2xl border border-blue-500/20">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {getGreeting()}, {userData.name.split(' ')[0]}
          </h1>
          <p className="text-blue-200 text-sm">{todayDate}</p>
        </div>
        <Link href="/dashboard/attendance">
          <Button icon={<Clock className="w-4 h-4" />}>Today's Attendance</Button>
        </Link>
      </div>

      {/* Face Registration Notification */}
      {!userData.faceRegistered && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ScanFace className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-400 mb-1">Face Registration Required</h3>
            <p className="text-sm text-gray-400">You must register your face before using the attendance system.</p>
          </div>
          <Link href="/dashboard/face-registration">
            <Button size="sm">Register Now</Button>
          </Link>
        </div>
      )}

      {/* Attendance Status Notification */}
      {userData.faceRegistered && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 border ${
          isComplete 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : canCheckOut 
              ? 'bg-blue-500/10 border-blue-500/30' 
              : 'bg-orange-500/10 border-orange-500/30'
        }`}>
          {isComplete ? (
            <><CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="text-sm text-emerald-400">Attendance completed successfully for today. ✅</span></>
          ) : canCheckOut ? (
            <><AlertCircle className="w-5 h-5 text-blue-400" /><span className="text-sm text-blue-400">Don't forget to record your office exit before leaving.</span></>
          ) : (
            <><AlertTriangle className="w-5 h-5 text-orange-400" /><span className="text-sm text-orange-400">Today's office entry attendance is pending.</span></>
          )}
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Skeleton variant="card" count={5} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Today's Entry"
            value={todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : '--:--'}
            icon={<LogIn className="w-5 h-5 text-emerald-400" />}
            color="text-emerald-400"
            index={0}
          />
          <StatCard
            title="Today's Exit"
            value={todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : '--:--'}
            icon={<LogOut className="w-5 h-5 text-blue-400" />}
            color="text-blue-400"
            index={1}
          />
          <StatCard
            title="Working Hours"
            value={todayAttendance?.workingHours ? `${todayAttendance.workingHours}h` : '0h'}
            icon={<Timer className="w-5 h-5 text-purple-400" />}
            color="text-purple-400"
            index={2}
          />
          <StatCard
            title="Status"
            value={isComplete ? 'Completed' : canCheckOut ? 'Working' : 'Pending'}
            icon={<Clock className="w-5 h-5 text-cyan-400" />}
            color={isComplete ? 'text-emerald-400' : canCheckOut ? 'text-cyan-400' : 'text-orange-400'}
            index={3}
          />
          <StatCard
            title="Attendance %"
            value={`${stats?.attendancePercentage || 0}%`}
            icon={<Calendar className="w-5 h-5 text-amber-400" />}
            color="text-amber-400"
            index={4}
          />
        </div>
      )}

      {/* Monthly Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Monthly Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-xs text-gray-500 mb-1">Present Days</p>
              <p className="text-2xl font-bold text-emerald-400">{stats?.presentDays || 0}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-xs text-gray-500 mb-1">Absent Days</p>
              <p className="text-2xl font-bold text-red-400">{stats?.absentDays || 0}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-xs text-gray-500 mb-1">Late Days</p>
              <p className="text-2xl font-bold text-amber-400">{stats?.lateDays || 0}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <p className="text-xs text-gray-500 mb-1 relative z-10">Avg Hours/Day</p>
              <p className="text-2xl font-bold text-purple-400 relative z-10">{stats?.averageHours || 0}h</p>
            </div>
          </div>
          
          <div className="mt-4 p-5 bg-gradient-to-br from-blue-900/40 to-emerald-900/40 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Performance Score
              </p>
              <h3 className="text-3xl font-extrabold text-white">{stats?.performanceScore || 0}<span className="text-lg text-gray-500 font-normal">/100</span></h3>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/5 border-4 flex items-center justify-center font-bold text-xl" style={{ borderColor: (stats?.performanceScore || 0) >= 80 ? '#10b981' : (stats?.performanceScore || 0) >= 50 ? '#f59e0b' : '#ef4444' }}>
              {stats?.performanceScore ? (stats.performanceScore >= 80 ? 'A' : stats.performanceScore >= 50 ? 'B' : 'C') : '-'}
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Link href="/dashboard/attendance" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300">Today's Attendance</span>
            </Link>
            <Link href="/dashboard/history" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300">View History</span>
            </Link>
            <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-gray-300">My Performance</span>
            </Link>
          </div>
        </Card>
      </div>

      {/* Analytics Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Weekly Working Hours</h2>
          </div>
          {stats?.weeklyHoursChart ? (
            <WeeklyHoursChart data={stats.weeklyHoursChart} />
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton variant="card" />
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.status === 'late' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {activity.checkOut ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{activity.checkOut ? 'Checked Out' : 'Checked In'}</p>
                    <p className="text-xs text-gray-500">
                      {activity.checkOut 
                        ? (activity.checkOut instanceof Date ? formatTime(activity.checkOut) : 'Just now')
                        : (activity.checkIn instanceof Date ? formatTime(activity.checkIn) : 'Just now')
                      } • {activity.date}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
