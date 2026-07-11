import React from 'react';

export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  employeeID: string;
  photoURL: string;
  role: 'employee' | 'admin';
  faceRegistered: boolean;
  status: 'active' | 'disabled';
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  id: string;
  uid: string;
  employeeID: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkIn: Date;
  checkOut: Date | null;
  workingHours: number | null;
  status: 'present' | 'absent' | 'late' | 'early-leave';
  faceVerified: boolean;
  location: { latitude: number; longitude: number } | null;
  createdAt: Date;
}

export interface FaceDescriptorData {
  uid: string;
  descriptors: number[][];
  updatedAt: Date;
}

export interface AppSettings {
  checkInStart: string; // HH:mm
  checkInEnd: string; // HH:mm
  lateThreshold: string; // HH:mm
  workingHours: number;
  companyName: string;
  timezone: string;
}

export interface DashboardStats {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  attendancePercentage: number;
  totalHours: number;
  averageHours: number;
  currentMonth: string;
  weeklyHoursChart: { date: string; hours: number }[];
  recentActivity: AttendanceRecord[];
  performanceScore: number;
}

export interface AdminStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
  monthlyChartData: { date: string; present: number; absent: number; late: number }[];
  weeklyData: { date: string; present: number; absent: number }[];
  recentActivity: { id: string; employeeName: string; employeeID: string; action: string; time: string | Date | null; status: string }[];
  departmentChartData: { name: string; value: number }[];
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export interface TableColumn<T = Record<string, unknown>> {
  header: string;
  accessor: keyof T | string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface ExportColumn {
  header: string;
  accessor: string;
}
