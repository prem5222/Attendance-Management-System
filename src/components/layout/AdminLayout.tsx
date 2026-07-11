'use client';

import { useState } from 'react';
import { ADMIN_NAV } from '@/lib/constants';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black/70 backdrop-blur-sm flex">
      <div className="hidden lg:block fixed inset-y-0 z-40">
        <Sidebar items={ADMIN_NAV} />
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden shadow-2xl"
            >
              <Sidebar items={ADMIN_NAV} mobile onClose={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col lg:ml-64 min-w-0 transition-all duration-300">
        <div className="lg:hidden sticky top-0 z-30 flex items-center px-4 h-16 bg-[#111]/80 backdrop-blur-xl border-b border-white/10">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 text-gray-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 font-semibold text-lg text-white">Admin Portal</span>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
