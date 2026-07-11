import { db } from '@/lib/firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { AttendanceRecord, DashboardStats, AdminStats } from '@/types';
import { getActiveEmployees } from './user.service';

const COLLECTION = 'attendance';

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthDateRange(
  year: number,
  month: number
): { startDate: string; endDate: string } {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

function getWorkingDaysInMonth(year: number, month: number): number {
  const lastDay = new Date(year, month, 0).getDate();
  let workingDays = 0;
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }
  return workingDays;
}

function getWorkingDaysUpToToday(year: number, month: number): number {
  const today = new Date();
  const lastDay = new Date(year, month, 0).getDate();
  const maxDay =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? Math.min(today.getDate(), lastDay)
      : lastDay;

  let workingDays = 0;
  for (let day = 1; day <= maxDay; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }
  return workingDays;
}

function parseAttendanceDoc(
  docSnap: { id: string; data: () => Record<string, unknown> }
): AttendanceRecord {
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    checkIn: data.checkIn
      ? (data.checkIn as Timestamp).toDate()
      : new Date(),
    checkOut: data.checkOut
      ? (data.checkOut as Timestamp).toDate()
      : null,
  } as AttendanceRecord;
}

export async function checkIn(
  uid: string,
  employeeID: string,
  employeeName: string,
  faceVerified: boolean,
  location?: { latitude: number; longitude: number }
): Promise<string> {
  const today = getTodayDateString();

  // Check for existing check-in today
  const existingQ = query(
    collection(db, COLLECTION),
    where('uid', '==', uid),
    where('date', '==', today)
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    throw new Error('You have already checked in today');
  }

  const now = new Date();
  const checkInTime = Timestamp.now();

  // Determine late status: late if after 09:15
  const lateThreshold = new Date(now);
  lateThreshold.setHours(9, 15, 0, 0);
  const isLate = now > lateThreshold;

  const status = isLate ? 'late' : 'present';

  const recordData: Record<string, unknown> = {
    uid,
    employeeID,
    employeeName,
    date: today,
    checkIn: checkInTime,
    checkOut: null,
    workingHours: null,
    status,
    faceVerified,
    createdAt: Timestamp.now(),
  };

  if (location) {
    recordData.location = location;
  }

  const docRef = await addDoc(collection(db, COLLECTION), recordData);
  return docRef.id;
}

export async function checkOut(
  attendanceId: string,
  checkInTime: Date
): Promise<Partial<AttendanceRecord>> {
  const docRef = doc(db, COLLECTION, attendanceId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('Attendance record not found');
  }

  const existingData = snapshot.data();
  if (existingData.checkOut) {
    throw new Error('You have already checked out today');
  }

  const now = new Date();
  const checkOutTimestamp = Timestamp.now();
  const checkInDate = checkInTime;

  // Calculate working hours
  const diffMs = now.getTime() - checkInDate.getTime();
  const workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

  // Determine early-leave status: early if before 17:00
  const earlyLeaveThreshold = new Date(now);
  earlyLeaveThreshold.setHours(17, 0, 0, 0);
  const isEarlyLeave = now < earlyLeaveThreshold;

  let status = existingData.status;
  if (isEarlyLeave && status !== 'late') {
    status = 'early-leave';
  } else if (isEarlyLeave && status === 'late') {
    // Keep 'late' status as it's more significant
    status = 'late';
  }

  const updateData = {
    checkOut: checkOutTimestamp,
    workingHours,
    status,
    updatedAt: Timestamp.now(),
  };

  await updateDoc(docRef, updateData);

  return {
    id: attendanceId,
    checkOut: now,
    workingHours,
    status,
  };
}

export async function getTodayAttendance(
  uid: string
): Promise<AttendanceRecord | null> {
  const today = getTodayDateString();

  const q = query(
    collection(db, COLLECTION),
    where('uid', '==', uid),
    where('date', '==', today)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  return parseAttendanceDoc(snapshot.docs[0]);
}

export async function getAttendanceHistory(
  uid: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> {
  let q;

  if (startDate && endDate) {
    q = query(
      collection(db, COLLECTION),
      where('uid', '==', uid),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
  } else if (startDate) {
    q = query(
      collection(db, COLLECTION),
      where('uid', '==', uid),
      where('date', '>=', startDate),
      orderBy('date', 'desc')
    );
  } else if (endDate) {
    q = query(
      collection(db, COLLECTION),
      where('uid', '==', uid),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
  } else {
    q = query(
      collection(db, COLLECTION),
      where('uid', '==', uid),
      orderBy('date', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(parseAttendanceDoc);
}

export async function getAllAttendanceByDate(
  date: string
): Promise<AttendanceRecord[]> {
  const q = query(
    collection(db, COLLECTION),
    where('date', '==', date)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(parseAttendanceDoc);
}

export async function getMonthlyAttendance(
  uid: string,
  year: number,
  month: number
): Promise<AttendanceRecord[]> {
  const { startDate, endDate } = getMonthDateRange(year, month);

  const q = query(
    collection(db, COLLECTION),
    where('uid', '==', uid),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(parseAttendanceDoc);
}

export async function getAttendanceStats(
  uid: string
): Promise<DashboardStats> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const records = await getMonthlyAttendance(uid, year, month);
  const workingDays = getWorkingDaysUpToToday(year, month);
  const totalWorkingDays = getWorkingDaysInMonth(year, month);

  let presentDays = 0;
  let lateDays = 0;
  let earlyLeaveDays = 0;

  for (const record of records) {
    if (record.status === 'present') {
      presentDays++;
    } else if (record.status === 'late') {
      lateDays++;
      presentDays++; // Late is still present
    } else if (record.status === 'early-leave') {
      earlyLeaveDays++;
      presentDays++; // Early leave is still present
    }
  }

  const absentDays = Math.max(0, workingDays - presentDays);
  const attendancePercentage =
    workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

  // Calculate total working hours
  let totalHours = 0;
  for (const record of records) {
    if (record.workingHours != null) {
      totalHours += record.workingHours;
    }
  }
  const averageHours =
    presentDays > 0 ? Math.round((totalHours / presentDays) * 100) / 100 : 0;

  // Calculate recent activity (latest 5 records)
  const recentActivity = [...records]
    .sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime())
    .slice(0, 5);

  // Fetch specific 7-day range to avoid cross-month bugs
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDateStr = getDateString(sevenDaysAgo);
  const endDateStr = getDateString(now);
  const weeklyRecords = await getAttendanceHistory(uid, startDateStr, endDateStr);

  // Calculate weekly hours chart
  const weeklyHoursChart: { date: string; hours: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    const dateStr = getDateString(d);
    const dayRecord = weeklyRecords.find(r => r.date === dateStr);
    weeklyHoursChart.push({
      date: dateStr,
      hours: dayRecord?.workingHours || 0
    });
  }

  // Calculate performance score (0-100)
  // Base score is attendance percentage
  let performanceScore = attendancePercentage;
  // Deduct 2 points for every late day
  performanceScore -= (lateDays * 2);
  // Cap between 0 and 100
  performanceScore = Math.max(0, Math.min(100, performanceScore));

  return {
    totalWorkingDays,
    presentDays,
    absentDays,
    lateDays,
    earlyLeaveDays,
    attendancePercentage,
    totalHours: Math.round(totalHours * 100) / 100,
    averageHours,
    currentMonth: `${year}-${String(month).padStart(2, '0')}`,
    weeklyHoursChart,
    recentActivity,
    performanceScore
  } as DashboardStats;
}

export async function getAdminStats(): Promise<AdminStats> {
  const today = getTodayDateString();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Get all active employees
  const activeEmployees = await getActiveEmployees();
  const totalEmployees = activeEmployees.length;

  // Get today's attendance
  const todayRecords = await getAllAttendanceByDate(today);
  const presentToday = todayRecords.length;
  const absentToday = Math.max(0, totalEmployees - presentToday);
  const lateToday = todayRecords.filter((r) => r.status === 'late').length;

  // Monthly chart data (attendance count per day for the current month)
  const { startDate, endDate } = getMonthDateRange(year, month);
  const monthlyQ = query(
    collection(db, COLLECTION),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );
  const monthlySnap = await getDocs(monthlyQ);
  const monthlyRecords = monthlySnap.docs.map(parseAttendanceDoc);

  // Group by date for chart data
  const dailyCounts: Record<string, { present: number; late: number; absent: number }> = {};
  const lastDay = new Date(year, month, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    // Only include working days
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dailyCounts[dateStr] = { present: 0, late: 0, absent: totalEmployees };
    }
  }

  for (const record of monthlyRecords) {
    if (dailyCounts[record.date]) {
      if (record.status === 'late') {
        dailyCounts[record.date].late++;
        dailyCounts[record.date].absent = Math.max(
          0,
          dailyCounts[record.date].absent - 1
        );
      } else {
        dailyCounts[record.date].present++;
        dailyCounts[record.date].absent = Math.max(
          0,
          dailyCounts[record.date].absent - 1
        );
      }
    }
  }

  const monthlyChartData = Object.entries(dailyCounts).map(([date, counts]) => ({
    date,
    present: counts.present,
    late: counts.late,
    absent: counts.absent,
  }));

  // Weekly data (last 7 days) - fetching exact range to avoid cross-month missing data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const weeklyStartDate = getDateString(sevenDaysAgo);
  const weeklyEndDate = getDateString(now);
  const weeklyRecords = await getAllAttendanceRange(weeklyStartDate, weeklyEndDate);

  const weeklyData: { date: string; present: number; absent: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = getDateString(date);
    const dayOfWeek = date.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dayRecords = weeklyRecords.filter((r) => r.date === dateStr);
    weeklyData.push({
      date: dateStr,
      present: dayRecords.length,
      absent: Math.max(0, totalEmployees - dayRecords.length),
    });
  }

  // Recent activity (last 10 check-ins/check-outs)
  const recentQ = query(
    collection(db, COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const recentSnap = await getDocs(recentQ);
  const recentActivity = recentSnap.docs
    .slice(0, 10)
    .map(parseAttendanceDoc)
    .map((record) => ({
      id: record.id,
      employeeName: record.employeeName,
      employeeID: record.employeeID,
      action: record.checkOut ? 'check-out' : 'check-in',
      time: record.checkOut || record.checkIn,
      status: record.status,
    }));

  // Calculate department chart data for today's present employees
  const departmentCounts: Record<string, number> = {};
  for (const record of todayRecords) {
    const emp = activeEmployees.find(e => e.uid === record.uid);
    if (emp && emp.department) {
      departmentCounts[emp.department] = (departmentCounts[emp.department] || 0) + 1;
    }
  }
  
  const departmentChartData = Object.entries(departmentCounts).map(([name, value]) => ({
    name,
    value
  }));

  return {
    totalEmployees,
    presentToday,
    absentToday,
    lateToday,
    attendanceRate:
      totalEmployees > 0
        ? Math.round((presentToday / totalEmployees) * 100)
        : 0,
    monthlyChartData,
    weeklyData,
    recentActivity,
    departmentChartData,
  } as AdminStats;
}

export async function getAllAttendanceRange(
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> {
  const q = query(
    collection(db, COLLECTION),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(parseAttendanceDoc);
}
