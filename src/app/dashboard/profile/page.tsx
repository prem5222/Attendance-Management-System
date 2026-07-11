'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Mail, Phone, Building, Briefcase } from 'lucide-react';

export default function ProfilePage() {
  const { userData } = useAuthContext();

  if (!userData) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">My Profile</h1>

      <Card className="p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-shrink-0">
            <Avatar src={userData.photoURL} name={userData.name} size="lg" className="w-32 h-32 text-4xl" />
          </div>
          
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white">{userData.name}</h2>
              <p className="text-blue-400 font-medium">{userData.designation || 'Employee'}</p>
              <div className="flex gap-2 mt-3">
                <Badge status={userData.status} />
                <Badge status={userData.role} className="bg-purple-500/20 text-purple-400 border-purple-500/30" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-white/10">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-2"><Mail className="w-4 h-4"/> Email</p>
                <p className="text-gray-300 font-medium">{userData.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Employee ID</p>
                <p className="text-gray-300 font-medium">{userData.employeeID}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-2"><Building className="w-4 h-4"/> Department</p>
                <p className="text-gray-300 font-medium">{userData.department || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-2"><Phone className="w-4 h-4"/> Phone</p>
                <p className="text-gray-300 font-medium">{userData.phone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
