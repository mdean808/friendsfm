import { Dialog } from '@capacitor/dialog';
import { Preferences } from '@capacitor/preferences';
import { toast } from '@zerodevx/svelte-toast';
import { action, atom } from 'nanostores';
import { user } from '.';
import { getFirebaseUrl, handleApiResponse } from '../lib';
import type { SavedSong } from '../types';
import { appCheckToken, authToken } from './auth';
import { loading } from './misc';

export const songs = atom<SavedSong[]>([]);

export const loadSongs = action(songs, 'load-songs', async (store) => {
  const res = await fetch(getFirebaseUrl('getsongs'), {
    method: 'POST',
    body: JSON.stringify({
      authToken: authToken.get(),
    }),
    headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
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
      const res = await fetch(getFirebaseUrl('deletesong'), {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          song,
        }),
        headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
      });
      const json = await handleApiResponse(res);
      if (!json) {
        // failed to set new music platform
        return false;
      }
    } else {
      // save to the backend
      const res = await fetch(getFirebaseUrl('savesong'), {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          song,
        }),
        headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
      });
      const json = await handleApiResponse(res);
      if (!json) {
        // failed to set new music platform
        return false;
      }
      s.push(json.message as SavedSong);
      store.set(s);
      await Preferences.set({
        key: 'songs',
        value: JSON.stringify(s || []),
      });
    }
  }
);

export const createSongsSpotifyPlaylist = action(
  songs,
  'create-songs-playlist',
  async () => {
    const u = user.get();
    if (u.likedSongsPlaylist) {
      window.location.href =
        'https://open.spotify.com/playlist/' + u.likedSongsPlaylist;
      return;
    }
    const { value } = await Dialog.confirm({
      title: 'Create Spotify® Playlist',
      message:
        'This will create a new Spotify® playlist of your saved songs. Proceed?',
    });
    if (!value) return;
    loading.set(true);
    const res = await fetch(getFirebaseUrl('createlikedsongsplaylist'), {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    const json = await handleApiResponse(res);
    loading.set(false);
    if (!json) {
      //api response failed
      toast.push('playlist creation failed. please try again.');
      return;
    }
    // goto the playlist!
    window.location.href = 'https://open.spotify.com/playlist/' + json.message;
    // return the playlist id
    toast.push('playlist successfully created!');
    return json.message;
  }
);
