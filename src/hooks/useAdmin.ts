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
      toast.error('Failed to retrieve employee data. Please try again.');
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
      toast.success('The employee profile has been successfully removed.');
    } catch (err) {
      console.error('Error deleting employee:', err);
      toast.error('Failed to remove the employee profile. Please try again.');
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
      toast.success(`The employee's status has been updated to ${currentStatus === 'active' ? 'disabled' : 'active'}.`);

    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error('Failed to update the employee status. Please try again.');
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

  const addEmployee = async (data: any) => {
    try {
      const { adminCreateUser } = await import('@/lib/services/auth.service');
      const { createUserDoc } = await import('@/lib/services/user.service');
      const { generateEmployeeID } = await import('@/lib/utils/helpers');

      const credential = await adminCreateUser(data.email, data.password, data.name);
      
      const newEmployee: any = {
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        department: data.department || '',
        designation: data.designation || '',
        employeeID: generateEmployeeID(),
        photoURL: '',
        role: 'employee',
        faceRegistered: false,
        status: 'active',
      };
      
      await createUserDoc(credential.user.uid, newEmployee);
      setEmployees(prev => [newEmployee, ...prev]);
      toast.success('The new employee profile has been created successfully!');
      return true;
    } catch (err: any) {
      console.error('Error creating employee:', err);
      toast.error(err.message || 'Failed to create the employee profile. Please try again.');
      return false;
    }
  };

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
    addEmployee,
  };
}
