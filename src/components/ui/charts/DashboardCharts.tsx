'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface WeeklyHoursChartProps {
  data: { date: string; hours: number }[];
}

export function WeeklyHoursChart({ data }: WeeklyHoursChartProps) {
  // Format dates for display
  const formattedData = data.map(item => ({
    ...item,
    day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
  })).reverse(); // chronological

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            contentStyle={{ 
              backgroundColor: '#111', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
            }}
            itemStyle={{ color: '#fff' }}
          />
          <Bar 
            dataKey="hours" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]} 
            name="Hours Worked"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface AdminWeeklyChartProps {
  data: { date: string; present: number; absent: number }[];
}

export function AdminWeeklyChart({ data }: AdminWeeklyChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
  })).reverse();

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            contentStyle={{ 
              backgroundColor: '#111', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="present" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} name="Present" />
          <Bar dataKey="absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DepartmentPieChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export function DepartmentPieChart({ data }: DepartmentPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-gray-500">
        No department data available
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#111', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
            }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
