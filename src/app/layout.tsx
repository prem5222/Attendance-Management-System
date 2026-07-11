import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

import BackgroundPixelStars from '@/components/ui/background-pixel-stars';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AttendGuard - Smart Attendance Management',
  description: 'Modern employee attendance management system with face recognition, real-time analytics, and comprehensive reporting.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="relative min-h-screen bg-black">
        <div className="fixed inset-0 z-[-2] bg-black bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAIElEQVR42mIUEhJiwAbevXuHVZyJgUQwqmEUDB0AEGAADd8DEPTX6ksAAAAASUVORK5CYII=')] bg-[size:10px]">
          <BackgroundPixelStars />
        </div>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { 
                background: 'rgba(20, 20, 20, 0.8)', 
                backdropFilter: 'blur(12px)', 
                color: '#fff', 
                border: '1px solid rgba(255,255,255,0.15)', 
                borderRadius: '16px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#18181b' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#18181b' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
