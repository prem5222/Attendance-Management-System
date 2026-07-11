'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserDoc } from '@/lib/services/user.service';
import { User } from '@/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userData: null,
  loading: true,
  error: null,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async (uid: string) => {
    try {
      const userDoc = await getUserDoc(uid);
      setUserData(userDoc);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser.uid);
    }
  }, [firebaseUser, fetchUserData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  return (
    <AuthContext.Provider
      value={{ firebaseUser, userData, loading, error, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
