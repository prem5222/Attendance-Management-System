'use client';

import { useState, useCallback } from 'react';
import { User, AttendanceRecord, AdminStats } from '@/types';
import { getAllUsers, deleteUserDoc, disableUser, enableUser } from '@/lib/services/user.service';
import { getAdminStats, getAllAttendanceRange } from '@/lib/services/attendance.service';
import toast from 'react-hot-toast';

export function useAdmin() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      setEmployees(users.filter((u) => u.role === 'employee'));
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchEmployees = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.employeeID?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q)
    );
  });

  const deleteEmployee = async (uid: string) => {
    try {
      await deleteUserDoc(uid);
      setEmployees((prev) => prev.filter((e) => e.uid !== uid));
      toast.success('Employee deleted');
    } catch (err) {
      console.error('Error deleting employee:', err);
      toast.error('Failed to delete employee');
    }
  };

  const toggleEmployeeStatus = async (uid: string, currentStatus: string) => {
    try {
      if (currentStatus === 'active') {
        await disableUser(uid);
      } else {
        await enableUser(uid);
      }
      setEmployees((prev) =>
        prev.map((e) =>
          e.uid === uid
            ? { ...e, status: currentStatus === 'active' ? 'disabled' : 'active' }
            : e
        )
      );
      toast.success(
        `Employee ${currentStatus === 'active' ? 'disabled' : 'enabled'}`
      );
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error('Failed to update employee status');
    }
  };

  const fetchAdminStats = useCallback(async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
      return data;
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      return null;
    }
  }, []);

  const fetchAttendanceReport = useCallback(
    async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
      try {
        return await getAllAttendanceRange(startDate, endDate);
      } catch (err) {
        console.error('Error fetching attendance report:', err);
        return [];
      }
    },
    []
  );

  return {
    employees: filteredEmployees,
    allEmployees: employees,
    loading,
    searchQuery,
    stats,
    fetchEmployees,
    searchEmployees,
    deleteEmployee,
    toggleEmployeeStatus,
    fetchAdminStats,
    fetchAttendanceReport,
  };
}
