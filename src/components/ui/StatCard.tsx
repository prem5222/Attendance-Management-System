'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  index?: number;
}

export default function StatCard({ title, value, icon, trend, trendValue, color = 'text-blue-400', index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className={cn('text-3xl font-bold', color)}>{value}</p>
        </div>
        <div className="p-3 bg-white/5 rounded-xl">{icon}</div>
      </div>
      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-4 text-xs">
          {trend === 'up' ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : trend === 'down' ? <TrendingDown className="w-3 h-3 text-red-400" /> : null}
          <span className={trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}>{trendValue}</span>
        </div>
      )}
    </motion.div>
  );
}
