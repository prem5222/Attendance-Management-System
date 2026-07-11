'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Shield, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateUserDoc } from '@/lib/services/user.service';
import { deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function SettingsPage() {
  const { userData } = useAuthContext();
  const router = useRouter();

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isReauthing, setIsReauthing] = useState(false);
  const [isAuthVerified, setIsAuthVerified] = useState(false);
  const [isResettingFace, setIsResettingFace] = useState(false);

  const handleVerifyAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      toast.error('Please enter email and password');
      return;
    }
    
    setIsReauthing(true);
    try {
      if (!auth.currentUser) throw new Error('Not logged in');
      const credential = EmailAuthProvider.credential(authEmail, authPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      setIsAuthVerified(true);
      toast.success('Identity verified');
      setAuthPassword(''); // Clear for security
    } catch (error: any) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/invalid-credential') toast.error('Invalid credentials');
        else toast.error('Authentication failed');
      } else {
        toast.error('Authentication failed');
      }
    } finally {
      setIsReauthing(false);
    }
  };

  const handleResetFace = async () => {
    if (!isAuthVerified || !userData?.uid) return;
    
    const confirm = window.confirm('Are you sure you want to reset your face data? You will need to register your face again before you can mark attendance.');
    if (!confirm) return;

    setIsResettingFace(true);
    try {
      // 1. Delete face descriptors
      await deleteDoc(doc(db, 'faceDescriptors', userData.uid));
      // 2. Update user status
      await updateUserDoc(userData.uid, { faceRegistered: false });
      
      toast.success('Face data deleted. Please register again.');
      router.push('/dashboard/face-registration');
    } catch (error) {
      toast.error('Failed to reset face data');
    } finally {
      setIsResettingFace(false);
    }
  };

  if (!userData) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Security Settings</h1>

      <Card className="space-y-6">
        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Face Data Reset</h2>
            <p className="text-sm text-gray-400">Delete your registered face data and register a new one.</p>
          </div>
        </div>

        {!userData.faceRegistered ? (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3 text-amber-400 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>You haven't registered your face yet. Please complete face registration first.</p>
          </div>
        ) : !isAuthVerified ? (
          <form onSubmit={handleVerifyAuth} className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-4 text-sm text-blue-400 flex items-start gap-3">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>For your security, you must verify your identity before resetting your face data.</p>
            </div>
            
            <Input
              label="Email Address"
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <Button type="submit" loading={isReauthing} icon={<Key className="w-4 h-4" />}>
              Verify Identity
            </Button>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p>Identity verified successfully.</p>
            </div>
            
            <div className="p-4 border border-red-500/30 bg-red-500/5 rounded-xl">
              <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-400 mb-4">
                This action will permanently delete your facial biometric data. You will be redirected to the registration page immediately.
              </p>
              <Button 
                variant="danger" 
                onClick={handleResetFace}
                loading={isResettingFace}
              >
                Delete Face Data & Re-register
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-500/10 flex items-center justify-center">
              <Key className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Account Access</h2>
              <p className="text-sm text-gray-400">Sign out of your account.</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={async () => {
              const { useAuth } = await import('@/hooks/useAuth');
              // We need to import useAuth at the top or just use the Firebase auth signout directly here
              const { auth } = await import('@/lib/firebase/config');
              await auth.signOut();
              router.push('/login');
            }}
          >
            Log Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
