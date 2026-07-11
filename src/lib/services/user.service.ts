import { db } from '@/lib/firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { User } from '@/types';

const COLLECTION = 'users';

export async function createUserDoc(
  uid: string,
  data: Partial<User>
): Promise<void> {
  const userRef = doc(db, COLLECTION, uid);
  await setDoc(userRef, {
    ...data,
    uid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function getUserDoc(uid: string): Promise<User | null> {
  const userRef = doc(db, COLLECTION, uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    ...data,
    uid: snapshot.id,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as User;
}

export async function updateUserDoc(
  uid: string,
  data: Partial<User>
): Promise<void> {
  const userRef = doc(db, COLLECTION, uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function getAllUsers(): Promise<User[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      uid: doc.id,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as User;
  });
}

export async function searchUsers(searchQuery: string): Promise<User[]> {
  const allUsers = await getAllUsers();
  const lowerQuery = searchQuery.toLowerCase();
  return allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      user.employeeID?.toLowerCase().includes(lowerQuery) ||
      user.department?.toLowerCase().includes(lowerQuery)
  );
}

export async function getUsersByDepartment(department: string): Promise<User[]> {
  const q = query(
    collection(db, COLLECTION),
    where('department', '==', department)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      uid: doc.id,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as User;
  });
}

export async function disableUser(uid: string): Promise<void> {
  await updateUserDoc(uid, { status: 'disabled' } as Partial<User>);
}

export async function enableUser(uid: string): Promise<void> {
  await updateUserDoc(uid, { status: 'active' } as Partial<User>);
}

export async function deleteUserDoc(uid: string): Promise<void> {
  const userRef = doc(db, COLLECTION, uid);
  await deleteDoc(userRef);
}

export async function getUserCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.size;
}

export async function getActiveEmployees(): Promise<User[]> {
  const q = query(
    collection(db, COLLECTION),
    where('role', '==', 'employee'),
    where('status', '==', 'active')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      uid: doc.id,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as User;
  });
}
