'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LINKS } from '@/lib/constants';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userData } = useAuthContext();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">AttendGuard</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === link.href ? 'text-blue-400' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 border-l border-white/10 pl-8">
              {userData ? (
                <>
                  <Link
                    href={userData.role === 'admin' ? '/admin' : '/dashboard'}
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center gap-3">
                    <Avatar src={userData.photoURL} name={userData.name} size="sm" />
                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors" title="Logout">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    Login
                  </Link>
                  <Button size="sm" onClick={() => router.push('/signup')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0a0a] border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium ${
                    pathname === link.href ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-white/10">
                {userData ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-3">
                      <Avatar src={userData.photoURL} name={userData.name} size="md" />
                      <div>
                        <p className="text-sm font-medium text-white">{userData.name}</p>
                        <p className="text-xs text-gray-400">{userData.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link
                        href={userData.role === 'admin' ? '/admin' : '/dashboard'}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                      >
                        <UserIcon className="w-5 h-5" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-base font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg"
                      >
                        <LogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 px-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2 text-base font-medium text-gray-300 bg-white/5 hover:bg-white/10 rounded-xl"
                    >
                      Login
                    </Link>
                    <Button className="w-full" onClick={() => { setMobileMenuOpen(false); router.push('/signup'); }}>
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
