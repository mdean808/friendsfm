import { action, atom } from 'nanostores';
import { handleApiResponse } from '../lib';
import type { SavedSong } from '../types';
import { authToken } from './auth';
import { FIREBASE_URL } from './misc';

export const songs = atom<SavedSong[]>([]);

export const loadSongs = action(songs, 'load-songs', async (store) => {
  const res = await fetch(FIREBASE_URL.get() + '/getSongs', {
    method: 'POST',
    body: JSON.stringify({
      authToken: authToken.get(),
    }),
  });
  const json = await handleApiResponse(res);
  if (!json) {
    // failed to set new music platform
    return false;
  }
  store.set(json.message as SavedSong[]);
});

export const toggleSong = action(
  songs,
  'add-song',
  async (store, song: SavedSong) => {
    let s = store.get();
    if (s.find((s) => s.name === song.name)) {
      // make sure the ID is present
      if (!song.id) song.id = s.find((so) => so.name === song.name)?.id;
      // remove the song from the list
      s = s.filter((s) => s.name !== song.name);
      store.set(s);
      // save to backend
      const res = await fetch(FIREBASE_URL.get() + '/deleteSong', {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          song,
        }),
      });
      const json = await handleApiResponse(res);
      if (!json) {
        // failed to set new music platform
        return false;
      }
    } else {
      // save to the backend
      const res = await fetch(FIREBASE_URL.get() + '/saveSong', {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          song,
        }),
      });
      const json = await handleApiResponse(res);
      if (!json) {
        // failed to set new music platform
        return false;
      }
      s.push(json.message as SavedSong);
      store.set(s);
    }
  }
);
