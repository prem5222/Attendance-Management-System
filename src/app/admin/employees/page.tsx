'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import { Search, Plus, UserX, UserCheck, MoreVertical, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AdminEmployeesPage() {
  const { employees, loading, fetchEmployees, toggleEmployeeStatus, addEmployee } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    designation: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.employeeID && emp.employeeID.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await addEmployee(formData);
    if (success) {
      setIsAddModalOpen(false);
      setFormData({ name: '', email: '', password: '', department: '', designation: '' });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Employees</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input 
            icon={<Search className="w-4 h-4" />}
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsAddModalOpen(true)}>
            Add Employee
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Face Auth</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="p-6"><Skeleton variant="table-row" count={5} /></td></tr>
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.uid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={emp.photoURL} name={emp.name} size="sm" />
                        <div>
                          <div className="font-medium text-white">{emp.name}</div>
                          <div className="text-xs text-gray-500">{emp.employeeID} | {emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white">{emp.department || '-'}</div>
                        <div className="text-xs text-gray-500">{emp.designation || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge status={emp.status} /></td>
                    <td className="px-6 py-4">
                      {emp.faceRegistered ? (
                        <div className="flex items-center gap-1 text-emerald-400 text-xs">
                           <UserCheck className="w-4 h-4" /> Registered
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-400 text-xs">
                           <ShieldAlert className="w-4 h-4" /> Pending
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleEmployeeStatus(emp.uid, emp.status === 'active' ? 'disabled' : 'active')}
                          className={emp.status === 'active' ? 'text-orange-400 hover:text-orange-300' : 'text-emerald-400 hover:text-emerald-300'}
                          title={emp.status === 'active' ? 'Disable Account' : 'Enable Account'}
                        >
                          {emp.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </Button>
                        <Link href={`/admin/employees/${emp.uid}`}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Employee">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input 
            label="Full Name" 
            required 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <Input 
            label="Email Address" 
            type="email" 
            required 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <Input 
            label="Temporary Password" 
            type="password" 
            required 
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Department" 
              required 
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
            />
            <Input 
              label="Designation" 
              required 
              value={formData.designation}
              onChange={(e) => setFormData({...formData, designation: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Add Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
