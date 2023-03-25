import { getFirestore } from 'firebase-admin/firestore';
import { MusicPlatform, MusicPlatformAuth, SavedSong } from '../../types';
import {
  addSongsToSpotifyPlaylist,
  removeSongsFromSpotifyPlaylist,
} from '../spotify';
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

  const user = await userRef.get();

  // add the new song to the playlist
  if (user.get('likedSongsPlaylist')) {
    if (user.get('musicPlatform') === MusicPlatform.spotify) {
      await addSongsToSpotifyPlaylist(
        [song],
        user.get('likedSongsPlaylist'),
        user.get('musicPlatformAuth') as MusicPlatformAuth
      );
    }
  }

  return songData;
};

export const removeSong = async (id: string, song: SavedSong) => {
  if (!id) throw new Error('No user id provided.');
  if (!song?.id) throw new Error('No song provided.');
  const userRef = db.collection('users').doc(id);
  const songsRef = userRef.collection('songs');
  const songRef = songsRef.doc(song.id);

  const user = await userRef.get();

  // remove the song from the playlist
  if (user.get('likedSongsPlaylist')) {
    if (user.get('musicPlatform') === MusicPlatform.spotify) {
      await removeSongsFromSpotifyPlaylist(
        [song],
        user.get('likedSongsPlaylist'),
        user.get('musicPlatformAuth') as MusicPlatformAuth
      );
    }
  }

  await songRef.delete();
};
