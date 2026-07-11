import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { FACE_MATCH_THRESHOLD } from '@/lib/constants';

const COLLECTION = 'faceDescriptors';

export async function storeFaceDescriptors(
  uid: string,
  descriptors: number[][]
): Promise<void> {
  const docRef = doc(db, COLLECTION, uid);
  await setDoc(docRef, {
    uid,
    descriptors,
    updatedAt: Timestamp.now(),
  });
}

export async function getFaceDescriptors(
  uid: string
): Promise<number[][] | null> {
  const docRef = doc(db, COLLECTION, uid);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return snapshot.data().descriptors as number[][];
}

export async function deleteFaceDescriptors(uid: string): Promise<void> {
  const docRef = doc(db, COLLECTION, uid);
  await deleteDoc(docRef);
}

export function compareFaceDescriptors(
  input: Float32Array,
  stored: number[][],
  threshold: number = FACE_MATCH_THRESHOLD
): { matched: boolean; distance: number; bestMatchIndex: number } {
  let bestDistance = Infinity;
  let bestMatchIndex = -1;

  for (let i = 0; i < stored.length; i++) {
    const storedDescriptor = stored[i];
    let sum = 0;
    for (let j = 0; j < input.length; j++) {
      const diff = input[j] - storedDescriptor[j];
      sum += diff * diff;
    }
    const distance = Math.sqrt(sum);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatchIndex = i;
    }
  }

  return {
    matched: bestDistance < threshold,
    distance: Math.round(bestDistance * 1000) / 1000,
    bestMatchIndex,
  };
}
