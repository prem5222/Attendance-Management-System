'use client';

import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 max-w-md bg-[#111] border border-white/10 rounded-3xl p-8"
      >
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <p className="text-gray-400">
            You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full">Go to Dashboard</Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">Go Home</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
