import { getFirestore } from 'firebase-admin/firestore';
import { Song } from '../../types';
const db = getFirestore();

export const getUserSongs = async (id: string) => {
  if (!id) throw new Error('No user id provided.');
  const userRef = db.collection('users').doc(id);
  const songsRef = userRef.collection('songs');
  const songs: Song[] = [];
  (await songsRef.get()).forEach((doc) => {
    songs.push(doc.data() as Song);
  });
  return songs;
};

export const addSong = async (id: string, song: Song) => {
  if (!id) throw new Error('No user id provided.');
  const userRef = db.collection('users').doc(id);
  const songsRef = userRef.collection('songs');

  const songRef = await songsRef.add(song);
  const songRes = (await songRef.get()).data();

  return songRes;
};

export const removeSong = async (id: string, song: Song) => {
  if (!id) throw new Error('No user id provided.');
  const userRef = db.collection('users').doc(id);
  const songsRef = userRef.collection('songs');
  const songRef = songsRef.doc(song.id);

  await songRef.delete();
};
