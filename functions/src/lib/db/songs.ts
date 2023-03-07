import { getFirestore } from 'firebase-admin/firestore';
import { SavedSong } from '../../types';
const db = getFirestore();

export const getUserSongs: (id: string) => Promise<SavedSong[]> = async (
  id
) => {
  if (!id) throw new Error('No user id provided.');
  const userRef = db.collection('users').doc(id);
  const songsRef = userRef.collection('songs');
  const songs: SavedSong[] = [];
  (await songsRef.get()).forEach((doc) => {
    const song = doc.data() as SavedSong;
    songs.push({ ...song, id: doc.id });
  });
  return songs;
};

export const addSong: (
  id: string,
  song: SavedSong
) => Promise<SavedSong> = async (id, song) => {
  if (!id) throw new Error('No user id provided.');
  const userRef = db.collection('users').doc(id);
  const songsRef = userRef.collection('songs');

  const songRef = await songsRef.add(song);
  const songRes = await songRef.get();
  const songData = { ...songRes.data(), id: songRes.id } as SavedSong;

  return songData;
};

export const removeSong = async (id: string, song: SavedSong) => {
  if (!id) throw new Error('No user id provided.');
  if (!song?.id) throw new Error('No song provided.');
  const userRef = db.collection('users').doc(id);
  const songsRef = userRef.collection('songs');
  const songRef = songsRef.doc(song.id);

  await songRef.delete();
};
