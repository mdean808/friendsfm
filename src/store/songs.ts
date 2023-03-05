import { action, atom } from 'nanostores';
import { handleApiResponse } from '../lib';
import type { Song } from '../types';
import { authToken } from './auth';

export const songs = atom<Song[]>([]);
export const toggleSong = action(
  songs,
  'add-song',
  async (store, song: Song) => {
    let s = store.get();
    if (s.find((s) => s.name === song.name)) {
      s = s.filter((s) => s.name !== song.name);
      store.set(s);
      // save to backend
      const res = await fetch(
        'https://us-central1-friendsfm.cloudfunctions.net/removeSong',
        {
          method: 'POST',
          body: JSON.stringify({
            authToken: authToken.get(),
            song: song,
          }),
        }
      );
      const json = await handleApiResponse(res);
      if (!json) {
        // failed to set new music platform
        return false;
      }
    } else {
      s.push(song);
      store.set(s);
      // save to the backend
      const res = await fetch(
        'https://us-central1-friendsfm.cloudfunctions.net/saveSong',
        {
          method: 'POST',
          body: JSON.stringify({
            authToken: authToken.get(),
            song: song,
          }),
        }
      );
      const json = await handleApiResponse(res);
      if (!json) {
        // failed to set new music platform
        return false;
      }
    }
  }
);
