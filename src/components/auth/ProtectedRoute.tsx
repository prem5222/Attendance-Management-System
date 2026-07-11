'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    }
  }, [firebaseUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
