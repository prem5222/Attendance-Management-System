'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { signUp, signIn, logOut, resetPassword as resetPw } from '@/lib/services/auth.service';
import { createUserDoc } from '@/lib/services/user.service';
import { generateEmployeeID } from '@/lib/utils/helpers';
import toast from 'react-hot-toast';

export function useAuth() {
  const { firebaseUser, userData, loading, error, refreshUser } = useAuthContext();
  const [authLoading, setAuthLoading] = useState(false);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setAuthLoading(true);
    try {
      const credential = await signIn(email, password, rememberMe);
      // Ensure user doc exists
      const { getUserDoc } = await import('@/lib/services/user.service');
      const existingDoc = await getUserDoc(credential.user.uid);
      if (!existingDoc) {
        await createUserDoc(credential.user.uid, {
          name: credential.user.displayName || 'User',
          email: credential.user.email || '',
          phone: '',
          department: '',
          designation: '',
          employeeID: generateEmployeeID(),
          photoURL: credential.user.photoURL || '',
          role: 'employee',
          faceRegistered: false,
          status: 'active',
        });
      }
      await refreshUser();
      toast.success('Welcome back!');
      return credential;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      const friendlyMessage = getFriendlyError(message);
      toast.error(friendlyMessage);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setAuthLoading(true);
    try {
      const credential = await signUp(email, password, name);
      await createUserDoc(credential.user.uid, {
        name,
        email,
        phone: '',
        department: '',
        designation: '',
        employeeID: generateEmployeeID(),
        photoURL: '',
        role: 'employee',
        faceRegistered: false,
        status: 'active',
      });
      toast.success('Account created! Please verify your email.');
      return credential;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      const friendlyMessage = getFriendlyError(message);
      toast.error(friendlyMessage);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logOut();
      toast.success('Logged out successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      toast.error(message);
    }
  };

  const resetPassword = async (email: string) => {
    setAuthLoading(true);
    try {
      await resetPw(email);
      toast.success('Password reset email sent!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Reset failed';
      toast.error(getFriendlyError(message));
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    user: firebaseUser,
    userData,
    loading: loading || authLoading,
    error,
    login,
    signup,
    logout,
    resetPassword,
    refreshUser,
  };
}

function getFriendlyError(message: string): string {
  if (message.includes('user-not-found')) return 'No account found with this email';
  if (message.includes('wrong-password') || message.includes('invalid-credential')) return 'Invalid email or password';
  if (message.includes('email-already-in-use')) return 'An account with this email already exists';
  if (message.includes('weak-password')) return 'Password is too weak';
  if (message.includes('invalid-email')) return 'Invalid email address';
  if (message.includes('too-many-requests')) return 'Too many attempts. Please try again later';
  if (message.includes('network-request-failed')) return 'Network error. Check your connection';
  if (message.includes('user-disabled')) return 'This account has been disabled';
  return message;
}
