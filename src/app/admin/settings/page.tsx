'use client';

import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Save } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-white">System Settings</h1>

      <Card>
        <h2 className="text-lg font-semibold text-white mb-6 border-b border-white/10 pb-4">Company Details</h2>
        <div className="space-y-4">
          <Input label="Company Name" defaultValue="AttendGuard Inc." />
          <Input label="Timezone" defaultValue="Asia/Kolkata" />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white mb-6 border-b border-white/10 pb-4">Attendance Rules</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Check-in Start Time" type="time" defaultValue="09:00" />
          <Input label="Check-in End Time" type="time" defaultValue="18:00" />
          <Input label="Late Threshold Time" type="time" defaultValue="09:15" />
          <Input label="Expected Working Hours" type="number" defaultValue={8} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button icon={<Save className="w-4 h-4" />}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
