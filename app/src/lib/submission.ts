import { get, writable, type Writable } from 'svelte/store';
import type { Submission } from '$lib/types';
import { doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db, submissionsCollection } from '$lib/firebase';
import { user } from '$lib/user';


export const userSubmission = <Writable<Submission>>writable();

export const getUserSubmission = async () => {
  const currSubNumber = (await getDoc(doc(db, 'misc', 'notifications'))).data()?.count;
  const q = query(submissionsCollection,
    where('userId', '==', get(user).id),
    where('number', '==', currSubNumber));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;
  return snapshot.docs[0];
};
