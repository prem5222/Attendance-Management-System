'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import Card from '@/components/ui/Card';
import { User, Mail, Building, Phone, Trophy, TrendingUp, Target, Award, Star } from 'lucide-react';
import { getInitials } from '@/lib/utils/helpers';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function ProfilePage() {
  const { userData } = useAuthContext();
  const { stats, fetchStats } = useAttendance();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (userData?.uid) {
      fetchStats(userData.uid);
      fetchLeaderboard();
    }
  }, [userData, fetchStats]);

  const fetchLeaderboard = async () => {
    // In a real production app, this would be computed by a Cloud Function and stored in a 'leaderboard' collection.
    // For this demonstration, we will do a basic client-side approximation or simply hardcode a few peers if no aggregation is available.
    // Since calculating everyone's stats client-side is expensive, we'll mock the leaderboard for UI purposes,
    // placing the current user properly based on their calculated score.
    
    // Simulate fetching leaderboard
    setTimeout(() => {
      setLeaderboard([
        { id: '1', name: 'Alice Chen', department: 'Engineering', score: 98, initials: 'AC' },
        { id: '2', name: 'Bob Smith', department: 'Design', score: 95, initials: 'BS' },
        { id: '3', name: 'Charlie Davis', department: 'Marketing', score: 92, initials: 'CD' },
      ]);
    }, 1000);
  };

  if (!userData) return null;

  // Performance Scoring Logic
  // Start with 100... deduct 5 for absent, 2 for late, 1 for early leave... add 1 for present days > 80%... cap between 0 and 100.
  let performanceScore = 100;
  if (stats) {
    performanceScore -= (stats.absentDays * 5);
    performanceScore -= (stats.lateDays * 2);
    performanceScore -= (stats.earlyLeaveDays * 1);
    
    if (stats.attendancePercentage > 80) {
      performanceScore += Math.floor(stats.presentDays / 5); // Add a small bonus for consistent attendance
    }
    
    performanceScore = Math.max(0, Math.min(100, performanceScore));
  }

  // Insert user into mock leaderboard if score is high enough
  let finalLeaderboard = [...leaderboard];
  if (stats) {
    const userEntry = {
      id: userData.uid,
      name: userData.name + ' (You)',
      department: userData.department,
      score: performanceScore,
      initials: getInitials(userData.name)
    };
    finalLeaderboard.push(userEntry);
    finalLeaderboard.sort((a, b) => b.score - a.score);
    // Keep top 4
    finalLeaderboard = finalLeaderboard.slice(0, 4);
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Profile & Performance</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="text-center">
            <div className="w-24 h-24 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-2 border-blue-500/30">
              {getInitials(userData.name)}
            </div>
            <h2 className="text-xl font-bold text-white">{userData.name}</h2>
            <p className="text-gray-400 text-sm mb-4">{userData.designation || 'Employee'}</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
              ID: {userData.employeeID}
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="font-semibold text-white mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{userData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{userData.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Building className="w-4 h-4 text-gray-500" />
                <span>{userData.department || 'Not assigned'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance & Leaderboard */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Attendance Performance
                </h3>
                <p className="text-sm text-gray-400 mt-1">Based on your attendance history this month</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black ${getScoreColor(performanceScore)}`}>
                  {performanceScore}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Score</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-gray-400 text-xs mb-1">Base Score</div>
                <div className="text-lg font-semibold text-white">100</div>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                <div className="text-red-400/80 text-xs mb-1">Absent (-5)</div>
                <div className="text-lg font-semibold text-red-400">-{stats ? stats.absentDays * 5 : 0}</div>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                <div className="text-amber-400/80 text-xs mb-1">Late (-2)</div>
                <div className="text-lg font-semibold text-amber-400">-{stats ? stats.lateDays * 2 : 0}</div>
              </div>
              <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                <div className="text-orange-400/80 text-xs mb-1">Early (-1)</div>
                <div className="text-lg font-semibold text-orange-400">-{stats ? stats.earlyLeaveDays * 1 : 0}</div>
              </div>
            </div>

            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all duration-1000"
                style={{ width: `${performanceScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Needs Improvement</span>
              <span>Excellent</span>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Trophy className="w-5 h-5 text-amber-400" />
              Department Leaderboard
            </h3>
            
            <div className="space-y-3">
              {finalLeaderboard.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    entry.id === userData.uid 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex-shrink-0 w-8 text-center font-bold text-gray-500">
                    #{index + 1}
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    index === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                    index === 2 ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30' :
                    'bg-white/10 text-gray-400'
                  }`}>
                    {entry.initials}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${entry.id === userData.uid ? 'text-blue-400' : 'text-white'}`}>
                      {entry.name}
                    </h4>
                    <p className="text-xs text-gray-500">{entry.department}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{entry.score}</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
