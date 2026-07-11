'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/helpers';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6',
        'transition-colors duration-300',
        hover && 'cursor-pointer hover:bg-white/8 hover:border-white/20',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
