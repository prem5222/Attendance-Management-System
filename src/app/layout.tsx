import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AttendGuard - Smart Attendance Management',
  description: 'Modern employee attendance management system with face recognition, real-time analytics, and comprehensive reporting.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
              success: { iconTheme: { primary: '#3b82f6', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
