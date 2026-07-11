export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function calculateWorkingHours(checkIn: Date, checkOut: Date): number {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

export function getDateString(date?: Date): string {
  const d = date || new Date();
  return d.toISOString().split('T')[0];
}

export function isLate(checkInTime: Date, threshold: string): boolean {
  const [hours, minutes] = threshold.split(':').map(Number);
  const thresholdDate = new Date(checkInTime);
  thresholdDate.setHours(hours, minutes, 0, 0);
  return checkInTime > thresholdDate;
}

export function isEarlyLeave(checkOutTime: Date, expectedEnd: string): boolean {
  const [hours, minutes] = expectedEnd.split(':').map(Number);
  const expectedEndDate = new Date(checkOutTime);
  expectedEndDate.setHours(hours, minutes, 0, 0);
  return checkOutTime < expectedEndDate;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateEmployeeID(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'EMP-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function cn(...classes: (string | undefined | boolean | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    present: 'text-emerald-400',
    absent: 'text-red-400',
    late: 'text-amber-400',
    'early-leave': 'text-orange-400',
    'checked-in': 'text-emerald-400',
    'checked-out': 'text-blue-400',
    'not-checked-in': 'text-gray-400',
  };
  return colors[status] || 'text-gray-400';
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getWorkingDaysInMonth(year: number, month: number): number {
  const daysInMonth = getDaysInMonth(year, month);
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }
  return workingDays;
}
