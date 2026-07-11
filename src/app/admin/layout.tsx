'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRoute>
      <AdminLayout>{children}</AdminLayout>
    </AdminRoute>
  );
}
