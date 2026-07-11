import { auth } from '@/lib/firebase/config';
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
} from 'firebase/auth';

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await sendEmailVerification(credential.user);
  return credential;
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
