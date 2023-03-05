import { getFirestore } from 'firebase-admin/firestore';
import { Song } from '../../types';
const db = getFirestore();

export const getUserSongs = async (id: string) => {
  if (!id) throw new Error('No user id provided.');
  const userRef = db.collection('users').doc(id);
  const songsRef = userRef.collection('songs');
  const songs: Song[] = [];
  (await songsRef.get()).forEach((doc) => {
    const song = doc.data() as Song;
    songs.push({ ...song, id: doc.id });
  });
  return songs;
};

export const addSong = async (id: string, song: Song) => {
  if (!id) throw new Error('No user id provided.');
  const userRef = db.collection('users').doc(id);
  const songsRef = userRef.collection('songs');

  const songRef = await songsRef.add(song);
  const songRes = await songRef.get();
  const songData = { ...songRes.data(), id: songRes.id };

  return songData;
};

export const removeSong = async (id: string, song: Song) => {
  if (!id) throw new Error('No user id provided.');
  if (!song?.id) throw new Error('No song provided.');
  const userRef = db.collection('users').doc(id);
  const songsRef = userRef.collection('songs');
  const songRef = songsRef.doc(song.id);

  await songRef.delete();
};
