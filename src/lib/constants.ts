import {
  LayoutDashboard,
  Clock,
  History,
  User,
  ScanFace,
  Users,
  ClipboardList,
  Settings,
  BarChart3,
} from 'lucide-react';

export const APP_NAME = 'AttendGuard';

export const DEFAULT_SETTINGS = {
  checkInStart: '09:00',
  checkInEnd: '18:00',
  lateThreshold: '09:15',
  workingHours: 8,
  companyName: 'AttendGuard Inc.',
  timezone: 'Asia/Kolkata',
};

export const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Marketing',
  'Sales',
  'Finance',
  'Operations',
  'Product',
  'Design',
  'Customer Support',
  'Legal',
  'Research & Development',
  'IT',
];

export const DESIGNATIONS = [
  'Software Engineer',
  'Senior Software Engineer',
  'Lead Engineer',
  'Engineering Manager',
  'Product Manager',
  'Designer',
  'HR Executive',
  'HR Manager',
  'Marketing Executive',
  'Sales Executive',
  'Financial Analyst',
  'Operations Manager',
  'Data Analyst',
  'DevOps Engineer',
  'QA Engineer',
  'Intern',
];

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Features', href: '/#features' },
];

export const DASHBOARD_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Today\'s Attendance', href: '/dashboard/attendance', icon: 'Clock' },
  { label: 'History', href: '/dashboard/history', icon: 'History' },
  { label: 'Profile', href: '/dashboard/profile', icon: 'User' },
  { label: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
];

export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { label: 'Employees', href: '/admin/employees', icon: 'Users' },
  { label: 'Attendance', href: '/admin/attendance', icon: 'ClipboardList' },
  { label: 'Reports', href: '/admin/reports', icon: 'BarChart3' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
];

export const FACE_MATCH_THRESHOLD = 0.45;

export const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

export const STATUS_COLORS: Record<string, string> = {
  present: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  absent: 'bg-red-500/20 text-red-400 border-red-500/30',
  late: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'early-leave': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  disabled: 'bg-red-500/20 text-red-400 border-red-500/30',
};
