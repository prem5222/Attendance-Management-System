import { auth, db, firebaseConfig } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  UserCredential,
  getAuth,
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  return credential;
}

export async function adminCreateUser(
  email: string,
  password: string,
  name: string
): Promise<UserCredential> {
  const adminApp = initializeApp(firebaseConfig, 'AdminApp_' + Date.now());
  const adminAuth = getAuth(adminApp);
  try {
    const credential = await createUserWithEmailAndPassword(adminAuth, email, password);
    await updateProfile(credential.user, { displayName: name });
    return credential;
  } finally {
    await deleteApp(adminApp);
  }
}

export async function signIn(
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<UserCredential> {
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logOut(): Promise<void> {
  return signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

export async function verifyEmail(): Promise<void> {
  if (auth.currentUser) {
    return sendEmailVerification(auth.currentUser);
  }
  throw new Error('No user is currently signed in');
}

export async function logAuthEvent(email: string, action: 'login' | 'signup', status: 'success' | 'failed', metadata?: any): Promise<void> {
  try {
    await addDoc(collection(db, 'authLogs'), {
      email,
      action,
      status,
      metadata: metadata || null,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
}
