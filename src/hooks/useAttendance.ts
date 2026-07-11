'use client';

import { useState, useCallback } from 'react';
import { AttendanceRecord, DashboardStats } from '@/types';
import {
  checkIn as checkInService,
  checkOut as checkOutService,
  getTodayAttendance as getTodayService,
  getAttendanceHistory as getHistoryService,
  getAttendanceStats as getStatsService,
} from '@/lib/services/attendance.service';
import toast from 'react-hot-toast';

export function useAttendance() {
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTodayAttendance = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const record = await getTodayService(uid);
      setTodayAttendance(record);
      return record;
    } catch (err) {
      console.error('Error fetching today attendance:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCheckIn = async (
    uid: string,
    employeeID: string,
    employeeName: string,
    faceVerified: boolean,
    location?: { latitude: number; longitude: number }
  ) => {
    setLoading(true);
    try {
      const recordId = await checkInService(uid, employeeID, employeeName, faceVerified, location);
      toast.success('Your office check-in was successful. ✅');
      await fetchTodayAttendance(uid);
      return recordId;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Check-in failed';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (attendanceId: string, checkInTime: Date) => {
    setLoading(true);
    try {
      await checkOutService(attendanceId, checkInTime);
      toast.success('Your office check-out was successful. 👋');
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Check-out failed';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = useCallback(async (
    uid: string,
    startDate?: string,
    endDate?: string
  ) => {
    setLoading(true);
    try {
      const records = await getHistoryService(uid, startDate, endDate);
      setHistory(records);
      return records;
    } catch (err) {
      console.error('Error fetching history:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (uid: string) => {
    try {
      const data = await getStatsService(uid);
      setStats(data);
      return data;
    } catch (err) {
      console.error('Error fetching stats:', err);
      return null;
    }
  }, []);

  const canCheckIn = !todayAttendance;
  const canCheckOut = !!(todayAttendance && !todayAttendance.checkOut);
  const isComplete = !!(todayAttendance && todayAttendance.checkOut);

  return {
    todayAttendance,
    history,
    stats,
    loading,
    fetchTodayAttendance,
    handleCheckIn,
    handleCheckOut,
    fetchHistory,
    fetchStats,
    canCheckIn,
    canCheckOut,
    isComplete,
  };
}
